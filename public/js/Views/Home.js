define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'hgn!/templates/Home'
], function ( $, _, Backbone, socket, template ) {
    var View = Backbone.View.extend({
        update: function ( response ) {
            $('#memused', this.el).animate({
                width: (100 / response.totalmem) * (response.totalmem - response.freemem) + '%'
            }).html((Math.floor(((response.totalmem - response.freemem) / 1024 / 1024 / 1024) * 100) / 100) + 'Gb of ' + (Math.floor(response.totalmem / 1024 / 1024 / 1024 * 100) / 100) + 'Gb used');
        },

        render: function () {
            var that = this;

            $(this.el).html(template());

            this.getStats = setInterval(function () {
                socket.emit('home:overview', function ( response ) {
                    console.log(response);

                    that.update(response);
                });
            }, 2000);
        },

        deinitialize: function () {
            clearInterval(this.getStats);
        }
    });

    return View;
});