var Project = new Class({

    /**
     * @param {String} name   Project name. Make sure it's unique among projects here.
     * @param {Object} props	MANDATORY - Contains JSON-friendly info like:
	     * @param {String} description [optional, default null] additional text about the project.
	     * @param {String} id     [optional; default auto-generated] a unique id that is unique for EVERY PROJECT EVER. It should never change once the project is created.
	     * @param {String} group  [optional; default GROUP_DEFAULT] the name of the group that this project is in. Pass nothing if it's unorganized.
	     * @param {Object} shareInfo	[optional; default {}] contains information about this project's creator, url, password, etc.
	     * @param {String} lastModified	[optional; default now] The last time the cards or other props of this project were modified.
     * @param {Card[]} cards	[optional; default empty array] the cards this project owns.
     */
__init__: function(self, name, props, cards){
    self.name = name;
    /*//unpack values of props
    Object.extended(props).keys(function(key, value){
    	self[key] = value;
    });*/
   self.description = orDefault(props.description, null);
   var defaultID = "p" + Date.now() + (Math.floor(Math.random()*1000)+"").padLeft(3, 0); //get unix time + something random (just in case two projects are made at the EXACT same time.)
   self.id = orDefault(props.id, defaultID);
   self.group = orDefault(props.group, GROUP_DEFAULT);
   self.shareInfo = orDefault(props.shareInfo, {});
   self.lastModified = orDefault(props.lastModified, "" + Date.now());

    self.isEditing = false;
    self.cards = orDefault(cards, []);
    self.session = null;
    self.wrongCards = null; //cards they got wrong last session; temporary variable, filled in by session

},

    /**
     * @param {String} name   Project name. Make sure it's unique among projects here.
     * @param {String} description [optional, default null] additional text about the project.
     * @param {String} id     [optional; if omitted it's auto-generated] a unique id that is unique for EVERY PROJECT EVER. It should never change once the project is created.
     * @param {String} group  [optional, default GROUP_DEFAULT] the name of the group that this project is in. Pass nothing if it's unorganized.
     * @param {Object} shareInfo	[optional] contains information about this project's creator, url, password, etc.
     */
__init2__: function(self, name, description, id, group, shareInfo){
    self.name = name;
    self.description = orDefault(description, null); //TODO make this undefined by default so that it won't take up space when stored and there's nothing there
    self.isEditing = false;
    //self.lastStudied = null;
    if(!id){
         //get unix time + something random (just in case two projects are made at the EXACT same time.)
         id = "p" + Date.now() + (Math.floor(Math.random()*1000)+"").padLeft(3);
    }
    self.id = id;
    //self.id = Math.floor(Math.random() * 1000);
    self.cards = [];
    self.group = orDefault(group, GROUP_DEFAULT);
    self.shareInfo = orDefault(shareInfo, {});
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
    self.save();
    self.loadCardChart();
},

flipCards: function(self){
    //make all cards' question the answer and vice versa
    self.cards.forEach(function(card){
        var question = card.getQuestionText();
        var answer = card.getAnswerText(); //multiple choice card? sorry!
        card.setQuestion(answer);
        card.setAnswer(question);
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

getScore: function(self){
	var rawPoints = 0;
	Object.keys(Rank, function(key, value) {
		//value is a Rank object
		rawPoints += self.cards.filter(function(card) {
			return card.rank == value;
		}).length * value.score;
	});
	var points = Math.round(rawPoints/self.cards.length*100); //0 to 100
	return points;
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
     $('.btn-project-page[data-toggle="tooltip"]').tooltip();

     //managing clicking the buttons to go to each page; it's in the form .btn-launch-{slug}
     $('.btn-launch-create').oneClick(function(){
     	Editor.prepareCard(null); //to prepare for card __creation__
     });

     //description & name
     $('.univ-deck-name').html(self.name);
     self.reloadDescription();

     //tools
     $('#deck-btn-shuffle').oneClick(self.shuffle);
     $('#deck-btn-reset').oneClick(self.resetCards);
     $('#deck-btn-swap').oneClick(self.flipCards);

     //card chart
     self.loadCardChart.delay(100);
     $(window).resize(function(){
     	self.loadCardChart();
     });

     //INSIDE the batch page
     $('#batch-button-create').oneClick(function(){
     	self.batchCreate();
     });

    var img = new Image();
    self.cards.forEach(function(card){
     if(card.imageURL){
          img.src = card.imageURL;
     }
    });

},

updateManager: function(self){
    //show the spinny thingy
    //$.mobile.showPageLoadingMsg();

    //update UI
    $('#manage-input-filter').val('');

    /**
     * Enters either edit or delete mode, which changes what you can do to your cards.
     * @param {String} mode		a mode; get it from the ManageMode enum.
     */
    function enterMode(mode){
    	//ensure buttons are correctly styled and hide/show buttons appropriately
    	if(mode == ManageMode.EDIT){
    		//Timer.begin();
    		$('#manage-radio-mode-edit').parent().addClass('active');
    		$('#manage-radio-mode-delete').parent().removeClass('active');
    		//Timer.lap();

    		$('.manage-edit-card').show();
    		$('.manage-delete-card').hide();
    		//$('.manage-delete-card').addClass('manage-edit-card btn-default').removeClass('manage-delete-card btn-warning')
    		//	.find('.glyphicon').addClass('glyphicon-edit').removeClass('glyphicon-remove');
    		//Timer.lap();
    		//toast(Timer.getLapText(), {type: ToastTypes.SUCCESS});
    	}
    	else{
    		//Timer.begin();
    		$('#manage-radio-mode-edit').parent().removeClass('active');
    		$('#manage-radio-mode-delete').parent().addClass('active');
    		//Timer.lap();

    		$('.manage-edit-card').hide();
    		$('.manage-delete-card').show();
    		//$('.manage-edit-card').removeClass('manage-edit-card btn-default').addClass('manage-delete-card btn-warning')
    		//	.find('.glyphicon').removeClass('glyphicon-edit').addClass('glyphicon-remove');
    		//Timer.lap();
    		//toast(Timer.getLapText(), {type: ToastTypes.DANGER});
    	}
    }

    //empty card manager and refill
    var list = $('#manage-card-table');
    list.empty();

    //but first put in a loading text while we wait!
    //list.append(getClonedTemplate('template-flashcard-loading'));

    //USED BY LOADING CARDS
	var renderGroup = $.noop; //for storing the card rendering function

    /**
     * Loads the given Card[] into the card list.
     * @param {Card[]}	cards	all cards to load.
     * @param {String}	highlightText	[optional] if given, all instances of that text in the card are highlighted. Good for filtering.
     */
    function loadCards(cards, highlightText){
    	//if something else is loading, cancel that immediately!
    	renderGroup.cancel();
    	//Timer.begin();
    	//var timeString = "";

    	list.empty();

    	//preload click fns
    	//button for editing card
    	var editFn = function(){
	    	//get the hash, match it up, and edit that card
	    	var hash = $(this).data('hash');
	    	var card = self.getCardByHash(hash);
	    	card.edit(function(){
	    		//has the card been changed?
	    		if(card.getHash() != hash){
		    		//the card's been saved; reload
		    		loadCards(cards, highlightText);
	    		}
	    	});
    	};
    	//for deleting
    	var deleteFn = function(){
	    	//get the hash, match it up, and edit that card
	    	var hash = $(this).data('hash');
	    	var card = self.getCardByHash(hash);

	      	//update view
	      	$(this).closest('tr').remove();
	      	//update model
	      	self.cards = self.cards.subtract(card);
	      	self.save();
    	};

    	/**
    	 * Highlights the passed highlightText in all items in the given element.
    	 * @param {jQuery} elem	usually a list of paragraphs.
    	 */
    	var highlightFn = function(elem){
	    	//q and a are in <p>'s; replace any instances of text with bolded version
	    	elem.find('p').each(function(){
	    		var html = $(this).html(); //ONE question or answer text
	    		var matches = html.match(new RegExp(regexEscape(highlightText), "ig")); //ignore case; global search
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
    	};

    	//put in a few at a time
    	var cardGroups = cards.inGroupsOf(20);
    	//and put them in with a break after each
		renderGroup = function(group){
			group = group.compact(); //inGroupsOf puts null's at the end, which is bad
			var newItems = template('template-manage-cards', list, {cards: group}, true);
			//add handlers to the new items
			$(newItems).find('.manage-edit-card').oneClick(editFn);
			$(newItems).find('.manage-delete-card').oneClick(deleteFn);
			if(highlightText){
				highlightFn($(newItems));
			}
	    }.lazy(100);
    	cardGroups.forEach(function(group){
    		renderGroup(group);
    	});


    	//timeString += Timer.getDiff() + " "; Timer.begin();

    	//by default, enter edit mode
    	//enterMode(ManageMode.EDIT); //NEW this is already on by default

    	//timeString += Timer.getDiff() + " "; Timer.begin();

    	//highlight any instances of given text
    	if(highlightText){

    	}

    	//timeString += Timer.getDiff() + " "; Timer.begin();

    	//handle card clicks and all since these must be regenerated whenever you reload cards
	    //edit button
	    $('.manage-edit-card').oneClick(function(){

	    });

	    //timeString += Timer.getDiff() + " "; Timer.begin();

	    $('.manage-delete-card').oneClick(function(){

	    });

	    //timeString += Timer.getDiff() + " "; Timer.begin();

	    //toast(timeString);
    }

    //do this stuff later to reduce lag
    (function(){
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

	    //$('#manage-button-filter').oneClick(function(){
	    //change waits till they hit enter, keyup does it as soon as they hit a key... which is better? keyup is slicker but takes more resources since it reloads a lot
	    Timer.begin();
	    $('#manage-input-filter').oneBind('change keyup', function(){
	    	Timer.lap();
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
	    }.debounce(400) //give the field some time to settle down - if they're busy typing, don't reload after every single letter; wait until we're sure they're done. Average typing text ~= 300ms, but here's some leeway
	    );
	    $('#manage-button-filter-clear').oneClick(function(){
	    	$('#manage-input-filter').val('').trigger('change').trigger('keyup').focus();
	    });

	    //now we have some time. The first click of the mode buttons takes a LONG time (subsequent ones are faster), so get it out of the way now
	    //enterMode(ManageMode.DELETE);
	    enterMode(ManageMode.EDIT);
    }).delay(100);
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
    //Timer.begin();
    var delimiter = $('#batch-input-style').val();

    //multiple choice. TODO add selects for this
    var mcChoiceDelim = "|";
    var mcCorrectMarker = "*";

    //grab raw text containing all the cards
    var rawText = $('#batch-textarea').val(); //contains "Q-A \n Q-A \n Q-A ..."
    //Tara's Word problems; replace any long MS Word dashes (–) with normal ones (-) (side by side – -)
    rawText = rawText.replaceAll("–","-");
    //Timer.lap();

    //break into individual cards
    var rawCards = rawText.split('\n'); //now ["Q-A", "Q-A", ...]
    var malformedCards = []; //raw strings that don't work will be stored in this
    var numCardsCreated = 0;
    //Timer.lap();
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

            if(question == "" || answer == ""){
            	malformedCards.push(rawCard);
            	return;
            }

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
            numCardsCreated++;
        }
    });
    //Timer.lap();

    //cleanup
    self.save();
    //empty the text area and put in any malformed ones - so they can fix it and re-try
    var textarea = $('#batch-textarea');
    //Timer.lap();

    //was there malformed stuff?
    if(malformedCards.length > 0){
         var malformedString = malformedCards.join("\n");
         textarea.val(malformedString);//.css('height',0).change();
         textarea.focus();

         toast("Sorry &ndash; some of your cards weren't formatted right; they're still in the text box. Check the examples for help.", { type: ToastTypes.WARNING });
    }
    else{
         //all ok
         //textarea.val('').css('height',0).change();
         textarea.val('');

         toast(sprintf("Successfully created %d card%s!", numCardsCreated, numCardsCreated == 1 ? '' : 's'), {type: ToastTypes.SUCCESS});
    }

    //toast(Timer.getLapText());
	//alert(Timer.getLapText());

 /*(function show(){
      textarea.change(); //in case it got stuck @ 0 height... that tends to happen
 }).delay(200); //wait for a few pending things to finish
    */
},

/*
 * Renders cards in the print output page. The user hits print after that.
 */
preparePrintOutput: function(self){

	var cards = self.cards;
	var options = {
		printImages: $('#print-input-images').is(':checked')
	};
	var starsToPrint = []; //a card must have a number of stars equal to something in here, in order to be printed. we're using stars not ranks since the HTML uses stars and we can't easily work backwards
	for(var i=MIN_STARS; i<=MAX_STARS; i++){
		if($('#print-input-stars-' + i).hasClass('active')){
			//good, include it
			starsToPrint.push(i);
		}
	}
	//narrow down cards
	cards = cards.filter(function(card){
		return $.inArray(card.getStars(), starsToPrint) > -1;
	});

	template('template-print-table',$('#print-output-table-area'),{cards: cards, options: options});

	//handle clicks
	$('#print-output-button-print').oneClick(function(){
		window.print();
	});
},

/*
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
*/

updateLastModified: function(self){
	self.lastModified = "" + Date.now();
},

save: function(self){
    self.lastModified = Date.now();
    chevre.save(self);
},

getCompressed: function(self){
	var comp = {};
	comp.name = self.name;
	comp.description = self.description;
	comp.id = self.id;
	comp.group = self.group;
	comp.shareInfo = self.shareInfo;
	comp.lastModified = self.lastModified;
	comp.cards = self.cards.map(function(rawCard){
		var card = {};
		card.question = rawCard.question;
		card.answer = rawCard.answer;
		card.imageURL = rawCard.imageURL;
		card.repsLeft = rawCard.repsLeft;
		card.rank = rawCard.rank.name;
		return card;
	});
	return comp;
    /*
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
        */
}

});
