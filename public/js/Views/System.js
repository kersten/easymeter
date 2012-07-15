define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'hgn!/templates/System',
    'Views/System/Inside/Devices',
    'Views/System/Inside/Lights',
    'Views/System/Inside/SmartMeter',
    'Views/System/Outside/GardenWatering',
    'Views/System/Outside/Lights',
    'Views/System/Contracts',
    'Views/System/Help'
], function ( $, _, Backbone, socket, template ) {
    var View = Backbone.View.extend({
        view: null,

        events: {
            'click ul.nav > li > a': 'navigate'
        },

        initialize: function () {
            if ( !this.options.page ) {
                this.options.page = 'inside/SmartMeter';
            }
        },

        navigate: function ( e ) {
            e.preventDefault();

            if ( $(e.currentTarget).parent().hasClass('active') ) {
                return;
            }

            Backbone.history.navigate('/system/' + $(e.currentTarget).attr('href').substr(1), false);

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

            var View = require('Views/System/' + this.options.page.charAt(0).toUpperCase() + this.options.page.slice(1));
            this.view = new View({
                el: $('#subContent', this.el)
            });

            this.view.render();
        },

        render: function () {
            $(this.el).html(template());
            this.showView();
        }
    });

    return View;
});