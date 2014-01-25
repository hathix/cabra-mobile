var Session = new Class({
   
__init__: function(self, project){
    self.project = project;
    self.cards = null; //only cards to study
    self.results = []; //each studied card, as well as its result (knew it, didn't know, etc) goes in here. {card: Card, result: StudyResult}
    self.cardIndex = 0;
    self.activeCard = null; //card we're currently studying
    self.status = SessionStatus.SETUP;
    
    self.options = {
        style: StudyStyle.NORMAL, //see StudyStyles enum
        mode: StudyMode.NORMAL //see StudyModes enum
    };

	//enable or disable the "cards i didn't know last time" since this func is called whenever we visit the setup page
	if(self.project.wrongCards && !self.project.wrongCards.isEmpty()){
		$('#study-option-wrong-cards').show();
	}
	else{
		if($('#study-option-wrong-cards').is(':selected')){
			//if it's chosen, go to another one
			$('#study-input-mode').val(StudyStyle.NORMAL);
		}
		$('#study-option-wrong-cards').hide();
	}
},

start: function(self){
	
    //grab the options
    self.options.style = $('#study-input-style').val();//normal and jeopardy
    self.options.mode = $('#study-input-mode').val(); //string telling the studying mode
    
    //shuffle the project's cards
    if(chevre.options.shuffleBeforeStudying)
        self.project.shuffle();
    
    //now, based on the mode, determine which cards are to be studied
    var cardsToStudy = []; //fill this with the cards this session will have
    
    switch(self.options.mode){
    case StudyMode.NORMAL:        
        //grab cards from the project that are eligible to be studied
        //these are the cards with the lowest repsLeft. May be 0 or higher.
        //if cards have repsLeft [2,2,5], then subtract 2 (the min) from each to get some to 0
        //then grab the ones with 0 repsLeft
        var cardsWithMin = self.project.cards.min('repsLeft', true); //these are the cards with the minimum reps left
        var minRepsLeft = cardsWithMin[0].repsLeft; //the actual value
        //subtract the min reps from the rest - so that [2,2,5] would shift to [0,0,3]
        //this doesn't handle reducing the count by 1 for cards that were NOT studied - that's done at end
        self.project.cards.forEach(function(card){
            card.repsLeft -= minRepsLeft;
        });
        
        //the cards in this session are the cardsWithMin - which we already created
        //but make sure it's not more than the max we can have
        cardsToStudy = cardsWithMin.first(chevre.options.maxCardsPerSession); 
        break;
    case StudyMode.CRAM:
        //get every single card in the project regardless of how well you know it
        //don't need to change reps since the "moment of reckoning" will come for every card
        cardsToStudy = self.project.cards;
        break;
    case StudyMode.PERFECTION:
        //project may have list of cards the user got wrong last time; in that case, study JUST them
        //this is outside the whole leitner workflow (may have many cards that are rank A, not just wrong cards) so don't change any reps
        //we should have already checked if there even are any cards (if there aren't the corresponding menu item would have been disabled)
        cardsToStudy = self.project.wrongCards.randomize(); //the order of this has not been randomized (same cards, just the container is different); don't want them showing up in the same order
        break;
    }
    //we've decided which cards to study
    self.cards = cardsToStudy;
    //fill the self.results with {card: Card, result: null} (for now)
    self.results = self.cards.map(function(card){
    	return {card: card, result: StudyResult.SKIPPED}; //if this result isn't updated, var result will remain at SKIPPED so we know it hasn't been studied
    });

  /*
    //on swipe left - skip the card
    if(chevre.options.swipeToSkip)
     $('#study-main').oneBind("swipeleft", skip);
    
    
    */
    //load first card
    self.cardIndex = 0;
    self.loadCard();
},

loadCard: function(self, card){
    //if there's no card, get the one at the current card index
    if(!card)
        card = self.cards[self.cardIndex];
        
    self.activeCard = card;
	//card = self.activeCard; 
 
    //render template
    template("template-study-main",$('#study-card-area'), self); 
    
    //bind clicks
    var area = $('#study-card-area');
    
    //responsive measure to set text size
    /*area.find('.study-text').each(function(){
	    $(this).responsiveMeasure({
	          //idealLineLength: 66 //amazingly the default is right
	          minimumFontSize: 18,
	          maximumFontSize: 18*2    		
	    });
    });*/
   //just Q for now
   self.responsiveMeasure(area.find('#study-main-card-question').find('p'));
    
    //showing answer/checking for FR
    area.find('.btn-show-answer').oneClick(function(){
    	$(this).hide();
    	area.find('.hidden').removeClass('hidden');
    	self.responsiveMeasure(area.find('#study-main-card-answer').find('p'));
    });
    area.find('.btn-study-result-yes').oneClick(function(){
    	self.studiedCard(card, StudyResult.YES);
    });
    area.find('.btn-study-result-sortof').oneClick(function(){
    	self.studiedCard(card, StudyResult.SORT_OF);
    });
    area.find('.btn-study-result-no').oneClick(function(){
    	self.studiedCard(card, StudyResult.NO);
    });        
    //showing answer/checking for MC
    var MCButtons = area.find('.btn-choose-answer-mc');
    MCButtons.oneClick(function(){
    	var answerIndex = MCButtons.index($(this)); //0-3 for a 4-question card
    	var rightIndex = card.getMCRightAnswerIndex();
    	var correct;
    	
    	if(answerIndex == rightIndex){
    		//correct! woo hoo
    		$(this).addClass("btn-success");
    		$(this).find('span').addClass("glyphicon-ok");
    		
    		correct = true;
    	}
    	else{
    		//wrong!
    		$(this).addClass("btn-danger");
    		$(this).find('span').addClass("glyphicon-remove");
    		var rightButton = MCButtons.parent().find(sprintf("button:eq(%d)", rightIndex));  //find right indexed button and highlight it
    		rightButton.addClass("btn-info");
    		rightButton.find('span').addClass("glyphicon-ok");
    		
    		correct = false;
    	}
    	
    	//disable old buttons
    	MCButtons.addClass('disabled').unbind('click');
    	
    	//show next button
    	area.find('.hidden').removeClass('hidden');
    	
    	//bind click button
	    area.find('.btn-study-next').oneClick(function(){
	    	self.studiedCard(card, correct ? StudyResult.YES : StudyResult.NO); //only study now since that auto goes to next card
	    });    	
    });

 
 	//sidebar
 	var sidebar = $('#study-sidebar');
 	sidebar.find('.btn-card-current').html(sprintf("Card %d of %d", self.cardIndex+1, self.cards.length)); //card count
 	var isFirstCard = self.cardIndex == 0;
 	var isLastCard = self.cardIndex == self.cards.length-1;
 	sidebar.find('.btn-card-prev').toggle(!isFirstCard).oneClick(function(){
 		self.cardIndex--;
 		self.loadCard();	
 	});
 	sidebar.find('.btn-card-next').toggle(!isLastCard).oneClick(function(){
 		self.cardIndex++;
 		self.loadCard();	
 	});
 	//replace side buttons with quit ones when at first/last card??
 	//sidebar.find('.btn-quit-prev').toggle(isFirstCard);
 	//sidebar.find('.btn-quit-next').toggle(isLastCard);
 	sidebar.find('.btn-quit').oneClick(function(){
 		self.end();
 	});
 	sidebar.find('.btn-edit').oneClick(function(){
 		var oldHash = card.getHash();
 		card.edit(function(){
 			//modal closed
 			//was the card even changed?
 			if(card.getHash() != oldHash){
	 			//reload this card so we see the difference
	 			self.loadCard(card); 				
 			}
 		}); 		
 	});
 	//stars
 	var starArea = $('#study-sidebar-stars');
 	starArea.empty().append(card.getStarElement());
 	//if this has already been studied, put a little check mark in front
 	
 	//notification if you've already studied it
 	if(self.hasStudiedCard(card)){
 		$('.btn-card-current').prepend(getClonedTemplate('template-checkmark'));
 	} 	
 	
 	/*
 	var stars = card.getStars(); //1-5
 	//color text
 	var cssClass = "text-default";
 	switch(stars){
 		case 1: cssClass = "text-danger"; break;
 		case 2: cssClass = "text-warning"; break;
 		case 4: cssClass = "text-info"; break;
 		case 5: cssClass = "text-success"; break;
 	}
 	starArea.removeClass().addClass(cssClass);
 	//fill stars
 	starArea.children().each(function(i){
 		//i = star index; 0-4
 		$(this).removeClass("glyphicon-star glyphicon-star-empty");
 		if(i < stars){
 			$(this).addClass("glyphicon-star");
 		}
 		else{
 			$(this).addClass("glyphicon-star-empty");
 		}
 	});
 	*/
 	 
   /* 
    //determine what to show on front
    switch(self.options.style){
         case StudyStyle.NORMAL:
          self.front = CardParts.QUESTION;
          break;
         case StudyStyle.JEOPARDY:
          self.front = CardParts.ANSWER;
          break;
         case StudyStyle.RANDOM:
          var question = pushLuck(0.5); //true if we'll show question, false if answer
          if(question) self.front = CardParts.QUESTION;
          else self.front = CardParts.ANSWER;
          break;
    }
    //get text - question if we wanted question etc
    var text;
    if(self.front == CardParts.QUESTION) text = card.question;
    else if(self.front == CardParts.ANSWER) text = card.answer;
    self.setStudyText(text);
    */   
},

/**
 * Register the result of studying a card.
 * @param {Card} card	probably self.activeCard.
 * @param {StudyResult} result	An item from the StudyResult enum: StudyResult.YES, etc. 
 */
studiedCard: function(self, card, result){
    card.studied(result); //updates the rank & therefore reps left
    
    //find the matching card in results & update its status
    self.results.forEach(function(resultObject){
    	//if the card referenced here is what we studied, update its status
    	if(resultObject.card == card){
    		//match!
    		resultObject.result = result;
    	}
    });
    
    self.cardIndex++;
    
    //are we out of space?
    if(self.cardIndex >= self.cards.length){
        //session finished
        self.end();
    }
    else{
        //more cards; load those
        self.loadCard();
    }
},

/**
 * Changes the text in #study-textarea. 
 * @param {String} html  what to put in there - usually question or answer.
 */
/*setStudyText: function(self, html){
     $('#study-textarea').htmlFade(html);
          
     //text area responsive
     (function(){$('#study-textarea').responsiveMeasure({
          //idealLineLength: 66 //amazingly the default is right
          minimumFontSize: chevre.options.fontSize,
          maximumFontSize: chevre.options.fontSize*2
     })}).delay(100);     
},*/

/**
 * End the studying session. 
 */
end: function(self){
    //update the study session end page (switch when we're all done)
    
  
   
    //switch to the study session end page
    //$.mobile.changePage('#study-session-end');   
    nav.openPage('study-end');
    
    //TODO update so that this uses results
    //for each card that WASN'T studied, reduce its sessions left by 1
    //cards that were skipped count as not studied too. their sessions left should remain at 0
        //and by making it one less, or zero (whatever's bigger), this does that
    var notStudied = new Array();
    self.results.forEach(function(modResult){
    	//contains {card: Card, result: StudyResult}
    	if(modResult.result === StudyResult.SKIPPED){
    		//we did NOT study it
    		notStudied.push(modResult.card);
    	}
    });
    notStudied.forEach(function(card){
        //reduce repsLeft
        card.repsLeft = Math.max(card.repsLeft - 1, 0); //so it's 0 at minimum
    });
    
    
    //for cards the user got wrong, let the project know so that the user can study just those next time, if they so desire
    self.project.wrongCards = new Array();
    self.results.forEach(function(modResult){
    	//contains {card: Card, result: StudyResult}
    	if(modResult.result === StudyResult.NO){
    		self.project.wrongCards.push(modResult.card);
    	}
    });    
    
    //save this project only. we're saving it at the very end
    self.project.save();
},

/**
 * Returns all cards that were studied in this session (any result besides skipped.)
 */
getStudiedCards: function(self){
	return Object.values(self.results).flatten().unique();
},

hasStudiedCard: function(self, card){
	var hasStudied = false;
	self.results.each(function(resultObj){
		if(resultObj.card == card && resultObj.result !== StudyResult.SKIPPED){ 
			hasStudied = true;	
			return false;
		}
	});
	return hasStudied;
},


loadResultsChart: function(self){
     $('#study-result-chart').empty();
  	
     var rawResults = self.results.map('result'); //the result objects contain {card, result}; get just the result (StudyResult) part. So this is a StudyResult array.
     /**
      * Returns the number of cards with a certain StudyResult type.
      * @param {String} type  StudyResult.YES, StudyResult.NO, etc.
      */
     function countResultType(type){
          return rawResults.count(type);
     }
     
     var numTotal = self.results.length;
     var title = sprintf("Studied %d card%s", numTotal, numTotal != 1 ? 's' : '');
     
     var data = [
          [ "Knew it", countResultType(StudyResult.YES) ],
          [ "Sort of knew", countResultType(StudyResult.SORT_OF) ],
          [ "Didn't know", countResultType(StudyResult.NO) ],
          [ "Skipped", countResultType(StudyResult.SKIPPED) ] //at the outset we set the default value of the result var to SKIPPED, so if it wasn't updated to something else, we know the card wasn't studied
     ];
     
     var colors = [
          Rank.E.color, //yes
          Rank.C.color, //sort of
          Rank.A.color, //no
          Rank.D.color, //skipped
     ];
     
     
    
    $.jqplot('study-result-chart', [data], {
        title: title,
        seriesColors: colors,
        seriesDefaults: {
            renderer: $.jqplot.PieRenderer,
            rendererOptions: {
                showDataLabels: true,
                dataLabels: 'value',
                
                //make the pie filling-less
                fill: false,
                
                startAngle: -90, //make it so that "knew it" starts at 12 o'clock
                
                //the problem with these is that if there's tiny slices it'll fail (tries to draw too small)
                //sliceMargin: 5, //fails with small ratios (like 99 A / 1 B)
                lineWidth: 5 //this is ok even with small ratios (like 99 A / 1 B)
            }
        },
        legend: {
            show: true, 
            location: 'e'
        }    
    });  
},


/**
 * Adjusts the font size of the given element to be pleasing to the eye. 
 * @param {jQuery} elem		must contain text.
 */
responsiveMeasure: function(self, elem){
	elem.responsiveMeasure({
      //idealLineLength: 66 //amazingly the default is right
      minimumFontSize: chevre.options.fontSize,
      maximumFontSize: chevre.options.fontSize    		
	});	
}
    
});
