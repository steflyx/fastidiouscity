"""

Thanks to: GoogleNews API—Live News from Google News using Python, Mansi Dhingra
URL to the article: https://medium.com/analytics-vidhya/googlenews-api-live-news-from-google-news-using-python-b50272f0a8f0

"""

from googlesearch import search
from newspaper import Article
from newspaper import Config
import pandas as pd
import nltk
from nltk.tokenize import word_tokenize
nltk.download('punkt')
nltk.download('stopwords')
stopwords = set(nltk.corpus.stopwords.words()) 

USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'
config = Config()
config.browser_user_agent = USER_AGENT

#Uses Google search to retrieve a set of articles' links related to the query
#TO DO: Add country location and look for more pages + options to the search
def get_related_articles(query):

	#Clean the query of any stopword
	query = (" ").join([word for word in word_tokenize(query) if not word in stopwords])

	#Retrieve links
	links = []
	for link in search(query, tld="co.in", num=10, stop=10, pause=2):
		links.append(link)

	return links

#Uses newspaper3k library to retrieve an article's info starting from their url
#Returns:
#	dict    {'title', 'media', 'text', 'summary', 'authors', 'url', 'date', 'download_ok'}
def get_article_info(link):

	#Try to download the article
	try:
		article = Article(link, config=config)
		article.download()
		article.parse()
		article.nlp()
	except:
		return {'url': link, 'download_ok': 0}

	#Build the dictionary with the article info
	article_info = {}
	article_info['title']       = article.title
	article_info['media']       = article.top_image
	article_info['text']        = article.text
	article_info['summary']     = article.summary
	article_info['authors']     = article.authors
	article_info['date']        = article.publish_date	
	article_info['publisher']   = link.replace('https://', '').split('/')[0]
	article_info['url']         = link
	article_info['download_ok'] = 1

	return article_info