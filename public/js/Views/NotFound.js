define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'hgn!/templates/NotFound'
], function ( $, _, Backbone, socket, template ) {
    var View = Backbone.View.extend({
        render: function ( connected ) {
            $(this.el).html(template());
        }
    });

    return View;
});