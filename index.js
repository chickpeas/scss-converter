var fs = require('fs');
var sass = require('./sassify');

var variableFile, sassedFile;

var cssfile = fs.readFileSync(process.argv[2], 'utf-8');

sass.sassifyCss(cssfile);