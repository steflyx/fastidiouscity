var is_request_pending = false;
var articles_to_retrieve = 10;
var articles_retrieved = 0;
var selected_sentence = -1;

/*

This is the handler for showing information about a particular sentence.
	- Checks whether the sentence is among the ones deemed worthy
	- Opens a dialog box
	- Sends a request to the server to retrieve related articles and to analyze them

*/
$(document).on('click', '.sentence', function(){

	//We check that we're not in the process of sending requests to the server
	if (is_request_pending){
		return;
	}

	//De-select any previously selected sentence (turn its background color back to normal)
	if (selected_sentence != -1){
		selected_sentence.css('background-color', compute_background_only_green(selected_sentence.attr('worthiness-prob')*100));
	}
			
	//Retrieve already loaded info (text and worthiness value)
	selected_sentence = $(this);
	selected_sentence.css('background-color', 'rgb(255,255,0)');
	worthiness_prob = $(this).attr('worthiness-prob')*100;

	//Show claim info 
	show_claim_info($("#selected-sentence-container"), selected_sentence.text(), worthiness_prob);

	//Prepare the space to fit the related articles
	$("#info-container").show();
	$("#related-articles-container").empty();
	$("#related-articles-not-downloaded-container").hide();

	//If the sentence is not check-worthy we don't need to do anything else
	if (worthiness_prob < 50){
		return;
	}

	//If the sentence is check-worthy, we show the loader screen and send a request to the server to retrieve related articles
	$("#related-articles-container").append($(document.createElement('p')).html("<b>Evidence found online that support/refute the claim:</b>").css('margin-bottom', '1em'));
	$(".loader-text").text("Looking for related articles online...");
	$("#related-articles-loader").show();
	is_request_pending = true;
	send_request_articles(selected_sentence.text());

});

//Shows all the claim-related info inside the 'selected-sentence-container'
function show_claim_info(container, sentence, worthiness_prob){

	//Info for the questionnaire
	var question = "Do you agree that this sentence is a claim?";
	var target = sentence;
	var prediction = '';

	container.empty();
	container.append($(document.createElement('p')).html('The selected sentence is: "<b>' + sentence + '</b>"'));
	container.append("<br>");
	if (worthiness_prob < 50){
		container.append($(document.createElement('p')).text("We don't believe this sentence is a claim (with confidence: " + worthiness_prob + "%)"));
		question = question.replace("is a claim", "is not a claim");
		prediction = "No";
	}
	else{
		container.append($(document.createElement('p')).text("We believe this sentence is a claim (with confidence: " + worthiness_prob + "%)"));
		prediction = "Yes";
	}
	
	add_questionnaire(container=container, question_text=question, detector="Claim", target=sentence, prediction=prediction, target_opt="None");

};

//Sends an AJAX GET request to get the links to articles related to the sentence 
function send_request_articles(sentence_text) {
		
	$.getJSON($SCRIPT_ROOT + '/get_articles', {
		text: sentence_text
	}, function(data){

		//For each retrieved link, asks the server to send its info
		$(".loader-text").text("Found " + data.related_articles.length + " articles! Analyzing them...");
		articles_to_retrieve = data.related_articles.length;
		articles_retrieved = 0;
		for (var i=0; i<data.related_articles.length; i++){

		//Send request to the server to retrieve article info and to compute its support towards the claim
		article_info = send_request_article_info(data.related_articles[i], data.sentence);

		}

	});

};

//Asks the server to retrieve info about the article and to compute its support towards the claim
function send_request_article_info(link, sentence_text){

	//Make the request to the server
	$.getJSON($SCRIPT_ROOT + '/get_article_info', {
		sentence: sentence_text,
		article_url: link
	}, function(data){

		//Append the result to the dialog box
		add_article_info(data.article_info);

		//Update the number of retrieved articles
		articles_retrieved += 1;

		//If all articles have been retrieved, we can hide the loading screen and allow new requests
		if (articles_retrieved == articles_to_retrieve){
			is_request_pending = false;
			$("#related-articles-loader").hide();
		}

	});

};

//Computes a background color between red and green based on a 1 to 100 value passed to it
function compute_background(value){

	red    = 0;
	green  = 0;

	if (value < 50){
		red   = 255;
		green = Math.floor(2.55 * value * 2);
	}
	else{
		green = 255;
		red   = Math.floor(2.55 * (100 - value) * 2);
	}

	css_value = "rgb(" + red + ", " + green + ", 0)";
	return css_value;

};

//Computes a color between white and green based on a 1 to 100 value passed to it
function compute_background_only_green(value){

	not_green = 255 - value*2.55;
	css_value = "rgb(" + not_green + ",255," + not_green + ")";
	return css_value;

}

//Appends article infos to the HTML page
function add_article_info(article_info) {

	var article_info_container = $(document.createElement('div')).addClass('article-info-container');

	if (article_info['download_ok'] == 1){

		//Show article title (with link to the website) plus our prediction on the article support
		var title = $(document.createElement('p')).text("Title: ").append($(document.createElement('a')).text(article_info['title']).attr('href', article_info['url']));
		var conclusion = (article_info['support'] < 50) ? 'refutes' : 'supports';
		var support = (article_info['support'] < 50) ? 100 - article_info['support'] : article_info['support'];
		var belief = $(document.createElement('p')).html("We believe that the article  <b>" + conclusion + "</b> the claim (with confidence " + support + "%)");
		$(article_info_container).append(title).append(belief);

		//Add questionnaire
		var question = "Do you agree that this article " + conclusion + " the selected sentence?";
		add_questionnaire(article_info_container, question, "Agreement", selected_sentence, conclusion, article_info['text']);

		//Append everything to the main container		
		$("#related-articles-container").append(article_info_container);
		$("#related-articles-container").append("<br>");

	}
	else{
		//If we couldn't download the article, we only pass url
		var title = $(document.createElement('a')).text("This article on " + article_info['url'].replace('https://', '').split('/')[0]).attr('href', article_info['url']);
		$(article_info_container).append(title);

		$("#related-articles-not-downloaded-container").show();				
		$("#related-articles-not-downloaded-container").append(article_info_container);	
		$("#related-articles-not-downloaded-container").append("<br>");	
	}

};

