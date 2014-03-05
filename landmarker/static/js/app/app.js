// TODO make some methods hidden (just between these three objects)


define(['backbone', './landmarkbb', './meshbb'], function (Backbone, Landmark, Mesh) {

    "use strict";

    var App = Backbone.Model.extend({

        defaults: function () {
            return {
                mesh: new Mesh.Mesh,
                landmarks: new Landmark.LandmarkSet
            }
        }

    });

    return {
        App: App,
    };

});
