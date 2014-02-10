
from flask import Flask, request
from flask.ext.restful import reqparse, abort, Api, Resource

import pybug.io as pio
import os
from os import path


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
models = list(pio.import_meshes(os.path.join(config.model_dir, '*')))
models = {path.splitext(path.basename(m.filepath))[0]: m.toJSON()
          for m in models}

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

    def put(self, model_id):
        request.form['data']


class LandmarkList(Resource):

    def get(self):
        return os.listdir(config.landmark_dir)


api.add_resource(ModelList, '/models/')
api.add_resource(Model, '/models/<string:model_id>')
api.add_resource(LandmarkList, '/landmarks/')

# @app.route('/static')
# def root():
#     return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run()
