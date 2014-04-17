define(["underscore", "Backbone", "three"], function(_, Backbone, THREE) {

    "use strict";

    var basicMaterial = new THREE.MeshPhongMaterial();

    var Mesh = Backbone.Model.extend({

        urlRoot: "api/v1/meshes",

        t_mesh: function () {
            return this.get('t_mesh');
        },


        hasTexture: function() {
            return this.has('texture');
        },

        textureOff: function() {
            if (this.hasTexture()) {
                var wf = this.isWireframeOn();
                this.t_mesh().material = basicMaterial;
                if (wf) {
                    this.wireframeOn();
                } else {
                    this.wireframeOff();
                }
            }
        },

        textureOn: function() {
            if (this.hasTexture()) {
                var wf = this.isWireframeOn();
                this.t_mesh().material = this.get('texture');
                if (wf) {
                    this.wireframeOn();
                } else {
                    this.wireframeOff();
                }
            }
        },

        isWireframeOn: function () {
            return this.t_mesh().material.wireframe;
        },

        wireframeOn: function() {
           this.t_mesh().material.wireframe = true;
        },

        wireframeOff: function() {
            this.t_mesh().material.wireframe = false;
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
            var material;
            var result;
            if (response.tcoords) {
                // this mesh has a texture - grab it
                material = new THREE.MeshPhongMaterial( {
                    map: THREE.ImageUtils.loadTexture(
                        'api/v1/textures/' + this.id)});
                // We expect per-vertex texture coords only. Three js has per
                // face tcoords, so we need to handle the conversion.
                // First - generate all the tcoords in a list
                var tcs = [];
                _.each(response.tcoords, function (tc) {
                    tcs.push(new THREE.Vector2(tc[0], tc[1]));
                });
                // now index into them to build up the per-face uvs THREE js
                // uses
                var t; // the indices for the triangle in question
                for (var i = 0; i < geometry.faces.length; i++) {
                    t = geometry.faces[i];
                    geometry.faceVertexUvs[0].push(
                        [tcs[t.a], tcs[t.b], tcs[t.c]])
                }
                result = {
                    t_mesh: new THREE.Mesh(geometry, material),
                    texture: material
                };
            } else {
                // default to basic Phong lighting
                result = {
                    t_mesh: new THREE.Mesh(geometry, basicMaterial)
                };
            }
            // clean up the vertices
            geometry.mergeVertices();
            geometry.computeCentroids();
            // needed for lighting to work
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            geometry.computeBoundingSphere();

            return result;
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