function initUI(){
	initPages();
	initDialogs();
	
	//setup
	organizer.setup();
}

function initPages(){
	//home
	PageDB.getJQuery('home').oneBind('load', function(){
		//un-set active projects
		$('.univ-deck-name').html("Cabra");
	});
	
	//deck home
	PageDB.getJQuery('deck-home').oneBind('load', function(){
		//un-set active projects
		chevre.p.load();
	});
	
	PageDB.getJQuery('create').oneBind('load', function(){
		chevre.p.prepareCreateCardPage();
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
    PageDB.getJQuery('sync').oneBind('load', function(){
    	var setup = chevre.syncActivated();
    	$('#sync-show-setup').toggle(setup); //show if setup
    	$('#sync-show-new').toggle(!setup); //show if not setup
    	
    	if(setup){
    		$('#sync-passcode-reminder').html($.store.get(SL_KEYS.SYNC_KEY));
    		$('#sync-button-upload').oneClick(function(){
			    chevre.syncUpload(
			         function success(){ toast('Sync upload successful!', { duration: TOAST_DURATION_SHORT })},
			         function failure(){ toast('Sync upload failed. Enable your internet connection and try again.', { error: true})}
			    );
    		});
    		$('#sync-button-download').oneClick(function(){
    			chevre.syncDownload();
    		});
    		$('#sync-button-stop').oneClick(function(){
			    //cancel sync - destroy key
			    $.store.remove(SL_KEYS.SYNC_KEY);
			    nav.refreshPage();   			
    		});
    	}
    	else{
    		$('#sync-input-passcode').focus();
    		$('#sync-button-start').oneClick(function(){
    			var passcode = $('#sync-input-passcode').val().trim();
    			if(passcode && passcode != ""){
    				$.store.set(SL_KEYS.SYNC_KEY, passcode);
    				chevre.syncDownload();
    				nav.refreshPage();
    			}
    		})
    	}
    });	    
}

function initDialogs(){
	//CARD CREATE DIALOG
	$('#dialog-deck-create').ready(function(){
		$(this).find('.btn-submit').click(function(){
			//add a deck w/ that name
			var name = $('#input-deck-create-name').val();
			if(name && name.trim()){
				var deck = new Project(name);
				chevre.addProject(deck);
				$('#input-deck-create-name').val('');
			}
		});
	});
}
