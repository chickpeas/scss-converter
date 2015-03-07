var fs = require('fs');
var sass = require('./sassify');
var sassParser = require('./lib/parse-sass.js');


var sassObj, cssfile = fs.readFileSync(process.argv[2], 'utf-8');

var variableFile; 
variableFile = process.argv[3] ? fs.readFileSync(process.argv[3], 'utf-8') : false;
if (variableFile) {sassObj = sassParser(variableFile);}
sass.sassifyCss(cssfile, sassObj);