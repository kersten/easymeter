require.config({
    waitSeconds: 15,

    baseUrl: '/js',

    // set paths since they are outside the baseUrl
    paths  : {
        app           : '/',
        jquery        : 'libs/jquery-1.7.2',
        plugins       : 'libs/plugins',
        backbone      : 'libs/backbone',
        underscore    : 'libs/underscore',
        iobind        : 'libs/backbone.iobind',
        iosync        : 'libs/backbone.iosync',
        bootstrap     : 'libs/bootstrap',
        XDate         : 'libs/xdate',
        hgn           : 'libs/requirejs/hgn',
        text          : 'libs/requirejs/text',
        hogan         : 'libs/requirejs/hogan',
        i18n          : 'libs/requirejs/i18n',
        async         : 'libs/requirejs/async',
        goog          : 'libs/requirejs/goog',
        propertyParser: 'libs/requirejs/propertyParser',
        'socket.io'   : 'libs/socket.io',
        EventEmitter  : 'libs/EventEmitter'
    },

    shim: {
        backbone: {
            deps   : ['underscore', 'jquery'],
            exports: function ( _, $ ) {
                return window.Backbone.noConflict();
            }
        },

        underscore: {
            exports: '_'
        },

        iosync: {
            deps: ['backbone']
        },

        iobind: {
            deps   : ['iosync'],
            exports: 'Backbone.ioBind'
        },

        'plugins': ['jquery'],

        'bootstrap': ['jquery']
    }
});

require([
    'jquery',
    'XDate',
    'socket.io',
    'Router/main'
], function ( $, XDate, socket, Router ) {
    return;

    var today = 0;

    var todayFunc = function () {
        socket.emit('today', function ( data ) {
            $('#counterToday').text(data + ' kWh (' + (Math.floor(0.2329 * data * 100) / 100) + '€)');
            $('#counterTodayAverage').text((Math.floor((data / ((parseInt((new XDate()).toString("H")) * 60) + parseInt((new XDate()).toString("m")))) * 60 * 100) / 100) + ' kW pro Stunde');
            $('#counterTodayCost').text('Heute voraussichtlich ' + (Math.floor((0.2329 * data) / parseInt((new XDate()).toString("H")) * 24 * 100) / 100) + '€ Kosten');
        });

        setTimeout(todayFunc, 5000);
    };

    todayFunc();

    var monthFunc = function () {
        socket.emit('month', function ( data ) {
            $('#counterMonth').text(data + ' kWh (' + (Math.floor(0.2329 * data * 100) / 100) + '€)');
            $('#counterMonthAverage').text((Math.floor((data / parseInt((new XDate()).toString("d"))) * 100) / 100) + ' kW pro Tag');
            $('#counterMonthCost').text('Voraussichtlich ' + (Math.floor((0.2329 * data / (new XDate()).getDate()) * 100 * XDate.getDaysInMonth((new XDate()).getFullYear(),
                (new XDate()).getMonth())) / 100) + '€ Kosten diesen Monat');
        });

        setTimeout(monthFunc, 5000);
    };

    monthFunc();

    var counterFunc = function () {
        socket.emit('complete', function ( data ) {
            $('#counterComplete').text(data.complete + ' kWh');
            $('#counterCompleteYear').text(data.year + ' kWh dieses Jahr (' + (Math.floor(0.2329 * data.year * 100) / 100) + '€)');
            $('#counterCompleteYearCost').text('Voraussichtlich ' + (Math.floor((0.2329 * data.year / (new XDate()).getMonth()) * 100 * 12) / 100) + '€ Kosten dieses Jahr');
        });

        setTimeout(counterFunc, 5000);
    };

    counterFunc();

    socket.emit('connectedClients', function ( data ) {
        console.log(data);

        $('#connectedClients tbody').children().remove();
        data.forEach(function ( client ) {
            $('<tr><td>' + client.ip + '</td><td>' + client.mac + '</td><td>' + client.hostname + '</td></tr>').appendTo('#connectedClients tbody');
        });

        //socket.emit('connectedClients', arguments.callee);
    });

    // Load the Visualization API and the piechart package.
    google.load('visualization', '1.1', {'packages': ['corechart']});

    // Set a callback to run when the Google Visualization library is loaded.
    google.setOnLoadCallback(drawChart);

    // Callback that creates and populates a data table,
    // instantiates the pie chart, passes in the data and
    // draws it.
    var options = {
        title                 : 'Aktueller Stromverbrauch (maximal 2 Minuten)',
        titleTextStyle        : {color: 'black', fontSize: 30},
        curveType             : "function",
        width                 : 940,
        height                : 290,
        animation             : {
            duration: 1000,
            easing  : 'inAndOut'
        },
        backgroundColor       : { fill: 'transparent' },
        'vAxis.baseline'      : 0,
        'vAxis.viewWindow.min': 0,
        'vAxis.title'         : 'Watt',
        legend                : {position: 'none'},
        chartArea             : {width: '90%'},
        vAxis                 : {textPosition: 'in', minValue: 0},
        pointSize             : 4,
        series                : { 0: {color: 'red'}  }
    };

    var chart;
    var data = [
        ['Uhrzeit', 'Verbrauch']
    ];

    function drawChart () {
        chart = new google.visualization.LineChart(document.getElementById('chart_div'));

        socket.on('data', function ( rawData ) {
            var date = new XDate(new Date(rawData.date));
            data.push([date.toString("HH:mm:ss"), rawData.counter]);

            today += rawData.counter / 12;

            if ( data.length >= 60 ) {
                data.splice(1, 1);
            }

            renderData();
        });
    }

    function renderData () {
        var gData = google.visualization.arrayToDataTable(data);
        chart.draw(gData, options);
    }
});