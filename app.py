from flask import Flask, render_template, request, json, jsonify
import AFC
import concurrent.futures
import nltk
import news_search
import csv
import coreference
nltk.download('punkt')

app = Flask(__name__, static_url_path='/static')

"""

Returns the home page

"""
@app.route("/")
def main():
    return render_template('index.html',  analysis_requested = 0)

"""

Called when a request by the user is made to analyze a text.
The text is divided into sentences and each one is judged as check-worthy or non-check-worthy.
On top of that, the text is given to different predictors that analyze whether it's biased, which is its political leaning...

Returns:
	array of dict: 'sentences' [{'text', 'worthiness_prob'}]
	array of dict: 'text_predictions' [{'detector', 'prediction', 'positive_prediction', 'negative_prediction'}]


"""

@app.route('/analyze_text', methods=['GET'])
def analyze_text():

	#Read values
	_text = request.args.get('text', 0, type=str)
	
	#Divide text into sentences
	sentences_text = nltk.sent_tokenize(_text)

	#We analyze the sentences in parallel threads to check whether they're claim or not
	with concurrent.futures.ThreadPoolExecutor() as executor:
		threads_worthy_detector = [executor.submit(AFC.check_worthiness, (sentence_text)) for sentence_text in sentences_text]
	worthiness_results = [thread.result() for thread in threads_worthy_detector]

	#For each sentence, check if it's a claim and gather the fact_checking
	sentences = []
	for i in range(len(sentences_text)):
		
		#Gather info
		sentence = {}
		sentence['text'] = sentences_text[i]
		sentence['worthiness_prob'] = "{:.2f}".format(worthiness_results[i])
		sentences.append(sentence)		

		print("Analyzed sentence: {0}, worthiness probability {1}".format(sentences_text[i], sentence['worthiness_prob']))

	#After analyzing the sentences, we proceed to make predictions on the overall text
	text_predictions = AFC.analyze_text(_text)

	result = {'sentences': sentences, 'text_predictions': text_predictions}
	print("Predictions on the text: \n", text_predictions)
	return jsonify(result)	

"""

Receives:
	string: 'sentence' (the sentence we want to analyze)
	string: 'text' (the entire text)

Returns:
	array of strings: 'related_articles'
	string:			  'sentence'

"""
@app.route('/get_articles')
def get_articles():

	#Retrieve sentence to analyze
	sentence_text = request.args.get('sentence', 0, type=str)
	text = request.args.get('text', 0, type=str)
	print("Received sentence: ", sentence_text)

	#Apply co-reference resolution
	searched_sentence = coreference.link_entities(text, sentence_text)
	print("Searching for sentence: ", searched_sentence)

	#Retrieve links to related articles
	related_articles_links = news_search.get_related_articles(searched_sentence)
	print("Retrieved {} links".format(len(related_articles_links)))

	#Send back the result
	result = {'related_articles': related_articles_links, 'new_sentence': searched_sentence}
	return jsonify(result)

"""

Receives  a sentence and a link to analyze, answers with info about the link 
plus our guess on whether it supports/refutes the claim

Returns:
	dict: {'title', 'media', 'text', 'summary', 'authors', 'url', 'date', 'download_ok', 'support'}
(Only 'download_ok' and 'url' are valid if download_ok=0)

"""
@app.route('/get_article_info')
def get_article_info():

	#Retrieve sentence/article to analyze
	sentence_text = request.args.get('sentence', 0, type=str)
	link = request.args.get('article_url', 0, type=str)
	print("Analyzing article at url: ", link)
	print("Claim under examination: ", sentence_text)

	#Retrieve article info and compute its support towards the claim
	article = news_search.get_article_info(link)
	if article['download_ok'] == 0:
		print("Impossible to retrieve article on url ", article['url'])
	else:
		article['support'] = int(AFC.check_support(sentence_text, article['summary']) * 100)
		print("Retrieved article on url {0}; Supporting the claim with confidence {1}".format(article['url'], article['support']))

	#Send back the result
	result = {'article_info': article}
	return jsonify(result)

"""

Receives and stores a feedback from the user about one of our predictions
Receives:
	target:     sentence or article on which we made the prediction
	target_opt: second argument for the prediction if any (optional)
	detector:   what detector we were using
	prediction: what was our prediction
	feedback:   feedback of the user (yes/no)

"""
@app.route('/send_feedback')
def store_feedback():

	#Retrieve arguments sent by the client
	target     = request.args.get('target', 0, type=str)
	target_opt = request.args.get('target_opt', 0, type=str)
	detector   = request.args.get('detector', 0, type=str)
	prediction = request.args.get('prediction', 0, type=str)
	feedback   = request.args.get('feedback', 0, type=str)

	#target_opt is an optional argument
	if target_opt == 0 or target_opt == 'None':
		row = [target, prediction, feedback]
	else:
		row = [target, target_opt, prediction, feedback]

	#Store feedback
	filename = "./feedbacks/" + detector + ".txt"
	with open(filename, 'a', newline='\n', encoding='utf-8') as f:
		csv_writer = csv.writer(f)
		csv_writer.writerow(row)
		f.close()

	return jsonify({'Status': 'Success!'})


"""

Returns the explanation to a prediction
Receives:
	- predictor_name
	- text
Returns
	- text with HTML markups with different colors according to words' importance

"""
@app.route('/explain_prediction')
def explain_prediction():

	#Retrieve arguments sent by the client
	predictor_name = request.args.get('predictor_name', 0, type=str)
	text           = request.args.get('text', 0, type=str)

	print("Explaining prediction for text: ", text)
	result = {'explanation': AFC.explain_prediction(predictor_name, text)}
	return jsonify(result)




"""

Returns a text that can be used as example by the user

"""
@app.route('/get_example')
def get_example():
	example_name = request.args.get('example', 0, type=str)
	with open('Examples/' + example_name, 'r') as f:
		text = f.read()
	return jsonify({'example': text})



"""

Returns "About us" page

"""
@app.route('/about.html')
def show_about():
	return render_template('about.html')

"""

Return explanations for the various models

"""
@app.route('/bias.html')
def show_bias():
	return render_template('bias.html')

@app.route('/ideology.html')
def show_ideology():
	return render_template('ideology.html')

"""

Runs the application server side

"""
if __name__ == "__main__":
    app.run(host='0.0.0.0')
