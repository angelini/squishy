#!/usr/bin/env node

var Squishy = require('../lib/squishy');

(function main() {
  if(process.argv.length != 3) {
    return console.log('Usage: ' + process.argv[0] + ' ' + process.argv[1] + ' /path/to/index.html');
  }

  var squishy = new Squishy(process.argv[2]);
  squishy.squish(function(err, optimized) {
    if(err) {
      return console.error('Error: ' + err.message);
    }

    console.log(optimized);
  });
})();
