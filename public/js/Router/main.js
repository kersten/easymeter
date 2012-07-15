define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'EventEmitter',
    'Views/Home',
    'Views/Navigation',
    'Views/Network',
    'Views/Login',
    'Views/System',
    'Views/NotFound'
],
    function ( $, _, Backbone, socket, EventEmitter, HomeView, NavigationView, NetworkView, LoginView, SystemView, NotFoundView ) {
        var Router = Backbone.Router.extend({
            routes: {
                ''             : 'homeRoute',
                'home'         : 'homeRoute',
                'network'      : 'networkRoute',
                'network/:page': 'networkRoute',
                'system'       : 'systemRoute',
                'system/*page' : 'systemRoute',
                'login'        : 'loginRoute',
                '*actions'     : 'defaultRoute'
            },

            initialize: function () {
                this.bind('all', function ( ev ) {
                    if ( ev.indexOf('beforeroute:') === 0 ) {
                        //EventEmitter.emit('beforeroute', ev, Backbone.history.fragment);

                        if ( this.view != null ) {
                            if ( typeof(this.view.deinitialize) == 'function' ) {
                                this.view.deinitialize();
                            }

                            this.view.remove();
                            $('body > div.container').prepend($('<div id="content"></div>'));
                        }
                    }
                });
            },

            route: function ( route, name, callback ) {
                return Backbone.Router.prototype.route.call(this, route, name, function () {
                    var _this = this;
                    this.trigger.apply(this, ['beforeroute:' + name].concat(_.toArray(arguments)));

                    var self = this;
                    var func_args = arguments;

                    //this.updateNavigation(route);

                    socket.emit('connected', function ( response ) {
                        if ( !response.connected && Backbone.history.fragment != 'login' ) {
                            Backbone.history.navigate('/login', true);
                        } else {
                            callback.apply(self, func_args);
                        }

                        NavigationView.render(response.connected);
                    });
                });
            },

            homeRoute: function () {
                this.view = new HomeView({
                    el: $('#content')
                });

                this.view.render();
            },

            networkRoute: function ( page ) {
                this.view = new NetworkView({
                    el  : $('#content'),
                    page: page
                });

                this.view.render();
            },

            systemRoute: function ( page ) {
                this.view = new SystemView({
                    el  : $('#content'),
                    page: page
                });

                this.view.render();
            },

            loginRoute: function () {
                this.view = new LoginView({
                    el: $('#content')
                });

                this.view.render();
            },

            defaultRoute: function () {
                this.view = new NotFoundView({
                    el: $('#content')
                });

                this.view.render();
            }
        });

        var router = new Router();

        Backbone.history.start({pushState: true});

        return router;
    });