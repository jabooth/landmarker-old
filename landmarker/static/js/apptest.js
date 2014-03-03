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

var SidebarG;
var LandmarkG;
var THREEG;

var sidebar;
var landmarkList;

// Start the main app logic.
requirejs(["jquery", "three",
           "app/landmarkbb", "app/sidebarbb"],
    function($, THREE, Landmark, Sidebar) {

        "use strict";

        $(function () {
            landmarkList = new Landmark.LandmarkList;
            THREEG = THREE;
            SidebarG = Sidebar;
            LandmarkG = Landmark;
        });
    }
);
