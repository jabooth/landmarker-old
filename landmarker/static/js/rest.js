
var RIO = {};

RIO.RESTClient = function (restURL) {
    console.log("about to json");

    var modelURL = restURL + "models/";
    var landmarkURL = restURL + "landmarks/";
    var modelList;
    var landmarkList;
    updateModels();
    updateLandmarks();

    function listModels() {
        return modelList;
    }

    function updateLandmarks() {
        $.get(landmarkURL, function (lmListRes) {
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
        var id_url = landmarkURL + model_id;
        $.ajax({
            url: id_url,
            contentType: 'application/json',
            dataType: 'json',
            type: 'PUT',
            processData: false,
            data: JSON.stringify(lms),
            success: function(result) {
                console.log("YYYYEARR");
            }
        });
    }



    return {
        listModels: listModels,
        retrieveMesh: retrieveMesh,
        saveLandmarks: saveLandmarks
    };
};
