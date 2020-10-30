#from happytransformer import HappyROBERTA
import numpy as np
import spacy
import os

os.environ["CUDA_VISIBLE_DEVICES"] = "1"
happy_roberta = HappyROBERTA("roberta-large")
nlp = spacy.load("en")
#On some architectures
#nlp = spacy.load("en_core_web_sm")

#To load the model
print("AI will cause world ", happy_roberta.predict_mask("AI will cause world [MASK]", num_results=5)[0]['word'])

#Returns:
# - list of tokens forming the text
# - list of proper nouns found
# - list of token positions where pronouns tokens are found
def recognize_nouns(text):
  doc = nlp(text)
  proper_nouns = []
  pronouns = []
  tokens = []
  for i, token in enumerate(doc):
    if token.pos_ == 'PROPN':
      proper_nouns.append(token.text)
    if token.pos_ == 'PRON':
      pronouns.append(i)
    tokens.append(token.text)
  return tokens, proper_nouns, np.array(pronouns)


"""
Receives:
 - text_: the entire text
 - sentence: the sentence you want to focus on (just make it equal to text_ if you don't want to focus on a particular sentence)
 - threshold: minimum confidence required in a prediction (if the model is not confident in any prediction, returns the text as it is)

Returns:
 - the sentence with RoBERTa predictions in place of any pronoun (only predictions with confidence over threshold)

"""

def link_entities(text_, sentence, threshold=0.0001):

  #We will get words, proper nouns and pronouns for text + sentence
  words_0, proper_nouns_0, _ = recognize_nouns(text_.split(sentence)[0])
  words_1, proper_nouns_1, pronouns = recognize_nouns(sentence)
  words_2, proper_nouns_2, _ = recognize_nouns(text_.split(sentence)[1])

  #We want all the words and all the proper_nouns in the text, but we want pronouns
  #only from the sentence we're focusing on
  words = words_0 + words_1 + words_2
  proper_nouns = proper_nouns_0 + proper_nouns_1 + proper_nouns_2
  pronouns += len(words_0)
  
  #If no pronoun is found, just return the text as it is
  if len(pronouns) == 0 or len(proper_nouns) == 0:
    return sentence

  #The mask token prediction can be made with just one token at the time
  for pronoun in pronouns:

    #Insert [MASK] token in place of the pronoun
    if pronoun == (len(words)-1):
      text = " ".join(words[:pronoun] + ['[MASK]'])
    else:
      text = " ".join(words[:pronoun] + ['[MASK]'] + words[pronoun+1:])

    #Predict the [MASK] token
    results = happy_roberta.predict_mask(text, options=proper_nouns, num_results=len(proper_nouns))
    if results[0]['softmax'] >= threshold:
      words_1[pronoun - len(words_0)] = results[0]['word']

  return " ".join(words_1) 
