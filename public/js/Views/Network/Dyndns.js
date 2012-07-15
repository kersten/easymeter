define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'Models/Dyndns',
    'hgn!/templates/Network/Dyndns'
], function ( $, _, Backbone, socket, Dyndns, template ) {
    var View = Backbone.View.extend({
        callRender: false,

        events: {
            'click button[type="submit"]': 'save'
        },

        initialize: function () {
            _.bindAll(this, 'render');

            this.model = new Dyndns();

            // this is called upon fetch
            this.model.bind('change', this.render);

            this.model.fetch();
        },

        save: function () {

        },

        render: function () {
            console.log(this.model.toJSON());

            $(this.el).html(template(this.model.toJSON()));
        }
    });

    return View;
});