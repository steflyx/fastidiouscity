/*

Adds a button "Show why" that explains why a certain prediction was made
Takes:
 - text_to_explain
 - predictor
 - container: where to place the explanation
Returns:
 - HTML with explanation

*/
function add_show_why(container, predictor_name, text){
	
	var button = $(document.createElement('span')).text('Show why.');
	button.attr('predictor', predictor_name);
	button.attr('text_to_explain', text);
	button.addClass('show_why');
	$(container).append(button);
	$(container).append($(document.createElement('span')).text(" "));
	
};

$(document).on('click', '.show_why', function(){

	var button = $(this);
	var container = $(this).parent().parent();

	$.getJSON($SCRIPT_ROOT + '/explain_prediction', {
		'predictor_name': $(this).attr('predictor'),
		'text': $(this).attr('text_to_explain')
	}, function(data){

		button.empty();
		container.append($(document.createElement('p')).css('margin: 0.5em').html("Words <span style='background-color: rgb(0,255,0)'>highlighted in green</span> support the prediction, while words <span style='background-color: rgb(255,0,0)'>highlighted in red</span> deny it"))
		container.append($(document.createElement('p')).addClass('explanation-text').html(data.explanation));
				
	});
	
	button.removeClass('show_why');
	button.text("It will take a few moments...");

});