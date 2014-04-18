from menpolmjs import MenpoAdapter


class Config:
    pass

config = Config
config.gzip = False  # halves payload, increases server workload
config.model_dir = './models'
config.landmark_dir = './landmarks'

adapter = MenpoAdapter(config.model_dir, config.landmark_dir)
