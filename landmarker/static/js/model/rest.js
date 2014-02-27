
window.lmjs = window.lmjs || {};

window.lmjs.RESTClient = function (restURL, aLandmarkId) {
    console.log("about to json");

    var modelURL = restURL + "models/";
    var landmarkURL = restURL + "landmarks/";
    var modelList;
    var landmarkId = aLandmarkId;
    var landmarkList;
    updateModels();
    updateLandmarks();

    function listModels() {
        return modelList;
    }

    function landmarkIdURL () {
        return landmarkURL + landmarkId + '/';
    }

    function updateLandmarks(f) {
        $.get(landmarkIdURL(), function (lmListRes) {
            landmarkList = lmListRes;
            if (f !== undefined) {
                f(lmListRes);
            }
        });
    }

    function updateModels(f) {
        $.get(modelURL, function (modelListRes) {
            modelList = modelListRes;
            if (f !== undefined) {
                f(modelListRes);
            }
        });
    }

    function retrieveFirstMesh() {
        updateModels(function (modelListRes) {
            retrieveMesh(modelListRes[0]);
        })
    }

    function retrieveMesh(model_id) {
        var id_url = modelURL + model_id;
        $.getJSON(id_url, function (obj) {
            var mesh = window.lmjs.mesh.MeshFromJSON(obj, model_id)
            signals.meshChanged.dispatch(mesh);
        });
    }

    function retrieveMeshAfter(model_id) {
        var i = modelList.indexOf(model_id)
        if (i != -1 && i < modelList.length - 1) {
                retrieveMesh(modelList[i + 1]);
            }
    }

    function retrieveMeshBefore(model_id) {
        var i = modelList.indexOf(model_id)
        if (i != -1 && i > 0) {
            retrieveMesh(modelList[i - 1]);
        }
    }

    function saveLandmarks(model_id, lms) {
        var id_url = landmarkIdURL() + model_id;
        $.ajax({
            url: id_url,
            contentType: 'application/json',
            dataType: 'json',
            type: 'PUT',
            processData: false,
            data: JSON.stringify(lms),
            success: function(result) {
                console.log("success posting LMs");
            }
        });
    }

    function getLandmarkId () {
        return landmarkId;
    }

    function setLandmarkId (newLandmarkId) {
        landmarkId = newLandmarkId;
    }

    return {
        listModels: listModels,
        retrieveMesh: retrieveMesh,
        retrieveFirstMesh: retrieveFirstMesh,
        retrieveMeshAfter: retrieveMeshAfter,
        retrieveMeshBefore: retrieveMeshBefore,
        saveLandmarks: saveLandmarks,
        getLandmarkId: getLandmarkId,
        setLandmarkId: setLandmarkId
    };
};

// TODO iterate through available meshes (caching?)