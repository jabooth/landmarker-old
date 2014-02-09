window.URL = window.URL || window.webkitURL;
window.BlobBuilder = window.BlobBuilder ||
    window.WebKitBlobBuilder || window.MozBlobBuilder;

// hold a pointer to the signals lib so we can override it
var SIGNALS = signals;

var signals = {
    rendererChanged: new SIGNALS.Signal(),
    landmarkChanged: new SIGNALS.Signal(),
    landmarkSetChanged: new SIGNALS.Signal(),
    clearColorChanged: new SIGNALS.Signal(),
    windowResize: new SIGNALS.Signal(),
    meshChanged: new SIGNALS.Signal(),
    resetView: new SIGNALS.Signal()
};

var viewport = new Viewport(signals);
viewport.setTop('0px');
viewport.setLeft('0px');
viewport.setRight('0px');
viewport.setBottom('0px');
document.body.appendChild(viewport.dom);

document.addEventListener('dragover', function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}, false);

document.addEventListener('drop', function (event) {
    event.preventDefault();
    var file = event.dataTransfer.files[ 0 ];
    var chunks = file.name.split('.');
    var extension = chunks.pop().toLowerCase();
    var filename = chunks.join('.');
    parseFile(signals, file, filename, extension);
}, false);


var onWindowResize = function () {
    signals.windowResize.dispatch();
};

window.addEventListener('resize', onWindowResize, false);
onWindowResize();


var lmSet = LM.LandmarkSet(['PTS'], [68]);
signals.landmarkSetChanged.dispatch(lmSet);

document.addEventListener('keydown', function (event) {
    console.log(event.keyCode);
    switch (event.keyCode) {
        case 46:  // delete
            // TODO should clear selected landmarks
            break;
        case 85:  // u(ndo)
            lmSet.undo();
            signals.landmarkSetChanged.dispatch(lmSet);
            break;
        case 82:  // r(edo)
            lmSet.redo();
            signals.landmarkSetChanged.dispatch(lmSet);
            break;
        case 32: // spacebar
            signals.resetView.dispatch();
            break;
    }
}, false);


var BB = {};

// QUESTIONS
// TODO how to handle hidden state (history)
// How do change notifications work?



BB.Landmark = Backbone.Model.extend({

    defaults: {
        snapshottedPoint: null,
        point: null,
        selected: false
    },

    initialize: function () {
    },

    isModified: function isModified() {
        var point = this.get("point");
        var snapshottedPoint = this.get("snapshottedPoint");
        if (point === null || snapshottedPoint === null) {
            // if either are null, but both aren't, there is a modification
            return !(snapshottedPoint === null && point === null);
        }
        // no nulls here!
        return !point.equals(this.snapshottedPoint);
    },

    toJSON: function () {
        // only care about stringifying the point
        return this.get("point");
    },

    isEmpty: function isEmpty() {
        return this.get("point") === null;
    }
});

BB.Landmarks = Backbone.Collection.extend({
    model: BB.Landmark
});

BB.LandmarkGroup = Backbone.Model.extend({
    defaults : function() {
        return {landmarks:  new BB.Landmarks};
    }
});

BB.LandmarkGroups = Backbone.Collection.extend({
    model: BB.LandmarkGroup
});

BB.LandmarkSet = Backbone.Model.extend({
    defaults: function () {
        return {groups: new BB.LandmarkGroups};
    }
});

BB.EmptyLandmarkSet = function (labels, nLandmarks) {
    var i, j, lmset, lmgroups, lmgroup, lms;
    lmset = new BB.LandmarkSet;
    lmgroups = lmset.get("groups");
    for (i = 0; i < labels.length; i++) {
        lmgroup = new BB.LandmarkGroup({label: labels[i]});
        lms = lmgroup.get("landmarks");
        for (j = 0; j < nLandmarks[i]; j++) {
           lms.add(new BB.Landmark);
        }
        lmgroups.add(lmgroup);
    }
    return lmset;
};



var lm1 = new BB.Landmark({point: new THREE.Vector3(1,2,3)});  // set two lms
var lm2 = new BB.Landmark({point: new THREE.Vector3(4,5,6)});
var lm3 = new BB.Landmark;  // empty
var lmg_le = new BB.LandmarkGroup({title: 'l_eye'});
lmg_le.get("landmarks").add([lm1, lm2, lm3]);
var lmg_re = new BB.LandmarkGroup({title: 'r_eye'});
lmg_re.get("landmarks").add([lm1, lm2, lm3]);


var lms = BB.EmptyLandmarkSet(['l_eye', 'r_eye'], [3, 4]);


var LmGroupView = Backbone.View.extend({
    el: '.content',

    initialize: function() {
        this.listenTo(this.model, "change", this.render);
    },

    render: function() {
        var template = _.template($("#landmark-template").html(),
            {landmarks: this.model.get("landmarks").models});
        this.$el.html(template);
        return this;
    }
});

var body = new LmGroupView({model: lms.get("groups").at(0)});
