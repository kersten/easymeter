define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'hgn!/templates/Network/Port'
], function ( $, _, Backbone, socket, template ) {
    var View = Backbone.View.extend({
        render: function () {
            $(this.el).html(template());
        }
    });

    return View;
});