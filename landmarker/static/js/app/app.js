define(['backbone', './landmark', './mesh'],
    function (Backbone, Landmark, Mesh) {

    "use strict";

    var App = Backbone.Model.extend({

        defaults: function () {
            return {
                meshSource: new Mesh.MeshSource,
                landmarkType: 'shiyang',
                templateName: '.template'
            }
        },

        initialize: function () {
            // retrieve the list of meshes.
            _.bindAll(this, 'meshChanged');
            var meshes = this.get('meshSource');
            var that = this;
            meshes.fetch({
                success: function () {
                    var meshSource = that.get('meshSource');
                    meshSource.setMesh(meshSource.get('meshes').at(0));
                }
            });
            this.listenTo(meshes, 'change:mesh', this.meshChanged);
        },

        meshChanged: function () {
            console.log('mesh has been changed on the meshSource!');
            var landmarks = new Landmark.LandmarkSet({
                id: this.mesh().id,
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
                            landmarks.id = that.mesh().id;
                        }
                    });
                }
            });
        },

        mesh: function () {
            return this.get('meshSource').get('mesh');
        },

        landmarks: function () {
            return this.get('landmarks');
        }
    });

    return {
        App: App
    };
});
