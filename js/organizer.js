var organizer = new Singleton({

__init__: function(self){
     self.setup();
},

/**
 * Called BEFORE this runs the first time.
 */
setup: function(self){

     //$('#organizer-list').disableSelection();

     $('#organize-button-add').oneClick(function(){
     	//add a new, empty group
     	var groupName = $('#organize-input-group-name').val().trim();
     	if(groupName && groupName !== ""){
     		//make sure there's no duplicate group names
     		var existingGroupNames = $.makeArray($('#organize-group-list').find('.list-group-name')).map(function(e){ return $(e).html() });
     		groupName = ensureNoDuplicateNames(groupName, existingGroupNames);

     		var li = template('template-organize-group', $('#organize-group-list'), {name: groupName}, true);
		    li.find('.action-delete').oneClick(function(){
		    	self.deleteDivider(groupName);
		    });

		    //clear field
		    $('#organize-input-group-name').val('');
     	}
     });

     /*
     $('#organizer-add-divider').oneClick(function(){
          var name = $('#divider-name-field').val();
         if(name && name.trim() != ""){
             self.addDivider(name);
             //$('#organizer-list').listview('refresh');
             $('#divider-name-field').val(''); //clear field
             //$('#organizer-collapsible').trigger('collapse');
         }
     });
     */


     $('#organize-button-save').oneClick(function(){
          self.save();
     });
},

/**
 * Called each time the page is loaded.
 */
load: function(self){
	//group our decks...
	var rawGrouped = chevre.projects.groupBy('group'); // {"groupName": [proj1, proj2], "group2": [proj3] }

	//ensure we have an unorganized one even if there's no projects there
	if(!rawGrouped[GROUP_DEFAULT]){
		rawGrouped[GROUP_DEFAULT] = [];
	}

	//let's change it to [{groupName: [proj1, proj2]},{group2: [proj3]}]
	var groupArray = [];
	Object.keys(rawGrouped, function(key, value){
		//key == groupName (we call it name), value == projects (we call it decks)
		groupArray.add({name: key, decks: value});
	});

	//sort groupArray so "Unorganized" is at front
	groupArray = groupArray.sortBy(function(group){
		return group.name == GROUP_DEFAULT ? 0 : 1; //so that matches (0) are at front and non-matches (1) are at end
	});

	//template it up! put in one for each group; we don't do it en masse
	var list = $('#organize-group-list');
	list.empty();
	groupArray.forEach(function(group){
		var panel = template('template-organize-group', list, group, true);
		panel.find('.action-delete').oneClick(function(){
			self.deleteDivider(group.name);
		});
	});

     $('#organize-group-list').sortable({
          axis: 'y',
          cancel: "li.list-divider",
          items: "li.list-group-item:not(#organizer-top-divider)", //DON'T sort above unorganized item
          stop: function(event, ui){
               //sorting stopped, refresh
               self.save();
          },
          revert: false
     });
},

save: function(self){
     self.reassignGroups();

     chevre.refreshProjectList();
     chevre.save();
},

/**
 * Assigns groups to the projects based on their current location in the list.
 * Looks at the location of projects in the list and updates the model accordingly
 * DO NOT use this to permanently save; only use for temporary stuff
 */
reassignGroups: function(self){
     //we need to re-assign groups to each project & re-order projects based on the order they shuffled them in
     var lastGroup = null;
     var newProjectOrder = []; //what the NEW chevre.projects array should look like; since we're going from top to bottom, this will honor their organization requests
     $('#organize-group-list').children().each(function(){
          if($(this).hasClass("list-divider")){
               //it's a group divider
               lastGroup = $(this).find('.list-group-name').html();
          }
          else{
               //it's a project
               var project = chevre.getProjectByID($(this).data('id'));
               project.group = lastGroup;
               newProjectOrder.add(project);
          }
     });

     //reassign order (in case they shuffled projects around)
     console.log(newProjectOrder);
     chevre.projects = newProjectOrder;
},

addProject: function(self, project){
     var li = getClonedTemplate('template-organize-project');
     li.find('.project-name').html(project.name);
     li.data('id', project.id);

     $('#organizer-list').append(li);
},

deleteDivider: function(self, groupName){


		//console.log(groupName);
      self.reassignGroups();
      //get rid of this divider; change all projects with this group to unorganized and reload
      chevre.projects.each(function(project){
           if(project.group == groupName){
                project.group = GROUP_DEFAULT;
           }
      });

      chevre.save();
      chevre.refreshProjectList();

      //reloading will take care of getting rid of this li (since it has no projects it will be destroyed)
      self.load();
},

/**
 * Creates a divider (group) with the given name.
 * @param {String} name  the proposed name for the divider; we'll edit it if it clashes with an existing one
 */
/*addDivider: function(self, name){
     var dividerNames = [];
     $('#organize-group-list').children().each(function(){
          if($(this).data('role') == "list-divider"){
               //it's a group divider
               dividerNames.add($(this).find('.divider-name').html());
          }
     });
     name = ensureNoDuplicateNames(name, dividerNames);

     template('template-organize-group', $('#organize-group-list'), {name: groupName}, true);
     li.find('.divider-name').html(name);
     //li.css('color','red');
     li.find('.action-delete').oneClick(function(){
     		console.log(42);
          //get rid of this divider; change all projects with this group to unorganized and reload
          self.reassignGroups();
          chevre.projects.each(function(project){
               if(project.group == name){
                    project.group = GROUP_DEFAULT;
               }
          });
          //reloading will take care of getting rid of this li (since it has no projects it will be destroyed)
          self.load();
     });

     $('#organizer-list').append(li);
}*/


});
