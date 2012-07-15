define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'Views/Navigation',
    'hgn!/templates/Login'
], function ( $, _, Backbone, socket, NavigationView, template ) {
    var LoginView = Backbone.View.extend({
        events: {
            'click button'  : 'login',
            'keypress input': 'login'
        },

        login: function ( e ) {
            var keyCode = e.keyCode ? e.keyCode : e.which ? e.which : e.charCode;

            if ( e.currentTarget.nodeName == 'BUTTON' ) {
                e.preventDefault();
            }

            if ( keyCode == 13 || e.currentTarget.nodeName == 'BUTTON' ) {
                e.preventDefault();

                socket.emit('connect', {password: $('input').val()}, function ( response ) {
                    if ( response.connected ) {
                        Backbone.history.navigate('/', true);
                        NavigationView.render(response.connected);
                    } else {
                        console.log('Falsches Passwort')
                    }
                });
            }
        },

        render: function () {
            $(this.el).html(template());
        }
    });

    return LoginView;
});