var backup = new Singleton({
__init__: function(self){
     //the export formats. The string vals should match the select menu's option's vals
     self.formats = {
          XML: "xml",
          JSON: "json",
          commaSep: "commaSep", //q/a sep'd by a comma
          slashSep: "slashSep", //sep'd by /
          enterSep: "enterSep" //enter between q&a, two enters between cards
     }     
},

loadPage: function(self){
     $('#export-output').hide(); //that contains stuff only to be seen AFTER running export  
     //$('#export-text').css('height',0); //do it now... we'll prob need to do it later so do it while the user isn't watching
    // $('#export-preview-holder').hide();  
     //$('#export-live-preview').html('');

	$('#export-input-format').bind('change',function(){
	     //update live preview
	     var format = $('#export-input-format').val();
	     self.livePreview(format);
	});
	$('#export-button-run').oneClick(function(){
	     var format = $('#export-input-format').val();
	     self.runBackup(format);
	});      
	
	//by default let's preview the first thing
	     var format = $('#export-input-format').val();
	     self.livePreview(format);	
},

livePreview: function(self, format){
     var area = $('#export-live-preview');
     if(!format){
          //nothing, clear the live preview area
          area.html('');
     }
     else{
          //format some dummy cards
          //TODO do this but with the first 2 cards from the actual project
          var dummies = [
               new Card('2+2',4),
               new Card('What color is the sky?', 'Blue', 'http://imgur.com/kYnPaIz.jpg')
          ];
          var formatted = self.formatCards(format, dummies, true);
          $('#live-preview-holder').show();
          area.htmlFade(formatted);
     }
},

/**
 * Exports the current project's cards to the text area. 
 */
runBackup: function(self, format){
     //ensure it's a valid format
     if(Object.values(self.formats).indexOf(format) == -1) return false;
     
     var text = self.formatCards(format, chevre.p.cards, false); //in textarea not html
     $('#export-output-text').val(text);
     //.css('height',0).change(); //triggers autogrow to make it just fit; see http://is.gd/Nwssxa
     
     //update filename extension to save to
     var extension = 'txt';
     switch(format){
          case self.formats.XML:   extension = 'xml'; break;
          case self.formats.JSON:  extension = 'json'; break;
          case self.formats.commaSep:   extension = 'csv'; break;
          case self.formats.slashSep:   extension = 'csv'; break; //TODO consider .tsv (tab-sep vals) or .txt
          case self.formats.enterSep:   extension = 'txt';
     }
     $('#export-output-extension').html(extension);
     
     $('#export-output').show();
     $('#export-output-text').focus().select();
},

/**
 * given cards into a string that's ready to be shown to the user.to the user.
 * @param {Object} format     Something from self.formats.
 * @param {Card[]} cards      An array of cards.
 * @param {boolean} html      True if the text should be rendered as HTML (<br> etc), false if rendered for textarea (\n etc.)
 * @return {String} the cards in string form, based on the format.
 */
formatCards: function(self, format, cards, html){
     var text = ""; //fill me w/ text
     //TODO this only does cards... add proj name and description too. In that case it'd need a full-fledged project
     switch(format){
     case self.formats.XML:
          //TODO maybe jQuery-fy it? (but there's no real benefit there) like $('<set></set>')
          text = "<set>";
          cards.forEach(function(card){
               var item = "\n<card>";
               item += sprintf("\n\t<question>%s</question>", card.getQuestionText());
               item += sprintf("\n\t<answer>%s</answer>", card.getAnswerText());    
               if(card.hasImage()){
                    item += sprintf("\n\t<image>%s</image>", card.getImageURL());     
               }
               item += "\n</card>";
               text += item;
          });
          text += '\n</set>';
          break;
     case self.formats.JSON:
          //just JSON'ify the whole thing, then pretty it up w/ some enters
          //get rid of anything but the question/answer/image
          cards = cards.map(function(card){
               var c = {};
               c.question = card.getQuestionText();
               c.answer = card.getAnswerText();
               c.image = card.getImageURL();
               return c;
          });
          text = JSON.stringify(cards);
          text = text.replaceAll("},{","},\n{"); //newline after each item
          break;
     case self.formats.commaSep:
          cards.forEach(function(card){
               text += card.getQuestionText() + "," + card.getAnswerText();
               text += "\n";
          });
          text = text.substring(0, text.length-1); //cut off last \n... it's only treated as 1 char
          break;
     case self.formats.slashSep:
          cards.forEach(function(card){
               text += card.getQuestionText() + "/" + card.getAnswerText();
               text += "\n";
          });
          text = text.substring(0, text.length-1); //cut off last \n
          break;
     case self.formats.enterSep:
          cards.forEach(function(card){
               text += card.getQuestionText() + "\n" + card.getAnswerText();
               text += "\n\n";
          });
          text = text.substring(0, text.length-2); //cut off last \n\n
          break;                    
     }
     
     if(html){
          //escape any tags
          text = text.escapeHTML(); //remove any currently existing tags; <br>'s should NOT be escaped
          text = text.replaceAll("\n","<br>").replaceAll("\t","&nbsp;".repeat(5));
     }
     
     return text;
}
     
});
