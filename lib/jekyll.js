/**
 *
 * @module jekyll
 */
'use strict';

var Q = require('q'),
  tmp = require('tmp'),
  format = require('util').format,
  EventEmitter = require('events').EventEmitter,
  writeSync = require('graceful-fs').writeSync,
  coho = require('./coho'),
  file = Q.nfbind(tmp.file),

  USR_BIN_ENV = '/usr/bin/env',
  JEKYLL = 'jekyll',
  DEFAULT_PORT = 4000,
  BUNDLE_EXEC = 'bundle exec',
  OPTION_LIST = {
    src: '--source',
    dest: '--destination',
    safe: '--safe',
    plugins: '--plugins',
    layouts: '--layouts',
    watch: '--watch',
    auto: '--watch',
    config: '--config',
    drafts: '--drafts',
    future: '--future',
    lsi: '--lsi',
    limit_posts: '--limit_posts',
    port: '--port',
    server_port: '--port',
    host: '--host',
    baseurl: '--baseurl',
    trace: '--trace',

    // Deprecated flags
    paginate: false,
    permalink: false,
    markdown: false,
    url: false
  },

  jekyll = function jekyll(options) {
    var ee = new EventEmitter(),

 getMajorVersion =function getMajorVersion() {
          var versionCommand = coho(JEKYLL, '-v');
          if (options.bundleExec) {
            versionCommand.pre(BUNDLE_EXEC);
          }
          return versionCommand.pre(USR_BIN_ENV).exec()
            .then(function (stdout) {
              return stdout.match(/\d+/);
            }, function (err) {
              ee.emit('info', 'Please install Jekyll: http://jekyllrb.com/docs/installation/');
              return err;
            });

      },

      getConfigContext = function getConfigContext() {
          var raw = options.raw;
          if (raw) {
            return file({
              prefix: '_config.',
              postfix: '.yml'
            })
              .then(function (path, fd) {
                writeSync(fd, new Buffer(raw), 0, raw.length);
                return path;
              });
          }
          return Q();
      },
      run = function run(params) {
          var command = coho(JEKYLL),
            majorVersion = params.majorVersion,
            config = params.config;

          // Build the command string
          if (options.bundleExec) {
            command.pre(BUNDLE_EXEC);
          }

          if (options.serve) {
            command.add(majorVersion > 0 ? 'serve' : 'server');
          }
          else if (options.doctor) {
            command.add('doctor');
          }
          else {
            command.add('build');
          }

          // Insert temporary config path into the config option
          if (config) {
            options.config = options.config ? options.config + ',' + config : config;
          }

          // Add flags to command if running serve or build
          if (!options.doctor) {
            Object.keys(OPTION_LIST).forEach(function (option) {
              if (options[option]) {
                command.add(OPTION_LIST[option]);
                if (typeof options[option] !== 'boolean') {
                  command.add(options[option]);
                }
                if (options[option] === false) {
                  ee.emit('warning', format('Deprecated option: "%s"', option));
                }
              }
            });
          }

          ee.emit('info', command);

          if (options.serve) {
            ee.emit('info',
              format('Serving Jekyll on port %d.  Waiting...', options.port || DEFAULT_PORT));
          }

          return command.exec();
        };

    options = options || {};

    getMajorVersion()
      .then(function (majorVersion) {
        return getConfigContext()
          .then(function(config) {
              return run({
                config: config,
                majorVersion: majorVersion
              }) ;
          });
      })
      .fail(function(error) {
        ee.emit('error', error);
      });
  };

module.exports = jekyll;
