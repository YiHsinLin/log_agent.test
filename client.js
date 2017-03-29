var syslog = require("syslog-client");
var client = syslog.createClient("127.0.0.1");

// <190>Sep 22 9:51:41 192.168.137.55/24 snmp: VLAN 1 link-down notification.
// <190>Sep 22 9:51:49 192.168.137.55/24 snmp: Unit 1, Port  3 link-up notification.

client.log("snmp: VLAN 1 link-down notification");
