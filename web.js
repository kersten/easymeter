var serialport = require("serialport");
var SerialPort = serialport.SerialPort,
    serialPort = new SerialPort("/dev/serial/by-id/usb-Prolific_Technology_Inc._USB-Serial_Controller-if00-port0", {
        parser    : serialport.parsers.readline("\n"),
        databits  : 7,
        parity    : 1,
        buffersize: 150
    }),
    express = require('express'),
    app = express.createServer(),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    mongoose = require('mongoose'),
    io = require('socket.io').listen(app),
    xDate = require('xdate'),
    counterConfig = {
        year: 2012,
        num : 5064
    };

mongoose.connect('mongodb://easymeter:XSbOXfNH@ds033457.mongolab.com:33457/easymeter', function ( err ) {
    if ( err ) throw err;
});

var counter = new mongoose.Schema({
    counter: Number,
    type   : { type: String, enum: ['summary', 'moment', 'invalid'] }
});

var Counter = mongoose.model('Counter', counter);

/*
 1-0:0.0.0*255(4110427)
 1-0:1.8.0*255(00006797.8375667*kWh)
 1-0:21.7.255*255(000099.97*W)
 1-0:41.7.255*255(000310.86*W)
 1-0:61.7.255*255(000063.15*W)
 1-0:1.7.255*255(000473.98*W)
 1-0:96.5.5*255(82)
 0-0:96.1.255*255(1ESY1014001949)
 */

serialPort.on("data", function ( data ) {
    var packetPattern = /^[0-9]-[0-9]/i,
        typePattern = /^[0-9]-[0-9]:(.*?)\*/i,
        dataPattern = /\((.*?)\*.*?\)/i;

    if ( !data.match(packetPattern) ) {
        return;
    }

    var entry = {
        counter: null,
        type   : 'invalid'
    };

    switch ( typePattern.exec(data)[1] ) {
        case '1.8.0':
            entry.counter = parseFloat(dataPattern.exec(data)[1]);
            entry.type = 'summary';
            break;

        case '1.7.255':
            entry.counter = parseFloat(dataPattern.exec(data)[1]);
            entry.type = 'moment';
            break;
        default:
            return;
            break;
    }

    var counter = new Counter(entry);
    counter.save(function ( err, doc ) {
        //console.log(arguments);
    });
});

io.sockets.on('connection', function ( socket ) {
    serialPort.on("data", function ( data ) {
        var packetPattern = /^[0-9]-[0-9]/i,
            typePattern = /^[0-9]-[0-9]:(.*?)\*/i,
            dataPattern = /\((.*?)\*.*?\)/i;

        if ( !data.match(packetPattern) ) {
            return;
        }

        var entry = {
            counter: null,
            type   : 'invalid',
            date   : new Date()
        };

        switch ( typePattern.exec(data)[1] ) {
            case '1.7.255':
                entry.counter = parseFloat(dataPattern.exec(data)[1]);
                entry.type = 'moment';
                break;
            default:
                return;
                break;
        }

        socket.emit('data', entry);
    });

    socket.on('today', function ( callback ) {
        Counter.findOne({
            type: 'summary',
            _id : {
                $gt: Math.floor((new xDate()).setHours(0).setMinutes(0).setSeconds(0).getTime() / 1000).toString(16) + "0000000000000000"
            }
        }).limit(1).exec(function ( err, docs ) {
                if ( err ) return;

                Counter.findOne({
                    type: 'summary'
                }).sort('_id', -1).limit(1).exec(function ( err, last ) {
                        if ( err ) return;

                        callback(Math.floor((last.get('counter') - docs.get('counter')) * 100) / 100);
                    });
            });
    });

    socket.on('month', function ( callback ) {
        Counter.findOne({
            type: 'summary',
            _id : {
                $gt: Math.floor((new xDate()).setHours(0).setMinutes(0).setSeconds(0).setDate(1).getTime() / 1000).toString(16) + "0000000000000000"
            }
        }).limit(1).exec(function ( err, docs ) {
                if ( err ) return;

                Counter.findOne({
                    type: 'summary',
                    _id : {
                        $lt: Math.floor((new xDate()).setHours(23).setMinutes(59).setSeconds(59).setDate(xDate.getDaysInMonth((new xDate()).getFullYear(),
                            (new xDate()).getMonth())).getTime() / 1000).toString(16) + "0000000000000000"
                    }
                }).sort('_id', -1).limit(1).exec(function ( err, last ) {
                        if ( err ) return;

                        callback(Math.floor((last.get('counter') - docs.get('counter')) * 100) / 100);
                    });
            });
    });

    socket.on('complete', function ( callback ) {
        Counter.findOne({
            type: 'summary'
        }).sort('_id', -1).limit(1).exec(function ( err, docs ) {
                if ( err ) return;

                Counter.findOne({
                    type: 'summary',
                    _id : {
                        $gt: Math.floor((new xDate()).setHours(0).setMinutes(0).setSeconds(0).setDate(1).setMonth(1).getTime() / 1000).toString(16) + "0000000000000000"
                    }
                }).sort('_id', 1).limit(1).exec(function ( err, first ) {
                        if ( err ) return;

                        callback({
                            complete: Math.floor(docs.get('counter') * 100) / 100,
                            year    : Math.floor((docs.get('counter') - (((new xDate()).getFullYear() == counterConfig.year) ? counterConfig.num : first.get('counter'))) * 100) / 100
                        });
                    });
            });
    });

    socket.on('connectedClients', function ( callback ) {
        var cmd = spawn('arp-scan', ['-l']);

        cmd.stdout.on('data', function ( data ) {
            var lines = data.toString().split("\n"),
                regEx = /\s*(\d+\.\d+\.\d+\.\d+)\s*([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})\s*(.*)/,
                clients = [];

            lines.forEach(function ( line ) {
                if ( line.match(regEx) ) {
                    var client = line.match(regEx);
                    clients.push({
                        ip      : client[1],
                        mac     : client[2],
                        hostname: 'unknown'
                    });
                }
            });

            callback(clients);
        });
    });
});

app.configure(function () {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);

    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler());
});

app.get('/', function ( req, res ) {
    res.redirect('/index.html');
});

app.listen(8080);