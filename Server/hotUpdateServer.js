// nodejs server
var express = require('express');
var path = require('path');
var app = express();
app.use(express.static(path.join(__dirname,'hotUpdate')));
app.listen(80);
console.log("start Server");
