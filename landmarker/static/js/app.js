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

// Start the main app logic.
requirejs(["jquery", "three", "app/landmark", "app/sidebar", "app/mesh",
           "app/app", "app/viewport"],
    function($, THREE, Landmark, Sidebar, Model, App, Viewport) {

        "use strict";

        $(function () {



            app = new App.App;
            sidebar = new Sidebar.Sidebar({model: app});
            viewport = new Viewport.ViewportTHREEView({model: app, el: $('#viewport')});

        });
    }
);

function addUnitSphere(viewport) {
    var mat = new THREE.MeshPhongMaterial({color: 0x75ff75});
    var geo = new THREE.SphereGeometry(1, 10, 10);
    var unitsphere = new THREE.Mesh(geo, mat);
    viewport.scene.add(unitsphere);
}
