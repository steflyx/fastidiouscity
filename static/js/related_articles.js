/*

HANDLES RELATED ARTICLES
Contains:
	- Functions to retrieve related articles and their info
	- Function to add article info to HTML

*/


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

//Appends article infos to the HTML page
function add_article_info(article_info) {

	var article_info_container = $(document.createElement('div')).addClass('article-info-container');

	if (article_info['download_ok'] == 1){

		//Show article title (with link to the website) plus our prediction on the article support
		var title = $(document.createElement('p')).append($(document.createElement('a')).text(article_info['title']).attr('href', article_info['url']));
		var summary = $(document.createElement('p')).text(article_info['summary']);
		var conclusion = (article_info['support'] < 50) ? 'refutes' : 'supports';
		var support = (article_info['support'] < 50) ? 100 - article_info['support'] : article_info['support'];
		var belief = $(document.createElement('p')).html("We believe that the article  <b>" + conclusion + "</b> the claim (confidence " + support + "%)");
		$(article_info_container).append(title).append(summary).append(belief);

		//Add questionnaire
		var question = "Do you agree?";
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

