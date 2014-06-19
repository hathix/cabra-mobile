/*
 * Called at the ABSOLUTE beginning.
 */

Cobra.install();

/*
 * Called when the app is fully loaded.
 */
$(document).ready(function(){
	FastClick.attach(document.body);

	//see if we can get Cordova (for Android)
	require('cordova.js', function(){
		//Handle back button. Go back in history, dialogs, etc.
		document.addEventListener("backbutton", function(){
			if($('.modal').is('.in')){
				//a NORMAL modal is open; close it
				$('.modal.in').modal('hide');
			}
			else if(View.snapper.state().state == "left"){
				//slideout menu is open; close it
				View.snapper.close();
			}
			else if(nav.index > 0 || nav.modalOpen){
				nav.openPage(NAV_BACK); //go back a page or close the modal (special case), it'll handle it
			}
			else{
				//quit app, but save first
				chevre.save();
				navigator.app.exitApp();
			}
		}, false);

		//Handle menu button. Just show/hide the slideout menu.
		document.addEventListener("menubutton", function(){
			//Open/close the slideout (snapper) menu, as appropriate
			//if open, close
			if(View.snapper.state().state == "left"){
				View.snapper.close();
			}
			//if closed, open
			else{
				View.snapper.open('left');
			}
		}, false);
	});

     $('body').on('click','a[data-href]',function(){
          //open whatever had that trigger
          var href = $(this).data('href'); //like 'home' or something
          //trigger invisible tab
          nav.openPage(href);
     });

     //trawl all the pages for page metadata
     $('section').each(function(){
     	if(!$(this).data('name')) return;
     	var s = $(this);
     	var page = new Page(s.attr('id'), s.data('name'), s.data('description'), s.data('icon'), s.data('childof'));
     	PageDB.add(page);
     });


     //register helper
     /**
      * Renders if the given conditional function evaluates to true.
      * Usage (assuming context == obj):
      * 	{{#ifFunction "isOn"}} ... {{/ifFunction}}
      * So if obj.isOn() == true, this will render.
      */
     Handlebars.registerHelper('ifFunction', function(conditionalFunction, options) {
     	var fn = this[conditionalFunction];
		  if(fn()) {
		    return options.fn(this);
		  }
		  else{
		  	return options.inverse(this);
		  }
	});
     /**
      * Renders if the given conditional function evaluates to false.
      * Usage (assuming context == obj):
      * 	{{#unlessFunction "isOn"}} ... {{/unlessFunction}}
      * So if obj.isOn() == false, this will render.
      */
     Handlebars.registerHelper('unlessFunction', function(conditionalFunction, options) {
     	var fn = this[conditionalFunction];
		  if(!fn()) {
		    return options.fn(this);
		  }
		  else{
		  	return options.inverse(this);
		  }
	});

	/**
	 * Calls and displays the result of a certain function. Any HTML inside it will be passed as a jQuery object.
	 * IF YOU PUT SOMETHING INSIDE, WRAP IT ALL IN A TAG!
	 * Usage:
	 * 	{{#call "getText"}}{{/call}}
	 *  {{#call "capitalize"}}<div>Hi</div>{{/call}}
	 */
     Handlebars.registerHelper('call', function(fnName, options) {
     	var fn = this[fnName];
     	var arg = $(options.fn(this));
     	if(arg)
     		return fn(arg);
     	else
     		return arg;
	});

	/**
	 * Evaluates any bit of code and returns it. "this" is the current context. Nothing goes inside it.
	 * code should be a string.
	 * usage:
	 * 	{{#eval "this.getText(false)"}}{{/eval}}
	 */
     Handlebars.registerHelper('eval', function(code, options) {
     	var returnValue = eval(code);
     	return returnValue;
	});
	/*
	Handlebars.registerHelper('with', function(contextFunction, options) {
		var fn = this[contextFunction];
	  	return options.fn(fn());
	});
	*/

    initUI();
    chevre.start();

    //handle query string in URL - this is a project to download
    var queryText = window.location.search.substring(1);
    if(queryText && queryText !== ""){
    	//there IS something in the text
    	var queryObj = Object.fromQueryString(queryText);
    	var projectID = queryObj.share; //the ID of the thing to get
    	share.getProjectInfo(projectID, function(rawDeck){
    		//called back on success
    		share.openDeckConfirmDialog(projectID, rawDeck);
    	});
    }
});
