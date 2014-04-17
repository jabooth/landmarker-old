define(['jquery', 'underscore', 'backbone', 'three', './camera'], function ($, _, Backbone, THREE, Camera) {

    "use strict";

    var ViewportTHREEView = Backbone.View.extend({

        id: 'viewport',

        initialize: function () {
            _.bindAll(this, 'resize', 'render', 'changeMesh', 'mousedownHandler', 'update');
            this.$container = $('#viewportContainer');

            this.meshScale = 1.0;  // The radius of the mesh's bounding sphere
            // the radius of the landmarks in the normalized scene
            // TODO this should be on app not Viewport
            this.landmarkScale = 0.01;

            // ------ SCENE GRAPH CONSTRUCTION -----
            this.scene = new THREE.Scene();

            // --- SCENE: MODEL AND LANDMARKS ---
            // s_meshAndLms stores the mesh and landmarks in the models original
            // coordinates. This is always transformed to the unit sphere for
            // consistency of camera.
            this.s_meshAndLms = new THREE.Object3D();
            // s_lms stores the scene landmarks. This is a useful container to
            // get at all landmarks in one go, and is a child of s_meshAndLms
            this.s_lms = new THREE.Object3D();
            this.s_meshAndLms.add(this.s_lms);
            // s_mesh is the parent of the mesh itself in the THREE scene.
            // This will only ever have one child (the mesh).
            // Child of s_meshAndLms
            this.s_mesh = new THREE.Object3D();
            this.s_meshAndLms.add(this.s_mesh);
            this.scene.add(this.s_meshAndLms);

            // --- SCENE: CAMERA AND DIRECTED LIGHTS ---
            // s_camera holds the camera, and (optionally) any
            // lights that track with the camera as children
            this.s_camera = new THREE.PerspectiveCamera(50, 1, 0.02, 5000);
            this.s_camera.position.set(1.68, 0.35, 3.0);
            this.resetCamera();

            // --- SCENE: GENERAL LIGHTING ---
            this.s_lights = new THREE.Object3D();
            var pointLightLeft = new THREE.PointLight(0x404040, 1, 0);
            pointLightLeft.position.set(-100, 0, 100);
            this.s_lights.add(pointLightLeft);
            var pointLightRight = new THREE.PointLight(0x404040, 1, 0);
            pointLightRight.position.set(100, 0, 100);
            this.s_lights.add(pointLightRight);
            this.scene.add(this.s_lights);
            // TODO probably don't need this array any more?
            this.lights = [pointLightLeft, pointLightRight];


            // TODO re-add non WebGL support (maybe)
            this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
            var clearColor = 0xAAAAAA;
            this.renderer.setClearColor(clearColor, 1);
            this.renderer.autoClear = false;
            //this.renderer.autoUpdateScene = false;
            this.$el.html(this.renderer.domElement);

            this.sceneHelpers = new THREE.Scene();

            // add model if there already is one
            var modelSrc = this.model.get('modelSrc');
            var model;
            if (modelSrc.has("model")) {
                model = modelSrc.get("model");
                if (model.has("model")) {
                    this.changeMesh();
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
                    projector.unprojectVector(vector, that.s_camera);
                    ray.set(that.s_camera.position,
                        vector.sub(that.s_camera.position).normalize());
                    if (object instanceof Array) {
                        return ray.intersectObjects(object, true);
                    }
                    return ray.intersectObject(object, true);
                };

                var onMouseDown = function (event) {
                    event.preventDefault();
                    that.$el.focus();
                    onMouseDownPosition.set(event.offsetX, event.offsetY);
                    // TODO should intersect with our new scene nodes
                    intersectionsWithLms = getIntersects(event, that.s_lms);
                    intersectionsWithMesh = getIntersects(event, that.s_mesh);
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
                        var landmark, group;
                        // hunt through the landmarkViews for the right symbol
                        for (var i = 0; i < that.landmarkViews.length; i++) {
                            if (that.landmarkViews[i].symbol === landmarkSymbol) {
                                landmark = that.landmarkViews[i].model;
                                group = that.landmarkViews[i].group;
                            }
                        }
                        group.makeActive();
                        landmark.select();
                        // now we've selected the landmark, we want to enable dragging.
                        // Fix the intersection plane to be where we clicked, only a
                        // little nearer to the camera.
                        intersectionPlanePosition.subVectors(that.s_camera.position,
                            landmarkSymbol.position);
                        intersectionPlanePosition.divideScalar(10.0);
                        intersectionPlanePosition.add(landmarkSymbol.position);
                        intersectionPlane.position.copy(intersectionPlanePosition);
                        intersectionPlane.lookAt(that.s_camera.position);
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
                            if (!lm.get('isChanging')) lm.set('isChanging', true);
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
                            p = intersectionsWithMesh[0].point.clone();
                            // Convert the point back into the model space
                            that.s_meshAndLms.worldToLocal(p);
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
                                camToLm = lm.point().clone().sub(that.s_camera.position).normalize();
                                // make the ray point from camera to this point
                                ray.set(that.s_camera.position, camToLm);
                                intersectionsWithLms = ray.intersectObject(
                                    that.s_mesh, true);
                                if (intersectionsWithLms.length > 0) {
                                    // good, we're still on the model.
                                    lm.set('point', intersectionsWithLms[0].point);
                                    lm.set('isChanging', false);
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
            this.cameraControls = Camera.CameraController(
                this.s_camera, this.el);
            // when the camera updates, render
            this.cameraControls.on("change", that.update);

            // Bind event listeners
            window.addEventListener('resize', this.resize, false);
            this.listenTo(this.model.get('modelSrc'), "change:model", this.changeMesh);
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

        resetCamera: function () {
            this.s_camera.position.set(1.68, 0.35, 3.0);
            this.s_camera.lookAt(this.scene.position);
        },

        changeMesh: function () {
            console.log('Viewport: mesh has changed');
            // firstly, remove any existing mesh
            if (this.s_mesh.children.length) {
                this.s_mesh.remove(this.s_mesh.children[0]);
            }
            var mesh = this.model.get('modelSrc').get('model').get('model');
            this.s_mesh.add(mesh);

            // Now we need to rescale the s_meshAndLms to fit in the unit sphere
            // First, the scale
            this.meshScale = mesh.geometry.boundingSphere.radius;
            var s = 1.0 / this.meshScale;
            this.s_meshAndLms.scale.set(s, s, s);

            // THREE.js applies translation AFTER scale, so need to calc
            // appropriate translation
            var t = mesh.geometry.boundingSphere.center.clone();
            t.multiplyScalar(-1.0 * s);  // -1 as we want to centre
            this.s_meshAndLms.position = t;
            this.resetCamera();
            this.update();
        },

        changeLandmarks: function () {
            console.log('Viewport: landmarks have changed');
            var that = this;
            // 1. Clear the scene graph of all landmarks
            // TODO should this be a destructor on LandmarkView?
            this.s_meshAndLms.remove(this.s_lms);
            this.s_lms = new THREE.Object3D();
            this.s_meshAndLms.add(this.s_lms);
            // 2. Build a fresh set of views - clear any existing lms
            this.landmarkViews = [];
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
            this.renderer.clear();
            this.renderer.render(this.scene, this.s_camera);
            this.renderer.render(this.sceneHelpers, this.s_camera);
        },

        resize: function () {
            var w, h;
            w = this.$container.width();
            h = this.$container.height();
            this.s_camera.aspect = w / h;
            this.s_camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
            this.update();
        },

        mousedownHandler: function (event) {
            console.log('mouse down');
            event.preventDefault();
            this.handler(event);
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
                    this.viewport.s_lms.remove(this.symbol);
                    this.symbol = null;

                } else {
                    // the model may need updating. See what needs to be done
                    this.updateSymbol();
                }
            } else {
                // there is no symbol yet
                if (!this.model.isEmpty()) {
                    // and there should be! Make it and update it
                    this.symbol = this.createSphere(this.model.get('point'),
                        this.viewport.landmarkScale * this.viewport.meshScale, 1);
                    this.updateSymbol();
                    // and add it to the scene
                    this.viewport.s_lms.add(this.symbol);
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
