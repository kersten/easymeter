var Hook = require('hook.io').Hook,
    spawn = require('child_process').spawn,
    mongoose = require('mongoose'),
    NetworkClient = mongoose.model('NetworkClient');

var hostnameHook = new Hook({
    name : 'hostname',
    debug: true
});

var checkHosts = function ( callback ) {
    var cmd = spawn('nmap', ['-sP', '192.168.0.255/24']),
        clients = [];

    cmd.on('exit', function () {
        if ( typeof(callback) == 'function' ) {
            callback.apply(this, [clients]);
        }
    });

    cmd.stdout.on('data', function ( data ) {
        /*
         { '0': 'Host vdr-wohnzimmer.home (192.168.0.5) is up (0.000087s latency).\nMAC Address: 00:01:2E:31:66:DA (PC Partner)\n' }
         { '0': 'Host 192.168.0.23 is up (0.00013s latency).\nMAC Address: C4:3D:C7:72:8D:3F (Unknown)\n' }
         { '0': 'Host TL-WA901N.home (192.168.0.118) is up (0.00016s latency).\nMAC Address: B0:48:7A:F8:9B:70 (Unknown)\nHost Lion.home (192.168.0.131) is up (0.0080s latency).\nMAC Address: 7C:2F:80:2B:C3:8A (Unknown)\n' }
         { '0': 'Nmap done: 256 IP addresses (5 hosts up) scanned in 3.09 seconds\n' }
         */
        var hostRegEx = /^Host\s(.*?)\s\((.*?)\)/,
            macRegEx = /^MAC\sAddress:\s(.*?)\s/,
            client = { host: null, mac: null },
            validLine = false;

        data = data.toString().split("\n");

        data.forEach(function ( line ) {
            if ( line.match(hostRegEx) ) {

                client.host = line.match(hostRegEx);
                validLine = true;
            } else if ( line.match(macRegEx) ) {
                client.mac = line.match(macRegEx);
                validLine = true;
            }
        });

        if ( validLine ) {
            clients.push(client);
        }
    });
};

var checkHostInterval = function () {
    checkHosts(function ( clients ) {
        clients.forEach(function ( client ) {
            var networkClient = new NetworkClient({
                ip : client.ip,
                mac: client.mac[1]
            });

            networkClient.save(function ( err ) {
                if ( err.code == 11000 ) {
                    NetworkClient.update({mac: client.mac[1]}, { $set: { ip: client.host} }, {upsert: true});
                }
            });

            delete(networkClient);
            delete(client);
        });

        delete(clients);

        setTimeout(checkHostInterval, 60000);
    });
};

checkHostInterval();

hostnameHook.on('list', function ( data, callback ) {
    checkHosts(callback);
});

module.exports = hostnameHook;