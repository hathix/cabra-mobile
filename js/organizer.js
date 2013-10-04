var organizer = new Singleton({
  
__init__: function(self){
     self.setup();
},
  
/**
 * Called BEFORE this runs the first time.
 */
setup: function(self){
     $('#organizer-list').sortable({ 
          axis: 'y', 
          placeholder: 'ui-body-b', 
          cancel: "li[data-role='list-divider']", 
          items: "li:not(#head-divider)",
          stop: function(event, ui){
               //sorting stopped, refresh
               $('#organizer-list').listview('refresh');
          }
     });
     $('#organizer-list').disableSelection();
     $('#organizer-add-divider').oneClick(function(){
          var name = $('#divider-name-field').val();
         if(name && name.trim() != ""){
             self.addDivider(name);   
             $('#organizer-list').listview('refresh');
             $('#divider-name-field').val(''); //clear field
             $('#organizer-collapsible').trigger('collapse'); 
         }         
     });
     $('#organizer-save').oneClick(function(){
          self.save();
     });
},  
   
/**
 * Called each time the page is loaded.
 */     
load: function(self){ 
     //86 everything besides the main divider
     $('#organizer-list').find('li').not('#head-divider').remove();
     var groupedProjects = chevre.projects.groupBy('group'); //object { groupName: [proj1, proj2, proj3], ... }
    
     //stick on unorganized's first (since that divider is at the top)...
     if(Object.has(groupedProjects, GROUP_DEFAULT)){
          groupedProjects[GROUP_DEFAULT].each(function(project){
               self.addProject(project);     
          });
     }
     //and tack on everything else
     Object.keys(groupedProjects, function(groupName, projects){
          //make divider for each; we already added Unorganizd
          if(groupName != GROUP_DEFAULT){
               self.addDivider(groupName);             
               projects.each(function(project){
                    self.addProject(project);
               });
          }
     });
     
     $('#organizer-list').listview('refresh');
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
     $('#organizer-list').children().each(function(){ 
          if($(this).data('role') == "list-divider"){
               //it's a group divider
               lastGroup = $(this).find('.divider-name').html();
          }
          else{
               //it's a project
               var project = chevre.getProjectByID($(this).data('id'));
               project.group = lastGroup;
               newProjectOrder.add(project);
          }
     });    
     
     //reassign order (in case they shuffled projects around)
     //console.log(newProjectOrder);
     chevre.projects = newProjectOrder;   
},

addProject: function(self, project){
     var li = getClonedTemplate('template-organize-project');
     li.find('.project-name').html(project.name);
     li.data('id', project.id);
     
     $('#organizer-list').append(li);
},

/**
 * Creates a divider (group) with the given name. 
 * @param {String} name  the proposed name for the divider; we'll edit it if it clashes with an existing one
 */
addDivider: function(self, name){
     var dividerNames = [];
     $('#organizer-list').children().each(function(){ 
          if($(this).data('role') == "list-divider"){
               //it's a group divider
               dividerNames.add($(this).find('.divider-name').html());
          }
     });
     name = ensureNoDuplicateNames(name, dividerNames);
     
     var li = getClonedTemplate('template-organize-divider');
     li.find('.divider-name').html(name);
     li.find('button').button();
     li.find('button').oneClick(function(){
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
}
     
     
});
