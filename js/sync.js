var Sync = new Singleton({

sync: function(self, success, failure){
    if(chevre.syncActivated() == false){
        //sync not set up
        return;
    }

	var savedProjects = $.store.get(SL_KEYS.PROJECTS).compact();
	//process this into { id: project }
	var organizedSet = {};
	savedProjects.forEach(function(project){
		organizedSet[project.id] = project;
	});
	var stringified = JSON.stringify(organizedSet);

    $.post(
        syncBaseURL + 'php/sync-v1.php',
        {
            'passcode': $.store.get(SL_KEYS.SYNC_KEY),
            'projects': stringified,
            'lastsynced': $.store.get(SL_KEYS.LAST_SYNCED),
            'pw': 'o9fxxyouwT6N'
        },
        function(data){

        	data = JSON.parse(data);
        	/*
        	 * Data contains:
        	 * 		bool success		TRUE if success, FALSE if failure
        	 * 		String syncTime		When the syncing was completed
        	 * 		String projects		Encoded projects
        	 */

        	if(data && data.success === true){
        		$.store.set(SL_KEYS.LAST_SYNCED, data.syncTime);
        		$.store.set(SL_KEYS.PROJECTS, JSON.parse(data.projects).compact());
        	}

        	console.log(data);

        	if(success){ success(); }
        }
    ).fail(function(e){
	     //boo! failed!
	     console.log(e);
	     if(failure){ failure(); }
    });
}
});
