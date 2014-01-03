var Card = new Class({
   
   /**
    * Creates a flashcard.
    * @param {String} question     the question.
    * @param {String/{choices: String[], right: int}} answer       the answer. If it's MC, pass the object. Pass an array of strings in the choice field (one per answer), and pass the index of the right answer in the array as right.
    * @param {String} imageURL     [optional, default null] the link to the image (must be exact... like http://imgur.com/a.png) 
    */
__init__: function(self, question, answer, imageURL){
     self.setQuestion(question);
     self.setAnswer(answer);
     self.setImageURL(imageURL);

    self.repsLeft = 0;
    self.rank = null;
    self.setRank(Rank.A);
},

setQuestion: function(self, question){
     self.question = prettify(question);
},
setAnswer: function(self, answer){
     self.answer = prettify(answer);
},
setImageURL: function(self, imageURL){
     self.imageURL = imageURL;
},

hasImage: function(self){
     return self.imageURL != null;
},

isMultipleChoice: function(self){
     //return self.answer.indexOf(CARD_MC_SEPARATOR) != -1; 
     return self.answer.hasOwnProperty('choices');   
},

isFreeResponse: function(self){
	return !self.isMultipleChoice();
},

/**
 * Returns a String[] where each String is an MC choice. 
 * Ensure that this isMultipleChoice() before calling this.
 */
getMCAnswers: function(self){
     return self.answer.choices;
},

/**
 * Returns the index of the right answer in the answer.choices array. 
 */
getMCRightAnswerIndex: function(self){
     return self.answer.right;
},

/**
 * Returns true if the given answer index was right, false otherwise.
 */
checkMCAnswer: function(self, answeredIndex){
     return answeredIndex == self.answer.right;
},

getQuestionText: function(self){
     return self.question;
},

/**
 * Report the answer. This is used in formats when you CAN'T show all choices; for instance, when exporting or showing in the list view. 
 */
getAnswerText: function(self){
     if(self.isMultipleChoice()){
          //only give correct answer
          return self.answer.choices[self.answer.right];
     }     
     else{
          return self.answer;
     }
},

getImageURL: function(self){
     return self.imageURL;
},

setRank: function(self, rank){
    self.rank = rank;
    self.repsLeft = rank.baseReps;
},

/**
 * Returns the card's rank in a more friendly manner... stars instead of ranks.
 * Rank A -> 1 star, Rank E -> 5 stars
 * @return {int}	the number of stars 
 */
getStars: function(self){
	switch(self.rank){
		case Rank.A: return 1;
		case Rank.B: return 2;
		case Rank.C: return 3;
		case Rank.D: return 4;
		case Rank.E: return 5;
	}
},

/**
 * This card was studied by the user.
 * @param {StudyResult} result  from the StudyResults enum.
 */
studied: function(self, result){
    //adjust rank
    switch(result){
        case StudyResult.YES:
            self.setRank(nextRank(self.rank));
            break;
        case StudyResult.SORT_OF:
            break;
        case StudyResult.NO:
            self.setRank(Rank.A);
            break;
    }
},

/**
 * Fills a <li> containing info about a card (this is found in the card manager and other places.) 
 * @param {$li} li  A jQuery object containing the <li>. Use getClonedTemplate() to find it (it's from #template-card).
 */
fillLI: function(self, li){
     li.find('.card-manager-question').html(self.getQuestionText());
     li.find('.card-manager-answer').html(self.getAnswerText());
     
     if(self.imageURL){
          //add a thumbnail image to the li
          //don't put it in the template cause then everything gets that weird padding
          var image = getClonedTemplate('template-flashcard-image');
          image.attr('src', self.imageURL);
          
          li.find('a').prepend(image);
          //li.find('.card-manager-image').show().attr('src',self.imageURL);
     }
     
     //li of count
     //darken the color of the rank
     var rgb = hexToRGB(self.rank.color);
     var REDUCE_FACTOR = 0.85; // new colors will be this times as much as the original
     rgb = rgb.map(function(x){ return (x * REDUCE_FACTOR).round(); });     
     var hex = '#' + rgbToHex(rgb);
     
     li.find('.ui-li-count').html(self.rank.name).attr('title', "Rank " + self.rank.name).css('color',hex); //TODO maybe remove the color part... looks bad for C (yellow is illegible)x
},

/**
 * Returns a <div> containing colored stars corresponding to the stars this card has.
 * @return {jQuery}	a div formatted like this:
 * 	<div class="text-danger">
 * 	  <span class="glyphicon glyphicon-star"></span>...
 *  </div>
 */
getStarElement: function(self){
	var starArea = getClonedTemplate('#template-pure-stars');
 	var stars = self.getStars(); //1-5
 	//color text
 	var cssClass = "text-default";
 	switch(stars){
 		case 1: cssClass = "text-danger"; break;
 		case 2: cssClass = "text-warning"; break;
 		case 4: cssClass = "text-info"; break;
 		case 5: cssClass = "text-success"; break;
 	}
 	starArea.removeClass('text-default text-danger text-warning text-info text-success');
 	starArea.addClass(cssClass);
 	//fill stars
 	starArea.children().each(function(i){
 		//i = star index; 0-4
 		$(this).removeClass("glyphicon-star glyphicon-star-empty");
 		if(i < stars){
 			$(this).addClass("glyphicon-star");
 		}
 		else{
 			//$(this).addClass("glyphicon-star-empty");
 			$(this).remove(); //NEW: get rid of stars instead of leaving them empty
 		}
 	});	
 	
 	return starArea;
},

/**
 * Like getStarElement(), but returns the stars in HTML, not jQuery.
 */
getStarHTML: function(self){
	return self.getStarElement().outerHTML();
},

/**
 * Returns a unique (but mutable) value for this card. 
 * @param {Object} self
 * @return {int}	a hash
 */
getHash: function(self){
	var str = JSON.stringify(self);
	
	//SDBM algorithm - http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
	var hash = 0;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = char + (hash << 6) + (hash << 16) - hash;
    }
    return hash;
}
    
});
