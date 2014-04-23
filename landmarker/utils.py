import itertools
from collections import namedtuple
import json
from flask.ext.restful import unpack

Group = namedtuple('Group', ['label', 'n', 'index'])


def parse_group(group):
    x = group.split('\n')
    label, n_str = x[0].split(' ')
    n = int(n_str)
    index_str = x[1:]
    if len(index_str) == 0:
        return Group(label, n, [])
    index = [[int(j) for j in i.split(' ')] for i in index_str]
    indexes = set(itertools.chain.from_iterable(index))
    if min(indexes) < 0 or max(indexes) > n:
        raise ValueError("invalid connectivity")
    return Group(label, n, index)


def group_to_json(group):
    group_json = {}
    lms = [{'point': None}] * group.n
    group_json["landmarks"] = lms
    group_json["connectivity"] = group.index
    return group_json


def groups_to_json(groups):
    lm_json = {'version': 1, 'groups': {}}
    for g in groups:
        lm_json['groups'][g.label] = group_to_json(g)
    return lm_json


def load_template(path):
    with open(path, 'rb') as f:
        ta = f.read().strip().split('\n\n')
    print ta
    groups = [parse_group(g) for g in ta]
    return groups_to_json(groups)


from datetime import timedelta
from flask import make_response, request, current_app, Response
from functools import update_wrapper


def crossdomain(origin=None, methods=None, headers=None, max_age=21600,
                attach_to_all=True, automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                res = f(*args, **kwargs)
                if isinstance(res, Response):
                    resp = res
                else:
                    data, code, headers = unpack(res)
                    resp = make_response(json.dumps(data), code, headers)
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator