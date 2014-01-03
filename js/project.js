var Project = new Class({
    
    /**
     * @param {String} name   Project name. Make sure it's unique among projects here.
     * @param {String} description [optional, default null] additional text about the project.
     * @param {String} id     [optional; if omitted it's auto-generated] a unique id that is unique for EVERY PROJECT EVER. It should never change once the project is created.
     * @param {String} group  [optional, default GROUP_DEFAULT] the name of the group that this project is in. Pass nothing if it's unorganized.
     */
__init__: function(self, name, description, id, group){
    self.name = name;
    self.description = orDefault(description, null); //TODO make this undefined by default so that it won't take up space when stored and there's nothing there
    self.isEditing = false;
    //self.lastStudied = null;
    if(!id){
         //get unix time as unique code. let's hope there's no duplicates of that!
         id = "p" + Date.now();
    }
    self.id = id;
    //self.id = Math.floor(Math.random() * 1000);
    self.cards = [];
    self.group = orDefault(group, GROUP_DEFAULT);
    self.session = null;
    self.wrongCards = null; //cards they got wrong last session; temporary variable, filled in by session
    
},

equals: function(self, other){
    return self.id == other.id;
},

addCard: function(self, card){
    self.cards.add(card);
    
    //chevre.save(self);
},

numCards: function(self){
    if(self.raw){
        return self.rawCards.length;
    }    
    else{
        return self.cards.length;
    }
},

/**
 * Randomizes the order of all cards in the project. 
 */
shuffle: function(self){
    self.cards = self.cards.randomize();
    self.save();
},

/**
 * @param {String} sortType		use the SortType enum. This is what you're sorting based on: question, answer, etc. 
 * @param {boolean} desc		if false, sorts increasing (A-Z); if true, decreasing (Z-A)
 */
sortCards: function(self, sortType, desc){
	self.cards = self.cards.sortBy(function(card){
		var sortOn;
		switch(sortType){
			case SortType.QUESTION: sortOn = card.getQuestionText(); break;
			case SortType.ANSWER: sortOn = card.getAnswerText(); break;
			case SortType.STARS: sortOn = card.getStars(); break;
		}
		
		return sortOn;
	}, desc);
},

resetCards: function(self){
    self.cards.forEach(function(card){
       card.setRank(Rank.A); 
    });
    self.loadCardChart();
},

flipCards: function(self){
    //make all cards' question the answer and vice versa
    self.cards.forEach(function(card){
        var question = card.question;
        var answer = card.answer;
        card.question = answer;
        card.answer = question;    
    });
    self.save();
},

/**
 * Given a hash, finds the appropriate card (using Card.getHash()) and returns it. If it returns null, you have a problem. 
 */
getCardByHash: function(self, hash){
	var card = null;
	self.cards.forEach(function(c){
		if(c.getHash() == hash){ card = c; }
	});
	return card;
},

/**
 * Shows or hides the description based on whether or not there is one set. 
 */
showOrHideDescription: function(self){
    if(self.description){
        $('#project-description').html(self.description).show();
        $('#project-description-entry').hide();
        $('#project-description-entry-text').val(''); //clear the entry field
    }
    else{
        //don't have it
        $('#project-description').hide();
        $('#project-description-entry').show();
        $('#project-description-entry-button').oneClick(function(){
            //grab description text 
            var text = $('#project-description-entry-text').val();
            text = prettify(text); //make it show nicely in HTML
            if(text){
                self.description = text;
                self.showOrHideDescription(); //that'll do the first case
                self.save();
            }
        });
    }
},

clearDescription: function(self){
    self.description = null;
    self.showOrHideDescription();
    self.save();  
},

reloadDescription: function(self){
     //description AND name toggling
     //show the description/name area with what we already have
     var descriptionArea = template("template-deck-description", $('#deck-title-holder'), self);
     //listen to any updates
     descriptionArea.closest('.btn-description-edit').oneClick(function(){
          self.isEditing = true;
          self.reloadDescription();     
     });
     descriptionArea.closest('.btn-description-done').oneClick(function(){
          self.isEditing = false;
          var name = descriptionArea.closest('.input-name').val().trim(); //we can't have no name!
          if(name && name != ""){
          	self.name = name;
          	$('.univ-deck-name').html(self.name);//TODO have setName();
          }      
          self.description = descriptionArea.closest('.input-description').val().trim(); //we CAN have no desc
          self.save();
          self.reloadDescription();     
     });
     descriptionArea.closest('.btn-description-add').oneClick(function(){
          self.isEditing = true;
          self.reloadDescription();     
     });     
},

load: function(self){
     //load home page
     //put in all of our pages
     var pages = PageDB.get(['study','create','batch','manage','print','export']);
     //hide some if we have no cards (hide what requires cards)
     var hideIfNoCards = PageDB.get(['study','manage','print','export']);
     if(self.cards.isEmpty())
     	pages = pages.subtract(hideIfNoCards);
     //show them!
     template("template-project-pages",$('#project-page-list'),{pages: pages});
     
     //managing clicking the buttons to go to each page; it's in the form .btn-launch-{slug}
     $('.btn-launch-create').oneClick(function(){
     	Editor.prepareCard(null); //to prepare for card __creation__	
     });
     
     //description & name
     $('.univ-deck-name').html(self.name);
     self.reloadDescription();
     
     //card chart
     self.loadCardChart.delay(100);
     $(window).resize(function(){
     	self.loadCardChart();	
     });
     
     //INSIDE the batch page
     $('#batch-button-create').oneClick(function(){
     	self.batchCreate();
     });
     
     //
     
     //var hasCards = self.cards.length > 0;
     //var hideIfNoCards = ['study'];
     
    //load home page
    //$('#project-name').html(self.name);
    //$(document).attr('title', self.name);
    
    //$('#study-session-init-button').toggle(self.cards.length > 0);
/*    
    //show description text if there is any; otherwise show the description entry stuff
    self.showOrHideDescription();
    
    //self.prepareCreateCardPage(CARD_CREATE);
    $('#create-card-link').oneBind('click.cc', function(){
     self.prepareCreateCardPage(CARD_CREATE);      
    });
    
    //create card button in batch creator
    $('#batch-create-button').oneClick(function(e){

    });
    
    //start studying button in the study init page
    $('#study-session-start').oneClick(function(event){
        //make a session and start it
        self.session = new Session(self);
        self.session.start(); 
    });
    
    //this will be called the page loaded
    $('#project-home').oneBind('pageshow', function(){
        //show chart with cards
        self.loadCardChart();
        
        //enable/disable study button (the one to start initialization) if there are no cards
        var disable = self.cards.isEmpty(); //bool
        //$('#study-session-init-button').button(disable ? 'disable' : 'enable');
        //disable each of these
        var buttonIDsToDisable = [ '#study-session-init-button', '#card-manager-button', '#backup-launch-button', '#project-shuffle', '#project-reset', '#project-flip', '#project-print' ];
        buttonIDsToDisable.forEach(function(id){
            disable ? $(id).hide() : $(id).show();
            //$(id).toggleClass('ui-disabled', disable);
        });
        
        //the top/bottom buttons may have been removed so you may see square edges. Re-round them
        $('.project-main-controlgroup').controlgroup();
    });    
    $('#card-manager').oneBind('pageshow', function(){
        //update card manager list
        self.updateManager();
    });*/
    /*$('#card-viewer').oneBind('pageshow', function(){
          // set up click/tap panels
          $('.flip-click').click(function() {
               $(this).toggleClass('flip');
          });
    });*/
   /*
   $('#project-print').oneClick(function(){
        self.setupPrint();
   });
   
    $('#study-session-init').oneBind('pageshow', function(){
        //user given choice to study only cards they got wrong last time
        //but if no cards were wrong, or there WAS no last time (this is first run since opening Cabra), disable it
        var wrongCardsItem = $('#study-mode-perfection');    
        var modeSelect = $('#study-mode');
        
        if(self.wrongCards && self.wrongCards.length > 0){
            //there are some cards we could study
            wrongCardsItem.removeAttr('disabled');
        }
        else{
            //no cards we could study, so no point; disable that choice
            wrongCardsItem.attr('disabled', 'disabled');
            
            //if they had chosen to study perfection and now it got disabled, change the choice
            if(modeSelect.val() == StudyMode.PERFECTION){
                modeSelect.val(StudyMode.NORMAL); //will be refreshed later
            }
        }
        
        //refresh study mode select menu to reflect change
        modeSelect.selectmenu('refresh', true); //true is to rebuild it
    });
    
    
    //project manager & more tools
    $('#project-shuffle').oneClick(self.shuffle);
    $('#project-reset').oneClick(self.resetCards); //that'll save too
    $('#project-flip').oneClick(self.flipCards);
    $('#project-clear-description').oneClick(self.clearDescription);
    $('#project-edit').oneClick(function(){
        //give that dialog this project so it can access it
        $('#project-edit-dialog').jqmData('project', self);
        
        //rename the dialog
        $('#project-edit-header').html(self.name);        
    });
    
    //jqm init
    $('#create-mc-answers').find('input.mc-answer-radio').checkboxradio(); //init it now
    
    //now at the very end...
    //pre-load all images so that they're cached - so it's quicker to load them when you go to study
    var img = new Image();
    self.cards.forEach(function(card){
     if(card.imageURL){
          img.src = card.imageURL;
     }     
    });
    */
},

updateManager: function(self){
    //show the spinny thingy
    //$.mobile.showPageLoadingMsg();
    
    /**
     * Enters either edit or delete mode, which changes what you can do to your cards.
     * @param {String} mode		a mode; get it from the ManageMode enum. 
     */
    function enterMode(mode){
    	//ensure buttons are correctly styled and hide/show buttons appropriately
    	if(mode == ManageMode.EDIT){
    		$('#manage-radio-mode-edit').parent().addClass('active');
    		$('#manage-radio-mode-delete').parent().removeClass('active');
    		
    		$('.manage-edit-card').show();
    		$('.manage-delete-card').hide();
    	}
    	else{
    		$('#manage-radio-mode-edit').parent().removeClass('active');
    		$('#manage-radio-mode-delete').parent().addClass('active');
    		
    		$('.manage-edit-card').hide();
    		$('.manage-delete-card').show();    		
    	}
    }    
    
    //empty card manager and refill
    var list = $('#manage-card-list');
    list.empty();
    
    /**
     * Loads the given Card[] into the card list. 
     * @param {Card[]}	cards	all cards to load.
     * @param {String}	highlightText	[optional] if given, all instances of that text in the card are highlighted. Good for filtering.
     */
    function loadCards(cards, highlightText){
    	template('template-manage-cards', list, {cards: cards});
    	
    	//by default, enter edit mode
    	enterMode(ManageMode.EDIT);
    	
    	//highlight any instances of given text
    	if(highlightText){
	    	//q and a are in <p>'s; replace any instances of text with bolded version
	    	list.find('p').each(function(){
	    		var html = $(this).html(); //ONE question or answer text
	    		var matches = html.match(new RegExp(highlightText, "ig")); //ignore case; global search
	    		//matches is usually 1 item long, but can be more if the text is found more than once (eg "Ph" in "Philadelphia")
	    		if(matches){
	    			//We need to bold every matching text but not re-bold something we already looked at... therefore, we need to break stuff up and do a recursive method to bold each successive piece
	    			function emphasize(text){
	    				/*
	    				 * GAME PLAN:
	    				 * 1. Find things in text that match one thing we found
	    				 * 2. Break the string around that bit
	    				 * 3. Format that bit, then call this function on last bit
	    				 */
	    				var indices = matches.map(function(match){
	    					return text.indexOf(match);
	    				}); //e.g. [-1,1,2] if we can't find the first match but CAN the other 2
	    				if(indices.max() == -1){
	    					//we can't find anything! no more matches, return this
	    					return text;
	    				}
	    				else{
	    					//find closest non -1 thing
	    					var closestIndex = indices.remove(-1).min();
	    					var matchLength = matches[0].length; //they're all same length so we'll abuse that
	    					var leftBit = text.substring(0, closestIndex); //before the match
	    					var centerBit = text.substring(closestIndex, closestIndex + matchLength); //the match
	    					var rightBit = text.substring(closestIndex + matchLength); //after the match
	    					
	    					return leftBit + "<strong>" + centerBit + "</strong>" + emphasize(rightBit);
	    				}
	    			}
	    			
	    			html = emphasize(html);
	    			
		    		$(this).html(html);
	    		}
	    	});
    	}
    }
    
    
    //template it up
    //by default, use all cards
    loadCards(self.cards);
       
    //handle clicks in top bar

    $('#manage-radio-mode-edit').parent().oneClick(function(){ enterMode(ManageMode.EDIT); });
    $('#manage-radio-mode-delete').parent().oneClick(function(){ enterMode(ManageMode.DELETE); });
    
    $('#manage-sort-menu').find('a').oneClick(function(){
    	//this is a sorting button. Figure out our sorting settings
    	var sortOn = $(this).data('sorton');
    	var desc = $(this).data('desc');
    	self.sortCards(sortOn, desc);
    	nav.refreshPage();
    });
    
    //edit button
    $('.manage-edit-card').oneClick(function(){
    	//get the hash, match it up, and edit that card
    	var hash = $(this).data('hash');
    	var card = self.getCardByHash(hash);
    	
    	Editor.prepareCard(card);
    	nav.openPage('create');	
    });
    $('.manage-delete-card').oneClick(function(){
    	//get the hash, match it up, and edit that card
    	var hash = $(this).data('hash');
    	var card = self.getCardByHash(hash);
    	
      	//update view
      	$(this).closest('tr').remove();
      	//update model
      	self.cards = self.cards.subtract(card);
      	self.save();         	
    });    
    
    //$('#manage-button-filter').oneClick(function(){
    //change waits till they hit enter, keyup does it as soon as they hit a key... which is better? keyup is slicker but takes more resources since it reloads a lot
    $('#manage-input-filter').oneBind('change keyup', function(){
    	var filterText = $('#manage-input-filter').val();
    	if(filterText){
    		var filterLower = filterText.toLowerCase();
    		
    		var cards = self.cards.filter(function(card){
    			//q or a must contain filter text
    			return card.getQuestionText().toLowerCase().indexOf(filterLower) > -1 
    			    || card.getAnswerText().toLowerCase().indexOf(filterLower) > -1;
    			//TODO search other answer choices too
    		});
    		loadCards(cards, filterText);
    	}
    	else{
    		loadCards(self.cards);
    	}
    });
    $('#manage-button-filter-clear').oneClick(function(){
    	$('#manage-input-filter').val('').trigger('change').trigger('keyup').focus();
    });
},

loadCardChart: function(self){
    if(self.cards.isEmpty() || $('#deck-home-card-chart').is(':hidden')){
        //no cards, draw nothing OR it was hidden since the device can't handle drawing it
        $('#deck-home-card-chart').empty();
        //$('#project-card-chart').css({ 'height': '25px' }); //otherwise there would be a lot of empty space since the charts force it to be 300px //PROBLEM: after this, the charts stay 25px so it looks weird
        $('#deck-home-card-chart').html('<p class="lead text-info">This deck has no cards. Make some!</p>');
        return;
    }
    
    $('#deck-home-card-chart').empty();
    
    //we want an array of data in the format [ [numStars,numCards], ... ]
    var starAmounts = self.cards.map(function(c){ return c.getStars(); }); //[1,1,2,2,3,4,5]
    var data = [];
    for(var s=MIN_STARS; s<=MAX_STARS; s++){
    	//for each amount of stars, count how many we have of that
    	data.push([
    		s > 1 ? s + ' Stars' : s + ' Star',
    		starAmounts.count(s)
    	]);
    }
    
    //pluralize the title word Flashcard if necessary
    var titleWord = 'Flashcard';
    titleWord += self.cards.length != 1 ? 's' : '';
    
    try{
        $.jqplot('deck-home-card-chart', [data], {
            title: self.cards.length + ' ' + titleWord, //can change
            seriesColors: STAR_COLORS,
            seriesDefaults: {
                renderer: $.jqplot.PieRenderer,
                rendererOptions: {
                    showDataLabels: true,
                    dataLabels: 'value',
                    
                    //make the pie filling-less
                    fill: false,
                    
                    //the problem with these is that if there's tiny slices it'll fail (tries to draw too small)
                    //sliceMargin: 5, //fails with small ratios (like 99 A / 1 B)
                    lineWidth: 5 //this is ok even with small ratios (like 99 A / 1 B)
                }
            },
            legend: {
                show: true, 
                location: 'e',
                placement: 'outsideGrid'
            }    
        });
    }
    catch(ex){
        //This error often thrown when the slices the pie tries to draw are too tiny; eg 1/150 cards has rank A
        console.log(ex);
    }
},

/**
 * Batch creates many cards. Call this on click of the proper button. 
 */
batchCreate: function(self){
    //grab delimiter - from select
    var delimiter = $('#batch-input-style').val();
    
    //multiple choice. TODO add selects for this
    var mcChoiceDelim = "|";
    var mcCorrectMarker = "*";
    
    //grab raw text containing all the cards
    var rawText = $('#batch-textarea').val(); //contains "Q-A \n Q-A \n Q-A ..."
    //Tara's Word problems; replace any long MS Word dashes (–) with normal ones (-) (side by side – -)
    rawText = rawText.replaceAll("–","-");
    
    //break into individual cards
    var rawCards = rawText.split('\n'); //now ["Q-A", "Q-A", ...]
    var malformedCards = []; //raw strings that don't work will be stored in this
    rawCards.each(function(rawCard){
         //TODO put this in the Card class
        //Q and A are separated by some delimiter; what they told us should be delimiter
        var split = rawCard.splitOnce(delimiter); //[Q, A]
        if(split.length < 2){
            //malformed; skip this
            //store it in the malformed cards and leave it in the text box when we're done
            malformedCards.push(rawCard);
            //<TODO>: if all or most of the cards are malformed, assume the delimiter's wrong and intelligently guess which one is the right one
            return;    
        }
        else{
            //properly formed
            //trim the question and answer and assign to a card
            var question = cleanInput(split[0].trim());
            var answer = cleanInput(split[1].trim());

            //see if it's multiple choice
            if(answer.has(mcChoiceDelim)){
                 //it's MC
                 var choices = answer.split(mcChoiceDelim).compact(true); //[choice1,choice2,*choice3,choice4]
                 //ensure it has ONLY ONE correct marker leading off the string
                 var choicesBeginningWithMarker = choices.count(function(choice){ 
                      return choice.startsWith(mcCorrectMarker);
                 });
                 if(choicesBeginningWithMarker == 1){
                      //good!
                      //find where the right answer was
                      var rightIndex = choices.findIndex(function(choice){ return choice.startsWith(mcCorrectMarker)});
                      //remove marker from start of that choice
                      choices[rightIndex] = choices[rightIndex].substring(mcCorrectMarker.length); //chop off first few chars
                      answer = { choices: choices, right: rightIndex };
                 }
                 else{
                      //bad!
                      //TODO have it tell you WHY a card was malformed/rejected ("too many/too few cards starting with *" etc)
                      malformedCards.push(rawCard);
                      return;
                 }
            }
            var card = new Card(question, answer);
            //console.log(card);
            self.addCard(card);
        }            
    });
    
    //cleanup 
    self.save();
    //empty the text area and put in any malformed ones - so they can fix it and re-try
    var textarea = $('#batch-textarea');
    
    //was there malformed stuff?
    if(malformedCards.length > 0){
         var malformedString = malformedCards.join("\n");
         textarea.val(malformedString);//.css('height',0).change();
         textarea.focus();   
         
         e.preventDefault();
         
         toast("Sorry &ndash; some of your cards weren't formatted right; they're still in the text box! Check the Mass Creator Help.", { error: true });
    }
    else{
         //all ok
         //textarea.val('').css('height',0).change();
         textarea.val('');
    }
    

 /*(function show(){
      textarea.change(); //in case it got stuck @ 0 height... that tends to happen
 }).delay(200); //wait for a few pending things to finish
    */
    //TODO: prevent the button from going back to main immediately; only go there programmatically if all cards are well-formed	
},

/*
 * Renders cards in the print output page. The user hits print after that.
 */
preparePrintOutput: function(self){
	
	var cards = self.cards; //TODO narrow it down based on which ones they chose
	var options = {
		printImages: $('#print-input-images').is(':checked')
	};
	template('template-print-table',$('#print-output-table-area'),{cards: cards, options: options});
	
	//handle clicks
	$('#print-output-button-print').oneClick(function(){
		window.print();
	});
},

print: function(self){
     var table = $('#printer-table');
     table.empty();
     
     $.mobile.changePage('#printer-output');  
     //update header
     $('#printer-output').find('.project-name').html(self.name);
     
     self.cards.forEach(function(card){
          var tr = getClonedTemplate('template-print-row');
          if(card.hasImage()){
               tr.find('.print-image').attr('src', card.getImageURL());
          }
          else{
               tr.find('.print-image').hide();
          }
          tr.find('.print-question-text').html(card.getQuestionText());
          tr.find('.print-answer-text').html(card.getAnswerText());
          table.append(tr);
     });
     
     (function(){window.print();}).delay(1000);
     
       
},

decompress: function(self){
    //map each of the raw cards into an array of fixed cards
    self.cards = self.rawCards.map(function(rawCard){
        //rawCard has question and answer, which is what we're going for
        //also, we stored rank as just a string - so revive that by looking it up
        return decompress(rawCard, "Card",
            [ 'question', 'answer', 'imageURL' ], //recreate faithfully
            [
                'repsLeft',
                { rank: function(goodCard, rawRank){
                    //rawRank contains just the name of the rank; look it up in the Rank object
                    return Rank[rawRank];
                }}
            ]);    
    });
    
    //get rid of raw status
    self.raw = false;   
    delete self.rawCards;     
},

save: function(self){
    chevre.save(self);
},

getCompressed: function(self){
        return compress(self, [
            'name',
            'description',
            'id',
            'group',
            { cards: function(compressedProject, rawCards){
                //rawCards = raw cards within project - array
                //compress each member of the cards array
                return rawCards.map(function(rawCard){
                    return compress(rawCard, [
                        'question',
                        'answer',
                        'imageURL',
                        'repsLeft',
                        { 'rank': function(compressedCard, rankObj){ 
                                return rankObj.name; //just "A" for Rank.A  
                            }}
                    ]);  
                });   
            }}  
        ]);     
}

});
