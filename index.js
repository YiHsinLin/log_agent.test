'use strict';

var debug = require('debug')('log_agent');
var program = require('commander');
var jsonfile = require('jsonfile');
var Promise = require("bluebird");
var Syslogd = require('syslogd');
var restler = require('restler');

program
    .version('0.0.1')
    //.option('--host <n>', 'host name or IP address', 'localhost')
    .option('--port <n>', 'port number', 514)
    .option('--config <n>', 'configuration file', 'config.json')
    .parse(process.argv);

var defaultConfig = {
    port: program.port,
    proxy: {
        baseurl: "http://localhost:9200",
        baseindex: "/"
    }
};

var jsonReadFile = Promise.promisify(jsonfile.readFile);

var app = jsonReadFile(program.config)
    .then(function (configObj) {
        return Object.assign(defaultConfig, configObj);
    }, function errorOnReadConfig(err) {
        debug(err.message);
        return defaultConfig;
    })
    .then(function (configObj) {
        Syslogd(function(info) {
            proxy.call(configObj.proxy, info);
        }).listen(configObj.port, function(err) {
            console.log('start');
        });
    });

function proxy(info) {
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

    restler.post(url.full, {headers: headers, data: JSON.stringify(body)})
        .on('complete', function (result, response) {
            if (300 <= response.statusCode) {
                debug('POST %s failed [%d]', url.index, response.statusCode);
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
