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
	
	var button = $(document.createElement('p')).text('Show why').css('color', 'blue');
	button.attr('predictor', predictor_name);
	button.attr('text_to_explain', text);
	button.addClass('show_why');
	$(container).append(button);
	
};

$(document).on('click', '.show_why', function(){

	var button = $(this);

	$.getJSON($SCRIPT_ROOT + '/explain_prediction', {
		'predictor_name': $(this).attr('predictor'),
		'text': $(this).attr('text_to_explain')
	}, function(data){

		button.html(data.explanation);
		button.removeClass('show_why');
				
	});

});