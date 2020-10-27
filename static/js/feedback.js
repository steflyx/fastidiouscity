/*

HANDLES FEEDBACKS FROM USERS
Contains:
	- Function to add a questionnaire
	- Function to submit a feedback

*/


//Adds a questionnaire to element "container"
function add_questionnaire(container, detector, target, prediction, target_opt="None"){

	var question_container = $(document.createElement('div')).addClass('question-container');
	
	//Question that we're asking the user (in the form of "Do you agree this sentence is a ...?")
	$(question_container).append($(document.createElement('p')).text("Do you agree?").addClass('question-text'));

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