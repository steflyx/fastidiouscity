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
