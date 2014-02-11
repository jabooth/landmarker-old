
var RIO = {};

RIO.RESTClient = function (restURL, aLandmarkId) {
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

    function updateLandmarks() {
        $.get(landmarkIdURL(), function (lmListRes) {
            landmarkList = lmListRes;
        });
    }

    function updateModels() {
        $.get(modelURL, function (modelListRes) {
            modelList = modelListRes;
        });
    }

    function retrieveMesh(model_id) {
        var id_url = modelURL + model_id;
        $.getJSON(id_url, function (obj) {
            var mesh = LM.MeshFromJSON(obj)
            signals.meshChanged.dispatch(mesh);
        });
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
        saveLandmarks: saveLandmarks,
        getLandmarkId: getLandmarkId,
        setLandmarkId: setLandmarkId
    };
};

// TODO iterate through available meshes (caching?)