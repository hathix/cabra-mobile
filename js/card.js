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
}
    
});
