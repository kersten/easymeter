define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'iobind'
], function ( $, _, Backbone, socket ) {
    var Model = Backbone.Model.extend({
        urlRoot: 'dyndns:settings'
    });

    return Model;
});