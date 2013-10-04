var feedback = new Singleton({
__init__: function(self){
     self.featureChoices = [
          //'Fill-in-the-blank studying', WILL DO
          'Equation/LaTeX support',
          'XML/CSV flashcard import',
          'Printable flashcards',
          'Sharing flashcards with friends',
          'Instant flashcard translation (good for foreign languages)'
     ];
},

/**
 * Asks for the user's feedback (pops open the dialog) assuming it's been long enough and the user has used Cabra enough.
 * This will do everything for you. Just call it when you're ready.
 * Note it may or may not open the dialog.
 * (You can also open that dialog directly.)
 * @return {boolean}     true if it opens the dialog (it's time), false otherwise
 */
ask: function(self){
     //hold on! do they even want us to?
     if (!chevre.options.askFeedback) return false;
     
     var daysSinceAsked = Date.create().daysSince(Date.create($.store.get(SL_KEYS.FB_LAST_ASKED)));
     var usesSinceAsked = $.store.get(SL_KEYS.FB_USES_SINCE_ASKED);
     
     if(daysSinceAsked >= FB_MIN_DAYS && usesSinceAsked >= FB_MIN_USES){
          //yes, show the dialog
         $('#feedback-why').show(); //explain WHY we're asking for feedback
          $.mobile.changePage('#feedback',{
               role: "dialog"
          });
          //reset so we ask them again later
          self.resetUsageStats();
          return true;
     }
     return false;
},

/**
 * Resets the metrics that measure how long it's been since we asked for feedback, effectively resetting the counter for next time.
 */
resetUsageStats: function(self){
     //reset #s
     $.store.set(SL_KEYS.FB_LAST_ASKED, Date.create().format());
     $.store.set(SL_KEYS.FB_USES_SINCE_ASKED, 0);
},

loadDialog: function(self){
  //specifically load the feature choices
  var holder = $('#feedback-choices');  
  var i = 0;
  self.featureChoices.forEach(function(choice){
       var span = getClonedTemplate('#template-feedback');
       var id = 'feedback-choice-' + i;
       span.find('input').attr('name','feedback-choices-choices').attr('id',id);
       span.find('input').val(choice); //that's what we'll actually read
       span.find('label').attr('for',id).html(choice);
       
       holder.append(span.html());
       i++;
  });
  
  holder.trigger('create').controlgroup();
},

/**
 * Sends the feedback. Call this when the submit button's pushed. 
 */
submit: function(self){
     //get their actual feedback
     var results = self.grabFeedback();
     //console.log(results);
     
     console.log('Sending feedback...');
    $.post(
         feedbackURL,
         results,
         function(data){
              //they'll give the number 1
              console.log(data);
         }
    );
    
    self.resetUsageStats(); //they gave it to us now so let's not ask them soon
    
},

/**
 * Gets the user's input from the choices list.
 * @return {Object} an object with the user's feedback contained within it, as strings.
 */
grabFeedback: function(self){
     //get from choices list
     //TODO find some way to make these things required so they HAVE to fill it out (put in form?)
     
     var choices = $('#feedback-choices input:checked').val(); //gives you text or id (#) of what they want
     var comments = $('#feedback-comments').val(); //comments
     var email = $('#feedback-email').val();
     
     return {
          'choices': orDefault(choices, ""),
          'comments': orDefault(comments, ""),
          'email': orDefault(email, ""),
          'version': ABOUT.version,
          
          '_pw': "3*%2EOHitrY^" //securing w/ password
     }
},

/**
 * Checks what the user checked in the "Don't show feedback dialog again" box and updates prefs accordingly 
 * @param {Object} self
 */
checkDontShow: function(self){
     var dontShow = truthiness($('#feedback-dont-show:checked').length);
     chevre.options.askFeedback = !dontShow; //cause we're asking if they DON'T want to be asked again
     chevre.saveOptions();
}
});
