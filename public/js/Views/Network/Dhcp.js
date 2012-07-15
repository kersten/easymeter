define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'hgn!/templates/Network/Dhcp'
], function ( $, _, Backbone, socket, template ) {
    var View = Backbone.View.extend({
        render: function () {
            socket.emit('network:dhcp', function ( response ) {
                console.log(response.interfaces);

                $(this.el).html(template({
                    interfaces: response.interfaces
                }));
            });
        }
    });

    return View;
});