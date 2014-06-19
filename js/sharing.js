var share = new Singleton({
 __init__: function(self){

 },


 /**
  * Loads the UI for uploading one of your projects to the database, or downloading one.
  */
 initUI: function(self){
 	//UPLOAD STUFF
 	//create a list of projects
 	var select = $('#share-upload-deck-select');
 	select.empty();
	chevre.projects.forEach(function(deck){
	    var option = $('<option></option>');
	    option.html(deck.name);
	    option.val(deck.id);
	    select.append(option);
	});
 	//manage the passcode - there's a checkbox to activate it in the first place
 	$('#share-upload-password-checkbox').oneBind('change ready', function(){
 		 if($(this).is(':checked')){
 		 	//they DO want to password-protect, to enable the input
 		 	$('#share-upload-password').removeAttr('disabled').focus();
 		 }
 		 else{
 		 	$('#share-upload-password').attr('disabled','disabled');
 		 }
 	});
 	$('#share-upload-password-checkbox').attr('checked',false).trigger('change'); //just to be sure!

 	$('#share-upload-result').hide();

 	$('#share-upload-button-send').oneClick(function(){
 		var formOK = true;
 		var warningText = null;
 		//creator
 		var creator = $('#share-upload-creator').val().trim();
 		if(!creator || creator == ""){
 			formOK = false;
 			warningText = "You need to specify your name (write \"Anonymous\" if you'd rather not give your name.)";
 			$('#share-upload-creator').focus();
 		}
 		//password-protected?
 		var password;
 		if($('#share-upload-password-checkbox').is(':checked')){
 			//we EXPECT a password to be entered...
 			password = $('#share-upload-password').val().trim();
 			if(!password || password == ""){
 				formOK = false;
 				warningText = "You need to specify a passcode or uncheck the checkbox.";
 				$('#share-upload-password').focus();
 			}
 		}
 		var deckID = $('#share-upload-deck-select').val();
 		var deck = chevre.getProjectByID(deckID);

 		if(!formOK){
 			//problem - show warning text
 			toast(warningText, { type: ToastTypes.WARNING });
 		}
 		else{
 			//good to go; send it!
 			self.uploadProject(deck, creator, password, function(id){
 				//success! tell them
 				$('#share-upload-result-url').html(shareURL + id);
 				if(password){
 					$('.share-if-password').show();
 					$('#share-upload-result-password').html(password);
 				}
 				else{
 					$('.share-if-password').hide();
 				}
 				$('#share-upload-result').show();

 				//update deck's sharedInfo
 				deck.shareInfo.url = shareURL + id;
 				deck.shareInfo.password = password;
 				deck.save();
 			});
 		}
 	});


 	//DOWNLOAD STUFF
 	$('#share-download-all').oneClick(function(){
 		self.retrieveDecks(RETRIEVE_TYPES.ALL, self.loadDecks);
 	});
 	$('#share-download-most-downloaded').oneClick(function(){
 		self.retrieveDecks(RETRIEVE_TYPES.MOST_DOWNLOADED, self.loadDecks);
 	});
 	$('#share-download-newest').oneClick(function(){
 		self.retrieveDecks(RETRIEVE_TYPES.NEWEST, self.loadDecks);
 	});
 	$('#share-download-random').oneClick(function(){
 		self.retrieveDecks(RETRIEVE_TYPES.RANDOM, self.loadDecks);
 	});
 },

 /**
  * Given an array of raw decks, renders them in the deck download view.
  */
 loadDecks: function(self, rawDecks){
 	//edits the decks you just got to fix some formatting stuff
 	rawDecks.forEach(function(deck){
 		self.sanitizeDeck(deck);
 	});

 	template('template-share-import-project', $('#share-download-deck-output'), {decks: rawDecks});

 	//handle clicks of the download button
 	$('#share-download-deck-output').find('.btn-download').oneClick(function(){
 		var id = $(this).data('download');
 		var rawDeck = rawDecks.find(function(deck){ return deck.id == id});
 		self.openDeckConfirmDialog(id, rawDeck);
 	});
 },

 /**
  * Opens the dialog to confirm that the user really does want to download this deck. This should be the LAST user-facing UI element before the deck is downloaded; in other words, you should only call downloadProject() from here.
  * @param {int} id		the ID of the deck to download.
  * @param {Object} rawDeck	the raw deck object you got from the server - contains name, creator, etc.
  */
 openDeckConfirmDialog: function(self, id, rawDeck){
 	var modal = $('#dialog-share-download');
	template('template-share-download-confirm', modal, rawDeck);
	modal.modal('show');

	modal.find('.label-error').hide();
	modal.find('.btn-download').oneClick(function(){
		var $this = $(this);
		if(rawDeck.locked){
			//we need to check the password
			$(this).button('loading');

			//try the password
			var password = $('#share-download-confirm-password').val().trim();
			self.downloadProject(id, password, function success(){
				//good! just clean up here; downloadProject will take care of rest
				$this.button('downloading'); //TODO disable it
				modal.modal('hide');
			}, function fail(){
				//bad pw
				modal.find('.password-form').addClass('has-error');
				modal.find('.label-normal').hide();
				modal.find('.label-error').show();
				$('#share-download-confirm-password').focus();
				$this.button('reset');
			})

			//TODO if good pw show the downloading text
		}
		else{
			//no password; just get it
			$(this).button('downloading'); //TODO disable it
			self.downloadProject(id);
			modal.modal('hide');
		}
	});
 },

 /**
  * CALL ME WHENEVER YOU DOWNLOADED A DECK. This fixes important formatting stuff for the raw deck array.
  */
 sanitizeDeck: function(self, deck){
 	deck.date = Date.create(deck.date).format("{Month} {ord}, {year}"); //"2014-01-25 17:06:27" becomes "January 25th, 2014"
 	return deck;
 },

 // PRIVATE - backend functions


/**
 * Sends the given project to the server.
 * @param {Project} project
 * @param {String} creator	the creator's name.
 * @param {String} password	the password needed to download the project; pass null if there's none.
 * @param {Function} callback	{optional} this function will be called - with an int, id (of the project you just uploaded), as the arg - once the project is successfully uploaded.
 */
uploadProject: function(self, project, creator, password, callback){
	var compressed = project.getCompressed();
	//clone it and reset the rank - that's private stuff!
	var cloned = Object.clone(compressed, true);
	cloned.cards.forEach(function(card){
		card.rank = Rank.A.name;
		card.repsLeft = Rank.A.baseReps;
	});
	//delete private share info
	delete cloned.shareInfo;
    $.post(
        syncBaseURL + 'share-upload.php',
        {
        	'stamp': 		project.id,
        	'project_name': project.name,
        	'project_desc': project.description,
        	'project': 		JSON.stringify(cloned),
        	'creator': 		creator,
        	'password': 	password,

        	'pw': 			'uU3yhE7Q63n9'
        },
        function(data){
             //data should include an int with the ID of the project (where they can access it)
             var id = data.toNumber();
             console.log(id);

             if(callback){
             	callback(id);
             }
        }
    ).fail(function(){
     //boo! failed!
     toast('Uploading failed! Check your internet connection and try again.');
    });
},

/**
 * Checks the server to get information about the given project ID.
 * @param {Object} projectID
 * @param {Function} callback 	will be called with the information given from the server (see below), or null if there was no matching project
 * 	{name:String, description:String, creator:String, downloads:int, locked: boolean} (if locked is true, you need to provide a password)
 */
getProjectInfo: function(self, projectID, callback){
    $.post(
        syncBaseURL + 'share-download.php',
        {
        	'id': 	projectID,
        	'mode': 'check',

        	'pw': 	'uU3yhE7Q63n9'
        },
        function(data){
        	console.log(data);
             //if it failed, 0
             if(data == 0){
             	return null;
             }
             else{
             	//it's JSON; interpret it
             	var object = JSON.parse(data);
             	console.log(object);
             	var project = self.sanitizeDeck(object);
             	if(callback) callback(project);
             }
        }
    ).fail(function(){
     //boo! failed!
     console.log('FAILED');
    });
},

/**
 * Actually downloads/imports a project from the database.
 * @param {String} projectID	the id of the project you want.
 * @param {Object} password		the project's password, if necessary - pass null or something if not needed
 * @param {Function} onSucceed	(optional) called with no arguments if the downloading goes smoothly and the project is downloaded. You only need to handle UI stuff here, since all the backend (downloading, storing, etc.) is already done.
 * @param {Function} onFail		(optional) this function will be called with no arguments if the password is wrong.
 */
downloadProject: function(self, projectID, password, onSucceed, onFail){
    $.post(
        syncBaseURL + 'share-download.php',
        {
        	'id': 		projectID,
        	'mode': 	'get',
        	'password': password,

        	'pw': 		'uU3yhE7Q63n9'
        },
        function(data){
        	console.log(data);
             //if it failed (wrong password), 0
             if(data === "0" || !data){
             	//TODO alert wrong pw
             	if(onFail) onFail();
             }
             else{
             	//worked!
             	if(onSucceed) onSucceed();

             	//they gave the raw project; interpret it
             	var object = JSON.parse(data);
             	console.log(object);
             	var project = chevre.addProject(chevre.decompressProject(object));
             	chevre.loadProject(project);
             	nav.openPage('deck-home');
             }
        }
    ).fail(function(){
     //boo! failed!
     console.log('FAILED');
    });
},

/**
 * Looks up a subset of decks from the server based on various criteria. Calls callback with this information.
 * @param {Object} retrieveType		determines which decks will be downloaded (the most popular ones, the most recent ones, etc.) Use something from the RETRIEVE_TYPES enum.
 * @param {Function} callback	will be called with an array of raw project objects - each includes stuff like name, description, creator, etc.
 */
retrieveDecks: function(self, retrieveType, callback){
    $.post(
        syncBaseURL + 'share-download.php',
        {
        	'mode': 	'check_bulk',
        	'type': 	retrieveType,

        	'pw': 		'uU3yhE7Q63n9'
        },
        function(data){
        	if(data){
        		var projectInfo = JSON.parse(data); //array of projects, each giving some information about it
        		callback(projectInfo);
        	}

        }
    ).fail(function(){
     //boo! failed!
     console.log('FAILED');
    });
}

});

