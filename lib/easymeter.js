var serialport = require("serialport"),
    SerialPort = serialport.SerialPort,
    serialPort = new SerialPort("/dev/serial/by-id/usb-Prolific_Technology_Inc._USB-Serial_Controller-if00-port0", {
        parser    : serialport.parsers.readline("\n"),
        databits  : 7,
        parity    : 1,
        buffersize: 150
    }),
    mongoose = require('mongoose');

var Meter = mongoose.model('Meter');

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

    if ( typePattern.exec(data)[1] == null ) {
        return;
    }

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

    var meter = new Meter(entry);
    meter.save();

    entry.date = new Date();

    //easymeterHook.emit('meter', entry);

    delete(data);
    delete(entry);
    delete(meter);
});