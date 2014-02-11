/**
 * Created by jab08 on 19/01/2014.
 */
// TODO make some methods hidden (just between these three objects)
LM = {};

// v == THREE.Vector3
LM.Landmark = function (vector3) {

    var point = null;
    var snapshottedPoint = null;
    if (vector3 !== undefined) {
        // point has been provided
        point = vector3.clone();
        snapshottedPoint = vector3.clone();
    }
    var selected = false;

    function getPoint() {
        if (point === null) {
            return null;
        }
        return point.clone();
    }

    function setPoint(v) {
        point = v.clone();
    }

    function isEmpty() {
        return point === null;
    }

    function isSelected() {
        return selected;
    }

    function isModified() {
        if (point === null || snapshottedPoint === null) {
            // if either are null, but both aren't, there is a modification
            return !(snapshottedPoint === null && point === null);
        }
        // no nulls here!
        return !point.equal(snapshottedPoint);
    }

    function select() {
        selected = true;
    }

    function deselect() {
        selected = false;
    }

    function clear() {
        point = null;
    }

    function clone() {
        var newLM = LM.Landmark();
        if (snapshottedPoint !== null) {
            // have to push this snapshot back onto the stack
            newLM.setPoint(snapshottedPoint);
            newLM.snapshotTaken();
            // now snapshottedPoint is correct on the newLM
        }
        if (!isEmpty()) {
            newLM.setPoint(getPoint());
        } else {
            newLM.clear();
        }
        if (selected) {
            newLM.select();
        } else {
            newLM.deselect();
        }
        return newLM;
    }

    function equalTo (lm) {
        if (lm.isEmpty() === isEmpty() && lm.isSelected() === isSelected()) {
            if (!isEmpty() && point.equals(lm.getPoint())) {
                return true;
            }
        }
        return false;
    }

    // TODO this shouldn't be public.
    function snapshotTaken() {
        if (point !== null) {
            snapshottedPoint = point.clone();
        }
    }

    function rollbackModifications() {
        if (snapshottedPoint === null) {
            point = null;
        } else {
            point = snapshottedPoint.clone();
        }
    }

    function  toJSON() {
        var pointJSON = [null, null, null];
        if (!isEmpty()) {
            pointJSON = [point.x, point.y, point.z];
        }
        return {
            point: pointJSON
        }
    }

    return {
        getPoint: getPoint,
        setPoint: setPoint,
        isEmpty: isEmpty,
        isSelected: isSelected,
        isModified: isModified,
        snapshotTaken: snapshotTaken,
        rollbackModifications: rollbackModifications,
        select: select,
        deselect: deselect,
        clear: clear,
        clone: clone,
        equalTo: equalTo,
        toJSON: toJSON
    }
};

LM.LandmarkGroup = function(label, nLandmarksOnLabel, values) {
    var landmarks = [];
    var i;
    for (i = 0; i < nLandmarksOnLabel; i++) {
        if (values !== undefined) {
            landmarks.push(LM.Landmark(values[i]));
        } else {
            landmarks.push(LM.Landmark());
        }
    }

    function getLabel() {
        return label;
    }

    function getLandmark(i) {
        // TODO bounds check i
        return landmarks[i];
    }

    function setLandmark(i, lm) {
        // TODO bounds check i
        landmarks[i] = lm;
    }

    function nLandmarks() {
        return landmarks.length;
    }

    function nEmptyLandmarks() {
        return landmarks.reduce(function (a, b) {
            return a + (1 ? b.isEmpty() : 0);
        }, 0);
    }

    function nSelectedLandmarks() {
        return landmarks.reduce(function (a, b) {
            return a + (1 ? b.isSelected() : 0);
        }, 0);
    }

    function selectAll() {
        landmarks.map(function (a) {
            a.select();
        })
    }

    function deselectAll() {
        landmarks.map(function (a) {
            a.deselect();
        })
    }

    function clearAll() {
        landmarks.map(function (a) {
            a.clear();
        })
    }

    function setAllPoints(points) {
        if (points.length !== landmarks.length) {
            throw("Error:  trying to setAllPoints with wrong number of points");
        }
        for (var i = 0; i < landmarks.length; i++) {
            landmarks[i].setPoint(points[i]);
        }
    }

    function firstEmptyLandmark() {
        for (var i = 0; i < nLandmarks(); i++) {
            if (landmarks[i].isEmpty()) {
                return landmarks[i]
            }
        }
        // there are no empty landmarks
        return null;
    }

    function selectedLandmarks() {
        var selectedLms = [];
        var landmark;
        for (var i = 0; i < landmarks.length; i++) {
            landmark = landmarks[i];
            if (landmark.isSelected()) {
                selectedLms.push(landmark);
            }
        }
        return selectedLms;
    }

    function clone() {
        var newLMGroup = LM.LandmarkGroup(label, nLandmarksOnLabel);
        for (var i = 0; i < nLandmarksOnLabel; i++) {
            newLMGroup.setLandmark(i, landmarks[i].clone());
        }
        return newLMGroup;
    }

    function toJSON() {
        var tmp = {}
        tmp[getLabel()] = landmarks;
        return tmp;
    }

    return {
        getLabel: getLabel,
        getLandmark: getLandmark,
        setLandmark: setLandmark,
        nLandmarks: nLandmarks,
        nEmptyLandmarks: nEmptyLandmarks,
        nSelectedLandmarks: nSelectedLandmarks,
        setAllPoints: setAllPoints,
        selectAll: selectAll,
        deselectAll: deselectAll,
        clearAll: clearAll,
        firstEmptyLandmark: firstEmptyLandmark,
        selectedLandmarks: selectedLandmarks,
        clone: clone,
        toJSON: toJSON
    }
};

