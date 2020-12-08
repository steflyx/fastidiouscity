import requests
import ast
import os

#Create folder local_server/weights
if not os.path.isdir('../../local_server'):
	os.mkdir('../../local_server')
if not os.path.isdir('../../local_server/weights'):
	os.mkdir('../../local_server/weights')

print("Directories for the weights prepared, proceeding with the download...")

#Open weight list
with open('weights_list.txt', 'r') as f:
	infos = ast.literal_eval(f.read())

#Download files
BASE_URL = 'https://fastidiouscity-models.s3.eu-central-1.amazonaws.com/'
for info in infos:

	print("Downloading file: ", info['link'])

	#Create predictor's directory
	if not os.path.isdir('../../local_server/weights/' + info['directory']):
		os.mkdir('../../local_server/weights/' + info['directory'])

	#Download the file
	url = BASE_URL + info['link']
	r = requests.get(url, allow_redirects=True)
	open('../../local_server/weights/' + info['link'], 'wb').write(r.content)
