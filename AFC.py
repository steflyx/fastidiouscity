import ktrain
import ast

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
text_predictors = [{'name': predictor['name'], 'predictor': ktrain.load_predictor(BASE_DIR_WEIGHTS + 'weights/' + predictor['name'] + '_predictor'), 'positive_prediction': predictor['positive_prediction']} for predictor in predictors_list]

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
  text_predictions = [{'detector': predictor['name'], 'prediction': "{:.2f}".format(predictor['predictor'].predict_proba(text)[1]), 'positive_prediction': predictor['positive_prediction']} for predictor in text_predictors]
  return text_predictions
