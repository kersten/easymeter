define([
    'jquery',
    'underscore',
    'backbone',
    'hgn!/templates/Navigation'
], function ( $, _, Backbone, template ) {
    var NavigationView = Backbone.View.extend({
        events: {
            'click a': 'navigate'
        },

        navigate: function ( e ) {
            e.preventDefault();

            $('li.active', this.el).removeClass('active');

            if ( !$(e.currentTarget).hasClass('brand') ) {
                $(e.currentTarget).parent().addClass('active');
            }

            Backbone.history.navigate($(e.currentTarget).attr('href').substr(1), true);
        },

        render: function ( connected ) {
            $(this.el).html(template({
                connected: connected
            }));

            $('li.active', this.el).removeClass('active');
            $('li > a[href="#' + Backbone.history.fragment + '"]', this.el).parent().addClass('active');
        }
    });

    return new NavigationView({
        el: '#navigation'
    });
});