var Project = new Class({
    
    /**
     * @param {String} name   Project name. Make sure it's unique among projects here.
     * @param {String} id     [optional; if omitted it's auto-generated] a unique id that is unique for EVERY PROJECT EVER. It should never change once the project is created.
     * @param {String} description [optional, default null] additional text about the project.
     * @param {String} group  [optional, default GROUP_DEFAULT] the name of the group that this project is in. Pass nothing if it's unorganized.
     */
__init__: function(self, name, id, description, group){
    self.name = name;
    self.description = orDefault(description, null); //TODO make this undefined by default so that it won't take up space when stored and there's nothing there
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

load: function(self){
    //load home page
    //$('#project-name').html(self.name);
    //$(document).attr('title', self.name);
    
    //$('#study-session-init-button').toggle(self.cards.length > 0);
    
    //show description text if there is any; otherwise show the description entry stuff
    self.showOrHideDescription();
    
    //self.prepareCreateCardPage(CARD_CREATE);
    $('#create-card-link').oneBind('click.cc', function(){
     self.prepareCreateCardPage(CARD_CREATE);      
    });
    
    //create card button in batch creator
    $('#batch-create-button').oneClick(function(e){
        //grab delimiter - from select
        var delimiter = $('#batch-style').val();
        
        //multiple choice. TODO add selects for this
        var mcChoiceDelim = "|";
        var mcCorrectMarker = "*";
        
        //grab raw text containing all the cards
        var rawText = $('#batch-text').val(); //contains "Q-A \n Q-A \n Q-A ..."
        
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
        var textarea = $('#batch-text');
        
        //was there malformed stuff?
        if(malformedCards.length > 0){
             var malformedString = malformedCards.join("\n");
             textarea.val(malformedString).css('height',0).change();
             textarea.focus();   
             
             e.preventDefault();
             
             toast("Sorry &ndash; some of your cards weren't formatted right; they're still in the text box! Check the Mass Creator Help.", { error: true });
        }
        else{
             //all ok
             textarea.val('').css('height',0).change();
        }
        

     (function show(){
          textarea.change(); //in case it got stuck @ 0 height... that tends to happen
     }).delay(200); //wait for a few pending things to finish
        
        //TODO: prevent the button from going back to main immediately; only go there programmatically if all cards are well-formed
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
    });
    /*$('#card-viewer').oneBind('pageshow', function(){
          // set up click/tap panels
          $('.flip-click').click(function() {
               $(this).toggleClass('flip');
          });
    });*/
   
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
},

/**
 * Prepares/loads the card creation dialog/page.  
 * @param {String} usageType  CARD_CREATE if you're making a card from scratch, CARD_EDIT if you're editing a current card. If you are editing a card, pass the card as the next arg.
 * @param {Card} card    [optional] if you're editing a card, pass its value here.
 */
prepareCreateCardPage: function(self, usageType, card){
     var editing = usageType == CARD_EDIT && card !== undefined;
     if(!card) card = null;
     
    //handle clicks
   var questionField = $('#create-card-question');
   var answerField = $('#create-card-answer');
   var imageField = $('#create-card-image');
   var preview = $('#create-card-image-preview');
   var previewHolder = $('#create-card-image-holder');    
 
     //update various interface things based on whether you're editing or now
     var page = $('#create-card');
     page.find("div[data-role='header']").find('a').toggle(!editing); 
     $('#question-choice-navbar').toggle(!editing);
     
     //preload
     if(editing && card.hasImage()){
          //open collapsible, load preview
          previewHolder.slideDown();
          preview.attr('src', card.imageURL);
          $("#create-card-image-collapsible").trigger('expand');  
          $('.create-image-hint').hide();
          $('.edit-image-hint').show();    
     }
     else{
        previewHolder.slideUp();   
        preview.removeAttr('src');       
        $('#create-card-image-collapsible').trigger('collapse');   
          $('.create-image-hint').show();
          $('.edit-image-hint').hide();           
     }
     
     if(editing){
          $('#create-card-question').val(card.question);
          if(!card.isMultipleChoice()) $("#create-card-answer").val(card.answer);

     }
     else{
          $('#create-card-question').val('');
          $('#create-card-answer').val('');
     }  
        
     $('.create-buttons').toggle(!editing);
     $('.edit-buttons').toggle(editing);

     //$('label[for="create-card-image"]').html(editing ? "")  
    
     
            
    //when image is added/changed, immediately uploaded it
    imageField.oneBind('change.uploadImage', function(){
         
         //clear the old preview
         previewHolder.slideUp();
         preview.removeAttr('src');
         
         //if val == "" then it was cleared, else it was set
         if(imageField.val()){
               //get uploading
               $.mobile.loading("show", {
                    text : "Uploading your image...",
                    textVisible : true,
                    textOnly : false,
                    theme : "b"
               });

               imageField.uploadImage(function success(imageURL) {
                    $.mobile.loading("hide");

                    preview.attr('src', imageURL);
                    previewHolder.slideDown();
                    
                    //update hint
                    $('.create-image-hint').hide();
                    $('.edit-image-hint').show();  
                    
                    imageField.val(null);

                    toast("Your image was successfully uploaded!")
               }, function failure() {
                    imageField.val(null);
                    $.mobile.loading("hide");
                    toast("Uploading image failed. Either your internet is disconnected, or something else is wrong. Try again later.", {
                         duration : TOAST_DURATION_LONG,
                         error : true
                    });
               });
               
                
          }
          else{
               //cleared
               $('.create-image-hint').show();
               $('.edit-image-hint').hide();               
          }
    });  
    
    //remove image?
    $('#create-card-image-clear').oneClick(function(){
     previewHolder.slideUp();
     preview.removeAttr('src');   
     $('.create-image-hint').show();
     $('.edit-image-hint').hide();      
    });
    
    //card creator page!
    
    function addMCAnswer(answerText){
         var container = getClonedTemplate('template-mc-answer-container');
         if(answerText)
          container.find('input.mc-answer').val(answerText);
         //associate label and input dynamically
         //var id = "mc-answer-" + Math.floor(Math.random()*1000);
         //container.find('label.mc-answer-label').attr('for',id);
         //container.find('input.mc-answer').attr('id',id);
         container.hide();
         container.insertBefore($('#create-mc-add-choice').parent()); //get around button's wrapper div
         
         
         $('#create-mc-answers').trigger('create');
         
         container.slideDown();
         container.find('.ui-input-clear').oneClick(function(){
              //there MUST be at least 2 answer choices!
              var numChoices = $("#create-mc-answers").find('input.mc-answer').length;
              if(numChoices <= 2) return;
              
              //remove input 
              $(this).parent().parent().slideUp(function(){
                   $(this).remove();
                   updateMCAnswers();
              });    
                           
         });
         container.find('.ui-input-clear').attr('tabindex','-1');
         container.find('input.mc-answer').focus();
         
         (function(){updateMCAnswers();}).delay(100);
         
    }
    
    //call me when you add/remove a mc item
    function updateMCAnswers(){
         var numChoices = $("#create-mc-answers").find('input.mc-answer').length;
         //if there are 2 choices, hide the delete buttons, otherwise show them
         $('#create-mc-answers').find('.ui-input-clear').toggle(numChoices > 2); //shown if >2, hidden otherwise
    }
    
    $('#question-choice-free').oneClick(function(){
         $('#create-section-free').show();
         $('#create-section-mc').hide();      
    });
    $('#question-choice-mc').oneClick(function(){
         resetMCAnswers();  
         $('#create-section-free').hide();
         $('#create-section-mc').show(); 
    });  
        
    function resetMCAnswers(){
         //clear existing inputs
         $('#create-card').find('.mc-answer-container').remove();
         //add a few inputs
         if(editing){
              //load current choices
              card.getMCAnswers().forEach(function(choice){
                   addMCAnswer(choice);
              });
              //click right answer
              $('#create-mc-answers').find('input.mc-answer-radio').eq(card.answer.right).click().click(); //not sure why 2 clicks are needed; if you only do 1 it won't change
         }
         else{
              var DEFAULT_NUM_CHOICES = 4;
              for(var i=0; i<DEFAULT_NUM_CHOICES; i++){
                   addMCAnswer();
              }    
         }     
    }    
     //resetMCAnswers();
     

    
    //add new choice button
    $('#create-mc-add-choice').oneClick(function(){
         addMCAnswer();
     });
    
    //'click' whatever's currently open so that the listeners fire
    $('#question-choice-navbar').find('.ui-btn-active').click();
    
    if(editing){
         if(card.isMultipleChoice()) $('.multiple-choice-tab').click();
         else $('.free-response-tab').click();
    }
    
    //create card button in the card creator page (where the cards are ACTUALLY created)
    $('.create-card-button').oneClick(function(e){
         //what type of question is it? based on that, choose question and answer vars accordingly
         var question = questionField.val();
         var answer;
         var rightAnswer; //string of text of right answer
         
         if(!$('#create-section-free').is(':hidden')){
              //free-response is open
              answer = answerField.val();
         }
         else if(!$('#create-section-mc').is(':hidden')){
              //multiple-choice is open
              
              //check answer choices
              var rawEntries = $('#create-mc-answers').find('.mc-answer').map(function(){ return $(this).val(); }); //jQuery; has value of every input, even empty ones
              rawEntries = rawEntries.toArray().compact(true).unique(); //convert to normal js array and get rid of empty inputs which show up as ""
              //there MUST be >=2 OK entries here
              if(rawEntries.length >= 2){
                   answer = { choices: rawEntries };
              
                   //check what the right answer is
                   var rightAnswer = $('#create-mc-answers').find('.mc-answer-radio:checked')
                                        .closest(".mc-answer-container").find('.mc-answer').val(); //text of input next to the check button; i.e. text of right answer
                   if(rightAnswer){
                        //which index is this?
                        var index = answer.choices.indexOf(rightAnswer);
                        if(index != -1) answer.right = index;
                        else answer = false;
                   }                   
                   else{
                        answer = false;
                   }
              }
              else{
                   answer = false;
              }

         }
         
        
        //must provide question & answer
        if(question && answer){
             //clean them out NOW for the only time
             question = cleanInput(question);
             if(answer.hasOwnProperty('choices')) answer.choices = cleanInput(answer.choices); //MC
             else answer = cleanInput(answer); //free resp
             
             if(editing){
                  card.setQuestion(question);
                  card.setAnswer(answer);
             }
             else{
                  card = new Card(question, answer);
                  self.addCard(card);
             }
             self.save();
            
         
            
            //if they specified an image, have it be added and then re-save (async)
            //do it now anyway (if they added an image, we'll just re-save later)
            if(preview.attr('src')){
                 //preview's already done, just grab the url they got there
                 var imageURL = preview.attr('src');
                 card.setImageURL(imageURL);    
                 self.save();          
            }
            
            
            //clear the fields
            questionField.val('');
            answerField.val('');
            imageField.val('');
            previewHolder.slideUp();  
            preview.removeAttr('src');
            
            if(card.isMultipleChoice())
               resetMCAnswers();
            
            //give page focus to question field
            questionField.focus();            
        }
        else{
            //they omitted one or both
            if(!question) questionField.focus();
            else if(!answer) answerField.focus();
            
            e.preventDefault();
        }

    });
    $('.cancel-create-card-button').oneClick(function(){
        //empty fields and get back
        $('#create-card-question').val('');
        $('#create-card-answer').val('');  
        $("#create-card-image").val(''); 
    });
    $('.delete-card-button').oneClick(function(){
         if(editing){
          self.cards = self.cards.subtract(card);
          self.save();     
         }
    }); 
},

updateManager: function(self){
    //show the spinny thingy
    //$.mobile.showPageLoadingMsg();
    
    //empty card manager and refill
    var list = $('#card-manager-list');
    list.empty();
    
    //now before we add anything, disable searching until we're done
    var searchBar = $('#card-manager').find('.ui-input-text'); //the text field
    searchBar.attr('disabled','disabled');
    var originalSearchBarText = searchBar.attr('placeholder'); //restore later
    searchBar.attr('placeholder','Please wait...'); //TODO maybe remove this
    
    /*
     * We're being super cheap here:
     * First put in a dummy li and enhance it, and copy the enhanced HTML. That's what each LI will look like.
     * Then break the card list into chunks.
     * Add each card in a chunk. Use the enhanced LI template we got earlier.
     * Take a short break so it doesn't freeze up.
     * Continue with another chunk.
     */
    
    //add dummy li to see what it's like when enhanced
    var template = getClonedTemplate('template-card');
    list.append(template);
    list.listview('refresh');
    var liFixedHTML = list.html(); //this is how jqm enhances it
    list.empty();
    
    var chunkList = self.cards.inGroupsOf(CHUNK_SIZE); //breaks into a list of card chunks
    var chunkNum = 0;
    chunkList.forEach((function(chunk){
        //chunk contains a bunch of cards; add them all on
        chunk = chunk.compact(); //remove nulls at end
        chunk.forEach(function(card){
            //add in one card
            var li = $(liFixedHTML); 
            card.fillLI(li);
            
            //handle clicks
            li.find('.card-manager-edit-button').oneBind('click.edit', function(){
                 self.prepareCreateCardPage(CARD_EDIT, card);
            });
            //<TODO>: make this more efficient - attach handler to list with scope, not to each individual button 
                    
            list.append(li);                
        });
        
        if(chunkNum == 0){
             //if this is the FIRST chunk, prettify the listview now so that user won't see rounded corners (they'll see the first bit prettified; the rest will be unprettified but they won't see that immediately)
            list.listview('refresh'); 
        }
        

        chunkNum++;
        //list.listview('refresh');  //this slows it down a bit by re-prettifying each and every li
    }).lazy(BREAK_TIME)); //after each chunk, pause for a bit
    
    //lazy will make it take a bit of time; run full refresh once all are done
    var delay = chunkList.length * (BREAK_TIME + 100); //100: provide a bit of buffer for function to run
    (function(){ 
         //anything to run once we're all done
         //re-enable search bar
         searchBar.removeAttr('disabled');
         searchBar.attr('placeholder',originalSearchBarText);         
         
         list.listview('refresh');  //remove rounded edges and combine into list a bit later (else it'll lag or just not happen)
    }).delay(delay);
},

loadCardChart: function(self){
    if(self.cards.isEmpty()){
        //no cards, draw nothing$
        $('#project-card-chart').empty()
        //$('#project-card-chart').css({ 'height': '25px' }); //otherwise there would be a lot of empty space since the charts force it to be 300px //PROBLEM: after this, the charts stay 25px so it looks weird
        $('#project-card-chart').html('This project has no cards. Make some!');
        return;
    }
    
    $('#project-card-chart').empty();
    
    //map out how many cards have which rank
    var data = [];
    Object.each(Rank, function(key, value){
        //key is the rank name - like Rank.A, Rank.B, etc.
        //value is the actual object
        //count how much of our cards are that   
        var numCards = self.cards.count(function(card){
            return card.rank == value;    
        });     
        
        //add on to data - the rank's name and the # of cards
        data.push([ 'Rank ' + value.name, numCards ]);
    });
    
    //pluralize the title word Flashcard if necessary
    var titleWord = 'Flashcard';
    titleWord += self.cards.length != 1 ? 's' : '';
    
    try{
        $.jqplot('project-card-chart', [data], {
            title: self.cards.length + ' ' + titleWord, //can change
            seriesColors: Object.values(Rank).map(function(rank){ return rank.color; }), //the ranks' colors, in order
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
                location: 'e'
            }    
        });
    }
    catch(ex){
        //This error often thrown when the slices the pie tries to draw are too tiny; eg 1/150 cards has rank A
        console.log(ex);
    }
},

/**
 * Called when the Print Setup button is pushed.
 */
setupPrint: function(self){
     self.print();     
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
            'id',
            'description',
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
