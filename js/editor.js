/**
 * Manages card creation and editing.
 */
var Editor = new Singleton({

__init__: function(self){
	
	//jQuery stuff
   self.questionField = $('#create-input-question');
   self.answerField = $('#create-input-answer');
   self.imageField = $('#create-image-input-file');
   self.preview = $('#create-image-preview');
   self.previewHolder = $('#create-image-preview-holder');
   self.imageIfPresent = $('#create-image-if-present'); //show in image panel if there IS an image
   self.imageIfAbsent = $('#create-image-if-none'); //show in image panel if there is NOT an image	
   self.mcContainer = $('#create-mc-template-output');
   
   //actual instance vars
   self.card = null; //the card we're editing
},

/**
 * If you want to edit a card, call this function BEFORE loading the editor page.
 * Pass null if you're creating a card.
 */
prepareCard: function(self, card){
	self.card = card;
},

loadPage: function(self){
	if(self.card){ self.loadForEditing(self.card); }
	else{ self.loadForCreation() };
	//self.card = null; //to prevent the same card from being edited twice
},

/********** PRIVATE ***********/

/**
 * Fills the card creation/editing dialog with a current card and prepares it for editing.
 * You will need to open any page yourself.
 * This is called behind the scenes, too, when creating a new card.
 * @param {Card} card	if editing, pass the card; if creating, omit this
 */
loadForEditing: function(self, card){
	self.card = card;
	var isEditing = !!card;
	//true if card is available, false otherwise
	self.project = chevre.p;
	
	//FR section
	self.questionField.val(isEditing ? card.getQuestionText() : "");
	self.answerField.val(isEditing ? card.getAnswerText() : "");
	
	//by default hide preview stuff; assume no image
	self.adjustImageArea(false);
	self.imageField.val(null);
	
	//cosmetic changes
	//tab bar
	if(isEditing){
		if(card.isMultipleChoice()){
			$('#create-nav-tab-mc>a').tab('show'); //open that tab
		}
		else{
			$('#create-nav-tab-fr>a').tab('show');
		}
	}
	$('#create-tabs-type').toggle(!isEditing); //hide if editing, show if creating
	//buttons
	$('#create-button-add').toggle(!isEditing); //show if creating
	$('#create-button-save').toggle(isEditing);
	//$('#create-button-delete').toggle(isEditing);
	//cancel can stay no matter what
	//IMAGE - if the card has one, show it
	if(isEditing && card.hasImage()){
		self.preview.attr('src',card.getImageURL());
		self.adjustImageArea(true);
		$('#create-collapsible-image').collapse('show');			
	}
	else{
		self.adjustImageArea(false);
		$('#create-collapsible-image').collapse('hide');					
	}
	
	//when image is added/changed, immediately uploaded it
	self.imageField.oneBind('change.uploadImage', function() {
		self.onImageChange();
	});
	
	//remove image?
	$('#create-image-button-remove').oneClick(function() {
		self.adjustImageArea(false);
	});
	
	//preload choices for MC
	self.clearMCAnswers();
	if(isEditing && card.isMultipleChoice()){
		var answerChoices = self.card.getMCAnswers(); //String[]
		var rightIndex = self.card.getMCRightAnswerIndex(); //int
		//we need to make an object of { text: String, chosen: boolean} for each
		answerChoices.forEach(function(choice, index){
			var chosen = index == rightIndex;
			self.addMCAnswer(choice, chosen);
		});
	}
	else{
		self.resetMCAnswers();
	}
	
	//handle "add choice" click
	$('#create-mc-button-add').oneClick(function() {
		self.addMCAnswer();
	});
	
	//the ACTUAL card creation button
	//add or save have same behavior; they're just used alternately for cosmetic purposes
	$('#create-button-add').oneClick(function(e) {
		self.createCard(e);
	});
	$('#create-button-save').oneClick(function(e) {
		self.createCard(e);
	});	
	$('.cancel-create-card-button').oneClick(function() {
		self.cancel();
	});
	$('#create-button-delete').oneClick(function() {
		self.deleteCard();
	});
},

/**
 * Prepares to create a flashcard.
 */
loadForCreation: function(self){
	self.loadForEditing(undefined, undefined);
},

adjustImageArea: function(self, imagePresent){
     self.imageIfPresent.toggle(imagePresent);
     self.imageIfAbsent.toggle(!imagePresent);
     if(imagePresent){
     	self.previewHolder.slideDown();
     }
     else{
     	self.previewHolder.slideUp();
     	self.preview.removeAttr('src');
     }    	
},

/**
 * Called when the image area is changed: an image is added or deleted.
 * @param {Object} self
 */
onImageChange: function(self){      
     //clear the old stuff
     self.adjustImageArea(false);
     
     //if val == "" then it was cleared, else it was set
     if(self.imageField.val()){
           //get uploading
           self.imageField.uploadImage(function success(imageURL) {
                self.preview.attr('src', imageURL);
				self.adjustImageArea(true);
                
                self.imageField.val(null);

                toast("Your image was successfully uploaded!")
           }, function failure() {
                self.imageField.val(null);
                toast("Uploading image failed. Either your internet is disconnected, or something else is wrong. Try again later.", {
                     duration : TOAST_DURATION_LONG,
                     error : true
                });
           }); 
      }
},

addMCAnswer: function(self, answerText, chosen){
	answerText = orDefault(answerText, "");
	if(chosen === undefined) chosen = false;
	 var addedItem = template('template-create-mc-item', self.mcContainer, {
	 	text: answerText,
	 	chosen: chosen
	 }, true); //append
	 
	 addedItem.find('.btn-remove').oneClick(function(){
	 	//there MUST be at least 2 answer choices!
	 	var numChoices = self.mcContainer.find('.mc-item').length;
	 	if(numChoices <= 2) return;
	 	
	 	$(this).closest('.mc-item').remove();
	 	
	 	self.updateMCAnswers();
	 });
     self.updateMCAnswers();
     addedItem.find('.mc-item-input-text').focus();
},

/**
 * Call me when you add or remove a multiple choice answer choice.
 * @param {Object} self
 */
updateMCAnswers: function(self){
     var numChoices = self.mcContainer.find('.mc-item').length;
     //if there are 2 choices, hide the delete buttons, otherwise show them
     $('.mc-item').find('.btn-remove').parent().toggle(numChoices > 2); //shown if >2, hidden otherwise	
},

/**
 * Empties the multiple choice answer section. You MUST load something new in there, whether it's existing cards or calling resetMCAnswers()
 * @param {Object} self
 */
clearMCAnswers: function(self){
	self.mcContainer.html('');
},

/**
 * Reloads the MC answer section with four blank choices.
 * @param {Object} self
 */
resetMCAnswers: function(self){
	self.clearMCAnswers();
	 //add a few inputs
	  var DEFAULT_NUM_CHOICES = 4;
	  for(var i=0; i<DEFAULT_NUM_CHOICES; i++){
	       self.addMCAnswer();
	  }   
},

/**
 * Creates/saves the card and resets everything for the next run.
 * @param {Event} e	the event that came from jQuery's click handler.
 */
createCard: function(self, e){
     //what type of question is it? based on that, choose question and answer vars accordingly
     var question = self.questionField.val();
     var answer;
     var rightAnswer; //string of text of right answer
     
     var errorMsg = null;
     
     if($('#create-nav-tab-fr').is('.active')){
          //free-response is open
          answer = self.answerField.val();
     }
     else{
          //multiple-choice is open
          
          //check answer choices
          var rawEntries = self.mcContainer.find('.mc-item-input-text').map(function(){ return $(this).val(); }); //jQuery; has value of every input, even empty ones
          rawEntries = rawEntries.toArray().compact(true).unique(); //convert to normal js array and get rid of empty inputs which show up as ""
          //there MUST be >=2 OK entries here
          if(rawEntries.length >= 2){
               answer = { choices: rawEntries };
          
               //check what the right answer index is
               var index = null;
               $('.mc-item-input-correct').each(function(i){
               	if($(this).is(':checked')) index = i;
               });
               if(index !== null){
                    //we got an index!
                    answer.right = index;
               }                   
               else{
               		//didn't check anything!
               		errorMsg = "You need to select one answer choice (press one of the circular buttons to the left)."
                    answer = false;
               }
          }
          else{
          		errorMsg = "You need at least 2 answer choices.";
               answer = false;
          }
     }
    
    //must provide question & answer
    if(question && answer){
         //clean them out NOW for the only time
         question = cleanInput(question);
         if(answer.hasOwnProperty('choices')) answer.choices = cleanInput(answer.choices); //MC
         else answer = cleanInput(answer); //free resp
         
         console.log(self.card);
         if(self.card){
         	self.card.setQuestion(question);
         	self.card.setAnswer(answer);
         }
         else{
         	self.card = new Card(question, answer);
         	self.project.addCard(self.card);
         }
         
         self.project.save();
        
        //if they specified an image, have it be added and then re-save (async)
        //do it now anyway (if they added an image, we'll just re-save later)
        if(self.preview.attr('src')){
             //preview's already done, just grab the url they got there
             var imageURL = self.preview.attr('src');
             self.card.setImageURL(imageURL);    
             self.project.save();          
        }
        else{
        	//nothing there
        	if(self.card && self.card.hasImage()){
        		//well, it USED to have an image, but now it was cleared so it looks like it's been removed!
        		self.card.setImageURL(null);
        		self.project.save();
        	}
        }
        
        
        //clear the fields
        self.questionField.val('');
        self.answerField.val('');
        self.imageField.val('');
        self.adjustImageArea(false);
        
        if(self.card.isMultipleChoice())
           self.resetMCAnswers();
        
        //give page focus to question field
        self.questionField.focus();            
    }
    else{
        //they omitted one or both
        if(!question) self.questionField.focus();
        else if(!answer) self.answerField.focus();
        
        errorMsg = "You need to specify both a question and an answer."
        
        e.preventDefault();
    }	
    
    if(errorMsg){
    	toast(errorMsg, {type: ToastTypes.WARNING});
    }
},

cancel: function(self){
    //empty fields and get back
    $('#create-card-question').val('');
    $('#create-card-answer').val('');  
    $("#create-card-image").val(''); 
},

deleteCard: function(self){
     if(self.card){
      self.project.cards = self.project.cards.subtract(card);
      self.project.save();     
     }
}

});
