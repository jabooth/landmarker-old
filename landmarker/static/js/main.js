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

var viewport = new Viewport(signals, $('.viewport'));

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