LM.LandmarkSet = function (labels, nLandmarksPerLabel, modelId, groupedValues) {
    if (labels.length !== nLandmarksPerLabel.length) {
        throw("Labels and nLandmarksPerLabel need to be the same length");
    }
    var landmarkGroups = {};
    var activeGroupLabel = labels[0];
    var values = undefined;
    for (var i = 0; i < labels.length; i++) {
        if (groupedValues !== undefined) {
            values = groupedValues[i];
        }
        landmarkGroups[labels[i]] = LM.LandmarkGroup(labels[i],
            nLandmarksPerLabel[i], values);
    }

    // history
    var history = [];
    var historyPtr = -1;
    var initalState = {};  // copy of the initial state of this landmark group
    // TODO consider how a landmark set will be initialized from JSON instance
    for (i = 0; i < labels.length; i++) {
        initalState[labels[i]] = LM.LandmarkGroup(labels[i],
            nLandmarksPerLabel[i]);
    }

    function getLabels() {
        return labels;
    }

    function getGroup(label) {
        return landmarkGroups[label];
    }

    function getActiveGroup() {
        return landmarkGroups[activeGroupLabel];
    }

    function setActiveGroup(label) {
        activeGroupLabel = label;
    }

    function nGroups() {
        return labels.length;
    }

    function nonEmptyLandmarks() {
        var landmarks = [];  // the interesting lm's we want to return
        var label, i, lm, group;
        for (label in landmarkGroups) {
            if (landmarkGroups.hasOwnProperty(label)) {
                group = landmarkGroups[label];
                for (i = 0; i < group.nLandmarks(); i++) {
                    lm = group.getLandmark(i);
                    if (!lm.isEmpty()) {
                        // this landmark is visible!
                        landmarks.push({
                            label: label,
                            index: i,
                            landmark: lm
                        });
                    }
                }
            }
        }
        return landmarks;
    }

    function insertNewLandmark(v) {
        var activeGroup = getActiveGroup();
        if (activeGroup.nEmptyLandmarks() !== 0) {
            var nextLm = activeGroup.firstEmptyLandmark()
            nextLm.setPoint(v);
            if (activeGroup.nEmptyLandmarks() == 0) {
                // depleted this group! advance the active group on.
                console.log("Filled group! Advancing. WARNING - not implemented yer.");
                // TODO actually advance here
            }
            return nextLm;
        }
        return null;
    }

    function deselectAll() {
        for (var label in landmarkGroups) {
            if (landmarkGroups.hasOwnProperty(label)) {
                landmarkGroups[label].deselectAll();
            }
        }
    }

    function snapshotGroup(label) {
        // takes a new snapshot of the group. If label is not provided, the
        // active group is used.
        // add onto the stack a copy of the current state of the group in q'n
        while (history.length - 1 !== historyPtr) {
            // taking a snapshot where there is a future - need to erase this
            history.pop();
        }
        if (label === undefined) {
            label = activeGroupLabel;
        }
        var group = getGroup(label);
        // inform each landmark that they have been captured
        for (var i = 0; i < group.nLandmarks(); i++) {
            group.getLandmark(i).snapshotTaken();
        }
        history.push({label: label, group:group.clone()});
        historyPtr++; // advance the history pointer (guaranteed to be at end)
    }

    // returns null if can't undo, current history pointer if can.
    function undo() {
        if (historyPtr === -1) {
            return null; // can't undo beyond state
        }
        historyPtr--; // step back
        if (historyPtr == -1) {
            // arrived at the initial state - restore all.
            for (i = 0; i < labels.length; i++) {
                landmarkGroups[labels[i]] = initalState[labels[i]].clone();
            }
        } else {
            // pointer is in the array somewhere - restore that state
            restoreCurrentHistoryPtr();
        }
        return historyPtr;
    }

    // returns null if can't redo, current history pointer if can.
    function redo() {
        if (historyPtr === history.length -1) {
            // already at maximum, can't do anything
            return null;
        }
        historyPtr++;
        // pointer is in the array somewhere - restore that state
        restoreCurrentHistoryPtr();
        return historyPtr;
    }

    function restoreCurrentHistoryPtr() {
        var state = history[historyPtr];
        landmarkGroups[state.label] = state.group.clone();
    }

    function toJSON() {
        // pull off the values
        // reduce over the list of groups, building amalgamating them together
        var result = _.reduce(landmarkGroups, function (memo, group) {
            var groupJSON = group.toJSON();  // {'label': [lm1, ...]}
            _.each(groupJSON, function (value, key) {
                memo[key] = value; // reduction step
            });
            return memo;
        }, {});

        return {
            groups: result,
            modelId: modelId,
            version: 1
        }
    }


    return {
        getLabels: getLabels,
        getGroup: getGroup,
        getActiveGroup: getActiveGroup,
        setActiveGroup: setActiveGroup,
        nGroups: nGroups,
        nonEmptyLandmarks: nonEmptyLandmarks,
        insertNewLandmark: insertNewLandmark,
        deselectAll: deselectAll,
        snapshotGroup: snapshotGroup,
        undo: undo,
        redo: redo,
        toJSON: toJSON
    }
};

