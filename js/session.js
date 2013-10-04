var Session = new Class({
   
__init__: function(self, project){
    self.project = project;
    self.cards = null;
    self.results = null;
    self.cardIndex = 0;
    self.skippedCards = [];
    self.wrongCards = []; //actual cards you get wrong will go in here
    self.activeCard = null; //card we're currently studying
    self.front; //question or answer - whatever's on front of card
    
    self.options = {
        style: StudyStyle.NORMAL, //see StudyStyles enum
        mode: StudyMode.NORMAL //see StudyModes enum
    };
},

start: function(self){
    //grab the options
    self.options.style = $('#study-response').val();//normal and jeopardy
    self.options.mode = $('#study-mode').val(); //string telling the studying mode
    
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
    
    //init results - our private use
    self.results = [];
    
    //init click on show button, which will show answer
    $('#show-answer-button').oneClick(function(){
        //hide front side, show back
        //if front was question, show answer, and vice versa
        var html;
        if(self.front == CardParts.QUESTION) html = self.activeCard.answer;
        else if(self.front == CardParts.ANSWER) html = self.activeCard.question;
         self.setStudyText(html);
         
        //hide top, show bottom
        $('.study-main-answer').show(); //slideDown();
        $('.study-main-question').hide(); //slideUp();
    }); 
    //init quit button
    $('#study-quit').oneClick(function(){
        self.end();    
    });
    
        
    
    //studying result buttons (did you know or not)
    $('#study-result-yes').oneClick(function(){
        //alert the card the user knew it
        var card = self.activeCard;
        self.studiedCard(card, StudyResult.YES);
    });
    $('#study-result-sort').oneClick(function(){
         var card = self.activeCard;
        self.studiedCard(card, StudyResult.SORT_OF); 
    });
    $('#study-result-no').oneClick(function(){
         var card = self.activeCard;
        self.studiedCard(card, StudyResult.NO);    
    });
    
    //skip button
    var skip = function(){
        var card = self.activeCard;
        self.skippedCards.add(card);
        self.studiedCard(card, StudyResult.SKIPPED);         
    }; 
    $('#study-skip').oneClick(skip);
    //on swipe left - skip the card
    if(chevre.options.swipeToSkip)
     $('#study-main').oneBind("swipeleft", skip);
    
    
    //hide the answer panel; if we didn't, it would show when card 1 is being viewed
    $('.study-main-answer').hide();
    
    //init ui
    $('#study-main-mc-choices').controlgroup();
    
    //load first card
    self.cardIndex = 0;
    self.loadCard();
},

loadCard: function(self, card){
    //if there's no card, get the one at the current card index
    if(!card)
        card = self.cards[self.cardIndex];
        
    self.activeCard = card;
        
    //update page title (Card x of y)
    //cardindex +1 to make it human-readable: start at 1, end at length instead of start at 0
    var title = sprintf("Card %d of %d", self.cardIndex + 1, self.cards.length);
    $('#study-progress-counter').html(title);
    $(document).attr('title', title);
 
     
    //put stuff in
    //TODO rethink this... it can get a bit jerky
    if(card.hasImage()){
         //show image
         $('#study-image').attr('src', card.imageURL);
         $('#study-image').fadeIn();
    }
    else{
         $('#study-image').fadeOut();
    }
    
    if(card.isMultipleChoice()){
         //hide the show answer button and show the MC buttons
         $('#show-answer-button').hide();
         $('.study-main-question').show();
         $('.study-main-answer').hide();
         $('#study-main-mc-result').hide();
         
         //put in buttons!
         $('#study-main-mc-choices').empty();
         var choices = card.getMCAnswers();
         var correct = false;
         choices.each(function(choice, index){
              var button = getClonedTemplate('template-study-mc-choice');
              button.html(choice);
              button.data('index', index);
              button.oneClick(function(){
               var index = button.data('index');
               //compare to card...
               var rightIndex = card.getMCRightAnswerIndex();
               
               //style
               //make all things flat since the other themes we're applying are flat
               $('#study-main-mc-choices').find('button').buttonMarkup({ theme: 'd' });
               
               /**
                * Finds the answer with index i and applies the given CSS class to it. You can have several classes, space-separated. It also puts the icon (give a jQM icon name) on the side.
                */
               function styleAnswer(i, cssClass, icon){
                    var item = $('#study-main-mc-choices').find('.ui-btn').eq(i);
                    item.addClass(cssClass);
                    if(icon)
                         item.find('button').buttonMarkup({ icon: icon });
               }
               
               
               if(index == rightIndex){
                    //correct! style accordingly
                    styleAnswer(index, "alert-success", "check");
                    correct = true;
               }
               else{
                    //wrong!
                    styleAnswer(index, "alert-danger", "delete");
                    styleAnswer(rightIndex, "alert-success", "check");
               }
               
               //finish up
               $('#study-main-mc-choices').find('button').unbind('click') //stop clicking!
                    .css('cursor','default'); //use normal mouse, not hand
               $('#study-main-mc-next').focus();
               
               //SHOW 'next' BUTTON
               $('#study-main-mc-result').show();
               $('#study-main-mc-next').oneClick(function(){
                    self.studiedCard(card, correct ? StudyResult.YES : StudyResult.NO);
               });
               
              });
              $('#study-main-mc-choices').append(button);
         });
         $('#study-main-mc-choices').trigger('create');
         $('#study-main-mc-choices').controlgroup('refresh');
         
         $('.study-main-mc').show();
    }
    else{
         $('#show-answer-button').show();
         
         //hide the lower stuff (answer & buttons), show the top (show button)
         //do this BEFORE setting the q/a, so that the user cant peek
         $('.study-main-answer').hide(); //slideUp();
         $('.study-main-question').show(); //slideDown();    
         $('.study-main-mc').hide();
    } 
    
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

    //remove active state from the studying buttons... they tend to "stick" in active state
    //for some reason it doesn't work if called immediately, put it off a bit
    (function(){$('#study-buttons').find('a').removeClass('ui-btn-active')}).delay(100);
},

studiedCard: function(self, card, result){
    card.studied(result); //updates the rank & therefore reps left
    self.results.add(result);
    
    if(result == StudyResult.NO){
        //you didn't know it; save it in our list of wrong cards so you can re-study next time
        //TODO: instead of storing results, and cards wrong, just save an assoc array of card: result so you can count # cards and figure out which cards got which ranking all at once
        self.wrongCards.add(card);
    }
    
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
setStudyText: function(self, html){
     $('#study-textarea').htmlFade(html);
          
     //text area responsive
     (function(){$('#study-textarea').responsiveMeasure({
          //idealLineLength: 66 //amazingly the default is right
          minimumFontSize: chevre.options.fontSize,
          maximumFontSize: chevre.options.fontSize*2
     })}).delay(100);     
},

end: function(self){
    //update the study session end page (switch when we're all done)
    
    
    /*
    $('#result-yes-count').html(self.results.count(StudyResult.YES));
    $('#result-sort-count').html(self.results.count(StudyResult.SORT_OF));
    $('#result-no-count').html(self.results.count(StudyResult.NO));
    $('#result-skipped-count').html(self.results.count(StudyResult.SKIPPED));
    $('#result-total-count').html(self.results.length);
    */
   
    //switch to the study session end page
    $.mobile.changePage('#study-session-end');   
    
    //put in proper counts
    $('#study-session-end').oneBind('pageshow', function(){
         self.loadResultsChart();
    });
    
    
    //for each card that WASN'T studied, reduce its sessions left by 1
    //cards that were skipped count as not studied too. their sessions left should remain at 0
        //and by making it one less, or zero (whatever's bigger), this does that
    var studiedNotSkipped = self.cards.subtract(self.skippedCards);
    var notStudied = self.project.cards.subtract(studiedNotSkipped); //not studied and not skipped
    notStudied.forEach(function(card){
        //reduce repsLeft
        card.repsLeft = Math.max(card.repsLeft - 1, 0); //so it's 0 at minimum
    });
    //for cards the user got wrong, let the project know so that the user can study just those next time
    self.project.wrongCards = self.wrongCards;
    
    //save this project only. we're saving it at the very end
    self.project.save();
},

loadResultsChart: function(self){
     $('#session-result-chart').empty();
     
     /**
      * Returns the number of cards with a certain StudyResult type.
      * @param {String} type  "YES", "NO", etc. These are values of the StudyResult enum.
      */
     function countResultType(type){
          return self.results.count(StudyResult[type]);
     }
     
     var data = [
          [ "Knew it", countResultType("YES") ],
          [ "Sort of knew", countResultType("SORT_OF") ],
          [ "Didn't know", countResultType("NO") ],
          [ "Skipped", countResultType("SKIPPED") ]
     ];
     
     var colors = [
          Rank.E.color, //yes
          Rank.C.color, //sort of
          Rank.A.color, //no
          Rank.D.color, //skipped
     ];
     
     var total = self.results.length;
     var title = sprintf("Studied %d card%s", total, total != 1 ? 's' : '');
    
    try{
        $.jqplot('session-result-chart', [data], {
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
    }
    catch(ex){
        //This error often thrown when the slices the pie tries to draw are too tiny; eg 1/150 cards has rank A
        console.log(ex);
    }     
}
    
});
