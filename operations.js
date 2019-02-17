/**
 * This file is where the backup and restore operations are stored.
 *
 */
var couchbackup = require('@cloudant/couchbackup');
var environment = require('./environment');
var pkgcloud = require('pkgcloud');
var fs = require('fs');
var AWS = require('ibm-cos-sdk');
var util = require('util');



exports.backupCloudObjectStorage = function() {

  console.log("Executing Cloudant Backup operation...");

  var opts, config;

  if (environment.VCAP_SERVICES["cloudantNoSQLDB"] || environment.VCAP_SERVICES["cloudantNoSQLDB Dedicated"]) {
    console.log("Using Bound Cloudant");
    var vcapServices = environment.VCAP_SERVICES["cloudantNoSQLDB"] || environment.VCAP_SERVICES["cloudantNoSQLDB Dedicated"];
    credentials = vcapServices[0].credentials;

    if (credentials.apikey) {
      opts = { iamApiKey: credentials.apikey };
      console.log("Using IAM authentication for Cloudant");
    } else {  // Using legacy auth with username password in URL
      console.log("Using legacy authentication for Cloudant");
      opts = {};
    };
    var sourceUrl = credentials.url + '/' + environment.database_name;

  } else {
    console.log("Using Remote Cloudant");

    if (environment.cloudant_apikey) { // Using IAM auth for Cloudant
      opts = { iamApiKey: environment.cloudant_apikey };
      console.log("Using IAM authentication for Cloudant");
    } else {  // Using legacy auth with username password in URL
      console.log("Using legacy authentication for Cloudant");
      opts = {};
    };

    var sourceUrl = environment.cloudant_url + '/' + environment.database_name;
  }
    
  couchbackup.backup(sourceUrl, fs.createWriteStream("backup.txt"), opts, function(err, obj) {
    if (err) {
      console.log("Error backing up from Cloudant: ", err);
    } else {
      var config;
      //if bound - pull in values from Bluemix VCAP credentials
      if (environment.VCAP_SERVICES["cloud-object-storage"]) {

        console.log("Using Bound Object Storage");

        var vcapServices = environment.VCAP_SERVICES["cloud-object-storage"];
        credentials = vcapServices[0].credentials;

				config = {
          apiKeyId: credentials.apikey,
          serviceInstanceId: credentials.resource_instance_id
        };

        //if remote - Pull in values from manifest
      } else {
        console.log("Using Remote Cloud Object Storage");
        config = {
          apiKeyId: environment.cos_api_key,
          serviceInstanceId: environment.cos_resource_instance_id
        };
      }

			config.endpoint = environment.cos_endpoint_url;
			config.ibmAuthEndpoint = 'https://iam.ng.bluemix.net/oidc/token';

      //Authenticate
      var cos = new AWS.S3(config);

      //Upload file
      var fs = require('fs');
      var date = new Date();
			var dbName = environment.database_name.replace(/_/g, '-');
      var fileName = dbName + "-" + date.toISOString() + ".json";
			var bucketName = "cloudant-db-" + dbName + "-" + date.toLocaleString('en-us', { year: 'numeric' }) + "-" + date.toLocaleString('en-us', { month: '2-digit' });
      var BucketLocConstraint = environment.cos_region;

      cos.createBucket({
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: BucketLocConstraint
        },
      }, function(err, bucket) {

        if (err && err.statusCode != 409) {
          console.error(err);
        } else {
          var rStream = fs.createReadStream('backup.txt');
          cos.putObject({
            Bucket: bucketName,
            Key: fileName,
            Body: rStream
          }, function(err, data) {
		        if (err) {
		          console.error(err);
		        } else {
	            console.log("File uploaded successfully",data);
						}
					});
        }
      });
    }
  });
};
