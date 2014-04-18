import abc
from copy import deepcopy
from collections import defaultdict
import glob
import json
import os
import os.path as p
import StringIO

import menpo.io as mio
from menpo.shape.mesh import TriMesh, TexturedTriMesh


class LandmarkerJSAdapter(object):

    __metaclass__ = abc.ABCMeta

    @abc.abstractmethod
    def mesh_ids(self):
        pass

    @abc.abstractmethod
    def mesh_json(self, mesh_id):
        pass

    @abc.abstractmethod
    def all_landmarks(self):
        pass

    @abc.abstractmethod
    def landmark_ids(self, mesh_id):
        pass

    @abc.abstractmethod
    def landmark_json(self, mesh_id, lm_id):
        pass

    @abc.abstractmethod
    def save_landmark_json(self, mesh_id, lm_id, lm_json):
        pass

    @abc.abstractmethod
    def textured_mesh_ids(self):
        pass

    @abc.abstractmethod
    def texture_file(self, mesh_id):
        pass


def as_jpg_file(image):
    p = image.as_PILImage()
    output = StringIO.StringIO()
    p.save(output, format='jpeg')
    output.seek(0)
    return output


class MenpoAdapter(LandmarkerJSAdapter):

    def __init__(self, model_dir, landmark_dir):
        self.model_dir = model_dir
        self.landmark_dir = landmark_dir
        print('Importing meshes...')
        self.meshes = {}
        self.textures = {}
        for mesh in mio.import_meshes(p.join(self.model_dir, '*')):
            mesh_id = mesh.ioinfo.filename
            self.meshes[mesh_id] = mesh.tojson()
            if isinstance(mesh, TexturedTriMesh):
                self.textures[mesh_id] = as_jpg_file(mesh.texture)
        print(' - {} meshes imported.'.format(len(self.meshes)))
        print(' - {} meshes are textured.'.format(len(self.textures)))

        # HACK - Import basel face model for now.
        import scipy.io as sio
        x = sio.loadmat("/Users/jab08/Desktop/01_MorphableModel.mat")
        mean_head, trilist = x['shapeMU'], x['tl']
        trilist[:, [0, 1]] = trilist[:, [1, 0]]
        model = TriMesh(mean_head.reshape([-1, 3]), trilist=trilist - 1)
        self.meshes["basel"] = model.tojson()

    def landmark_fp(self, model_id, lm_id):
        lm_dir = p.join(self.landmark_dir, model_id)
        return p.join(lm_dir, lm_id + '.json')

    def list_landmarks(self, mesh_id=None):
        if mesh_id is None:
            mesh_id = '*'
        g = glob.glob(p.join(self.landmark_dir, mesh_id, "*"))
        return filter(lambda f: p.isfile(f) and
                                p.splitext(f)[-1] == '.json', g)

    def mesh_ids(self):
        return list(self.meshes)

    def mesh_json(self, mesh_id):
        return self.meshes[mesh_id]

    def all_landmarks(self):
        landmark_files = self.list_landmarks()
        mapping = defaultdict(list)
        for lm_path in landmark_files:
            dir_path, filename = p.split(lm_path)
            lm_set = p.splitext(filename)[0]
            lm_id = p.split(dir_path)[1]
            mapping[lm_id].append(lm_set)
        return mapping

    def landmark_ids(self, mesh_id):
        landmark_files = self.list_landmarks(mesh_id=mesh_id)
        return [p.splitext(p.split(f)[-1])[0] for f in landmark_files]

    def landmark_json(self, mesh_id, lm_id):
        fp = self.landmark_fp(mesh_id, lm_id)
        if not p.isfile(fp):
            raise IOError
        with open(fp, 'rb') as f:
            lm = json.load(f)
            return lm

    def save_landmark_json(self, mesh_id, lm_id, lm_json):
        subject_dir = p.join(self.landmark_dir, mesh_id)
        if not p.isdir(subject_dir):
            os.mkdir(subject_dir)
        fp = self.landmark_fp(mesh_id, lm_id)
        with open(fp, 'wb') as f:
            json.dump(lm_json, f, sort_keys=True, indent=4,
                      separators=(',', ': '))

    def textured_mesh_ids(self):
        return list(self.textures)

    def texture_file(self, mesh_id):
        return deepcopy(self.textures[mesh_id])
