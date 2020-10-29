import ktrain
import ast
import os

#Change "1" with "0,1" or "0" depending on which GPU you want to use
#os.environ["CUDA_VISIBLE_DEVICES"]="1"

BASE_DIR_WEIGHTS = '../local_server/'

worthy_predictor    = ktrain.load_predictor(BASE_DIR_WEIGHTS + 'weights/worthy_predictor')
agreement_predictor = ktrain.load_predictor(BASE_DIR_WEIGHTS + 'weights/agreement_predictor')

#In order to load the predictors we need to make a fake predictions
print("Preparing worthy predictor...")
worthy_predictor.predict('Economy is booming')
print("Preparing agreement predictor...")
agreement_predictor.predict('Economy is booming [SEP] The US GDP is crashing down')

#We need to load all the models that make predictions over the entire text (list of predictors is saved on a .txt file)
with open('./weights/predictors_list.txt', 'r') as f: 
  predictors_list = ast.literal_eval(f.read())
text_predictors = [{'name': predictor['name'], \
	'predictor': ktrain.load_predictor(BASE_DIR_WEIGHTS + 'weights/' + predictor['name'] + '_predictor'), \
	'positive_prediction': predictor['positive_prediction'], \
	'negative_prediction': predictor['negative_prediction']} \
	for predictor in predictors_list]

#Initialize the predictors
for text_predictor in text_predictors:
  text_predictor['predictor'].predict("Just a random sentence to load the predictor")
print("Text predictors ready")

#Checks the worthiness of a sentence
def check_worthiness(sentence):
  worthiness_prob = worthy_predictor.predict_proba(sentence)[1] #returns two probabilities: 1st probability not worthy, 2nd probability worthy (1-Pnot_worthy)
  return worthiness_prob

#Checks whether an article supports a given sentence
def check_support(sentence, article):
  entry = sentence + ' [SEP] ' + article
  return agreement_predictor.predict_proba(entry)[1] #returns two probabilities: 1st probability refutes, 2nd probability agrees (1-Prefute)

#Returns different predictions over an entire text
#TO DO: Make it work in parallel
def analyze_text(text):
  text_predictions = [{'detector': predictor['name'], \
  	'prediction': "{:.2f}".format(predictor['predictor'].predict_proba(text)[1]), \
  	'positive_prediction': predictor['positive_prediction'], \
  	'negative_prediction': predictor['negative_prediction']} \
  	for predictor in text_predictors]
  return text_predictions


#Explains why a certain prediction was made in a certain way
def explain_prediction(predictor_name, text):

  #The predictor can be either worthy_predictor, agreement_predictor or one of the text_predictors
  predictor_to_explain = None
  if predictor_name == 'worthy':
    predictor_to_explain = worthy_predictor
  if predictor_name == 'agreement':
    predictor_to_explain = agreement_predictor
  for predictor in text_predictors:
    if predictor_name == predictor['name']:
      predictor_to_explain = predictor['predictor']
      break

  #Error with predictor name
  if predictor_to_explain == None:
    print("Error: no predictor named ", predictor_name)
    return

  #The explanation is given in HTML form directly, so we need to clean it first
  explanation = predictor_to_explain.explain(text)
  explanation = '<p><span ' + '<span'.join(explanation.data.split('<span')[1:])
  explanation = explanation.replace('\n', '')

  return explanation
