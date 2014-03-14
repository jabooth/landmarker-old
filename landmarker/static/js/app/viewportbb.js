define(['jquery', 'underscore', 'backbone', 'three', './camera'], function ($, _, Backbone, THREE, Camera) {

    "use strict";

    var ViewportTHREEView = Backbone.View.extend({

        id: 'viewport',

        initialize: function () {
            _.bindAll(this, 'resize', 'render', 'changeModel', 'mousedownHandler', 'update');
            this.$container = $('#viewportContainer');
            this.scene = new THREE.Scene();
            this.sceneHelpers = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(50, 1, 0.02, 5000);
            // TODO re-add non WebGL support
            this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
            this.camera.position.set(500, 250, 500);
            this.camera.lookAt(this.scene.position);
            var clearColor = 0xAAAAAA;
            this.renderer.setClearColor(clearColor, 1);
            this.renderer.autoClear = false;
            //this.renderer.autoUpdateScene = false;
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
            var that = this;

            this.handler = (function () {
                // x, y position of mouse on click states
                var onMouseDownPosition = new THREE.Vector2();
                var onMouseUpPosition = new THREE.Vector2();

                // current world position when in drag state
                var positionLmDrag = new THREE.Vector3();
                // vector difference in one time step
                var deltaLmDrag = new THREE.Vector3();

                // track what was under the mouse upon clicking
                var PDO = {
                    NOTHING: "NOTHING",
                    model: "mesh",
                    landmark: "landmark"
                };
                var pressedDownOn = PDO.NOTHING;

                // where we store the intersection plane
                var intersectionPlanePosition = new THREE.Vector3();
                var intersectionsWithLms, intersectionsWithMesh,
                    intersectionsOnPlane;

                // ----- OBJECT PICKING  ----- //
                var intersectionPlane = new THREE.Mesh(
                    new THREE.PlaneGeometry(5000, 5000));
                intersectionPlane.visible = false;
                that.sceneHelpers.add(intersectionPlane);
                var ray = new THREE.Raycaster();
                var projector = new THREE.Projector();

                // ----- EVENTS ----- //
                var getIntersects = function (event, object) {
                    if (object === null || object.length === 0) {
                        return [];
                    }
                    var vector = new THREE.Vector3(
                        (event.offsetX / that.$container.width()) * 2 - 1,
                        -(event.offsetY / that.$container.height()) * 2 + 1, 0.5);
                    projector.unprojectVector(vector, that.camera);
                    ray.set(that.camera.position,
                        vector.sub(that.camera.position).normalize());
                    if (object instanceof Array) {
                        return ray.intersectObjects(object, true);
                    }
                    return ray.intersectObject(object, true);
                };

                var onMouseDown = function (event) {
                    event.preventDefault();
                    that.$el.focus();
                    onMouseDownPosition.set(event.offsetX, event.offsetY);
                    intersectionsWithLms = getIntersects(event, that.landmarkSymbols());
                    intersectionsWithMesh = getIntersects(event, that.mesh);
                    if (event.button === 0) {  // left mouse button
                        if (intersectionsWithLms.length > 0 &&
                            intersectionsWithMesh.length > 0) {
                            // degenerate case - which is closer?
                            if (intersectionsWithLms[0].distance <
                                intersectionsWithMesh[0].distance) {
                                landmarkPressed();
                            } else {
                                meshPressed();
                            }
                        } else if (intersectionsWithLms.length > 0) {
                            landmarkPressed();
                        } else if (intersectionsWithMesh.length > 0) {
                            meshPressed();
                        } else {
                            nothingPressed();
                        }
                        // start listening for this click finishing
                        $(document).one('mouseup.viewport', viewportOnMouseUp);
                    }

                    function meshPressed() {
                        console.log('mesh pressed!');
                        pressedDownOn = PDO.model;
                    }

                    function landmarkPressed() {
                        console.log('landmark pressed!');
                        // before anything else, disable the camera
                        that.cameraControls.disable();
                        pressedDownOn = PDO.landmark;
                        positionLmDrag.copy(intersectionsWithLms[0].point);
                        // the clicked on landmark
                        var landmarkSymbol = intersectionsWithLms[0].object;
                        var landmark;
                        // hunt through the landmarkViews for the right symbol
                        for (var i = 0; i < that.landmarkViews.length; i++) {
                            if (that.landmarkViews[i].symbol === landmarkSymbol) {
                                landmark = that.landmarkViews[i].model;
                            }
                        }
                        landmark.select();
                        // now we've selected the landmark, we want to enable dragging.
                        // Fix the intersection plane to be where we clicked, only a
                        // little nearer to the camera.
                        intersectionPlanePosition.subVectors(that.camera.position,
                            landmarkSymbol.position);
                        intersectionPlanePosition.divideScalar(10.0);
                        intersectionPlanePosition.add(landmarkSymbol.position);
                        intersectionPlane.position.copy(intersectionPlanePosition);
                        intersectionPlane.lookAt(that.camera.position);
                        intersectionPlane.updateMatrixWorld();
                        // start listening for dragging landmarks
                        $(document).on('mousemove.lmDrag', onLandmarkDrag);
                    }

                    function nothingPressed() {
                        console.log('nothing pressed!');
                        pressedDownOn = PDO.NOTHING;
                    }
                };

                var onLandmarkDrag = function (event) {
                    console.log("drag");
                    intersectionsOnPlane = getIntersects(event, intersectionPlane);
                    if (intersectionsOnPlane.length > 0) {
                        deltaLmDrag.subVectors(intersectionsOnPlane[0].point,
                            positionLmDrag);  // change in this step
                        // update the position
                        positionLmDrag.copy(intersectionsOnPlane[0].point);
                        var activeGroup = that.model.get('landmarks').get('groups').active();
                        var selectedLandmarks = activeGroup.landmarks().selected();
                        var lm, lmP;
                        for (var i = 0; i < selectedLandmarks.length; i++) {
                            lm = selectedLandmarks[i];
                            lmP = lm.point().clone();
                            lmP.add(deltaLmDrag);
                            lm.set('point', lmP);
                        }
                    }
                };

                var viewportOnMouseUp = function (event) {
                    console.log("up");
                    onMouseUpPosition.set(event.offsetX, event.offsetY);
                    that.cameraControls.enable();
                    var p, lm, newLm;
                    if (onMouseDownPosition.distanceTo(onMouseUpPosition) < 1) {
                        // a click
                        if (pressedDownOn === PDO.model) {
                            //  a click on model
                            p = intersectionsWithMesh[0].point;
                            newLm = that.model.get('landmarks').insertNew(p);
                            if (newLm !== null) {
                                // inserted a new landmark, select it
                                newLm.select();
                            }
                        } else if (pressedDownOn === PDO.NOTHING) {
                            // a click on nothing - deselect all
                            that.model.get('landmarks').get('groups').deselectAll();
                        }
                    } else {
                        // mouse was dragged
                        if (pressedDownOn === PDO.landmark) {
                            // snap landmarks back onto model
                            var activeGroup = that.model.get('landmarks').get('groups').active();
                            var selectedLandmarks = activeGroup.landmarks().selected();
                            var camToLm;
                            for (var i = 0; i < selectedLandmarks.length; i++) {
                                lm = selectedLandmarks[i];
                                camToLm = lm.point().clone().sub(that.camera.position).normalize();
                                // make the ray point from camera to this point
                                ray.set(that.camera.position, camToLm);
                                intersectionsWithLms = ray.intersectObject(
                                    that.mesh, true);
                                if (intersectionsWithLms.length > 0) {
                                    // good, we're still on the model.
                                    lm.set('point', intersectionsWithLms[0].point);
                                } else {
                                    console.log("fallen off model");
                                    // TODO add back in history!
//                                for (i = 0; i < selectedLandmarks.length; i++) {
//                                    selectedLandmarks[i].rollbackModifications();
//                                }
                                    // ok, we've fixed the mess. drop out of the loop
                                    break;
                                }
                                // only here as all landmarks were successfully moved
                                //landmarkSet.snapshotGroup(); // snapshot the active group
                            }
                        }
                    }
                    // stop listening for lmDrag
                    $(document).off('mousemove.lmDrag');
                };

                return onMouseDown
            })();

            // make an empty list of landmark views
            this.landmarkViews = [];
            this.mesh = null;
            this.cameraControls = Camera.CameraController(this.camera, this.el);
            // when the camera updates, render
            this.cameraControls.on("change", that.update);

            // Bind event listeners
            window.addEventListener('resize', this.resize, false);
            this.listenTo(this.model.get('modelSrc'), "change:model", this.changeModel);
            this.listenTo(this.model, "change:landmarks", this.changeLandmarks);

            // trigger resize, and register for the animation loop
            this.resize();
            animate();

            function animate() {
                requestAnimationFrame(animate);
            }
        },

        events: {
            'mousedown' : "mousedownHandler"
        },

        changeModel: function () {
            console.log('Viewport: model has changed');
            // firstly, clear the scene of any existing mesh
            // TODO currently removes landmarks and it shouldn't
            var obj, i;
            for (i = this.scene.children.length - 1; i >= 0; i --) {
                obj = this.scene.children[i];
                if (!_.contains(this.lights, obj)) {
                    // it's not a light
                    this.scene.remove(obj);
                }
            }
            console.log("Adding face to the scene");
            this.mesh = this.model.get('modelSrc').get('model').get('model');
            this.scene.add(this.mesh);
            this.update();
        },

        changeLandmarks: function () {
            //  build a fresh set of views - clear any existing lms
            this.landmarkViews = [];
            var that = this;
            _.each(this.landmarkViews, function (lmView) {
                that.scene.remove(lmView.symbol);
            });
            console.log('Viewport: landmarks have changed');
            var groups = this.model.get('landmarks').get('groups');
            groups.each(function (group) {
                group.get('landmarks').each(function (lm) {
                    that.landmarkViews.push(new LandmarkTHREEView(
                        {
                            model: lm,
                            group: group,
                            viewport: that
                        }));
                });
            })
        },

        // this is called whenever there is a state change on the THREE scene
        update: function () {
            this.sceneHelpers.updateMatrixWorld();
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

        mousedownHandler: function (event) {
            console.log('mouse down');
            this.handler(event);
        },

        landmarkSymbols: function () {
            var symbols = [];
            _.each(this.landmarkViews, function (lm) {
                if (lm.symbol !== null) {
                    symbols.push(lm.symbol);
                }
            });
            return symbols;
        }
    });

    var LandmarkTHREEView = Backbone.View.extend({

        initialize: function (options) {
            this.listenTo(this.model, "all", this.render);
            this.group = options.group;
            this.viewport = options.viewport;
            this.listenTo(this.group, "change:active", this.render);
            this.symbol = null; // a THREE object that represents this landmark.
            // null if the landmark isEmpty
            this.render();
        },

        render: function () {
            if (this.symbol !== null) {
                // this landmark already has an allocated representation..
                if (this.model.isEmpty()) {
                    // but it's been deleted.
                    this.viewport.scene.remove(this.symbol);
                    this.symbol = null;

                } else {
                    // the model may need updating. See what needs to be done
                    this.updateSymbol();
                }
            } else {
                // there is no symbol yet
                if (!this.model.isEmpty()) {
                    // and there should be! Make it and update it
                    this.symbol = this.createSphere(this.model.get('point'), 5, 1);
                    this.updateSymbol();
                    // and add it to the scene
                    this.viewport.scene.add(this.symbol);
                }
            }
            // tell our viewport to update
            this.viewport.update();
        },

        createSphere: function (v, radius, selected) {
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
        },

        updateSymbol: function () {
            // TODO set colour based on group active
            this.symbol.position.copy(this.model.point());
            if (this.group.get('active') && this.model.isSelected()) {
                this.symbol.material.color.setHex(0xff75ff);
            } else {
                this.symbol.material.color.setHex(0xffff00);
            }
        }
    });

    function Viewport(signals, $dom) {

        var landmarkSet = null;  // only ever hold one landmark set
        var landmarkSymbols = [];  // LM objects we currently have in the scene
        var mesh = null;  // the single object we are landmarking

        var landmarkSymbolToLandmark = {};



        dom.addEventListener('mousedown', mouseHandlers.mouseDown, false);



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
        ViewportTHREEView: ViewportTHREEView
    }

});
