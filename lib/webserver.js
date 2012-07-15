var express = require('express'),
    app = express.createServer(),
    connect = require('express/node_modules/connect'),
    fs = require('fs'),
    SessionMongoose = require("session-mongoose"),
    mongooseSessionStore = new SessionMongoose({
        url     : 'mongodb://easymeter:XSbOXfNH@ds033457.mongolab.com:33457/easymeter',
        interval: 120000 // expiration check worker run interval in millisec (default: 60000)
    }),
    hoganSrc = fs.readFileSync(require.resolve('hogan.js/web/builds/2.0.0/hogan-2.0.0.amd.js')),
    io = require('socket.io').listen(app),
    lessMiddleware = require('less-middleware'),
    Meter = require('mongoose').model('Meter'),
    xDate = require('xdate'),
    counterConfig = {
        year: 2012,
        num : 5064
    },
    os = require('os');

io.configure(function () {
    var parseCookie = connect.utils.parseCookie;
    var Session = connect.middleware.session.Session;

    this.set('authorization', function ( data, accept ) {
        if ( data.headers.cookie ) {
            data.cookie = parseCookie(data.headers.cookie);
            data.sessionID = data.cookie['homeworker'];

            // save the session store to the data object
            // (as required by the Session constructor)

            data.sessionStore = mongooseSessionStore;
            mongooseSessionStore.get(data.sessionID, function ( err, session ) {
                if ( err ) {
                    accept(err.message, false);
                } else {
                    // create a session object, passing data as request and our
                    // just acquired session data
                    data.session = new Session(data, session);

                    accept(null, true);
                }
            });
        } else {
            return accept('No cookie transmitted.', false);
        }
    });
});

io.sockets.on('connection', function ( socket ) {
    socket.on('connected', function ( callback ) {
        callback({connected: socket.handshake.session.connected});
    });

    socket.on('connect', function ( data, callback ) {
        if ( data.password == 'pass' ) {
            socket.handshake.session.connected = true;
            callback({connected: true});
        } else {
            socket.handshake.session.connected = false;
            callback({connected: false});
        }

        mongooseSessionStore.set(socket.handshake.sessionID, {connected: socket.handshake.session.connected});
        socket.handshake.session.touch().save();
    });

    socket.on('home:overview', function ( callback ) {
        var osInfos = {
            hostname: os.hostname(),
            type    : os.type(),
            platform: os.platform(),
            arch    : os.arch(),
            release : os.release(),
            uptime  : os.uptime(),
            load    : os.loadavg(),
            totalmem: os.totalmem(),
            freemem : os.freemem(),
            cpus    : os.cpus()
        };

        callback(osInfos);
        delete(osInfos);
    });

    socket.on('network:dhcp', function ( callback ) {
        callback({
            interfaces: os.networkInterfaces()
        });
    });

    socket.on('dyndns:settings:read', function ( data, callback ) {
        callback(null, {
            interface: 'ppp0',
            noip     : true,
            login    : 'kerstenk@gmail.com',
            password : 'password'
        });
    });

    /*webserverHook.on('easymeter::meter', function ( meter ) {
        if ( meter.type == 'moment' ) {
            socket.emit('data', meter);
        }

        delete(meter);
    });*/

    socket.on('today', function ( callback ) {
        Meter.findOne({
            type: 'summary',
            _id : {
                $gt: Math.floor((new xDate()).setHours(0).setMinutes(0).setSeconds(0).getTime() / 1000).toString(16) + "0000000000000000"
            }
        }).limit(1).exec(function ( err, docs ) {
                if ( err ) return;

                Meter.findOne({
                    type: 'summary'
                }).sort('_id', -1).limit(1).exec(function ( err, last ) {
                        if ( err ) return;

                        callback(Math.floor((last.get('counter') - docs.get('counter')) * 100) / 100);
                    });
            });
    });

    socket.on('month', function ( callback ) {
        Meter.findOne({
            type: 'summary',
            _id : {
                $gt: Math.floor((new xDate()).setHours(0).setMinutes(0).setSeconds(0).setDate(1).getTime() / 1000).toString(16) + "0000000000000000"
            }
        }).limit(1).exec(function ( err, docs ) {
                if ( err ) return;

                Meter.findOne({
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
        Meter.findOne({
            type: 'summary'
        }).sort('_id', -1).limit(1).exec(function ( err, docs ) {
                if ( err ) return;

                Meter.findOne({
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

    socket.on('smartmeter:contract:data', function ( callback ) {
        callback({
            monthly: 84.00
        });
    });

    socket.on('connectedClients', function ( callback ) {
        /*hostnameHook.emit('list', function ( clients ) {
            callback(clients);
        });*/
    });
});

app.configure(function () {
    app.use(lessMiddleware({
        src     : __dirname + '/../less',
        compress: true,
        once    : true,
        dest    : __dirname + '/../public',
        debug   : true
    }));

    app.use(express.static(__dirname + '/../public'));

    app.use(express.cookieParser('a'));
    app.use(express.logger());

    app.use(express.session({
        store : mongooseSessionStore,
        secret: 'a',
        key   : 'homeworker',
        maxAge: null
    }));
});

app.get('/js/hogan.js', function ( req, res ) {
    res.header('Content-Type', 'application/javascript');
    res.end(hoganSrc);
});

app.get('/templates/*', function ( req, res ) {
    var file = fs.readFileSync(__dirname + '/../templates/' + req.params[0]);

    res.send(file);
    delete(file);
});

app.get('*', function ( req, res ) {
    var file = fs.readFileSync(__dirname + '/../views/index.mustache');

    res.header('Content-Type', 'text/html');
    res.end(file);
    delete(file);
});

app.listen(8080);