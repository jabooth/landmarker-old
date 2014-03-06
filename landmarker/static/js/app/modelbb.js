
define(["underscore", "Backbone", "three"], function(_, Backbone, THREE) {

        "use strict";

        var Model = Backbone.Model.extend({

            urlRoot: "api/v1/models",

            model: function () {
                return this.get('model');
            },

            landmarkRadius: function () {
                return this.model().geometry.boundingSphere.radius / 100

            },

            toJSON: function () {
                var trilist = _.map(this.model().geometry.faces, function (face) {
                    return [face.a, face.b, face.c];
                });

                var points = _.map(this.model().geometry.vertices, function (v) {
                    return [v.x, v.y, v.z];
                });

                return {
                    points: points,
                    trilist: trilist
                };
            },

            parse: function (response) {
                var geometry = new THREE.Geometry();
                _.each(response.points, function (v) {
                    geometry.vertices.push(new THREE.Vector3(v[0], v[1], v[2]));
                });
                _.each(response.trilist, function (tl) {
                    geometry.faces.push(new THREE.Face3(tl[0], tl[1], tl[2]));
                });
                geometry.mergeVertices();
                geometry.computeCentroids();
                // needed for lighting to work
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                geometry.computeBoundingSphere();
                // default to Phong lighting
                var material = new THREE.MeshPhongMaterial();
                return {model: new THREE.Mesh(geometry, material)};
            }

        });

        var ModelList = Backbone.Collection.extend({

            model: Model

//            lookup: function (id) {
//                var model;
//                if (model = this.get(id)) {
//                    console.log('back from cache');
//                    return $.Deferred().resolveWith(this, model);
//                } else {
//                    model = new Model({id: id});
//                    this.add([model]);
//                    console.log('from the server');
//                    return model.fetch();
//                }
//            }
        });

        // Holds a list of available models, and a model list. The model list
        // is populated immediately, although models aren't fetched until demanded.
        // Also has a model parameter - the currently active model.
        var ModelAdapter = Backbone.Model.extend({

            defaults: function () {
                return {
                    models: new ModelList
                };
            },

            url: function () {
                return "api/v1/models";
            },

            parse: function (response) {
                var models = _.map(response, function (modelId) {
                   new Model({id: modelId})
                });
                var modelList = new ModelList(models);
                var model = modelList.at(0);
                return {
                    models: modelList,
                    model: model
                };
            },

            models: function () {
                return this.get('models');
            }

        });

        return {
            Model: Model,
            ModelList: ModelList,
            ModelAdapter: ModelAdapter
        };
    }
);

// TODO support textured meshes