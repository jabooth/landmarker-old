var parseFile = function (signals, file, filename, extension) {
    switch (extension) {
        case 'ctm':
            var reader = new FileReader();
            reader.addEventListener('load', function (event) {
                var contents = event.target.result;
                var stream = new CTM.Stream(contents);
                stream.offset = 0;
                var loader = new THREE.CTMLoader();
                loader.createModelClassic(new CTM.File(stream), function (geometry) {
                    geometry.sourceType = "ctm";
                    geometry.sourceFile = file.name;
                    var material = new THREE.MeshPhongMaterial();
                    loadMesh(new THREE.Mesh(geometry, material));
                });
            }, false);
            reader.readAsBinaryString(file);
            break;

        case 'dae':
            var reader = new FileReader();
            reader.addEventListener('load', function (event) {
                var contents = event.target.result;
                var parser = new DOMParser();
                var xml = parser.parseFromString(contents, 'text/xml');
                var loader = new THREE.ColladaLoader();
                loader.parse(xml, function (collada) {
                    loadMesh(collada.scene);
                });
            }, false);
            reader.readAsText(file);
            break;

        case 'obj':
            var reader = new FileReader();
            reader.addEventListener('load', function (event) {
                var contents = event.target.result;
                loadMesh(new THREE.OBJLoader().parse(contents));
            }, false);
            reader.readAsText(file);
            break;

        case 'ply':
            var reader = new FileReader();
            reader.addEventListener('load', function (event) {
                var contents = event.target.result;
                console.log(contents);
                var geometry = new THREE.PLYLoader().parse(contents);
                geometry.sourceType = "ply";
                geometry.sourceFile = file.name;
                var material = new THREE.MeshPhongMaterial();
                loadMesh(new THREE.Mesh(geometry, material));
            }, false);
            reader.readAsText(file);
            break;

        case 'stl':
            var reader = new FileReader();
            reader.addEventListener('load', function (event) {
                var contents = event.target.result;
                var geometry = new THREE.STLLoader().parse(contents);
                geometry.sourceType = "stl";
                geometry.sourceFile = file.name;
                var material = new THREE.MeshPhongMaterial();
                loadMesh(new THREE.Mesh(geometry, material));
            }, false);
            reader.readAsBinaryString(file);
            break;

        case 'vtk':
            var reader = new FileReader();
            reader.addEventListener('load', function (event) {
                var contents = event.target.result;
                var geometry = new THREE.VTKLoader().parse(contents);
                geometry.sourceType = "vtk";
                geometry.sourceFile = file.name;
                var material = new THREE.MeshPhongMaterial();
                loadMesh(new THREE.Mesh(geometry, material));
            }, false);
            reader.readAsText(file);
            break;
    }

    function loadMesh(mesh) {
        mesh.name = filename;
        signals.meshChanged.dispatch(mesh);
    }
};



