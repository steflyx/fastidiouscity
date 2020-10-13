import requests
import ast

with open('weights_list.txt', 'r') as f:
	infos = ast.literal_eval(f.read())

BASE_URL = 'https://fastidiouscity-models.s3.eu-central-1.amazonaws.com/'
for info in infos:
	url = BASE_URL + info['link']
	r = requests.get(url, allow_redirects=True)
	open('../../local_server/weights/' + info['link'], 'wb').write(r.content)