//Adds a questionnaire to element "container"
function add_questionnaire(container, question_text, detector, target, prediction, target_opt="None"){

	var question_container = $(document.createElement('div')).addClass('question-container');
	
	//Question that we're asking the user (in the form of "Do you agree this sentence is a ...?")
	$(question_container).append($(document.createElement('p')).text(question_text).addClass('question-text'));

	//Answer that the user can give (yes/no)
	var answer = $(document.createElement('p')).addClass('answer-text');
	$(answer).append($(document.createElement('span')).text('Yes').addClass('answer').addClass('answer-yes'));
	$(answer).append($(document.createElement('span')).text('/'))
	$(answer).append($(document.createElement('span')).text('No').addClass('answer').addClass('answer-no'));
	$(question_container).append(answer);

	//Hidden fields (detector, target, prediction, target_opt)
	$(question_container).append($(document.createElement('p')).addClass('question-hidden-fields').addClass('detector').text(detector))
	$(question_container).append($(document.createElement('p')).addClass('question-hidden-fields').addClass('target').text(target))
	$(question_container).append($(document.createElement('p')).addClass('question-hidden-fields').addClass('prediction').text(prediction))
	$(question_container).append($(document.createElement('p')).addClass('question-hidden-fields').addClass('target_opt').text(target_opt))

	//Add the questionnaire to the original container
	$(container).append(question_container);

}

//Sends a feedback from the user to the server
$(document).on('click', '.answer', function(){

	//Gets:
	//	the target of the prediction (a sentence or an artice)
	//  an optional second target, if any
	//  what detector we were using
	//  what was our prediction
	//  what was the user's feedback
	var target      = $(this).parent().parent().find(".target").text();
	var target_opt  = $(this).parent().parent().find(".target_opt").text();
	var detector    = $(this).parent().parent().find(".detector").text();
	var prediction  = $(this).parent().parent().find(".prediction").text();
	var feedback    = $(this).attr('class').split(" ")[1].split("-")[1];
	var answer_item = $(this).parent()
			
	$.getJSON($SCRIPT_ROOT + '/send_feedback', {
		target: target,
		target_opt: target_opt,
		detector: detector,
		prediction: prediction,
		feedback: feedback
	}, function(data){

		//Empty the questionnaire and thank the user
		answer_item.empty();
		answer_item.text("Thanks for your response!");
				
	});

});


//Submits the form with the input text given by the user
$("#submit-text").click(function(){

	//Shows loading animation
	$("#submit-text").hide();
	$(".loader").show();

	//Gets:
	//	the test given in input by the user
	var text = $("#user-text-input").val();
			
	$.getJSON($SCRIPT_ROOT + '/analyze_text', {
		text: text
	}, function(data){

		//Hides the input textarea and shows the results
		$("#form-container").hide();
		$("#main-container").show();

		//For each sentence, we have:
		//	text
		//	background (a different shade of green depending on worthiness-prob)
		//	worthiness-prob (probability of it being a claim)
		for (var i = 0; i < data.sentences.length; i++) {
			var span_sentence = $(document.createElement('span')).text(data.sentences[i]['text']);
			$(span_sentence).addClass('sentence');
			$(span_sentence).css('background-color', compute_background_only_green(data.sentences[i]['worthiness_prob']*100));
			$(span_sentence).attr('worthiness-prob', data.sentences[i]['worthiness_prob']);
			$("#main-text").append(span_sentence);
			$("#main-text").append($(document.createElement('span')).text(" "))
		}

		//Show info about the predictions on the complete text
		for (var i=0; i<data.text_predictions.length; i++){
			var info_text = "We believe that this speech is " + data.text_predictions[i]['positive_prediction'] + 
			" (with confidence: " + Math.trunc(data.text_predictions[i]['prediction']*100) + "%)";

			var prediction = document.createElement('p');
			data.text_predictions[i]['prediction'] < 0.5 ? $(prediction).text(info_text.replace('We believe', "We don't believe")) : $(prediction).text(info_text);
			$(prediction).html($(prediction).html().replace(data.text_predictions[i]['positive_prediction'], '<a href="' + data.text_predictions[i]['detector'] + '.html">' + data.text_predictions[i]['positive_prediction'] + '</a>'))
			$("#text-analysis-container").append(prediction);

			var question_text = "Do you agree that this speech is ";
			question_text += data.text_predictions[i]['prediction'] < 0.5 ? "not " : "";
			question_text += data.text_predictions[i]['positive_prediction'] + "?";

			var detector = data.text_predictions[i]['detector'];

			var target = $("#main-text").text();

			var prediction = data.text_predictions[i]['prediction'];

			add_questionnaire(container="#text-analysis-container", question_text=question_text, detector=detector, target, prediction=prediction, target_opt="None");
		
			$("#text-analysis-container").append(document.createElement("br"));
		}
				
	});

});


//Loads one of the examples
$("#example-list li").click(function(){

	var filename = $(this).attr('name');
			
	$.getJSON($SCRIPT_ROOT + '/get_example', {
		example: filename
	}, function(data){

		//Load example in the input area
		$('#user-text-input').text(data.example);

	});

});

