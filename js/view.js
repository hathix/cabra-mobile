/**
 * Handles all button clicks. 
 */
function initClicks(){
     
//home

//open options/menu panel on swipe
$('#home').oneBind( "swipeleft swiperight", function(e) {
     // We check if there is no open panel on the page because otherwise
     // a swipe to close the left panel would also open the right panel (and v.v.).
     // We do this by checking the data that the framework stores on the page element (panel: open).
     if ($.mobile.activePage.jqmData("panel") !== "open") {
          if (e.type === "swipeleft") {
               $("#menu-panel").panel("open");
          } else if (e.type === "swiperight") {
               $("#options-panel").panel("open");
          }
     } else {
          //close any existing one
          if (e.type === "swipeleft") {
               $("#options-panel").panel("close");
          } else if (e.type === "swiperight") {
               $("#menu-panel").panel("close");
          }
     }
     });

    
//make project
$('#create-project-button').bind('click',  function(){
    var projName = $('#project-name-field').val();
    if(projName && projName.trim() != ""){
        chevre.addProject(new Project(projName));   
        $('#project-name-field').val(''); //clear field 
    }
});
//import from quizlet
$('#quizlet-import-button').oneClick(function(){
    importer.quizlet();    
});

//project home
//$('#project-list').listview(); //TODO figure this out
/**
 * if we call this line here, we get an error if reloading from a different page (on Project page -> reload -> throws error once it gets to home page and calls this line)
 * What's the problem with calling listview here?
 */

//project options/edit
var editDialog = $('#project-edit-dialog');
$('#project-edit-delete').click(function(){
    //grab the project from the dialog's data
    var project = editDialog.jqmData('project');
    chevre.removeProject(project);
});
$('#project-edit-merge').click(function(){
    //the dialog asking what to merge into will appear
    //mergeFrom project is the one that was clicked
    var project = editDialog.jqmData('project');
    
    //fill in data
    $('#merge-project-name').html(project.name);
    //fill the select with each other project
    var select = $('#merge-project-select');
    select.empty();
    chevre.projects.forEach(function(optionProject){
        if(optionProject.equals(project)) return; //can't merge into the project we're merging from
        var option = $('<option></option>');
        option.html(optionProject.name);
        option.val(optionProject.id);
        //console.log(option.html());
        select.append(option); 
    });
    select.selectmenu('refresh'); //TODO figure out why there's an error here, although it doesn't break anything
});
$('#merge-project-button').click(function(){
    //the button was actually clicked! figure out mergeFrom and mergeTo
    var mergeFrom = editDialog.jqmData('project');
    var mergeToID = $('#merge-project-select').val();
    var mergeTo = chevre.getProjectByID(mergeToID);
    //console.log(mergeFrom.name + " -> " + mergeTo.name);
    chevre.mergeProjects(mergeFrom, mergeTo);
});

$('#project-edit-rename').click(function(){
    //grab the project from the dialog's data
    var project = editDialog.jqmData('project');
    //load the project rename dialog with this project's info
    $('#project-rename-field').val(project.name);
});
$('#rename-project-button').click(function(){
    //grab the project from the dialog's data
    var project = editDialog.jqmData('project');    
    //now change project's name
    var newName = $('#project-rename-field').val();
    if(newName){
        project.name = newName;
        //find its div - it's project-div-[id#], and the name is stored in the a.project
        $('#project-div-' + project.id).find('.project-name').html(newName);
        
        chevre.save();
    }
});

//backup
$('#backup').oneBind('pageshow',function(){
     backup.loadPage();
});
$('#backup-format').bind('change',function(){
     //update live preview
     var format = $('#backup-format').val();
     backup.livePreview(format);
});
$('#backup-run').oneClick(function(){
     var format = $('#backup-format').val();
     backup.runBackup(format);
});

/*
//command line
$('#command-line-enter').click(function(){
   var result;
   try{
       result = eval($('#command-line-input').val()) + "";
   }
   catch(error){
       //error? show them
       result = error + "";
   }
   $('#command-line-output').html(result); 
});
*/

//sync
$('#sync-home').bind('pageshow', function(){
    //is sync set up?
    var already = $('#sync-already-set-up');
    var notyet = $('#sync-not-set-up');
    if(chevre.syncActivated()){
        //yup; hide the not set up and show already set up
        notyet.hide();
        already.show();
        //fill in the proper field with our passcode
        $('#sync-passcode-reminder').html($.store.get(SL_KEYS.SYNC_KEY));
    }    
    else{
        //nope, not set up yet
        notyet.show();
        already.hide();
    }
});
$('#sync-start').click(function(){
    //grab passcode, save it, and get syncing
    var passcode = $('#sync-passcode-entry').val();
    if(passcode && passcode.length > 0){
        $.store.set(SL_KEYS.SYNC_KEY, passcode);
        //should we upload or download?
        //if user's already set up: they may have no projects on this machine, so download is good
        //if user's not set up: there's no data on server, so download won't do anything
            //NEW: if user's not set up, sync data will be UPLOADED if no data is on server
        chevre.syncDownload();
    } 
});

//manual upload/download buttons
$('#sync-upload').click(function(){
    //show spinner
    /*$.mobile.loading('show', {
        text: 'Uploading...',
        textVisible: true,
        theme: 'b'
    });*/
    //do it
    chevre.syncUpload(
         function success(){ toast('Sync upload successful!', { duration: TOAST_DURATION_SHORT })},
         function failure(){ toast('Sync upload failed. Enable your internet connection and try again.', { error: true})}
    );
    //hide spinner
   // $.mobile.loading('hide');    
});
$('#sync-download').click(function(){
     chevre.syncDownload(false);
});
$('#sync-stop').click(function(){
    //cancel sync - destroy key
    $.store.remove(SL_KEYS.SYNC_KEY);
});
$('.sync-reload-page').click(reloadPage);

//delete data
$('#clear-data').click(function(){
     //they've already confirmed (gone through the dialog)
     $.store.clear();
     reloadPage();
})

//adding image
//if they don't have HTML5 File support, don't let them add anything
//they can SEE images but can't add any
if(!(window.File && window.FormData)){
     $('#create-card-image-collapsible').hide();
     $('#edit-card-image-container').hide();
     //TODO minor polish: when they open up the edit card dialog and there is an image BUT they can't change it(no File), then show some hr or something
}

//feedback
   var loadFeedback = (function(){
        feedback.loadDialog();
   }).once();
$('#feedback').bind('pageshow', function(){
   loadFeedback();
});
$('#feedback-send').click(function(){
   feedback.submit(); 
   feedback.checkDontShow(); 
});
$('#feedback-cancel').click(function(){
     feedback.checkDontShow();
})

//organizer
$('#project-organizer').oneBind('pageshow', function(){
     organizer.load();
});

//misc
//image - when clicked, show popup
//$('#image-popup').popup(); //init it
$('.flashcard-image').click(function(e){
     //show popup with this image full size
     var src = $(this).attr('src');
     
     $('#image-popup-image').attr('src',src);
     $('#image-popup').popup('open');
     
     e.stopPropagation(); //this doesn't count as click on study main
});
$('#image-popup').on({
     popupbeforeposition: function(){
       var maxHeight = $( window ).height() - 60 + "px";
       $( "#image-popup-image" ).css( "max-height", maxHeight );          
     }
});
$('.flashcard-image').attr('title', 'Click to see full size');

}

/**
 * Loads all meta-info about the app (about). 
 */
function initAbout(){  
    //about stuff; uses classes not ids so info can be put multiple places
    //just give a span any of these classes and the appropriate stuff will be entered
    $('.about-version').html(ABOUT.version);
    $('.about-codename-name').html(ABOUT.codename.name);
    $('.about-codename-language').html(ABOUT.codename.language);
    $('.about-codename-translation').html(ABOUT.codename.translation);
    $('.about-date').html(ABOUT.date.short()); 
    
    //this one requires a UL or OL
    //grab the array of changes, and convert to a bunch of LI's
    var changesLIs = ABOUT.changes.map(function(string){
        return "<li>" + string + "</li>";
    }).join("");
    $('.about-changes').html(changesLIs); //must be ul or ol for this!
}
