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
        three: 'three.min'
    },
    shim: {
        three: {
            exports: 'THREE'
        }
    }
});

var app = {};
var THREEG;
var LandmarksG;

// Start the main app logic.
requirejs(["jquery", "signals",
           "app/app", "app/landmarkbb", "app/viewport", "app/sidebarbb"],
    function($, SIGNALS, App, Landmark, Viewport, Sidebar) {

        "use strict";

        $(function () {
            var app = new App.App;
            var signaller = {
                rendererChanged: new SIGNALS.Signal(),
                landmarkChanged: new SIGNALS.Signal(),
                landmarkSetChanged: new SIGNALS.Signal(),
                clearColorChanged: new SIGNALS.Signal(),
                windowResize: new SIGNALS.Signal(),
                meshChanged: new SIGNALS.Signal(),
                resetView: new SIGNALS.Signal()
            };

            var keyboard = {
                ctrl: false,
                shift: false,
                delete: false
            };

            var viewport = new Viewport.Viewport(signaller, keyboard,
                $('.viewport'));

            app.on('change:model', function () {
                console.log("model has changed");
           });


            // handle resizing
            var onWindowResize = function () {
                signaller.windowResize.dispatch();
            };
            window.addEventListener('resize', onWindowResize, false);
            onWindowResize();

            //app.sidebar = Sidebar.Sidebar(app.signaller, app.keyboard);
        });
    }
);

// insert the panel into the page at the right place
// $('.Sidebar-LandmarksPanel').html(sidebar.render().$el);