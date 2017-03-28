var syslog = require("syslog-client");
var client = syslog.createClient("127.0.0.1");
 
client.log("example message");
