var DHCP = require('./lib/dhcp');

var ndns = require('./lib/ndns');
var server = ndns.createServer('udp4');
var client = ndns.createClient('udp4');

var LOCAL_PORT = 53;
var REMOTE_HOST = "8.8.8.8"
var REMOTE_PORT = 53;

server.on("request", function ( req, res ) {
    console.log(req);
    var c_req = client.request(REMOTE_PORT, REMOTE_HOST);
    c_req.on("response", function ( c_res ) {
        res.send(c_res);
    });
    c_req.send(req);
});

server.bind(LOCAL_PORT);
//client.bind();

var dhcp = new DHCP();