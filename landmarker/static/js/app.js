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
requirejs(["jquery", "three",
           "app/landmark", "app/sidebar",
           "app/app", "app/viewport", "app/toolbar"],
    function($, THREE, Landmark, Sidebar, App, Viewport, Toolbar) {

        "use strict";

        $(function () {
            app = new App.App;
            sidebar = new Sidebar.Sidebar({model: app});
            // note that we provide the Viewport with the canavas overlay of
            // the viewport as requested.
            viewport = new Viewport.Viewport(
                {
                    model: app,
                    el: $('#vpoverlay')
                });
            toolbar = new Toolbar.Toolbar({model: app.get('meshSource')});

        // ----- KEYBOARD HANDLER ----- //
        $(window).keypress(function(e) {
            var key = e.which;
            switch (key) {
                case 100:  // d
                    app.landmarks().deleteSelected();
                    break;
                case 32:  // space bar = reset camera
                    viewport.resetCamera();
                    break;
                case 116:  // t = [T]exture toggle
                    app.mesh().textureToggle();
                    break;
                case 119:  // w = [W]ireframe toggle
                    app.mesh().wireframeToggle();
                    break;
                case 97:  // a = select [A]ll
                    app.landmarks().selectAllInActiveGroup();
                    break;
            }
        });

        });
    }
);
