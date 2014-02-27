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


// TODO rm these for server mode to start with
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

var meshL, lmSet;

signals.meshChanged.add( function (mesh) {
    // get a handle on the current mesh
    meshL = mesh;
    // make a fresh LM set
    lmSet = LM.LandmarkSet(['PTS'], [34],
        mesh.getModelId());
    console.log("clearing landmarks for new face");
    signals.landmarkSetChanged.dispatch(lmSet);
});

var restURL = "http://localhost:5000/";
var restClient = RIO.RESTClient(restURL, 'icip34');
restClient.retrieveFirstMesh();
var sidebar;
$(function () {
    $("#nextMesh").click(function () {
        restClient.retrieveMeshAfter(meshL.getModelId());
    });
    $("#previousMesh").click(function () {
        restClient.retrieveMeshBefore(meshL.getModelId());
    });
    $("#saveLandmarks").click(function () {
        restClient.saveLandmarks(meshL.getModelId(), lmSet);
    });
    $('#undo').click(function() {
        lmSet.undo();
        signals.landmarkSetChanged.dispatch(lmSet);
    });
    $('#redo').click(function() {
        lmSet.redo();
        signals.landmarkSetChanged.dispatch(lmSet);
    });
    $('#resetView').click(function() {
        signals.resetView.dispatch();
    });

    var Sidebar = function (signals, keyboard) {
        var _lmSet;
        var trOddTemplate = _.template($("#trTemplateOdd").html());
        var trEvenTemplate = _.template($("#trTemplateEven").html());

        function tableForLandmarkGroup(lmGroup) {
            var table = "";
            for (var i = 0; i < lmGroup.nLandmarks(); i++) {
                table += tableRowForLandmark(lmGroup.getLandmark(i), i);
            }
            return table;
        }

        function tableRowForLandmark(lm, i) {
            var template = xyziForLandmark(lm, i);
            if (i % 2) {
                return trOddTemplate(template);
            } else {
                return trEvenTemplate(template);
            }
        }

        function xyziForLandmark(lm, i) {
            var p;
            if (lm.isEmpty()) {
                return {
                    x: '-',
                    y: '-',
                    z: '-',
                    i: i
                };
            } else {
                p = lm.getPoint();
                return {
                    x: p.x.toPrecision(4),
                    y: p.y.toPrecision(4),
                    z: p.z.toPrecision(4),
                    i: i
                };
            }
        }

        function updateTable(lmGroup) {
            clearTable();
            $("tbody").append(tableForLandmarkGroup(lmGroup));
            updateLandmarkLabelAndCount(lmGroup);
        }

        function updateLandmarkLabelAndCount(lmGroup) {
            $(".LabelName").html(lmGroup.getLabel());
            var n = lmGroup.nLandmarks();
            var c = n - lmGroup.nEmptyLandmarks();
            var n_str = pad(n, 2);
            var c_str = pad(c, 2);
            $(".LabelCount").html(c_str + "/" + n_str);

            function pad(n, width, z) {
                z = z || '0';
                n = n + '';
                return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
            }
        }

        signals.landmarkChanged.add(function (lm, i, lmGroup) {
            var id = "#lm" + i.toString();
            var p = xyziForLandmark(lm, i);
            $(id + " .x").html(p.x);
            $(id + " .y").html(p.y);
            $(id + " .z").html(p.z);
            if (lm.isSelected()) {
                $(id).addClass("Table-Cell-Selected");
            } else {
                $(id).removeClass("Table-Cell-Selected");
            }
            updateLandmarkLabelAndCount(lmGroup)
        });

        signals.landmarkSetChanged.add(function (lmSet) {
            _lmSet = lmSet;  // get a handle on the lmSet..
            updateTable(lmSet.getActiveGroup());
            $("tr").click(function () {
                console.log('row clicked');
                var i = parseInt(this.id.substring(2),10);
                if (!keyboard.shift) {
                    lmSet.deselectAll();
                }
                var active = lmSet.getActiveGroup();
                var lm = active.getLandmark(i);
                if (!lm.isEmpty()) {
                    lm.select();
                }
                // TODO this should be more granular (lmGroupChanged)
                signals.landmarkSetChanged.dispatch(lmSet);
            });
        });

        function clearTable() {
            $("tbody tr").remove();
        }

        return {
            tableForLandmarkGroup: tableForLandmarkGroup,
            updateTable: updateTable
        };
    };

    sidebar = Sidebar(signals, keyboard);
});

