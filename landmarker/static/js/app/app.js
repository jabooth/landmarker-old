// TODO make some methods hidden (just between these three objects)


define(['backbone', './landmarkbb', './modelbb'], function (Backbone, Landmark, Model) {

    "use strict";

    var App = Backbone.Model.extend({

        defaults: function () {
            return {
                models: new Model.ModelAdapter,
                landmarkType: 'ibug68',
                templateName: '.template'
            }
        },

        initialize: function () {
            // retrieve the list of models.
            _.bindAll(this, 'modelChanged');
            this.get('models').fetch();
            var models = this.get('models');
            this.listenTo(models, 'change:model', this.modelChanged);
        },

        modelChanged: function () {
            console.log('model has been changed!');
            this.get('models').get('model').fetch();
            var landmarks = new Landmark.LandmarkSet({
                id: this.model().id,
                type: this.get('landmarkType')
            });
            var that = this;
            landmarks.fetch({
                success: function () {
                    console.log('got the landmarks!');
                    that.set('landmarks', landmarks);
                },
                error: function () {
                    // can't find landmarks for this person! Grab the template
                    // instead
                    console.log("couldn't get the landmarks");
                    landmarks.id = that.get('templateName');
                    landmarks.fetch({
                        success: function () {
                            console.log('got the template landmarks!');
                            that.set('landmarks', landmarks);
                            landmarks.id = that.model().id;
                        }
                    });
                }
            });
        },

        model: function () {
            return this.get('models').get('model');
        }

    });

    return {
        App: App
    };
});
