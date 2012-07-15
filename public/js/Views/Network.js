define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'require',
    'hgn!/templates/Network',
    'Views/Network/App',
    'Views/Network/Dhcp',
    'Views/Network/Dns',
    'Views/Network/Dyndns',
    'Views/Network/Firewall',
    'Views/Network/Help',
    'Views/Network/Logs',
    'Views/Network/Port',
    'Views/Network/Provider'
], function ( $, _, Backbone, socket, require, template ) {
    var View = Backbone.View.extend({
        events: {
            'click ul.nav > li > a': 'navigate'
        },

        initialize: function () {
            if ( !this.options.page ) {
                this.options.page = 'provider';
            }
        },

        navigate: function ( e ) {
            e.preventDefault();

            Backbone.history.navigate('/network/' + $(e.currentTarget).attr('href').substr(1), false);

            this.options.page = $(e.currentTarget).attr('href').substr(1);
            this.showView();
        },

        showView: function () {
            $('li.active', this.el).removeClass('active');
            $('li > a[href="#' + this.options.page + '"]', this.el).parent().addClass('active');

            if ( this.view != null ) {
                if ( typeof(this.view.deinitialize) == 'function' ) {
                    this.view.deinitialize();
                }

                this.view.remove();
                $('.row', this.el).append($('<div class="span8" id="subContent"></div>'));
            }

            var View = require('Views/Network/' + this.options.page.charAt(0).toUpperCase() + this.options.page.slice(1));
            this.view = new View({
                el: $('#subContent', this.el)
            });

            if ( this.view.callRender === undefined || this.view.callRender === true ) {
                this.view.render();
            }
        },

        render: function () {
            $(this.el).html(template());
            this.showView();
        }
    });

    return View;
});