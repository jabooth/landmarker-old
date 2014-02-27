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
        signals: 'signals.min',
        three: 'three.min'
    },
    shim: {
        three: {
            exports: 'THREE'
        }
    }
});

// Start the main app logic.
requirejs(["jquery", "signals",
           "app/landmark", "app/rest", "app/viewport", "app/sidebar"],
    function($, SIGNALS, Landmark, Rest, Viewport, Sidebar) {
        $(function () {
            var app = {};
            app.signaller = {
                rendererChanged: new SIGNALS.Signal(),
                landmarkChanged: new SIGNALS.Signal(),
                landmarkSetChanged: new SIGNALS.Signal(),
                clearColorChanged: new SIGNALS.Signal(),
                windowResize: new SIGNALS.Signal(),
                meshChanged: new SIGNALS.Signal(),
                resetView: new SIGNALS.Signal()
            };

            app.keyboard = {
                ctrl: false,
                shift: false,
                delete: false
            };

            app.viewport = new Viewport.Viewport(app.signaller, app.keyboard,
                $('.viewport'));


            var onWindowResize = function () {
                app.signaller.windowResize.dispatch();
            };

            window.addEventListener('resize', onWindowResize, false);
            onWindowResize();

            document.addEventListener('keydown', function (event) {
                console.log("down: " + event.keyCode);
                switch (event.keyCode) {
                    case 46:  // delete
                        // TODO should clear selected landmarks
                        break;
                    case 85:  // u(ndo)
                        app.lms.undo();
                        app.signaller.landmarkSetChanged.dispatch(app.lms);
                        break;
                    case 82:  // r(edo)
                        app.lms.redo();
                        app.signaller.landmarkSetChanged.dispatch(app.lms);
                        break;
                    case 32: // spacebar
                        app.signaller.resetView.dispatch();
                        break;
                    case 16: // shift
                        app.keyboard.shift = true;
                        break;
                    case 17:  // ctrl
                        app.keyboard.ctrl = true;
                        break;
                    case 27:  // esc
                        app.lms.deselectAll();
                        app.signaller.landmarkSetChanged.dispatch(app.lms);
                        break;
                }
            }, false);

            document.addEventListener('keyup', function (event) {
                console.log("up: " + event.keyCode);
                switch (event.keyCode) {
                    case 16:  // shit
                        app.keyboard.shift = false;
                        break;
                    case 17:  // ctrl
                        app.keyboard.ctrl = false;
                        break;
                }
            }, false);

            app.signaller.meshChanged.add(function (mesh) {
                // get a handle on the current mesh
                app.mesh = mesh;
                // make a fresh LM set
                app.lms = Landmark.LandmarkSet(['PTS'], [34],
                    mesh.getModelId());
                console.log("clearing landmarks for new face");
                app.signaller.landmarkSetChanged.dispatch(app.lms);
            });

            app.restURL = "http://localhost:5000/";
            app.restClient = Rest.RESTClient(app.signaller,
                                             app.restURL, 'icip34');
            app.restClient.retrieveFirstMesh();

            $("#nextMesh").click(function () {
                app.restClient.retrieveMeshAfter(app.mesh.getModelId());
            });
            $("#previousMesh").click(function () {
                app.restClient.retrieveMeshBefore(app.mesh.getModelId());
            });
            $("#saveLandmarks").click(function () {
                app.restClient.saveLandmarks(app.mesh.getModelId(), app.lms);
            });
            $('#undo').click(function() {
                app.lms.undo();
                app.signaller.landmarkSetChanged.dispatch(app.lms);
            });
            $('#redo').click(function() {
                app.lms.redo();
                app.signaller.landmarkSetChanged.dispatch(app.lms);
            });
            $('#resetView').click(function() {
                app.signaller.resetView.dispatch();
            });

            app.sidebar = Sidebar.Sidebar(app.signaller, app.keyboard);
        });
    }
);
