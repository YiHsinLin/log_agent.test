'use strict';

var Syslogd = require('syslogd');
var rest = require('restler');

Syslogd(function(info) {
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
    console.log(info);

    var hrTime = process.hrtime();

    console.log(hrTime);

    var baseurl = "http://localhost:9200/mars/system/" + hrTime[0] + '' + hrTime[1];

    console.log(baseurl);

    var reqHeaders,
        body;

        reqHeaders = {
            "content-type": "application/json"
        };

        body = {
            severity: 6,
            service: "fabric",
            hostname: info.hostname,
            address: info.address,
            message: info.msg
        };

        console.log(body);

        rest.post(baseurl, {headers: reqHeaders, data: JSON.stringify(body)})
            .on('complete', function (result, response) {
                if (300 <= response.statusCode) {
                    console.log(response.statusCode);
                }
            });

    // rest.post(options.baseurl + '/login', {headers: reqHeaders, data: body})
    //                 .on('complete', function (result, response) {
    //                     if (300 <= response.statusCode) {
    //                         return done(result, {result: result, response: response});
    //                     } else {
    //                         cookies = getCookies(response);
    //                         ret.get('/api/users?username=' + options.username, function (err, result) {
    //                             ret.id = result.result.users[0].id;
    //                             return done(null, {result: result, response: response});
    //                         });
    //                     }
    //                 });

}).listen(514, function(err) {
    console.log('start')
});
