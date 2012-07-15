define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'hgn!/templates/System/Inside/SmartMeter',
    'goog!visualization,1.1,packages:[corechart]'
], function ( $, _, Backbone, socket, template ) {
    var View = Backbone.View.extend({
        yearlyCosts: 0,

        drawChart: function () {
            var that = this;

            this.data = [
                ['Uhrzeit', 'Verbrauch']
            ];

            this.chart = new google.visualization.LineChart($('#chart_div').get(0)),
                this.options = {
                    title                 : 'Aktueller Stromverbrauch (maximal 2 Minuten)',
                    titleTextStyle        : {color: '#333', fontName: 'Ubuntu', fontSize: 18},
                    curveType             : "function",
                    width                 : 620,
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

            socket.on('data', function ( rawData ) {
                var date = new XDate(new Date(rawData.date));
                that.data.push([date.toString("HH:mm:ss"), rawData.counter]);

                if ( that.data.length >= 60 ) {
                    that.data.splice(1, 1);
                }

                that.renderData();
            });
        },

        renderData: function () {
            var gData = google.visualization.arrayToDataTable(this.data);
            this.chart.draw(gData, this.options);
        },

        todayFunc: function () {
            socket.emit('today', function ( data ) {
                $('#counterToday').text(data + ' kWh (' + (Math.floor(0.2329 * data * 100) / 100) + '€)');
                $('#counterTodayAverage').text((Math.floor((data / ((parseInt((new XDate()).toString("H")) * 60) + parseInt((new XDate()).toString("m")))) * 60 * 100) / 100) + ' kW pro Stunde');
                $('#counterTodayCost').text('Heute voraussichtlich ' + (Math.floor((0.2329 * data) / parseInt((new XDate()).toString("H")) * 24 * 100) / 100) + '€ Kosten');
            });

            setTimeout(function ( thisObj ) {
                thisObj.todayFunc();
            }, 5000, this);
        },

        monthFunc: function () {
            socket.emit('month', function ( data ) {
                $('#counterMonth').text(data + ' kWh (' + (Math.floor(0.2329 * data * 100) / 100) + '€)');
                $('#counterMonthAverage').text((Math.floor((data / parseInt((new XDate()).toString("d"))) * 100) / 100) + ' kW pro Tag');
                $('#counterMonthCost').text('Voraussichtlich ' + (Math.floor((0.2329 * data / (new XDate()).getDate()) * 100 * XDate.getDaysInMonth((new XDate()).getFullYear(),
                    (new XDate()).getMonth())) / 100) + '€ Kosten diesen Monat');
            });

            setTimeout(function ( thisObj ) {
                thisObj.monthFunc();
            }, 5000, this);
        },

        counterFunc: function () {
            var that = this;

            socket.emit('complete', function ( data ) {
                that.yearlyCosts = (Math.floor((0.2329 * data.year / (new XDate()).getMonth()) * 100 * 12) / 100);

                $('#counterComplete').text(data.complete + ' kWh');
                $('#counterCompleteYear').text(data.year + ' kWh dieses Jahr (' + (Math.floor(0.2329 * data.year * 100) / 100) + '€)');
                $('#counterCompleteYearCost').text('Voraussichtlich ' + (Math.floor((0.2329 * data.year / (new XDate()).getMonth()) * 100 * 12) / 100) + '€ Kosten dieses Jahr');

                that.contractData();
            });

            setTimeout(function ( thisObj ) {
                thisObj.counterFunc();
            }, 5000, this);
        },

        contractData: function () {
            var that = this;

            socket.emit('smartmeter:contract:data', function ( data ) {
                $('#monthly').text('Monatlicher Abschlag: ' + (Math.floor(data.monthly * 100) / 100) + '€');
                $('#yearly').text('Gesamt Summe pro Jahr: ' + (Math.floor(data.monthly * 12 * 100) / 100) + '€');
                $('#difference').text('Differenz: ' + (Math.floor((that.yearlyCosts - (Math.floor(data.monthly * 12 * 100) / 100)) * 100) / 100) + '€');
            });
        },

        render: function () {
            $(this.el).html(template());

            this.drawChart();
            this.todayFunc();
            this.monthFunc();
            this.counterFunc();
        },

        deinitialize: function () {
            socket.removeAllListeners('data');
        }
    });

    return View;
});