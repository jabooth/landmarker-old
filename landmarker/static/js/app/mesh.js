define(["underscore", "Backbone", "three"], function(_, Backbone, THREE) {

    "use strict";

    var Mesh = Backbone.Model.extend({

        urlRoot: "api/v1/meshes",

        t_mesh: function () {
            return this.get('t_mesh');
        },

        toJSON: function () {
            var trilist = _.map(this.t_mesh().geometry.faces, function (face) {
                return [face.a, face.b, face.c];
            });

            var points = _.map(this.t_mesh().geometry.vertices, function (v) {
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
            return {t_mesh: new THREE.Mesh(geometry, material)};
        }

    });

    var MeshList = Backbone.Collection.extend({
        model: Mesh
    });

    // Holds a list of available meshes, and a MeshList. The MeshList
    // is populated immediately, although meshes aren't fetched until demanded.
    // Also has a mesh parameter - the currently active mesh.
    var MeshSource = Backbone.Model.extend({

        defaults: function () {
            return {
                meshes: new MeshList
            };
        },

        url: function () {
            return "api/v1/meshes";
        },

        parse: function (response) {
            var meshes = _.map(response, function (meshId) {
               return new Mesh({id: meshId})
            });
            var meshList = new MeshList(meshes);
            return {
                meshes: meshList
            };
        },

        mesh: function () {
            return this.get('mesh');
        },

        meshes: function () {
            return this.get('meshes');
        },

        nMeshes: function () {
            return this.get('meshes').length;
        },

        next: function () {
            if (!this.hasSuccessor()) {
                return;
            }
            this.setMesh(this.get('meshes').at(this.meshIndex() + 1));
        },

        previous: function () {
            if (!this.hasPredecessor()) {
                return;
            }
            this.setMesh(this.get('meshes').at(this.meshIndex() - 1));
        },

        setMesh: function (newMesh) {
            // TODO this should cache and not get every time
            var that = this;
            newMesh.fetch({
                success: function () {
                    console.log('grabbed new mesh');
                    that.set('mesh', newMesh);
                }
            });
        },

        hasPredecessor: function () {
            return this.meshIndex() !== 0;
        },

        hasSuccessor: function () {
            return this.nMeshes() - this.meshIndex() !== 1;
        },

        // returns the index of the currently active mesh
        meshIndex: function () {
            return this.get('meshes').indexOf(this.get('mesh'));
        }
    });

    return {
        Mesh: Mesh,
        MeshList: MeshList,
        MeshSource: MeshSource
    };
}

);

// TODO support textured meshes