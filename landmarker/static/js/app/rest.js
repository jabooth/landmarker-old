define(["jquery", "./mesh"], function($, Mesh) {

    // TODO iterate through available meshes (caching?)
    function RESTClient(signals, restURL, aLandmarkId) {

        "use strict";

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

        function retrieveMesh(modelId) {
            var idUrl = modelURL + modelId;
            $.getJSON(idUrl, function (obj) {
                var mesh = Mesh.MeshFromJSON(obj, modelId)
                signals.meshChanged.dispatch(mesh);
            });
        }

        function retrieveMeshAfter(modelId) {
            var i = modelList.indexOf(modelId)
            if (i != -1 && i < modelList.length - 1) {
                retrieveMesh(modelList[i + 1]);
            }
        }

        function retrieveMeshBefore(modelId) {
            var i = modelList.indexOf(modelId)
            if (i != -1 && i > 0) {
                retrieveMesh(modelList[i - 1]);
            }
        }

        function saveLandmarks(modelId, lms) {
            var idUrl = landmarkIdURL() + modelId;
            $.ajax({
                url: idUrl,
                contentType: 'application/json',
                dataType: 'json',
                type: 'PUT',
                processData: false,
                data: JSON.stringify(lms),
                success: function() {
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
    }

    return {
        RESTClient: RESTClient
    }

});

