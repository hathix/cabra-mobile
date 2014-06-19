var PageDB = new Singleton({

__init__: function(self){
	self.pages = [
		//new Page("home", "Home", "Home sweet home", "home"),
		//new Page("sync", "Sync", "Sync it up", "refresh"),
		//new Page("options","Options", "Optioned to AAA", "cog")
	];
},

/**
 * Returns the page(s) with the given slug(s).
 * @param {String/String[]} slugObj	either one string, or an array of strings, if you want several pages.
 * @return {Page/Page[]}	depending on what you passed.
 */
get: function(self, slugObj){
	if(Object.isArray(slugObj)){
		var array = slugObj.map(function(slug){
			return self.pages.find(function(page){
				return page.slug == slug;
			});
		});
		return array.compact();
	}
	else{
		//slug is a string
		var result = self.pages.find(function(page){
			return page.slug == slugObj;
		});
		return result;
	}
},

/**
 * Gets ONE page and returns it wrapped in a jQuery object so you can bind listeners to it.
 * @param {String} slug	a string identifying the page.
 */
getJQuery: function(self, slug){
	return $(self.get(slug));
},

/**
 * Adds the given page to the database.
 * @param {Page} page
 */
add: function(self, page){
	self.pages.push(page);
}

});
