var dgram = require('dgram'),
    server = dgram.createSocket('udp4');

/*
 53 1 3 55 6 1 3 6 15 119 252 57 2 5 220 61 7 1 88 85 202 232 78 44 50 4 192 168 0 111 51 4 0 118 167 0 255
 */

var DHCP = function () {
    function readIpRaw ( msg, offset ) {
        if ( 0 === msg.readUInt8(offset) )
            return undefined;
        return '' +
            msg.readUInt8(offset++) + '.' +
            msg.readUInt8(offset++) + '.' +
            msg.readUInt8(offset++) + '.' +
            msg.readUInt8(offset++);
    }

    function readIp ( msg, offset, obj, name ) {
        var len = msg.readUInt8(offset++);
        assert.strictEqual(len, 4);
        p.options[name] = readIpRaw(msg, offset);
        return offset + len;
    }

    function readString ( msg, offset, obj, name ) {
        var len = msg.readUInt8(offset++);
        p.options[name] = msg.toString('ascii', offset, offset + len);
        offset += len;
        return offset;
    }

    function readAddressRaw ( msg, offset, len ) {
        var addr = '';
        while ( len-- > 0 ) {
            var b = msg.readUInt8(offset++);
            addr += (b + 0x100).toString(16).substr(-2);
            if ( len > 0 ) {
                addr += ':';
            }
        }
        return addr;
    }

    server.on("message", function ( msg, rinfo ) {
        var p = {
            op     : protocol.BOOTPMessageType.get(msg.readUInt8(0)),
            // htype is combined into chaddr field object
            hlen   : msg.readUInt8(2),
            hops   : msg.readUInt8(3),
            xid    : msg.readUInt32BE(4),
            secs   : msg.readUInt16BE(8),
            flags  : msg.readUInt16BE(10),
            ciaddr : readIpRaw(msg, 12),
            yiaddr : readIpRaw(msg, 16),
            siaddr : readIpRaw(msg, 20),
            giaddr : readIpRaw(msg, 24),
            chaddr : protocol.createHardwareAddress(
                protocol.ARPHardwareType.get(msg.readUInt8(1)),
                readAddressRaw(msg, 28, msg.readUInt8(2))),
            sname  : trimNulls(msg.toString('ascii', 44, 108)),
            file   : trimNulls(msg.toString('ascii', 108, 236)),
            magic  : msg.readUInt32BE(236),
            options: {}
        };
    });

    server.on("listening", function () {
        var address = server.address();
        console.log("server listening " +
            address.address + ":" + address.port);
    });

    server.bind(67);
    server.setBroadcast(true);
};

module.exports = DHCP;