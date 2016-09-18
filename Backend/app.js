
// [START app]
'use strict';

var express = require('express');

var app = express();

app.get('/', function (req, res) {
  res.status(200).send('Hello, world!');
});

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END app]
