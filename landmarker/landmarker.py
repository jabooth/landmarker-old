import json
import os
from collections import defaultdict
import os.path as p
import glob
import StringIO
from copy import deepcopy

from flask import Flask, request, send_file
from flask.ext.restful import abort, Api, Resource

import menpo.io as mio
from menpo.shape.mesh import TriMesh, TexturedTriMesh


class Config:
    pass

config = Config
config.gzip = False  # halves payload, increases server workload
config.model_dir = './models'
config.landmark_dir = './landmarks'

app = Flask(__name__, static_url_path='')

if config.gzip:
    from flask.ext.compress import Compress
    Compress(app)
    
api = Api(app)


print('Importing meshes...')

meshes = {}
textures = {}


def as_jpg_file(image):
    p = image.as_PILImage()
    output = StringIO.StringIO()
    p.save(output, format='jpeg')
    output.seek(0)
    return output


def as_open_file(file):

    def f():
        return deepcopy(file)

    return f

for mesh in mio.import_meshes(p.join(config.model_dir, '*')):
    mesh_id = mesh.ioinfo.filename
    meshes[mesh_id] = mesh.tojson()
    if isinstance(mesh, TexturedTriMesh):
        textures[mesh_id] = as_open_file(as_jpg_file(mesh.texture))

print(' - {} meshes imported.'.format(len(meshes)))
print(' - {} meshes are textured.'.format(len(textures)))

# import scipy.io as sio
# x = sio.loadmat("/Users/jab08/Desktop/01_MorphableModel.mat")
# mean_head, trilist = x['shapeMU'], x['tl']
# trilist[:, [0, 1]] = trilist[:, [1, 0]]
# model = TriMesh(mean_head.reshape([-1, 3]), trilist=trilist - 1)
# meshes["basel"] = model.tojson()


def list_landmarks(mesh_id=None):
    if mesh_id is None:
        mesh_id = '*'
    g = glob.glob(p.join(config.landmark_dir, mesh_id, "*"))
    return filter(lambda f: p.isfile(f) and p.splitext(f)[-1] == '.json', g)


def landmark_fp(model_id, lm_id):
    lm_dir = p.join(config.landmark_dir, model_id)
    return p.join(lm_dir, lm_id + '.json')


class Mesh(Resource):

    def get(self, mesh_id):
        try:
            return meshes[mesh_id]
        except KeyError:
            abort(404, message="{} is not an available model".format(mesh_id))


class MeshList(Resource):

    def get(self):
        return list(meshes)


class Texture(Resource):

    def get(self, mesh_id):
        try:
            return send_file(textures[mesh_id](), mimetype='image/jpeg')
        except KeyError:
            abort(404, message="{} is not a textured mesh".format(mesh_id))


class TextureList(Resource):

    def get(self):
        return [k for k, v in meshes.iteritems() if 'tcoords' in v]


class Landmark(Resource):

    def get(self, mesh_id, lm_id):
        fp = landmark_fp(mesh_id, lm_id)
        if not p.isfile(fp):
            abort(404, message="{}:{} does not exist".format(mesh_id, lm_id))
        try:
            with open(fp, 'rb') as f:
                lm = json.load(f)
            return lm
        except Exception:
            abort(404, message="{}:{} does not exist".format(mesh_id, lm_id))

    def put(self, mesh_id, lm_id):
        subject_dir = p.join(config.landmark_dir, mesh_id)
        if not p.isdir(subject_dir):
            os.mkdir(subject_dir)
        fp = landmark_fp(mesh_id, lm_id)
        with open(fp, 'wb') as f:
            json.dump(request.json, f, sort_keys=True, indent=4,
                      separators=(',', ': '))


class LandmarkList(Resource):

    def get(self):
        landmark_files = list_landmarks()
        mapping = defaultdict(list)
        for lm_path in landmark_files:
            dir_path, filename = p.split(lm_path)
            lm_set = p.splitext(filename)[0]
            lm_id = p.split(dir_path)[1]
            mapping[lm_id].append(lm_set)
        return mapping


class LandmarkListForId(Resource):

    def get(self, mesh_id):
        landmark_files = list_landmarks(mesh_id=mesh_id)
        return [p.splitext(p.split(f)[-1])[0] for f in landmark_files]


api_endpoint = '/api/v1/'

api.add_resource(MeshList, api_endpoint + 'meshes')
api.add_resource(Mesh, api_endpoint + 'meshes/<string:mesh_id>')

api.add_resource(TextureList, api_endpoint + 'textures')
api.add_resource(Texture, api_endpoint + 'textures/<string:mesh_id>')

api.add_resource(LandmarkList, api_endpoint + 'landmarks')
api.add_resource(LandmarkListForId, api_endpoint +
                 'landmarks/<string:mesh_id>')
api.add_resource(Landmark, api_endpoint +
                 'landmarks/<string:mesh_id>/<string:lm_id>')


# @app.route('/static')
# def root():
#     return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(debug=True)
