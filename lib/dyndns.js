var DynDNSClient = require('node-dyndns-client'),
    dyndns = new DynDNSClient({
        url      : "http://members.dyndns.org/",
        hostname : [
            "4s.scrapper-site.net",
            "barnebee.dnsalias.net"
        ],
        username : process.env.DYNDNS_USERNAME,
        password : process.env.DYNDNS_PASSWORD,
        interface: 'ppp0',
        protocol : 'ipv4',
        check    : 5
    });
