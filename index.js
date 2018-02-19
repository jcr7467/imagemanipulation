// dependencies
var async = require('async');

//var gm = require('gm').subClass({ imageMagick: true });
var util = require('util');

let isBuffer = require('is-buffer');


var AWS = require('aws-sdk');
var jimp = require('jimp')
// get reference to S3 client
var s3 = new AWS.S3();



// AWS Lambda runs this on every new file upload to s3
exports.handler = function(event, context, callback) {
    console.log('Received event:', JSON.stringify(event, null, 2));
    // Get the object from the event and show its content type
    var bucket = event.Records[0].s3.bucket.name;
    var key = event.Records[0].s3.object.key;
    s3.getObject({Bucket: bucket, Key: key}, function(err, data) {
        if (err) {
            console.log("Error getting object " + key + " from bucket " + bucket +
                ". Make sure they exist and your bucket is in the same region as this function.");
            callback("Error getting file: " + err, null);
        } else {

            // log the content type, should be an image
            console.log('CONTENT TYPE:', data.ContentType);
            console.log(data.Body)

            jimp.read(data.Body).then(function (image) {
                // do stuff with the image
                image.quality(40).getBuffer(jimp.AUTO, function(err, buffer){
                    console.log('i got into read')
                    if(err){console.log(err)}
                    else{
                        const params = {
                            Bucket: 'bookstackreducequalityphotos',
                            Key:  key,
                            Body: buffer
                        };
                        // Upload new image, careful not to upload it in a path that will trigger the function again!
                        s3.putObject(params, function (err, data) {
                            if (err) {
                                callback("Error uploading image: " + err, null);
                            } else {
                                console.log("Successfully uploaded image on S3", data);
                                // call AWS Lambda's callback, function was successful!!!
                                callback(null, data);
                            }
                        });

                    }
                })
            }).catch(function (err) {
                console.log(err)
            });
        }
    });
};