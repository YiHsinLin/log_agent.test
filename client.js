'use strict';

var program = require('commander');
var syslog = require("syslog-client");

program
    .version('0.0.1')
    .option('--address <n>', 'IP address', '127.0.0.1')
    .option('--port <n>', 'port number', 514)
    .option('--tag <n>', 'tag', 'snmp')
    .option('--message <n>', 'message', 'VLAN 1 link-down notification')
    .option('--facility <n>', 'facility number', 16)
    .option('--severity <n>', 'level (emerg | alert | crit | err | warning | notice | info | debug)',
        /^(emerg|alert|crit|err|warning|notice|info|debug)$/i, 'info')
    .parse(process.argv);


var client = syslog.createClient(program.host, {port: program.port});

var severity = {
    'emerg': 0,
    'alert': 1,
    'crit': 2,
    'err': 3,
    'warning': 4,
    'notice': 5,
    'info': 6,
    'debug': 7
};

// Message:
// <190>Sep 22 9:51:41 192.168.137.55/24 snmp: VLAN 1 link-down notification.
// <190>Sep 22 9:51:49 192.168.137.55/24 snmp: Unit 1, Port  3 link-up notification.

client.log(program.tag + ': ' + program.message, {
    facility: program.facility,
    severity: severity[program.severity]
});
