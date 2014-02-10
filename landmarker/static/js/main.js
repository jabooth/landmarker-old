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

var keyboard = {
    ctrl: false,
    shift: false,
    delete: false
}

var viewport = new Viewport(signals, keyboard, $('.viewport'));

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


document.addEventListener('keydown', function (event) {
    console.log("down: " + event.keyCode);
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
        case 16: // shift
            keyboard.shift = true;
            break;
        case 17:  // ctrl
            keyboard.ctrl = true;
            break;
        case 27:  // esc
            lmSet.deselectAll();
            signals.landmarkSetChanged.dispatch(lmSet);
            break;
    }
}, false);


document.addEventListener('keyup', function (event) {
    console.log("up: " + event.keyCode);
    switch (event.keyCode) {
        case 16:  // shit
            keyboard.shift = false;
            break;
        case 17:  // ctrl
            keyboard.ctrl = false;
            break;
    }
}, false);

// add a basic LM set to get started
var lmSet = LM.LandmarkSet(['PTS'], [68]);

signals.meshChanged.add( function (mesh) {
    // make a fresh LM set
    lmSet = LM.LandmarkSet(['PTS'], [68]);
    console.log("clearing landmarks for new face")
    signals.landmarkSetChanged.dispatch(lmSet);
});
