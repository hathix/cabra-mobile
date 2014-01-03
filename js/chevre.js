/**
 * Like Controller in desktop Cabra.
 * All global functions you'll need to use are in the chevre object: chevre.func() 
 * 
 * Accessible:
 * Project[] projects
 */

var chevre = new Singleton({
    
__init__: function(self){
    self.projects = [];     
    self.activeProject = self.p = null;
    
    self.defaultOptions = {
        maxCardsPerSession: 50,     //int
        fontSize: FontSize.MEDIUM, //FontSize: int
        shuffleBeforeStudying: true, //boolean
        swipeToSkip: true, //boolean
        askFeedback: true,
        theme: Theme.BLUE
    };
    self.options = {};
    
    /*self.pages = [
    	new Page("Home", "Home sweet home", "home", "home"),
    	new Page("Deck Home", "Deck home", "home", "deck-home")
    ];*/
   
   /*pageDB.getJQuery('deck-home').bind('load', function(){
   		self.loadProject();
   });*/
},

/**
 * Returns the page with the given slug. 
 */
page: function(self, slug){
	return PageDB.get(slug);
},

/**
 * Called when the program is first booted up. 
 */
start: function(self){
    //load options & projects
    self.load();
    
    nav.home(); //open home page
    
    //now that we're done... at this point not much is happening
    
    //check version
    var oldVersion = $.store.get(SL_KEYS.LAST_VERSION);
    if(oldVersion && oldVersion != ABOUT.version){
        //they loaded a new version.
        //$.mobile.changePage('#updated');
        template('template-updated-changes',$('#updated-changes'),{items: ABOUT.changes});
        nav.openPage('updated');
        console.log("Chevre updated to version " + ABOUT.version);
    }
    else if(oldVersion == undefined){
        //it's the first time they're using Cabra
        //this will only show once - EVER - because version is always set later on
        //$.mobile.changePage('#welcome');
        nav.openPage('welcome');
    }
    $.store.set(SL_KEYS.LAST_VERSION, ABOUT.version);
    
    //feedback tracking
    //when we last asked them for feedback
    if(!$.store.get(SL_KEYS.FB_LAST_ASKED)){
         //$.store.set(SL_KEYS.FIRST_USED, Date.create().format());
         $.store.set(SL_KEYS.FB_LAST_ASKED, Date.create().format());
    }
    //num uses since we last asked
    var numUses = orDefault($.store.get(SL_KEYS.FB_USES_SINCE_ASKED), 0);
    numUses++;
    $.store.set(SL_KEYS.FB_USES_SINCE_ASKED, numUses);
    
    (function(){
         feedback.ask(); //try to get feedback
    }).delay(2000); //give some time to get oriented before we pop up
},

getProjectByID: function(self, id){
    return self.projects.find(function(project){
        return project.id == id;
    })    
},
    
addProject: function(self, project, dontSave){
     //if the project's name is the same as that of an existing project, rename (else the old one is overwritten)
     //tack on a "(1)" to ensure unique names, or if there IS something with a "(1)", rename to "(2)" and so on
     project.name = ensureNoDuplicateNames(project.name, chevre.projects.map('name'));

    self.projects.push(project);
    
    //TODO: maybe sort projects when a new one's added? but that involves adding the li to a custom spot...
    
    self.refreshProjectList();
    
    /*
    var li = getClonedTemplate('template-divider');
    li.`html(project.group);
    $('#project-list').append(li).listview('refresh');
    */
   
    if(!dontSave)
        self.save(project); 
},

refreshProjectList: function(self){
     $('#project-list').empty();
     
     var groupedProjects = self.projects.groupBy('group'); //object { groupName: [proj1, proj2, proj3], ... }
    Object.keys(groupedProjects, function(groupName, projects){
         var data = {
              groupName: groupName,
              decks: projects
         };
         
          //make panel containing each
          var panel = template("template-project-panel", $('#project-list'), data, true);    
    });
    
    //reload all clicks
    $('.project-list-item').click(function(){
     var id = $(this).data('id');
     //load that project
     self.loadProject(self.getProjectByID(id));     
    });
    $('.project-list-item').find('.project-list-item-edit').click(function(e){
    	var id = $(this).closest('.project-list-item').data('id');
    	var project = self.getProjectByID(id);
    	e.stopPropagation(); //prevent the click handler for the whole thing being clicked (that'd take us to project home page)
    	
    	//populate fields
    	var dialog = $('#dialog-deck-edit');
    	dialog.find('.deck-name').html(project.name);
    	//load the merge deck selector with the names of our othe rdecks
    	$('#deck-edit-merge-into').html('');
		chevre.projects.forEach(function(deck){
		    if(deck.equals(project)) return; //can't merge into the project we're merging from
		    var option = $('<option></option>');
		    option.html(deck.name);
		    option.val(deck.id);
		    $('#deck-edit-merge-into').append(option); 
		});
        	
    	//handle clicks
    	dialog.find('.btn-merge').oneClick(function(){
		    var mergeFrom = project;
		    var mergeToID = $('#deck-edit-merge-into').val();
		    var mergeTo = self.getProjectByID(mergeToID);
		    //console.log(mergeFrom.name + " -> " + mergeTo.name);
		    self.mergeProjects(mergeFrom, mergeTo);
		    
		    //close merge area
			$("#deck-edit-merge").collapse('hide');		    
    	});
    	dialog.find('.btn-delete').oneClick(function(){
    		//TODO decide if we need confirmation
    		/*bootbox.confirm('Are you sure you want to permanently delete this deck?', function(){
    			dialog.modal('hide');
    		});*/
    		
    		dialog.modal('hide');
    		self.removeProject(project);
    	});
    	//TODO HANDLE MERGING CLICKS
    	
    	dialog.modal('show');
    });
    //TODO make long-clicking open the edit dialog too, but that's its own can of worms...
   
     
     //$('#project-list').listview('refresh');
},

/**
 * Creates a list item for a given project. 
 */
/*createProjectLI: function(self, project){
    //add to view - grab template and modify it
    var li = getClonedTemplate("template-project");
    li.find(".project-name").html(project.name);
    //show desc if there is one; else show nothing
    //li.find(".project-description").html(orIfFalsy(project.description, "")); //project.numCards() + " Cards"));
    li.find(".project-card-count").html(project.numCards()); //bubble showing # of cards
    
    li.find(".project").click(function(){
        //main buttons
        self.loadProject(project);
    });
    
    //click on the gear OR long-tap for options
    li.find(".project").bind('taphold', function(event){
        li.find(".project-options").trigger('click');   
        event.preventDefault();
    });
    li.find(".project-options").click(function(){
        //give that dialog this project so it can access it
        $('#project-edit-dialog').jqmData('project', project);
        
        //rename the dialog
        $('#project-edit-header').html(project.name);
    });
    li.attr('id', 'project-div-' + project.id);
    
    return li;
},*/

/**
 * Finds and returns the $li of the given project. 
 */
findProjectLI: function(self, project){
     return $('#project-list-item-' + project.id);
},

/**
 * Opens up a project for studying, etc. 
 */
loadProject: function(self, project){
    //when we loaded Chevre, the project's cards weren't unpacked; they were left raw
    //if they're STILL raw, it's the first time we viewed - unpack them
    if(project.raw){
        project.decompress();
    }
    project.load();
    self.activeProject = self.p = project; //self.p is shortcut
},

removeProject: function(self, project){
    self.projects = self.projects.subtract(project);
    if(self.activeProject == project){
        self.activeProject = self.p = null;
    }
 
    //remove from view
    $('#project-list-item-' + project.id).remove();
    self.refreshProjectList();
    
    self.save();
},

/**
 * Takes the cards from mergeFrom and places them into mergeTo's cards list. Then mergeFrom is deleted.
 * @param {Project} mergeFrom   the project whose cards to take. It will be deleted.
 * @param {Project} mergeTo     the project who will receive the cards. 
 */
mergeProjects: function(self, mergeFrom, mergeTo){
    //they are automatically decompressed now (0.4.1)
    mergeTo.cards.add(mergeFrom.cards);
    self.removeProject(mergeFrom);
    self.loadProject(mergeTo); //open it up for viewing
},

save: function(self, project, dontSync){
    console.log("Saving...");
    
    //they may have sent us a project to save - in that case, save ONLY that
    if(project && $.store.get(SL_KEYS.PROJECTS)){
        //find that project out of storage, re-compress it, and re-save
        var storedProjects = $.store.get(SL_KEYS.PROJECTS);
        var didResave = false; //will be set to true if we re-saved any project (will stay false if it wasn't found')
        for(var i=0; i<storedProjects.length; i++){
            if(project.equals(storedProjects[i])){
                //right index; re-assign
                storedProjects[i] = project.getCompressed();
                //re-save
                $.store.set(SL_KEYS.PROJECTS, storedProjects);
                didResave = true;
                break;
            }
        }
        
        if(!didResave){
            //they haven't reached it so far, which means that there's no matching project. so add a new one
            storedProjects.add(project.getCompressed());
            //re-save & upload
            $.store.set(SL_KEYS.PROJECTS, storedProjects);
        }
        
        if(!dontSync)
            self.syncUpload();
        return storedProjects;     
    }
    
    //otherwise, just save it all
    
    //UGLY CODE AHEAD
    var compressed = compress(self, [
        {
            'projects': function(compressed, val){ //compressed is chevre
                //val = array of raw projects
                //go through each project in array
                return val.map(function(project){ return project.getCompressed(); });
                //return val.map(compressProject); //see above func
            }
        }
    ]);
    
    //store it
    $.store.set(SL_KEYS.PROJECTS, compressed.projects);
    self.syncUpload();
    
    return compressed; //if they want to see it
},

load: function(self){
    console.log("Loading...");
    
    /* //device id is useless for now
    //if this is a new install, load certain necessary things / save certain things
    if(!$.store.get(SL_KEYS.DEVICE_ID)){
        //set a new device id; this is pretty much read-only so it'll be the same forever on this device
        //device id is unique to this device
        //TODO: find some way to make a more personalized id (perhaps let user set it themselves in sync menu)
        //default is just random num
        var id = Number.random(1e8);
        $.store.set(SL_KEYS.DEVICE_ID, id);
    }
    */
    
    //OPTIONS
    self.loadOptions();
    
    
    //PROJECTS

    
    //if there's sync, then grab that; otherwise get it from locally
    //TODO: rethink this method (perhaps prefer local stuff)
    if(self.syncActivated()){
        //projects in the table are stored as pure (not compressed), so we can load them directly
        self.syncDownload(true);
    }
    else{
        //load as normal
        self.loadLocally();    
    }
},

/**
 * Loads cards from the local storage. 
 */
loadLocally: function(self){
    var stored = $.store.get(SL_KEYS.PROJECTS);
    if(truthiness(stored))
        self.unpackProjects();
    else
        self.loadDefaultProjects();        
},

/**
 * Takes the projects from straight stored form and converts to raw form. They will be fully converted to normal form when loaded.
 */
unpackProjects: function(self){
    var rawProjects = $.store.get(SL_KEYS.PROJECTS);
    //UGLY CODE AHEAD
    var goodProjects = rawProjects.map(function(rawProj){
        return decompress(rawProj, "Project",
        [ 'name', 'description', 'id', 'group' ], //in init
        [ 
            { cards: function(goodProj, rawCards){
                    //obj is the good object, value is the raw cards
                    //NEW: store them as raw until the project is loaded; THEN convert them
                    goodProj.raw = true; //not converted yet
                    goodProj.rawCards = rawCards;
                }}
        ]);    
    });
    
    //add in the projects
    goodProjects.forEach(function(project){
        self.addProject(project, true); //don't save at all; the data has been saved BEFORE now     
        
        //decompress the project to normal
        project.decompress();
    });
},

/**
 * Loads the default projects & cards.
 * @param {Object} self
 */
loadDefaultProjects: function(self){
    console.log("Defaults...");
    //temporary!
    var proj = new Project("Sample Flashcards (try me out!)", "Try out Cabra with this sample set of flashcards!");
    var cards = [
         new Card("What animal is this?", "A goat", "http://imgur.com/wSyzk7l.png"),
         new Card("sin²θ =","2sinθcosθ"),
         new Card("What color is the sky?", {choices: ["Green","Blue","Yellow","Red"], right: 1}),
         new Card("'Goat' in Spanish", "'Cabra'")
    ];
    cards.forEach(function(card){
        proj.addCard(card);    
    });
    self.addProject(proj);
},

loadOptions: function(self){
    //grab options from storage
    var storedOptions = $.store.get(SL_KEYS.OPTIONS);
    //if there are no options (nothing stored), use defaults
    //merge defaults with stored so that anything that WASN'T set is just set to default
    self.options = $.extend({}, self.defaultOptions, storedOptions);
    self.updateOptions();
    
    //init the options dialog
    var options = self.options;
    
    /**
     * ADD A NEW LINE WHENEVER YOU ADD A NEW OPTION!
     * Also add to chevre.defaultOptions at top. 
     * Also add to chunk below - saving options
     */
    $('#options-panel').oneBind('panelbeforeopen', function(){
        //set the current value of any form elements to whatever's stored
        $('#options-max-cards').val(options.maxCardsPerSession).slider('refresh');
        var shuffleValue = options.shuffleBeforeStudying ? "on" : "off";
        $('#options-shuffle').val(shuffleValue).slider('refresh');
        var swipeValue = options.swipeToSkip ? "on" : "off";
        $('#options-swipe').val(swipeValue).slider('refresh'); 
        $('#options-theme').val(options.theme).selectmenu('refresh');
        var fbValue = options.askFeedback ? "on" : "off";
        $('#options-feedback').val(fbValue).slider('refresh');
        
        //font size - see what matches
        var size = options.fontSize;
        var fontName = "MEDIUM"; //"SMALL", "MEDIUM", etc.
        Object.keys(FontSize,function(key, value){
          if(value == size) fontName = key;      
        });
        $('#options-font-size').val(fontName).selectmenu('refresh');
    });
    
    //save when "done" is clicked
    $('#options-finish').oneClick(function(){
        //get stuff from the options page and store to vars
        options.maxCardsPerSession = $('#options-max-cards').val().toNumber();
        options.fontSize = FontSize[$('#options-font-size').val()]; //looking up in the enum
        options.shuffleBeforeStudying = $('#options-shuffle').val() == "on"; //true if it's on, fals e if off
        options.swipeToSkip = $('#options-swipe').val() == "on";
        options.theme = $('#options-theme').val();
        options.askFeedback = $('#options-feedback').val() == "on";
        
        self.saveOptions();
        
        $('#options-panel').panel('close'); //FIXME i set the data-rel=close attribute on the Done button (this one), but it won't close as long as the button has an id attribute
    });
},

/**
 * Call this independently of save().
 */
saveOptions: function(self){
    $.store.set(SL_KEYS.OPTIONS, self.options);
    self.updateOptions();
},

/**
 * Call when initializing page (load) and after saving options.
 * This re-loads any things dynamically that were changed (i.e. theme). 
 */
updateOptions: function(self){
    //theme... update the theme css file
    $('#theme-stylesheet').attr('href', sprintf("css/themes/%s.css", self.options.theme));
},

/**
 * Returns true if the user's set up sync, false otherwise 
 */
syncActivated: function(self){
    return $.store.get(SL_KEYS.SYNC_KEY) != undefined;    
},

/**
 * Uploads to sync the existing data. Make sure you save() first.
 * @param {function}     success  [optional] if you pass it, it will be called if upload succeeds (i.e. PHP/AJAX all work.)
 * @param {function}     failure  [optional] if you pass it, it will be called if upload fails (i.e. internet off.)
 */
syncUpload: function(self, success, failure){
    if(self.syncActivated() == false){
        //sync not set up
        return;
    }
    
    console.log("Uploading...");
    //pass the passcode & projects (strings, stored in browser) to php, which will store in table
    //TODO: instead of storing pure form, store it compressed
    $.post(
        syncBaseURL + 'sync-upload.php',
        {
            'passcode': $.store.get(SL_KEYS.SYNC_KEY),
            'projects': JSON.stringify($.store.get(SL_KEYS.PROJECTS)) //what's nice is that this won't store undefined values
        },
        function(data){
             //it's just 1 (literally just that number)
             //only called if it succeeds so...
             if(success) success();
        }
    ).fail(function(){
     //boo! failed!
     if(failure) failure(); 
    });
    
},

/**
 * If the user has a sync key, grabs data from the server and saves it. If there is no data from the server, in instead uploads the data we have. See the body for explanation.
 * @param {boolean} unpack    if true, this will unpack the projects and load them into memory; if false, it'll just save them away. Pass false if you're sync downloading manually, pass true if it's during startup.
 */
syncDownload: function(self, unpack){
    if(self.syncActivated() == false){
        //sync not set up
        return;
    }
        
    console.log("Downloading...");
    //pass the passcode; get projects in return
    $.ajax({
        type: 'POST',
        url: syncBaseURL + 'sync-download.php',
        data: {
            'passcode': $.store.get(SL_KEYS.SYNC_KEY)
        },
        
        success: function(data){
            //data is some HTML; the projects are wrapped in a <pre> tag
            var projectsString = $(data.trim()).html(); //there may be some spaces before the actual text; remove those, then get the json-encoded projects out
            //console.log(projectsString);
            projectsString = projectsString.unescapeHTML();
            try{
                var projects = $.parseJSON(projectsString);
            }
            catch(error){
                //Sometimes there's a sort of error when downloading (usually when the last machine to upload didn't finish or do it right)
                console.log("Sync download failed");
                console.log(projectsString);
                console.log(error);
                
                //don't do anything; fall back to local storage
                self.loadLocally(); //this may or may not be already done (don't think  it is - we need to unpack our projects and all ourself)
                return;
            }
            
            //so it did work
            console.log("Download successful!");
            //console.log(projects);
            if(projects == null){
                //there's no corresponding data on the server
                //so don't do anything
                //this would most likely happen if we're setting up sync for the first time, and there's no data on server
                //instead, let's upload our data so that future syncing will work
                chevre.syncUpload(); //TODO: reconsider
            }
            else{
                //save it
                $.store.set(SL_KEYS.PROJECTS, projects);
                //self.save(undefined, true); //no project; and don't sync it
                
                toast("Your cards were successfully synced!",{type: ToastTypes.SUCCESS});
                //reload the page
                //<TODO>: remove all projects and load in the new ones
                //TODO: make this more efficient - keep a tag of when we synced; if that's more recent than this then don't sync
            }
            
            if(unpack){
               self.unpackProjects(); //they've been stored away but now load into memory as raw
            }
        },
        
        timeout: 3000, //how many ms to wait before declaring that it failed; TODO: tweak this
        error: function(jqXHR, textStatus, errorThrown){
            //sync failed! load normally (from local storage)
            console.log('Download failed!');
            console.log(textStatus);
            
            self.loadLocally(); //long expensive operation
            
            //tell user
            toast("Sync download failed (your device may be offline.) No worries - Cabra's loading flashcards from your device.", 
               { type: ToastTypes.DANGER, duration: TOAST_DURATION_LONG });
        }
    })
}
        
      
});
