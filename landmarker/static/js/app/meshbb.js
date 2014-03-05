
define(["underscore", "Backbone", "three"], function(_, Backbone, THREE) {

        "use strict";

        var Mesh = Backbone.Model.extend({

            urlRoot: "api/v1/models",

            mesh: function () {
                return this.get('mesh');
            },

            landmarkRadius: function () {
                return this.mesh().geometry.boundingSphere.radius / 100

            },

            toJSON: function () {
                var trilist = _.map(this.mesh().geometry.faces, function (face) {
                    return [face.a, face.b, face.c];
                });

                var points = _.map(this.mesh().geometry.vertices, function (v) {
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
                return {mesh: new THREE.Mesh(geometry, material)};
            }

        });

        return {
            Mesh: Mesh
        };
    }
);

// TODO support textured meshes