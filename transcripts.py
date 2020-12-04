import requests
from bs4 import BeautifulSoup
import random

BASE_URL = 'https://www.rev.com/blog/transcript-category/donald-trump-transcripts'
MAX_NUMBER_OF_PARAGRAPHS = 4

"""

Returns a transcript from a random Donald Trump speech (retrieved from rev.com)

"""
def retrieve_trump():
	
	#Retrieve main page containing links to all transcripts
	main_page = requests.get(BASE_URL)
	if main_page.status_code != 200:
 		return "Error retrieving transcript"
 	soup = BeautifulSoup(main_page.content, 'html.parser')

 	#Retrieve links to transcripts and choose a random one
	speeches_url = [container.find('a')['href'] for container in soup.find_all('div', class_='col-md-4 mv3')]
	chosen_page = requests.get(speeches_url[random.randint(0, len(speeches_url))])
	if chosen_page.status_code != 200:
		return "Error retrieving transcript"

	#Retrieve speech and select some paragraphs from it
	speech = BeautifulSoup(chosen_page.content, 'html.parser').find('div', class_='fl-callout-text').find_all('p')
	if len(speech) > NUMBER_OF_PARAGRAPHS:
		first_selected_paragraph = random.randint(0, len(speech) - NUMBER_OF_PARAGRAPHS)
		speech = speech[first_selected_paragraph : first_selected_paragraph + NUMBER_OF_PARAGRAPHS]

	return " ".join([text.get_text().split('\n')[1] for text in speech]) #.split('\n')[1] removes the name of the speaker from the paragraph