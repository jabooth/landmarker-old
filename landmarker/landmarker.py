import json
import os
from collections import defaultdict
import os.path as p
import glob

from flask import Flask, request
from flask.ext.restful import abort, Api, Resource

import pybug.io as pio


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

# import all the models we want to serve (they are static)
models = list(pio.import_meshes(p.join(config.model_dir, '*')))
models = {m.ioinfo.filename: m.tojson() for m in models}


def list_landmarks(model_id=None):
    if model_id is None:
        model_id = '*'
    g = glob.glob(p.join(config.landmark_dir, model_id, "*"))
    return filter(lambda f: p.isfile(f) and p.splitext(f)[-1] == '.json', g)


def landmark_fp(model_id, lm_id):
    lm_dir = p.join(config.landmark_dir, model_id)
    return p.join(lm_dir, lm_id + '.json')


class Model(Resource):

    def get(self, model_id):
        try:
            return models[model_id]
        except KeyError:
            abort(404, message="{} is not an available model".format(model_id))


class ModelList(Resource):

    def get(self):
        return list(models)


class Landmark(Resource):

    def get(self, model_id, lm_id):
        fp = landmark_fp(model_id, lm_id)
        if not p.isfile(fp):
            abort(404, message="{}:{} does not exist".format(model_id, lm_id))
        try:
            with open(fp, 'rb') as f:
                lm = json.load(f)
            return lm
        except Exception:
            abort(404, message="{}:{} does not exist".format(model_id, lm_id))


    def put(self, model_id, lm_id):
        fp = landmark_fp(model_id, lm_id)
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

    def get(self, model_id):
        landmark_files = list_landmarks(model_id=model_id)
        return [p.splitext(p.split(f)[-1])[0] for f in landmark_files]


api_endpoint = '/api/v1/'
api.add_resource(ModelList, api_endpoint + 'models')
api.add_resource(Model, api_endpoint + 'models/<string:model_id>')
api.add_resource(LandmarkList, api_endpoint + 'landmarks')
api.add_resource(LandmarkListForId, api_endpoint + 'landmarks/<string:model_id>')
api.add_resource(Landmark, api_endpoint +
                           'landmarks/<string:model_id>/<string:lm_id>')


# @app.route('/static')
# def root():
#     return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(debug=True)

# TODO PyBug landmarks should be JSON-ible
# TODO define spec carefully and template concept
# TODO implement landmarkedmodel endpoint