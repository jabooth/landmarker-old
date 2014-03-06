// TODO make some methods hidden (just between these three objects)


define(['backbone', './landmarkbb', './modelbb'], function (Backbone, Landmark, Model) {

    "use strict";

    var App = Backbone.Model.extend({

        defaults: function () {
            return {
                models: new Model.ModelAdapter,
                landmarks: new Landmark.LandmarkSet
            }
        },

        initialize: function () {
            console.log('getting model list');
            this.get('models').fetch();
        }

    });

    return {
        App: App
    };
});
