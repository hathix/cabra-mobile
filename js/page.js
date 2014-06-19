/**
 * A certain page (organizer, sync, studying, etc.) Each page has its own function, <section>, and purpose.
 */
var Page = new Class({

/**
 *
 * @param {String} slug  the id of the page's section in the HTML. Omit the hashtag. Must be unique identifier of this page.
 * @param {String} name  the fancy user-facing name.
 * @param {String} description     A user-friendly page description.
 * @param {String} icon  a glyphicon icon in case we need to display the page; give just the icon name. "cog" -> "glyphicon glyphicon-cog".
 * @param {String} childOf	[optional; default null] Pass the slug of the page this is a child of, if any. If this page is a child, it can only be opened from the parent page or a sibling. Furthermore, when it is opened, it is not tracked in history.

 */
__init__: function(self, slug, name, description, icon, childOf){
     self.name = name;
     self.description = description;
     self.icon = icon;
     self.slug = slug;
     self.childOf = orDefault(childOf, null);
},

/**
 * Returns the jQuery element the page represents.
 */
getElement: function(self){
	return $('#' + self.slug);
},

/**
 * Called when this page is loaded to be shown to the user.
 */
load: function(self){

}

});
