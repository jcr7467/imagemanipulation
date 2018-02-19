// Name this file index.js and zip it + the node_modules then upload to AWS Lambda
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});
var jimp = require('jimp');

// Rotate an image given a buffer
var resizeImage = function(data, callback) {
    jimp.read(data.buffer).then(function(image) {
        console.log(data.buffer)
        console.log('image:::' + image);

            console.log('got to image reduction quality');
            console.log(image)
            image.quality(60);
            image.getBuffer(jimp.AUTO);
            return callback(null, image);

    }).catch(function(err) {
        console.log('An error occurred when reading the file: ' + err.message);
        return callback(err, null);
    })
};



// AWS Lambda runs this on every new file upload to s3
exports.handler = function(event, context, callback) {

    console.log('Received event:', JSON.stringify(event, null, 2));
    // Get the object from the event and show its content type
    var bucket = event.Records[0].s3.bucket.name;
    console.log(bucket)
    var key = event.Records[0].s3.object.key;

    console.log(key);
    s3.getObject({Bucket: bucket, Key: key}, function(err, data) {
        if (err) {
            console.log("Error getting object " + key + " from bucket " + bucket +
                ". Make sure they exist and your bucket is in the same region as this function.");
            callback("Error getting file: " + err, null);
        } else {
        console.log(data)
            // log the content type, should be an image
            console.log('CONTENT TYPE:', data.ContentType);
            // rotate the image


            resizeImage(data.Body, function(error, image) {
                console.log('data body:'+ data.Body);

                const params = {
                    Bucket: 'bookstackreducedqualityphotos',
                    Key:  key,
                    Body: image
                };

                // Upload new image, careful not to upload it in a path that will trigger the function again!
                s3.putObject(params, function (err, data) {
                    if (err) {
                        callback("Error uploading rotated image: " + err, null);
                    } else {
                        console.log("Successfully uploaded image on S3", data);
                        // call AWS Lambda's callback, function was successful!!!
                        callback(null, data);
                    }
                });
            });
        }
    });
};