/*

HANDLES INPUT FROM THE USER IN THE INITAL FORM
Input can be:
	- A test submitted in the text area
	- A request for an example

*/


//Submits the form with the input text given by the user
$("#submit-text").click(function(){

	//Shows loading animation
	$("#submit-text").hide();
	$(".loader").show();

	//Gets:
	//	the test given in input by the user
	var text = $("#user-text-input").val();
	input_text = text; //Keeps the text in a global variable
			
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

			$("#text-analysis-container").append(show_text_prediction(data.text_predictions[i]));

		}
				
	});

});

//Shows predictions on the text
function show_text_prediction(prediction_info){

	//Prepare the text to show positive/negative prediction
	var prediction_text = prediction_info['prediction'] < 0.5 ? prediction_info['negative_prediction'] : prediction_info['positive_prediction']
	var prediction_value = prediction_info['prediction'] < 0.5 ? 1 - prediction_info['prediction'] : prediction_info['prediction'];
	var info_text = "We believe that this text is " + prediction_text + " (confidence: " + Math.trunc(prediction_value*100) + "%).";

	//Put everything in a container
	var prediction_container = $(document.createElement('div')).addClass('text-prediction-container');
	var prediction_html = $(document.createElement('p')).text(info_text);
	$(prediction_html).html($(prediction_html).html().replace(prediction_text, '<a href="' + prediction_info['detector'] + '.html">' + prediction_text + '</a>'))
	$(prediction_container).append(prediction_html);

	//Add questionnaire and show why button
	var detector      = prediction_info['detector'];
	var target        = $("#main-text").text();
	var prediction    = prediction_info['prediction'];
	add_questionnaire(container=prediction_html, detector=detector, target, prediction=prediction, target_opt="None");
	add_show_why(prediction_html, detector, target);

	return prediction_container;

};


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