LM.LandmarkSetFromJSON = function (obj) {
    var groups = obj.groups;
    var labels = _.map(groups, function (group, label) {
        return label;
    });
    var groupedPoints = _.map(groups, function (group) {
        return _.map(group, function (lm) {
            return new THREE.Vector3(lm.point[0], lm.point[1], lm.point[2]);
        })
    });
    var nPointsPerGroup = _.map(groupedPoints, function (points) {
       return points.length;
    });
    return LM.LandmarkSet(labels, nPointsPerGroup, groupedPoints, obj.modelId);
};


LM.saveAndRebuild = function (lmSet) {
    var x = JSON.stringify(lmSet);
    var obj = JSON.parse(x);
    return LM.LandmarkSetFromJSON(obj);
};


LM.Mesh = function (mesh, modelId) {

    function toJSON () {
        var trilist = _.map(mesh.geometry.faces, function (face) {
            return [face.a, face.b, face.c];
        });

        var points = _.map(mesh.geometry.vertices, function (v) {
            return [v.x, v.y, v.z];
        });

        return {
            points: points,
            trilist: trilist,
            modelId: modelId
        };
    }

    return {
        getModelId: function () {return modelId;},
        toJSON: toJSON,
        getMesh: function () {return mesh;}
    }
};

LM.MeshFromJSON = function (obj) {
    var geometry = new THREE.Geometry();
    _.each(obj.points, function (v) {
        geometry.vertices.push(new THREE.Vector3(v[0], v[1], v[2]));
    });
    _.each(obj.trilist, function (tl) {
        geometry.faces.push(new THREE.Face3(tl[0], tl[1], tl[2]));
    });
    // TODO fix material (smoothing?)
    var material = new THREE.MeshPhongMaterial();
    return LM.Mesh(new THREE.Mesh(geometry, material), obj.modelId);
};

// TODO sort out namespacing
// TODO support textured meshes
