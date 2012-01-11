// Requires
var path = require('path');
var jsdom = require('jsdom');
var fs = require('fs');
var less = require('less');
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

var Squishy = function(index_path) {
  this.dirname = path.dirname(index_path);
  this.index = fs.readFileSync(index_path);
  this.jquery = fs.readFileSync(__dirname + '/jquery.js');
};

Squishy.prototype.squish = function(callback) {
  var that = this;

  var optimize = function(err, styles, scripts, window) {
    if(err) {
      return callback(err);
    }

    var $ = window.$;

    // Remove Comments
    $('*').contents().each(function() {
      if (this.nodeType == 8) {
        $(this).remove();
      }
    });

    // Append inline styles to the head
    var style = window.document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = styles;
    window.document.head.appendChild(style);
    
    // Uglify the javascript
    var ast = jsp.parse(scripts);
    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);

    // Append inline JS to the body
    var script = window.document.createElement('script');
    script.type = 'text/javascript';
    script.text = pro.gen_code(ast);
    window.document.body.appendChild(script);

    callback(null, '<!DOCTYPE html>' + $('html')[0].outerHTML);
  };

  var parse = function(err, window) {
    if(err) {
      return callback(err);
    }

    var $ = window.$;
    var styles = '';
    var lesscss = '';
    var scripts = '';

    // Collect Styles
    $('link').each(function() {
      var $this = $(this);
      var resource = path.join(that.dirname, $this.attr('href')).toString();

      if ($this.data().optimize === 'css') { 
        styles += fs.readFileSync(resource);
        $this.remove();
      }

      if($this.data().optimize === 'less') {
        lesscss += fs.readFileSync(resource);
        $this.remove();
      }
    });

    // Collect Scripts
    $('script').each(function() {
      var $this = $(this);

      if ($this.data().optimize === 'js') {
        var resource = path.join(that.dirname, $this.attr('src')).toString();
        scripts += fs.readFileSync(resource);
        $this.remove();
      }

      // Remove dev only scripts (i.e. client-side less)
      if ($this.data().optimize === 'dev') {
        $this.remove();
      }
    });

    less.render(lesscss, function(err, css) {
      optimize(err, styles + css, scripts, window);
    });
  };
  
  jsdom.env({
    html: this.index,
    src: [this.jquery],
    done: parse
  });
};

module.exports = Squishy;
