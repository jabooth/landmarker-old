define(['jquery', 'underscore', 'backbone', 'three', './camera'], function ($, _, Backbone, THREE, Camera) {

    "use strict";

    var THREEView = Backbone.View.extend({

        id: 'viewport',

        initialize: function () {
            _.bindAll(this, 'resize', 'render', 'changeModel');
            this.$container = $('#viewportContainer');
            this.scene = new THREE.Scene();
            this.sceneHelpers = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(50, 1, 0.02, 5000);
            // TODO re-add non WebGL support
            this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
            this.camera.position.set(500, 250, 500);
            this.camera.lookAt(this.scene.position);
            var clearColor = 0xAAAAAA;
            this.renderer.setClearColor(clearColor);
            this.renderer.autoClear = false;
            this.renderer.autoUpdateScene = false;
            this.$el.html(this.renderer.domElement);

            // add lights
            var pointLightLeft = new THREE.PointLight(0x404040, 1, 0);
            pointLightLeft.position.set(-100, 0, 100);
            this.scene.add(pointLightLeft);
            var pointLightRight = new THREE.PointLight(0x404040, 1, 0);
            pointLightRight.position.set(100, 0, 100);
            this.scene.add(pointLightRight);
            this.lights = [pointLightLeft, pointLightRight];

            // add model if there already is one
            var modelSrc = this.model.get('modelSrc');
            var model;
            if (modelSrc.has("model")) {
                model = modelSrc.get("model");
                if (model.has("model")) {
                    this.changeModel();
                }
            }

            // Bind event listeners
            window.addEventListener('resize', this.resize, false);
            this.resize();
            this.listenTo(this.model.get('modelSrc'), "change:model", this.changeModel);

//            var mouseHandlers = (function () {
//
//                // x, y position of mouse on click states
//                var onMouseDownPosition = new THREE.Vector2();
//                var onMouseUpPosition = new THREE.Vector2();
//
//                // current world position when in drag state
//                var positionLmDrag = new THREE.Vector3();
//                // vector difference in one time step
//                var deltaLmDrag = new THREE.Vector3();
//
//                // track what was under the mouse upon clicking
//                var PDO = {
//                    nothing: "nothing",
//                    model: "mesh",
//                    landmark: "landmark"
//                };
//                var pressedDownOn = PDO.nothing;
//
//                // where we store the intersection plane
//                var intersectionPlanePosition = new THREE.Vector3();
//                var intersectionsWithLms, intersectionsWithMesh,
//                    intersectionsOnPlane;
//
//                // ----- OBJECT PICKING  ----- //
//                var intersectionPlane = new THREE.Mesh(
//                    new THREE.PlaneGeometry(5000, 5000));
//                intersectionPlane.visible = false;
//                this.sceneHelpers.add(intersectionPlane);
//                var ray = new THREE.Raycaster();
//                var projector = new THREE.Projector();
//
//                // ----- EVENTS ----- //
//                var getIntersects = function (event, object) {
//                    var vector = new THREE.Vector3(
//                        (event.layerX / this.$container.width * 2 - 1,
//                        -(event.layerY / this.$container.width) * 2 + 1, 0.5);
//                    projector.unprojectVector(vector, this.camera);
//                    ray.set(this.camera.position,
//                        vector.sub(this.camera.position).normalize());
//                    if (object instanceof Array) {
//                        return ray.intersectObjects(object, true);
//                    }
//                    return ray.intersectObject(object, true);
//                };
//
//                var onMouseDown = function (event) {
//                    event.preventDefault();
//                    this.$el.focus();
//                    onMouseDownPosition.set(event.layerX, event.layerY);
//                    intersectionsWithLms = getIntersects(event, this.landmarkSymbols);
//                    intersectionsWithMesh = getIntersects(event, this.model);
//                    if (event.button === 0) {  // left mouse button
//                        if (intersectionsWithLms.length > 0 &&
//                            intersectionsWithMesh.length > 0) {
//                            // degenerate case - which is closer?
//                            if (intersectionsWithLms[0].distance <
//                                intersectionsWithMesh[0].distance) {
//                                landmarkPressed();
//                            } else {
//                                meshPressed();
//                            }
//                        } else if (intersectionsWithLms.length > 0) {
//                            landmarkPressed();
//                        } else if (intersectionsWithMesh.length > 0) {
//                            meshPressed();
//                        } else {
//                            nothingPressed();
//                        }
//                        document.addEventListener('mouseup', onMouseUp, false);
//                    }
//
//                    function meshPressed() {
//                        pressedDownOn = PDO.model;
//                    }
//
//                    function landmarkPressed() {
//                        pressedDownOn = PDO.landmark;
//                        positionLmDrag.copy(intersectionsWithLms[0].point);
//                        // the clicked on landmark
//                        var landmarkSymbol = intersectionsWithLms[0].object;
//                        var landmark = this.landmarkSymbolToLandmark[landmarkSymbol.id];
//                        // if user isn't holding down shift or doesn't have multiple
//                        // selected, deselect rest
//                        // TODO handle multiple landmark selection
//                        // select this landmark
//                        landmark.select();
//                        // now we've selected the landmark, we want to enable dragging.
//                        // Fix the intersection plane to be where we clicked, only a
//                        // little nearer to the camera.
//                        intersectionPlanePosition.subVectors(this.camera.position,
//                            this.landmarkSymbol.position);
//                        intersectionPlanePosition.divideScalar(10.0);
//                        intersectionPlanePosition.add(this.landmarkSymbol.position);
//                        intersectionPlane.position.copy(this.intersectionPlanePosition);
//                        intersectionPlane.lookAt(this.camera.position);
//                        intersectionPlane.updateMatrixWorld();
//                        // and attach the drag listener.
//                        document.addEventListener('mousemove', onLandmarkDrag, false);
//                        this.cameraControls.enabled = false;
//                    }
//
//                    function nothingPressed() {
//                        pressedDownOn = PDO.nothing;
//                        this.cameraControls.enabled = true;
//                    }
//                };
//
//                var onLandmarkDrag = function (event) {
//                    intersectionsOnPlane = getIntersects(event, intersectionPlane);
//                    if (intersectionsOnPlane.length > 0) {
//                        deltaLmDrag.subVectors(intersectionsOnPlane[0].point,
//                            positionLmDrag);  // change in this step
//                        // update the position
//                        positionLmDrag.copy(intersectionsOnPlane[0].point);
//                        var activeGroup = landmarkSet.groups().active();
//                        var selectedLandmarks = activeGroup.landmarks().selected();
//                        var lm, lmP;
//                        for (var i = 0; i < selectedLandmarks.length; i++) {
//                            lm = selectedLandmarks[i];
//                            lmP = lm.point().clone();
//                            lmP.add(deltaLmDrag);
//                            lm.set('point', lmP);
//                        }
//                        signals.landmarkSetChanged.dispatch(landmarkSet);
//                    }
//                };
//
//                var onMouseUp = function (event) {
//                    onMouseUpPosition.set(event.layerX, event.layerY);
//                    cameraControls.enabled = true;
//                    var p, lm;
//                    if (onMouseDownPosition.distanceTo(onMouseUpPosition) < 1) {
//                        // a click
//                        if (pressedDownOn === PDO.model) {
//                            //  a click on model
//                            p = intersectionsWithMesh[0].point;
//                            // TODO insert new landmark
//                            var lm = landmarkSet.insertNew(p); //LM
//                            landmarkSet.groups().deselectAll();  //LM
//                            lm.select(); //LM
//                            signals.landmarkChanged.dispatch(lm);
//                            render();
//                        } else if (pressedDownOn === PDO.nothing) {
//                            // a click on nothing - deselect all
//                            landmarkSet.groups().deselectAll();
//                            signals.landmarkSetChanged.dispatch(landmarkSet);
//                        }
//                    } else {
//                        // mouse was dragged
//                        if (pressedDownOn === PDO.landmark) {
//                            // snap landmarks back onto model
//                            var activeGroup = landmarkSet.groups().active();
//                            var selectedLandmarks = activeGroup.landmarks().selected();
//                            var camToLm;
//                            for (var i = 0; i < selectedLandmarks.length; i++) {
//                                lm = selectedLandmarks[i];
//                                camToLm = lm.point().clone().sub(camera.position).normalize();
//                                // make the ray point from camera to this point
//                                ray.set(camera.position, camToLm);
//                                intersectionsWithLms = ray.intersectObject(
//                                    mesh.model(), true);
//                                if (intersectionsWithLms.length > 0) {
//                                    // good, we're still on the model.
//                                    lm.set('point', intersectionsWithLms[0].point);
//                                } else {
//                                    console.log("fallen off model");
//                                    // TODO add back in history!
////                                for (i = 0; i < selectedLandmarks.length; i++) {
////                                    selectedLandmarks[i].rollbackModifications();
////                                }
//                                    // ok, we've fixed the mess. drop out of the loop
//                                    break;
//                                }
//                                // only here as all landmarks were successfully moved
//                                //landmarkSet.snapshotGroup(); // snapshot the active group
//                            }
//                            signals.landmarkSetChanged.dispatch(landmarkSet);
//                        }
//                    }
//
//                    document.removeEventListener('mousemove', onLandmarkDrag);
//                    document.removeEventListener('mouseup', onMouseUp);
//                };
//
//                return {
//                    mouseDown: onMouseDown,
//                }
//            })();

            // controls need to be added *after* main logic,
            // otherwise cameraControls.enabled doesn't work.
            this.cameraControls = new Camera.CameraController(this.camera, this.el);
            // when the camera updates, render
            var that = this;
            this.cameraControls.addEventListener('change', function () {
                that.update();
            });

            animate();

            function animate() {
                requestAnimationFrame(animate);
            }
        },

        events: {
            'click' : "clickHandler"
        },

        changeModel: function () {
            // firstly, clear the scene of any existing mesh
            // TODO this will have to not remove landmarks
            var obj, i;
            for (i = this.scene.children.length - 1; i >= 0; i --) {
                obj = this.scene.children[i];
                if (!_.contains(this.lights, obj)) {
                    // it's not a light
                    this.scene.remove(obj);
                }
            }
            console.log("Adding face to the scene");
            this.scene.add(this.model.get('modelSrc').get('model').get('model'));
            this.update();
        },

        update: function () {
            this.sceneHelpers.updateMatrixWorld();
            console.log('update called');
            this.scene.updateMatrixWorld();
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
            this.renderer.render(this.sceneHelpers, this.camera);
        },

        resize: function () {
            var w, h;
            w = this.$container.width();
            h = this.$container.height();
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
            this.update();
        },

        clickHandler: function () {
            console.log("The THREE View has been clicked");
        }

    });

    function Viewport(signals, $dom) {

        var landmarkSet = null;  // only ever hold one landmark set
        var landmarkSymbols = [];  // LM objects we currently have in the scene
        var mesh = null;  // the single object we are landmarking

        var landmarkSymbolToLandmark = {};



        dom.addEventListener('mousedown', mouseHandlers.mouseDown, false);

        // goes through landmarkSet and ensures every landmark is visualized with
        // it's current state. Also fixes up the mapping between landmarkSymbols and actual
        // landmark objects.
        function syncLandmarks() {
            // ensures that the current landmarks on the scene are correct based on the
            // landmark set.
            // first - check there is a landmarkSet!
            if (landmarkSet === null) {
                return;
            }
            // 1. Go through all the landmarks and remove them from the scene.
            var i, visibleLms, landmark;
            for (i = 0; i < landmarkSymbols.length; i++) {
                scene.remove(landmarkSymbols[i]);
            }
            // 2. Clear the landmarkSymbols and the mappings.
            landmarkSymbols = [];
            landmarkSymbolToLandmark = {};
            // 3. Rebuild all landmark symbols using the landmark model.
            visibleLms = landmarkSet.groups().nonempty();
            for (i = 0; i < visibleLms.length; i++) {
                landmark = visibleLms[i];
                var p = landmark.point();
                var sphere = createSphere(p, mesh.landmarkRadius(),
                    landmark.isSelected());
                landmarkSymbols.push(sphere);
                scene.add(sphere);
                landmarkSymbolToLandmark[sphere.id] = landmark;
            }

            function createSphere(v, radius, selected) {
                var wSegments = 10;
                var hSegments = 10;
                var geometry = new THREE.SphereGeometry(radius, wSegments, hSegments);
                var landmark = new THREE.Mesh(geometry, createDummyMaterial(selected));
                landmark.name = 'Sphere ' + landmark.id;
                landmark.position.copy(v);
                return landmark;
                function createDummyMaterial(selected) {
                    var hexColor = 0xffff00;
                    if (selected) {
                        hexColor = 0xff75ff
                    }
                    return new THREE.MeshPhongMaterial({color: hexColor});
                }
            }
        }

        var origup = camera.up.clone();
        var origposition = camera.position.clone();
        var originallookat = scene.position.clone();
        signals.resetView.add(function () {
            camera.up.copy(origup);
            camera.position.copy(origposition);
            camera.lookAt(originallookat);
            render();
        });

        return $dom;
    }

    return {
        Viewport: Viewport,
        THREEView: THREEView
    }

});
