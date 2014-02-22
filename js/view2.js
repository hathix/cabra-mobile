var View = {
	snapper: null //slideout menu
};

function initUI(){
	initPages();
	initDialogs();
	
	//setup code
	organizer.setup();
	
	//options
	/*
	$(window).resize(function(){
		var mainHeight = $('#main-container').height();
		$('.study-main-card').css('height', mainHeight - 150); //reserve space for other buttons etc	
	});
	*/
	//about
    //just give a span any of these classes and the appropriate stuff will be entered
    $('.about-version').html(ABOUT.version);
    $('.about-codename').html(ABOUT.codename);
    $('.about-released').html(ABOUT.date.short()); 
    $('.about-copyright-year').html(Date.create().format("{yyyy}")); //current year for copyright stuff
    
    //this one requires a UL or OL
    //grab the array of changes, and convert to a bunch of LI's
    var changesLIs = ABOUT.changes.map(function(string){
        return "<li>" + string + "</li>";
    }).join("");
    $('.about-changes').html(changesLIs); //must be ul or ol for this!	
	
	//init snapper!
	var snapper = new Snap({
		element: document.getElementById("main-container"),
		disable: 'right',
		hyperextensible: false,
		touchToDrag: false, //TODO this prevents you from swiping to open the menu; should we allow this? (it's really wonky on mobile, but intuitive)
		minDragDistance: 10, //default 5
		flickThreshold: 10, //default 50
	});
	View.snapper = snapper;
	$('#navbar-menu-button').oneClick(function(){
		//if open, close
		if(snapper.state().state == "left"){
			snapper.close();
		}
		//if closed, open
		else{
			snapper.open('left');
		}
	});
	$('#menu').find('.close').oneClick(function(){
		snapper.close();
	});
	/*
	//manage snapper classes - close button if opened, open button if closed
	var closedClass = "glyphicon-th";
	var openedClass = "glyphicon-remove";
	snapper.on('open', function(){
		//change arrow to opened state
		$('#navbar-menu-button').find('.glyphicon').removeClass(closedClass).addClass(openedClass);
	});
	snapper.on('close', function(){
		//change arrow to closed state
		$('#navbar-menu-button').find('.glyphicon').addClass(closedClass).removeClass(openedClass);
	});	
	snapper.on('drag', function(){
		$('#navbar-menu-button').find('.glyphicon').toggleClass(closedClass).toggleClass(openedClass);
	});
	*/
	
	/* MISCELLANEOUS STUFF */
	//menu

	$('#menu-links').find('a').oneClick(function(){
		snapper.close();	
		(function(){$('#menu-links').find('li').removeClass('active')}).delay(500); //prevents .active from 'sticking' to the pills; delay to avoid interfering with animation (not really sure why)
	});
	$('#menu-link-feedback').click(function(){
		//console.log(3);
		feedback.ask(true); //force to show it
	});
	
	/*
	 * TOO MANY PROBLEMS TO WORK EFFECTIVELY NOW - TODO IMPLEMENT LATER (1/3/14)
	 * http://jasonbutz.info/bootstrap-lightbox/
	 *
	//whenever a thumbnail image (created dynamically in the future) is clicked, show it in a lightbox
	$(document).on('click.lightbox','.img-lightbox', function(){
		$('#lightbox-shell')
	});
	*/
}

function initPages(){
	//home
	PageDB.getJQuery('home').oneBind('load', function(){
		//un-set active projects in the deck home
		$('.univ-deck-name').html("Cabra");
		//refresh view
		chevre.refreshProjectList();
	});
	
	//deck home
	PageDB.getJQuery('deck-home').oneBind('load', function(){
		//un-set active projects
		chevre.p.load();
	});
	
	PageDB.getJQuery('create').oneBind('load', function(){
		//chevre.p.prepareCreateCardPage();
		Editor.loadPage();
	});	
	PageDB.getJQuery('manage').oneBind('load', function(){
		chevre.p.updateManager();
	});
	PageDB.getJQuery('print-output').oneBind('load', function(){
		chevre.p.preparePrintOutput();
	});
	PageDB.getJQuery('export').oneBind('load', function(){
		backup.loadPage();
	});
			
    PageDB.getJQuery('study').oneBind('load', function(){
    	var self = chevre.p;
    	self.session = new Session(self);
    });
    PageDB.getJQuery('study-main').oneBind('load', function(){
    	var self = chevre.p;
    	self.session.start();
    });	
    PageDB.getJQuery('study-end').oneBind('load', function(){
    	var self = chevre.p;
    	self.session.loadResultsChart();
    });	
    
    
    PageDB.getJQuery('deck-import').oneBind('load', function(){
    	importer.quizlet();
    });	
    PageDB.getJQuery('organize').oneBind('load', function(){
    	organizer.load();
    });	    
    PageDB.getJQuery('share').oneBind('load', function(){
		share.initUI();
    });
    PageDB.getJQuery('options').oneBind('load', function(){
		loadOptions();
    });
    PageDB.getJQuery('contact').oneBind('load', function(){
    	//prevent spammers from harvesting my email by doing this
		var en = "neel";
		var ed = "hathix [dot] com";
		var at = "[at]";
		$('#contact-email').html(en + " " + at + " " + ed);
    });
    PageDB.getJQuery('sync').oneBind('load', function(){
    	var setup = chevre.syncActivated();
    	$('#sync-show-setup').toggle(setup); //show if setup
    	$('#sync-show-new').toggle(!setup); //show if not setup
    	
    	if(setup){
    		$('#sync-passcode-reminder').html($.store.get(SL_KEYS.SYNC_KEY));
    		$('#sync-button-upload').oneClick(function(){
    			var self = $(this);
    			self.button('loading');
			    chevre.syncUpload(
			         function success(){ 
			         	toast('Your cards were successfully uploaded!', { type: ToastTypes.SUCCESS, duration: TOAST_DURATION_SHORT });
			         	self.button('reset');
			         },
			         function failure(){ 
			         	toast('Uploading your cards failed. Enable your internet connection and try again.', { type: ToastTypes.DANGER });
			         	self.button('reset');
			         	}
			    );
    		});
    		$('#sync-button-download').oneClick(function(){
    			var self = $(this);
    			self.button('loading');
    			chevre.syncDownload(false);
    			self.button('reset');
    			bootbox.dialog({
    				message: "Your cards have been successfully downloaded! <strong>You'll now need to refresh the page.</strong>",
    				title: "Download successful!",
    				buttons: {
    					main: {
    						label: "OK",
    						className: "btn-primary",
    						callback: function(){
    							reloadPage();
    						}
    					}
    				}	
    			});
    		});
    		$('#sync-button-stop').oneClick(function(){
			    //cancel sync - destroy key
			    $.store.remove(SL_KEYS.SYNC_KEY);
			    reloadPage();		
    		});
    	}
    	else{
    		$('#sync-input-passcode').focus();
    		$('#sync-button-start').oneClick(function(){
    			var passcode = $('#sync-input-passcode').val().trim();
    			if(passcode && passcode != ""){
    				$.store.set(SL_KEYS.SYNC_KEY, passcode);
    				chevre.syncDownload();
    				reloadPage();
    			}
    		})
    	}
    });	    
}

function initDialogs(){
	//CARD CREATE DIALOG
	$('#dialog-deck-create').find('.btn-submit').oneClick(function(){
		//add a deck w/ that name
		var name = $('#input-deck-create-name').val();
		if(name && name.trim()){
			var deck = new Project(name);
			chevre.addProject(deck);
			$('#input-deck-create-name').val('').focus();
		}
	});
}
