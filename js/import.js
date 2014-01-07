/*
 * Various tools for importing from various sources.
 * 
 * importer.quizlet() - asks the user for a name, gets some cards from Quizlet, and imports them
 */

var importer = {

quizlet: function(){
    //when the quizlet submit button is clicked, grab the search text
    $('#button-import-send').oneClick(function(){
        var searchText = $('#input-import-text').val();
        if(searchText){
        	//put in the loader while we're waiting
        	var html = getClonedTemplate('template-import-loading').html();
        	$('#import-list-quizlet').html(html);
            importer.quizletText(searchText);
        }    
    });
},
quizletText: function(text){
    //called with certain text to search for
    //grab JSON
   $.ajax({
       url: QUIZLET.api.searchSets + text.escapeURL(),
       crossDomain: true,
       dataType: "jsonp",
       success: function(response){
           //if there was an error, response has .error
           if(response.error){
               //clean up and get out
               //TODO add alert
               //$('#quizlet-list').empty().append($('<li>No projects found! :(</li>')).listview('refresh');
               
               //console.log(response);
               return;
           }
           
           var projects = response.sets.first(QUIZLET.maxToLoad); //array of Set objs; there are tons of these
           //Set has id, title, term_count, description
           //https://quizlet.com/api/2.0/docs/searching-sets/
           var list = $('#import-list-quizlet');
           template("template-quizlet-import-project", list, {projects:projects});
           list.find('.panel-collapse').on('show.bs.collapse', function(){
	           	//collapsible opened; show some samples
	           	var id = $(this).data('id');
	           	importer.quizletGetSampleCards(id, $(this).find('.import-preview-list'));	
           });
           list.find('.btn-more-samples').oneClick(function(){
	           	//more samples!
	           	var parent = $($(this).closest('.panel-collapse'));
	           	var id = parent.data('id');
	           	importer.quizletGetSampleCards(id, parent.find('.import-preview-list'), false); //NEW: replace, don't append... TODO consider appending (but then there's problems if the list is too short or cards are repeated)        	
           });
           list.find('.btn-import').oneClick(function(){
	           	var parent = $($(this).closest('.panel-collapse'));
	           	var id = parent.data('id');
	           	importer.quizletID(id);
	           	nav.openPage(NAV_BASE);           		
           });       
       }
   });    
},

/*
 * Loads sample cards for the project with the given ID and puts it in the given container.
 * @param {String} id	from Quizlet
 * @param {jQuery} container	where to put some sample cards. They'll be added as list items so give a list view.
 * @param {boolen} append		[optional, default false] if true, we'll add to the current list of samples.
 */
quizletGetSampleCards: function(id, container, append){
   $.ajax({
       url: QUIZLET.api.getSet + id,
       crossDomain: true,
       dataType: "jsonp",
       success: function(response){
       		//we want a few terms (aka cards)
       		var cards = response.terms.randomize().first(NUM_SAMPLE_CARDS);
       		template("template-quizlet-import-preview",container,{cards:cards}, append);   
       }
   }); 	
},

quizletID: function(id){
    //called with certain id of project to get
   $.ajax({
       url: QUIZLET.api.getSet + id,
       crossDomain: true,
       dataType: "jsonp",
       success: function(response){
           //has title, description (maybe; it's "" if not there), terms
           var name = response.title;
           var description = orDefault(response.description, undefined);
           var project = new Project(name, description);
           var cards = response.terms.map(function(rawCard){
            //this has term (q) and definition (a), as well as image (rawCard.image.url)
            //convert to a proper card
            //they may have nothing as question and answer (undefined) or may have empty string, so give default values to avoid function havoc
            var question = orIfFalsy(rawCard.term, " ");
            var answer = orIfFalsy(rawCard.definition, " ");
            var imageURL = undefined;
            if(rawCard.image && rawCard.image.url) imageURL = rawCard.image.url;
            return new Card(question, answer, imageURL);  
           }); //this is good cards
           project.cards = cards;
           
           importer.acceptProject(project);
       }
   });      
},

/**
 * Once you have a project chosen, loaded with cards, and selected by the user to import, call this. 
 * @param {Project} project an imported project.
 */
acceptProject: function(project){
   chevre.addProject(project);
   
   //go to that project's page
   chevre.loadProject(project);
   nav.openPage('deck-home');    
}
    
};
