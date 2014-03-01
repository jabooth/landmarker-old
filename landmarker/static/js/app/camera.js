/**
 * Controller for handling basic camera events on a Landmarker.
 *
 * A landmarker in general has complex state - what landmarks are selected,
 * what mesh is being used, lighting arrangements, and so on. The camera's
 * behavior however is simple - in response to certain mouse and touch
 * interactions, the camera is rotated, zoomed, and panned around some sort of
 * target. This class encapsulates this behavior.
 *
 * Takes a camera object as it's first parameter, and optionally a domElement to
 * attach to (if none provided, the document is used).
 *
 * Hooks up the following callbacks to the domElement:
 *
 * - focus(target)  // refocus the camera on a new target
 * - pan(vector)  // pan the camera along a certain vector
 * - zoom(vector)  // zoom the camera along a certain vector
 * - rotate(delta)  // rotate the camera around the target
 *
 * Note that other more complex behaviors (selecting and repositioning landmarks
 * for instance) can disable the Controller temporarily with the enabled
 * property.
 */

define(['three'], function (THREE) {

    "use strict";

     function CameraController (camera, domElement) {

        // API
        this.enabled = true;  // false disconnects all event listeners

        // internals
        var scope = this;
        var vector = new THREE.Vector3();  // a temporary vector for efficient maths
        var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
        var state = STATE.NONE;  // the current state of the Camera
        var target = new THREE.Vector3();  // where the camera is looking
        var normalMatrix = new THREE.Matrix3();

        // events
        var changeEvent = { type: 'change' };
        this.focus = function (newTarget) {
            target = newTarget;
            camera.lookAt(target);
            scope.dispatchEvent(changeEvent);
        };

        this.pan = function (distance) {
            normalMatrix.getNormalMatrix(camera.matrix);
            distance.applyMatrix3(normalMatrix);
            distance.multiplyScalar(distanceToTarget() * 0.001);
            camera.position.add(distance);
            target.add(distance);
            scope.dispatchEvent(changeEvent);
        };

        this.zoom = function (distance) {
            normalMatrix.getNormalMatrix(camera.matrix);
            distance.applyMatrix3(normalMatrix);
            distance.multiplyScalar(distanceToTarget() * 0.001);
            camera.position.add(distance);
            scope.dispatchEvent(changeEvent);
        };

        function distanceToTarget() {
            return vector.copy(target).sub(camera.position).length();
        }

        this.rotate = function (delta) {
            var theta, phi, radius;
            var EPS = 0.000001;

            // vector = position - target
            vector.copy(camera.position).sub(target);
            radius = vector.length();

            theta = Math.atan2(vector.x, vector.z);
            phi = Math.atan2(Math.sqrt(vector.x * vector.x + vector.z * vector.z),
                vector.y);
            theta += delta.x;
            phi += delta.y;
            phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

            // update the vector for the new theta/phi/radius
            vector.x = radius * Math.sin(phi) * Math.sin(theta);
            vector.y = radius * Math.cos(phi);
            vector.z = radius * Math.sin(phi) * Math.cos(theta);

            camera.position.copy(target).add(vector);
            camera.lookAt(target);
            scope.dispatchEvent(changeEvent);
        };

        // mouse
        function onMouseDown(event) {
            if (scope.enabled === false) return;
            event.preventDefault();
            if (event.button === 0) {
                state = STATE.ROTATE;
            } else if (event.button === 1) {
                state = STATE.ZOOM;
            } else if (event.button === 2) {
                state = STATE.PAN;
            }
            document.addEventListener('mousemove', onMouseMove, false);
            document.addEventListener('mouseup', onMouseUp, false);
        }

        function onMouseMove(event) {
            if (scope.enabled === false) return;
            event.preventDefault();
            var movementX = event.movementX || event.webkitMovementX ||
                event.mozMovementX || event.oMovementX || 0;
            var movementY = event.movementY || event.webkitMovementY ||
                event.mozMovementY || event.oMovementY || 0;
            if (state === STATE.ROTATE) {
                scope.rotate(new THREE.Vector3(-movementX * 0.005,
                    -movementY * 0.005, 0));
            } else if (state === STATE.ZOOM) {
                scope.zoom(new THREE.Vector3(0, 0, movementY));
            } else if (state === STATE.PAN) {
                scope.pan(new THREE.Vector3(-movementX, movementY, 0));
            }
        }

        function onMouseUp(event) {
            if (scope.enabled === false) return;
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);
            state = STATE.NONE;
        }

        function onMouseWheel(event) {
            if (scope.enabled === false) return;
            var delta = 0;
            if (event.wheelDelta) { // WebKit / Opera / Explorer 9
                delta = -event.wheelDelta;
            } else if (event.detail) { // Firefox
                delta = event.detail * 10;
            }
            scope.zoom(new THREE.Vector3(0, 0, delta));
        }

        domElement.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        }, false);
        domElement.addEventListener('mousedown', onMouseDown, false);
        domElement.addEventListener('mousewheel', onMouseWheel, false);
        domElement.addEventListener('DOMMouseScroll', onMouseWheel, false);

        // touch
        var touch = new THREE.Vector3();
        var prevTouch = new THREE.Vector3();
        var prevDistance = null;

        function touchStart(event) {
            if (scope.enabled === false) return;
            var touches = event.touches;
            switch (touches.length) {
                case 2:
                    var dx = touches[0].pageX - touches[1].pageX;
                    var dy = touches[0].pageY - touches[1].pageY;
                    prevDistance = Math.sqrt(dx * dx + dy * dy);
                    break;
            }
            prevTouch.set(touches[0].pageX, touches[0].pageY, 0);
        }

        function touchMove(event) {
            if (scope.enabled === false) return;
            event.preventDefault();
            event.stopPropagation();
            var touches = event.touches;
            touch.set(touches[0].pageX, touches[0].pageY, 0);
            switch (touches.length) {
                case 1:
                    scope.rotate(touch.sub(prevTouch).multiplyScalar(-0.005));
                    break;
                case 2:
                    var dx = touches[0].pageX - touches[1].pageX;
                    var dy = touches[0].pageY - touches[1].pageY;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    scope.zoom(new THREE.Vector3(0, 0, prevDistance - distance));
                    prevDistance = distance;
                    break;
                case 3:
                    scope.pan(touch.sub(prevTouch).setX(-touch.x));
                    break;
            }
            prevTouch.set(touches[0].pageX, touches[0].pageY, 0);
        }

        domElement.addEventListener('touchstart', touchStart, false);
        domElement.addEventListener('touchmove', touchMove, false);
    }

    CameraController.prototype = Object.create(
        THREE.EventDispatcher.prototype);

    return {
        CameraController: CameraController
    }
});
