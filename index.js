'use strict';

var debug = require('debug')('log_agent');
var program = require('commander');
var jsonfile = require('jsonfile');
var Promise = require("bluebird");
var Syslogd = require('./src/syslogd'); // Using customized version
var restler = require('restler');

program
    .version('0.0.1')
    //.option('--host <n>', 'host name or IP address', 'localhost')
    .option('--port <n>', 'port number', 5140)
    .option('--config <n>', 'configuration file', 'config.json')
    .option('--dry-run')
    .parse(process.argv);

var defaultConfig = {
    port: program.port,
    dryRun: program.dryRun,
    proxy: {
        baseurl: "http://localhost:9200",
        baseindex: "/",
        source: {}
    }
};

var jsonReadFile = Promise.promisify(jsonfile.readFile);

Syslogd.prototype.parse = function preParser(msg, rinfo) {
    msg = msg + '';
    msg = msg.trimRight();
    if (!msg.startsWith('<')) {
        var priIndex = msg.indexOf(' '),
            pri = msg.substr(0, priIndex),
            severityHash = {
                'DEBUG': 7,
                'ERROR': 3,
                'FATAL': 2,
                'INFO': 6,
                'WARN': 4
            };

        if (typeof severityHash[pri] !== 'undefined') {
            msg = '<' + (16 * 8 + severityHash[pri]) + '>' + msg.substr(priIndex, msg.length - 1);
        }
    }

    return Syslogd.parser(msg, rinfo);
};

// (function () {
//     var moment = require('moment');
//     var y = moment('2017-03-30 14:48:57.977', 'YYYY-MM-DD hh:mm:ss.SSS');
//
//     var x = Syslogd.prototype.parse('INFO  2017-03-30 14:51:11.988 hostname AppTest: Hello World\r\n', {});
//     debug('%o', x);
//
//     var x = Syslogd.prototype.parse('INFO  2017-03-30 14:51:11.988 hostname AppTest: Hello World\r\n', {address: '192.168.137.101'});
//     debug('%o', x);
// })();


var app = jsonReadFile(program.config)
    .then(function (configObj) {
        return Object.assign(defaultConfig, configObj);
    }, function errorOnReadConfig(err) {
        debug(err.message);
        return defaultConfig;
    })
    .then(function (configObj) {
        Syslogd(function(info) {
            var that = makeContext(configObj, info.address);

            proxy.call(that, info, configObj, {dryRun: configObj.dryRun});
        }).listen(configObj.port, function(err) {
            console.log('start, listening on port ' + configObj.port);
        });
    });

//private-function-begin
function makeContext(configObj, address) {
    var context = Object.assign({}, configObj.proxy);

    delete context.source;

    if (typeof configObj.proxy.source[address] !== 'undefined') {
        context = Object.assign(context, configObj.proxy.source[address]);
    }

    return context;
}
//private-function-end

function proxy(info, options) {
    /*
     info = {
         facility: 7
         , severity: 22
         , tag: 'tag'
         , time: Mon Dec 15 2014 10:58:44 GMT-0800 (PST)
         , hostname: 'hostname'
         , address: '127.0.0.1'
         , family: 'IPv4'
         , port: null
         , size: 39
         , msg: 'info'
     }
     */

    var self = this,
        options = options || {},
        url = makeReqUrl(),
        headers = {
            "content-type": "application/json"
        },
        body = {
            id: url.id,
            facility: info.facility,
            severity: info.severity,
            tag: info.tag,
            time: info.time.toISOString(),
            localeDateTime: info.time.toLocaleDateString() + ' ' + info.time.toLocaleTimeString(),
            hostname: info.hostname,
            address: info.address,
            message: info.msg
        };

    debug('POST %s, %o', url.index, body);

    if (options.dryRun) {
        return;
    }

    restler.post(url.full, {headers: headers, data: JSON.stringify(body)})
        .on('complete', function (result, response) {
            if (result) {
                debug('  <= Error: %o', result);
            } else if (300 <= response.statusCode) {
                debug('  <= POST %s failed [%d]', url.index, response.statusCode);
            }
        });

    function makeReqUrl() {
        var hrTime = process.hrtime();

        return {
            full: self.baseurl + self.baseindex + hrTime[0] + '' + hrTime[1],
            index: self.baseindex + hrTime[0] + '' + hrTime[1],
            id: hrTime[0] + '' + hrTime[1]
        }
    }
}
