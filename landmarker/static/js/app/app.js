// TODO make some methods hidden (just between these three objects)


define(['backbone', './landmarkbb', './modelbb'], function (Backbone, Landmark, Model) {

    "use strict";

    var App = Backbone.Model.extend({

        defaults: function () {
            return {
                modelSrc: new Model.ModelSource,
                landmarkType: 'ibug68',
                templateName: '.template'
            }
        },

        initialize: function () {
            // retrieve the list of models.
            _.bindAll(this, 'modelChanged');
            var models = this.get('modelSrc');
            var that = this;
            models.fetch({
                success: function () {
                    var modelSrc = that.get('modelSrc');
                    modelSrc.setModel(modelSrc.get('models').at(0));
                }
            });
            this.listenTo(models, 'change:model', this.modelChanged);
        },

        modelChanged: function () {
            console.log('model has been changed on the modelSrc!');
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
            return this.get('modelSrc').get('model');
        }

    });

    return {
        App: App
    };
});
