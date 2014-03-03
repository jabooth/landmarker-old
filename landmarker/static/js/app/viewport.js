define(['three', './camera'], function (THREE, Camera) {

    "use strict";

    function Viewport(signals, keyboard, $dom) {
        // capture the raw dom
        var dom = $dom[0];

        var clearColor = 0xAAAAAA;

        // state
        var landmarkSet = null;  // only ever hold one landmark set
        var landmarkSymbols = [];  // LM objects we currently have in the scene
        var mesh = null;  // the single object we are landmarking

        var landmarkSymbolToLandmark = {};

        // ----- SCENE HELPERS ----- //
        var sceneHelpers = new THREE.Scene();

        // ----- SCENE AND CAMERA ----- //
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(50,
            dom.offsetWidth / dom.offsetHeight, 0.02, 5000);
        camera.position.set(500, 250, 500);
        camera.lookAt(scene.position);

        //var ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        //scene.add(ambientLight);

        var pointLightLeft = new THREE.PointLight(0x404040, 1, 0);
        pointLightLeft.position.set(-100, 0, 100);
        scene.add(pointLightLeft);
        var pointLightRight = new THREE.PointLight(0x404040, 1, 0);
        pointLightRight.position.set(100, 0, 100);
        scene.add(pointLightRight);

        var mouseHandlers = (function () {

            // x, y position of mouse on click states
            var onMouseDownPosition = new THREE.Vector2();
            var onMouseUpPosition = new THREE.Vector2();

            // current world position when in drag state
            var positionLmDrag = new THREE.Vector3();
            // vector difference in one time step
            var deltaLmDrag = new THREE.Vector3();

            // track what was under the mouse upon clicking
            var PDO = {
                nothing: "nothing",
                mesh: "mesh",
                landmark: "landmark"
            };
            var pressedDownOn = PDO.nothing;

            // where we store the intersection plane
            var intersectionPlanePosition = new THREE.Vector3();
            var intersectionsWithLms, intersectionsWithMesh, intersectionsOnPlane;

            // ----- OBJECT PICKING  ----- //
            var intersectionPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(5000, 5000));
            intersectionPlane.visible = false;
            sceneHelpers.add(intersectionPlane);
            var ray = new THREE.Raycaster();
            var projector = new THREE.Projector();

            // ----- EVENTS ----- //
            var getIntersects = function (event, object) {
                var vector = new THREE.Vector3(
                    (event.layerX / dom.offsetWidth) * 2 - 1,
                    -(event.layerY / dom.offsetHeight) * 2 + 1, 0.5);
                projector.unprojectVector(vector, camera);
                ray.set(camera.position, vector.sub(camera.position).normalize());
                if (object instanceof Array) {
                    return ray.intersectObjects(object, true);
                }
                return ray.intersectObject(object, true);
            };

            var onMouseDown = function (event) {
                event.preventDefault();
                dom.focus();
                onMouseDownPosition.set(event.layerX, event.layerY);
                intersectionsWithLms = getIntersects(event, landmarkSymbols);
                intersectionsWithMesh = getIntersects(event, mesh.getMesh());
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
                    if (!keyboard.ctrl) {
                        document.addEventListener('mouseup', onMouseUp, false);
                    }
                }

                function meshPressed() {
                    if (keyboard.ctrl) {
                        // focus the camera to the point selected
                        var intersects = getIntersects(event, mesh.getMesh());
                        if (intersects.length > 0) {
                            cameraControls.focus(intersects[0].point);
                            cameraControls.enabled = true;
                        }
                    }
                    pressedDownOn = PDO.mesh;
                }

                function landmarkPressed() {
                    pressedDownOn = PDO.landmark;
                    positionLmDrag.copy(intersectionsWithLms[0].point);
                    // the clicked on landmark
                    var landmarkSymbol = intersectionsWithLms[0].object;
                    var landmark = landmarkSymbolToLandmark[landmarkSymbol.id];
                    // if user isn't holding down shift or doesn't have multiple
                    // selected, deselect rest
                    if (!(keyboard.shift ||
                        landmarkSet.groups().active().landmarks().nSelected() > 1)) {
                        landmarkSet.groups().deselectAll();
                    }
                    // select this landmark
                    landmark.select();
                    signals.landmarkSetChanged.dispatch(landmarkSet);
                    // now we've selected the landmark, we want to enable dragging.
                    // Fix the intersection plane to be where we clicked, only a
                    // little nearer to the camera.
                    intersectionPlanePosition.subVectors(camera.position,
                        landmarkSymbol.position);
                    intersectionPlanePosition.divideScalar(10.0);
                    intersectionPlanePosition.add(landmarkSymbol.position);
                    intersectionPlane.position.copy(intersectionPlanePosition);
                    intersectionPlane.lookAt(camera.position);
                    intersectionPlane.updateMatrixWorld();
                    // and attach the drag listener.
                    document.addEventListener('mousemove', onLandmarkDrag, false);
                    cameraControls.enabled = false;
                }

                function nothingPressed() {
                    pressedDownOn = PDO.nothing;
                    cameraControls.enabled = true;
                }
            };

            var onLandmarkDrag = function (event) {
                intersectionsOnPlane = getIntersects(event, intersectionPlane);
                if (intersectionsOnPlane.length > 0) {
                    deltaLmDrag.subVectors(intersectionsOnPlane[0].point,
                        positionLmDrag);  // change in this step
                    // update the position
                    positionLmDrag.copy(intersectionsOnPlane[0].point);
                    var activeGroup = landmarkSet.groups().active();
                    var selectedLandmarks = activeGroup.landmarks().selected();
                    var lm, lmP;
                    for (var i = 0; i < selectedLandmarks.length; i++) {
                        lm = selectedLandmarks[i];
                        lmP = lm.point().clone();
                        lmP.add(deltaLmDrag);
                        lm.set('point', lmP);
                    }
                    signals.landmarkSetChanged.dispatch(landmarkSet);
                }
            };

            var onMouseUp = function (event) {
                onMouseUpPosition.set(event.layerX, event.layerY);
                cameraControls.enabled = true;
                var p, lm;
                if (onMouseDownPosition.distanceTo(onMouseUpPosition) < 1) {
                    // a click
                    if (pressedDownOn === PDO.mesh) {
                        //  a click on mesh
                        p = intersectionsWithMesh[0].point;
                        // TODO insert new landmark
                        var lm = landmarkSet.insertNew(p); //LM
                        landmarkSet.groups().deselectAll();  //LM
                        lm.select(); //LM
                        signals.landmarkChanged.dispatch(lm);
                        render();
                    } else if (pressedDownOn === PDO.nothing) {
                        // a click on nothing - deselect all
                        landmarkSet.groups().deselectAll();
                        signals.landmarkSetChanged.dispatch(landmarkSet);
                    }
                } else {
                    // mouse was dragged
                    if (pressedDownOn === PDO.landmark) {
                        // snap landmarks back onto mesh
                        var activeGroup = landmarkSet.groups().active();
                        var selectedLandmarks = activeGroup.landmarks().selected();
                        var camToLm;
                        for (var i = 0; i < selectedLandmarks.length; i++) {
                            lm = selectedLandmarks[i];
                            camToLm = lm.point().clone().sub(camera.position).normalize();
                            // make the ray point from camera to this point
                            ray.set(camera.position, camToLm);
                            intersectionsWithLms = ray.intersectObject(
                                mesh.getMesh(), true);
                            if (intersectionsWithLms.length > 0) {
                                // good, we're still on the mesh.
                                lm.set('point', intersectionsWithLms[0].point);
                            } else {
                                console.log("fallen off mesh");
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
                        signals.landmarkSetChanged.dispatch(landmarkSet);
                    }
                }

                document.removeEventListener('mousemove', onLandmarkDrag);
                document.removeEventListener('mouseup', onMouseUp);
            };

            var onDoubleClick = function (event) {

            };

            return {
                mouseDown: onMouseDown,
                doubleClick: onDoubleClick
            }
        })();

        dom.addEventListener('mousedown', mouseHandlers.mouseDown, false);
        dom.addEventListener('dblclick', mouseHandlers.doubleClick, false);

        // controls need to be added *after* main logic,
        // otherwise cameraControls.enabled doesn't work.
        var cameraControls = new Camera.CameraController(camera, dom);
        // when the camera updates, render
        cameraControls.addEventListener('change', function () {
            render();
        });

        // ----- SIGNALS ----- //
        signals.rendererChanged.add(function (object) {
            dom.removeChild(renderer.domElement);
            renderer = object;
            renderer.setClearColor(clearColor);
            renderer.autoClear = false;
            renderer.autoUpdateScene = false;
            renderer.setSize(dom.offsetWidth, dom.offsetHeight);
            dom.appendChild(renderer.domElement);
            render();
        });

        signals.meshChanged.add(function (object) {
            if (mesh !== null) {
                console.log("Removing existing face");
                scene.remove(mesh.getMesh());
            }
            console.log("Adding face to the scene");
            scene.add(object.getMesh());
            mesh = object;
            render();
        });

        signals.clearColorChanged.add(function (color) {
            renderer.setClearColor(color);
            render();
            clearColor = color;
        });

        signals.windowResize.add(function () {
            var w = $(".App-Viewport").width();
            var h = $(window).height();
            camera.aspect = w/h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            render();
        });

        signals.landmarkSetChanged.add(function (landmarks) {
            landmarkSet = landmarks;
            syncLandmarks();
            render();
        });

        signals.landmarkChanged.add(function (landmark) {
            syncLandmarks();
            render();
        });

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
                var sphere = createSphere(p, mesh.landmarkRadius,
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


        // TODO readd non WebGL support
        var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});


        renderer.setClearColor(clearColor);
        renderer.autoClear = false;
        renderer.autoUpdateScene = false;
        dom.appendChild(renderer.domElement);
        animate();

        // the actual render loop
        function animate() {
            requestAnimationFrame(animate);
        }

        // on state change, call this
        function render() {
            sceneHelpers.updateMatrixWorld();
            scene.updateMatrixWorld();
            renderer.clear();
            renderer.render(scene, camera);
            renderer.render(sceneHelpers, camera);
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
        Viewport: Viewport
    }
});
