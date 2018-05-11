/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var http = require('http');
var environment = require('./environment');
var operations = require('./operations');

// create a new express server
var app = express();

//run the backup every 24 hours, or 86400000 milliseconds
setInterval( operations.backupCloudObjectStorage, environment.backup_interval);


//serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

http.createServer(app).listen(environment.VCAP_APP_PORT, environment.VCAP_APP_HOST, function(){
    console.log("Storage application started: " + environment.VCAP_APP_HOST + ":" + environment.VCAP_APP_PORT);
    operations.backupCloudObjectStorage();
});
