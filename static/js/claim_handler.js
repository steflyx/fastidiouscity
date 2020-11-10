/*

HANDLES CLAIM INFO REQUESTS
Contains:
	- Functions to update HTML of text + sending request for articles (handled in related_articles.js)
	- Function to show claim info

*/
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
	$("#no-selected-sentence-info").hide();
	$("#related-articles-container").empty();
	$("#related-articles-not-downloaded-container").hide();

	//If the sentence is not check-worthy we don't need to do anything else
	if (worthiness_prob < 50){
		return;
	}

	//If the sentence is check-worthy, we send a request to the server to obtain its self-contained version
	send_coreference_request();	

});

//Shows all the claim-related info inside the 'selected-sentence-container'
function show_claim_info(container, sentence, worthiness_prob){

	//Info for the questionnaire
	var target = sentence;
	var prediction = '';
	var div_sentence = $(document.createElement('div')).addClass('selected-sentence-container-text');

	container.empty();
	div_sentence.append($(document.createElement('p')).html('You have selected the following sentence:'));
	div_sentence.append($(document.createElement('p')).html('"<b>' + sentence + '</b>"'));
	container.append(div_sentence);
	container.append("<br>");
	if (worthiness_prob < 50){
		belief = $(document.createElement('p')).text("We don't believe this sentence is a claim (confidence: " + worthiness_prob + "%). ");
		prediction = "No";
	}
	else{
		belief = $(document.createElement('p')).text("We believe this sentence is a claim (confidence: " + worthiness_prob + "%). ");
		prediction = "Yes";
	}
	
	container.append(belief);
	add_show_why(belief, 'worthy', sentence);
	add_questionnaire(container=belief, detector="Claim", target=sentence, prediction=prediction, target_opt="None");

};


//Sends a request to the server to obtain a self-contained version of the sentence
function send_coreference_request(){

	//Show the loader
	$(".loader-text").text("Preparing the sentence...");
	$("#related-articles-loader").show();

	$.getJSON($SCRIPT_ROOT + '/perform_coreference_resolution', {
		sentence: $(selected_sentence).text(),
		text: input_text
	}, function(data){

		//Update the sentence to analyze
		$(".selected-sentence-container").after($(document.createElement('p')).text("We used the following sentence to make the search more effective:"));
		$(".selected-sentence-container").after($(document.createElement('p')).html('"<b>' + data.coreference_sentence + '</b>"'));
		$(".selected-sentence-container").after($(document.createElement('br')));
		sentence_to_analyze = data.coreference_sentence;

		//Hide the loader
		$("#related-articles-loader").hide();

	});


};