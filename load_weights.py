import requests
import ast

with open('weights_list.txt', 'r') as f:
	infos = ast.literal_eval(f.read())

BASE_URL = 'https://fastidiouscity-models.s3.eu-central-1.amazonaws.com/'
for info in infos:
	url = BASE_URL + info['link']
	r = requests.get(url, allow_redirects=True)
	open(info['link'], 'wb').write(r.content)

url = 'https://fastidiouscity-models.s3.eu-central-1.amazonaws.com/agreement_predictor/tf_model.h5'

r = requests.get(url, allow_redirects=True)

open('agreement_predictor/tf_model.h5', 'wb').write(r.content)