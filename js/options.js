/*
 * Handles options.
 */

/**
 * Takes the current option values and loads them into the view.
 */
function loadOptions(){
	var options = chevre.options;
	//console.log(options);
	//numbers
	$('#option-max-cards').val(options.maxCardsPerSession);
	$('#option-max-cards').change(function(){
		var val = parseInt($(this).val());
		if(val && 5 <= val && val <= 100){
			//ok!
			$('#option-max-cards').val(val);
		}
		else if(!val || val === NaN || val === undefined || val === null){
			//load some default value in there
			$('#option-max-cards').val(25);
		}
		else if(val < 5){
			//too low
			$('#option-max-cards').val(5);
		}
		else if(val > 100){
			//too high
			$('#option-max-cards').val(100);
		}
	});
	
	//checkboxes
	$('#option-swipe-skip').attr('checked', options.swipeToSkip);
	$('#option-ask-feedback').attr('checked', options.askFeedback);
	
	//selects
	//we only store the # for fontSize; work backwards to get correct label
    var size = options.fontSize;
    var fontName = "MEDIUM"; //default
    Object.keys(FontSize,function(key, value){
      if(value == size) fontName = key;      
    });	
	$('#option-font-size').val(fontName);
	
	
	//and bind click handlers
	$('#option-delete-all').oneClick(function(){
		bootbox.confirm("Are you sure you want to delete all of your data forever, including your flashcards and settings? (If you've set up sync, your data is safe in the cloud but will be removed from this device.)", function(confirmed){
			if(confirmed){
				$.store.clear();
				reloadPage();				
			}
		});
	});
	$('#option-save').oneClick(function(){
		saveOptions();
	});
}

function saveOptions(){
	var options = chevre.options;
    options.maxCardsPerSession = $('#option-max-cards').val().toNumber();
    options.fontSize = FontSize[$('#option-font-size').val()]; //looking up in the enum
    options.swipeToSkip = $('#option-swipe-skip').is(':checked');
    options.askFeedback = $('#option-ask-feedback').is(':checked');
    
    console.log(options);
    $.store.set(SL_KEYS.OPTIONS, options);
    
    toast("Options saved!", {type: ToastTypes.SUCCESS});
}
