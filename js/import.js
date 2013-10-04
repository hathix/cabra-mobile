/*
 * Various tools for importing from various sources.
 * 
 * importer.quizlet() - asks the user for a name, gets some cards from Quizlet, and imports them
 */

var importer = {

quizlet: function(){
    //when the quizlet submit button is clicked, grab the search text
    $('#quizlet-search-submit').oneClick(function(){
        var searchText = $('#quizlet-search').val();
        if(searchText){
            importer.quizletText(searchText);
        }    
    });
},
quizletText: function(text){
    //called with certain text to search for
    $.mobile.loading('show', {
        text: 'Finding projects...',
        textVisible: true,
        theme: 'b'
    }); //that spinner thingy
    //grab JSON
   $.ajax({
       url: QUIZLET.api.searchSets + text.escapeURL(),
       crossDomain: true,
       dataType: "jsonp",
       success: function(response){
           //if there was an error, response has .error
           if(response.error){
               //clean up and get out
               $.mobile.loading('hide');
               //TODO: show an alert (this would be best with jqm1.2 which will have this feature), and remove the stuff below
               $('#quizlet-list').empty().append($('<li>No projects found! :(</li>')).listview('refresh');
               
               //console.log(response);
               return;
           }
           
           var projects = response.sets.first(QUIZLET.maxToLoad); //array of Set objs
           //Set has id, title, term_count
           //https://quizlet.com/api/2.0/docs/searching-sets/
           var list = $('#quizlet-list');
           list.empty();
           projects.forEach(function(project){
                //create an li from the template and add to the list; the user will choose one of these
                var li = getClonedTemplate('template-quizlet');
                li.find('.quizlet-name').html(project.title);
                //li.find('.quizlet-description').html(project.description); //not available in short form
                //li.find('.quizlet-description').html(project.subjects.first(5).join(", ")); //this shows tags
                li.find('.quizlet-card-count').html(project.term_count);
                li.find('.quizlet-import-button').oneClick(function(){
                    //we now have the id; look that up!
                    importer.quizletID(project.id);
                });
                
                //grab a few cards from the top
                
                list.append(li);
           });
           
            //hide that spinner thingy which we showed earlier
            $.mobile.loading('hide');
           
           list.listview('refresh');
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
            //they may have nothing as question and answer (undefined), so make those things null to avoid function havoc
            var question = orDefault(rawCard.term, " ");
            var answer = orDefault(rawCard.definition, " ");
            var imageURL = undefined;
            if(rawCard.image && rawCard.image.url) imageURL = rawCard.image.url;
            return new Card(question, answer, imageURL);  
           }); //this is good cards
           project.cards = cards;
            
           //show them sample cards & info about proj
           //the #importer-sample dialog has been opened by <a> elem, let's fill it w/ info
           $('#importer-sample-name').html(project.name);
           $('#importer-sample-description').html(project.description);
           $('#importer-sample-numcards').html(project.cards.length);
           
           //fill in some sample cards so they know what they're importing
           var sampleCards = project.cards.sample(NUM_SAMPLE_CARDS); //a few random cards
           //get an li for each
           var list = $('#importer-sample-list');
           list.empty();
           sampleCards.forEach(function(card){                   
               var li = getClonedTemplate('template-card');
               //fill in Q&A
               card.fillLI(li);
               //get rid of <a>... links to edit card which is useless
               li.find('a').attr('href','#');
               //get rid of any counter w/ the rank
               li.find('.ui-li-count').remove();
               //TODO copy that template in the HTML code... it's becoming very different than template-card. Maybe call it template-quizlet-card.
               list.append(li);
           });
           list.listview('refresh');
            
           //hook up buttons to accept/reject this set
           $('#importer-sample-accept').oneClick(function(){
            importer.acceptProject(project);
            //$(this).unbind('click'); //TODO figure out why this works. WITHOUT IT: first time you import something it's OK. Second time (w/ same keyword), you import the first thing AND the second thing. It appears that this click handler fires twice
           });
           $('#importer-sample-cancel').oneClick(function(){
               //$('#importer-sample').dialog('close');
           });           
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
   $.mobile.changePage('#project-home');
   chevre.loadProject(project);    
}
    
};
