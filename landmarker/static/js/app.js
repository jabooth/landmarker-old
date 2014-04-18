requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        app: '../app',
        jquery: 'jquery-2.1.0',
        underscore: 'underscore-min',
        backbone: 'backbone',
        signals: 'signals.min',
        three: 'three'
    },
    shim: {
        three: {
            exports: 'THREE'
        }
    }
});

var app;
var sidebar;
var viewport;
var toolbar;

// Start the main app logic.
requirejs(["jquery", "three", "app/landmark", "app/sidebar", "app/mesh",
           "app/app", "app/viewport", "app/toolbar"],
    function($, THREE, Landmark, Sidebar, Model, App, Viewport, Toolbar) {

        "use strict";

        $(function () {
            app = new App.App;
            sidebar = new Sidebar.Sidebar({model: app});
            viewport = new Viewport.ViewportTHREEView({model: app, el: $('#viewport')});
            toolbar = new Toolbar.Toolbar({model: app.get('meshSource')});
        });
    }
);
