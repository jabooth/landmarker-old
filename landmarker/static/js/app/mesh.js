
define(["underscore", "three"], function(_, THREE) {

        function Mesh(mesh, modelId) {

            function toJSON () {
                var trilist = _.map(mesh.geometry.faces, function (face) {
                    return [face.a, face.b, face.c];
                });

                var points = _.map(mesh.geometry.vertices, function (v) {
                    return [v.x, v.y, v.z];
                });

                return {
                    points: points,
                    trilist: trilist,
                };
            }

            return {
                getModelId: function () {return modelId;},
                toJSON: toJSON,
                getMesh: function () {return mesh;},
                landmarkRadius: mesh.geometry.boundingSphere.radius / 100
            };
        }

        function MeshFromJSON(obj, modelId) {
            var geometry = new THREE.Geometry();
            _.each(obj.points, function (v) {
                geometry.vertices.push(new THREE.Vector3(v[0], v[1], v[2]));
            });
            _.each(obj.trilist, function (tl) {
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
            return Mesh(new THREE.Mesh(geometry, material), modelId);
        }

        return {
            Mesh: Mesh ,
            MeshFromJSON: MeshFromJSON
        };
    }
);

// TODO support textured meshes
