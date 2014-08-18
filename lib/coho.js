/**
 *
 * @module command
 */

'use strict';

var Q = require('q'),
  child_process = require('child_process');

var Coho = function Coho() {
  this.cmd = Coho.parseArgs.apply(null, arguments);
};

Coho.parseArgs = function commandify() {
  if (Array.isArray(arguments[0])) {
    return arguments[0];
  }
  else {
    return arguments.length > 1 ? Array.prototype.slice.apply(arguments) : arguments[1].split(' ');
  }
};

Coho.prototype.append = function append() {
  this.cmd = this.cmd.concat.apply(this.cmd, arguments);
  return this;
};
Coho.prototype.add = Coho.prototype.append;

Coho.prototype.prepend = function prepend() {
  this.cmd = Coho.parseArgs.apply(null, arguments).concat(this.cmd);
  return this;
};
Coho.prototype.pre = Coho.prototype.prepend;

Coho.prototype.toString = function toString() {
  return this.cmd.join(' ');
};

Coho.prototype.get = function get() {
  return [this.cmd[0], this.cmd.slice(1)];
};

Coho.prototype.exec = function exec() {
  var coho = this;
  return Q.nfapply(child_process.exec, this.get())
    .then(function(stdout, stderr) {
      coho.stdout = stdout;
      coho.stderr = stderr;
      return arguments;
    }, function(err) {
      coho.err = err;
      return arguments;
    });
};

Coho.prototype.clear = function clear() {
  this.cmd = [];
};
Coho.prototype.reset = Coho.prototype.clear;

module.exports = (function() {
    function Proxy(args) {
        return Coho.apply(this, args);
    }
    Proxy.prototype = Coho.prototype;

    return function coho() {
        return new Proxy(arguments);
    };
})();
