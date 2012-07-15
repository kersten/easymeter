var fs = require("fs"),
    mongoose = require('mongoose');

mongoose.connect(process.env.MONGOLAB_STRING, function ( err ) {
    if ( err ) throw err;
});

var files = require('findit').sync(__dirname + '/lib/schema');

files.forEach(function ( file ) {
    if ( fs.lstatSync(file).isFile() ) {
        console.log('info:  Register Schema "' + file + '"');
        require(file);
    }
});

delete(files);

var easymeter = require('./lib/easymeter'),
    webserver = require('./lib/webserver');

/*

hook.on('hook::ready', function () {
    var hooks = [
        hostnameHook = require('./lib/hostname'),
        easymeterHook = require('./lib/easymeter')
    ];

    async.map(hooks, function ( hook, callback ) {
        hook.on('hook::ready', function () {
            callback(null);
        });

        hook.start();
    }, function () {
        var webserverHook = require('./lib/webserver');
        webserverHook.start();
    });
});

hook.start();   */