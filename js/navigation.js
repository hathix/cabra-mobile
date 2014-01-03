
/**
 * Handles all navigation. 
 */
var nav = new Singleton({

__init__: function(self){
     //start at home since that's where app opens
     self.history = [PageDB.get("home")];  //stores past Pages
     self.index = 0; //where we are in history
},

/**
 * HERE'S HOW NAVIGATION WORKS.
 * When you go to a new page, a new item is added to history, and the pointer is at the last item.
 * When you go back, the index goes backward. You can do this till you get to the base of the history stack.
 * If you've gone back and index != history.length-1 (you're behind the tip of the stack), you can go forward (increase index)
 * BUT, as soon as you add something new to history, all future items (items ahead of pointer) are deleted. 
 */

/**
 * PUBLIC!
 * Opens the given page or goes home/back/forward depending on the href.
 * This is like clicking a link in a browser window.
 * @param {String} href  the slug of the page to navigate to. Exclude the hashtag.
 */
openPage: function(self, href){

     //there are certain special cases. NAV_BACK, NAV_HOME, NAV_FORWARD
     if(href == NAV_HOME){
          self.home();
     }
     else if(href == NAV_BACK){
          self.back();
     }
     else if(href == NAV_FORWARD){
          self.forward();
     }
     else{
		//normal link to open a page

		var page = PageDB.get(href);
		if(page.childOf) {
			//yup, this page is a child of someone! special rules
			//TODO check that current page is parent/sibling of new page
			//load it, but don't log in history
			self.loadPage(page);
		} 
		else {
			//normal full page
			self.addHistoryItem(href);
			self.loadCurrentPage();
		}
     }
},

/**
 * PUBLIC!
 * Reloads the current page. Not the browser reloading, but the "page" we're using.
 */
refreshPage: function(self){
	self.loadCurrentPage();	
},

/**
 * Goes back a page. 
 */
back: function(self){
	self.loadPage(NAV_BACK);
},

/**
 * PRIVATE USE ONLY.
 * Opens (navigates to) the page currently pointed at by the index.
 */
loadCurrentPage: function(self){
     var page = self.history[self.index];
     self.loadPage(page);
},

/**
 * Very low level - this opens a page, any page. Use loadCurrentPage() for most things; only use this directly for child pages or other pages that exist outside the normal history hierarchy. 
 */
loadPage: function(self, page){
	if(!(page instanceof Page)){
		//they probably meant openPage, but that won't work here
		console.log("Hey! You meant openPage!");
		x = null; x.makeError;
	}
	
     //we want to open the trigger; if it doesn't exist, make it
     if(!self.hasTrigger(page)){
          self.makeTrigger(page);
     }
     //open that tab
     $('#trigger-' + page.slug).tab('show');
     $(page).trigger('load'); //TODO maybe move above the line that actually shows it?
     
     self.buildBreadcrumbs();	
},

addHistoryItem: function(self, href){
	var page = PageDB.get(href);
	
	var slugs = self.getSlugs();
	var navIndex = slugs.indexOf(href); //-1 if this is a new page, >-1 if it's already in the hierarchy
	if(navIndex == -1){
		//new page. cut anything in front and pop this on.
	     //say we have [a,b,c,d] and index=2. Cut anything in front of that and add on top
	     if(self.index < self.history.length-1){
	          self.history.length = self.index+1;
	     }
	     self.history.add(page);
	     self.index = self.history.length-1;		
	}
	else{
		//the page to move to exists at position navIndex; either forward or back
		//maintain the hierarchy as it is
		self.index = navIndex;
	}
	

},

home: function(self){
     //empty history and go to home page
     self.history = [];
     self.index = 0;
     self.addHistoryItem(NAV_BASE);
     self.loadCurrentPage();
},

back: function(self){
     //if there's nowhere to go back, stop!
     if(self.index == 0) return;
     self.index -= 1;
     self.loadCurrentPage();    
},

forward: function(self){
     //if there's nowhere to go forward, stop!
     if(self.index == self.history.length-1) return;
     self.index += 1;
     self.loadCurrentPage();     
},

/**
 * Returns true if the trigger (hidden tab for nav purposes) for the given href exists. 
 * @param {Page} href  the object for the page in question. Exclude the hashtag.
 */
hasTrigger: function(self,  page){
     return ($('#triggers').has(sprintf('a[href="#%s"]',page.slug)).length != 0);
},

/** 
 * Makes a trigger (fake tab for nav purposes) for the given href.
 * @param {Page} page  the page to open.
 */
makeTrigger: function(self, page){
     var tab = $(sprintf('<a href="#%s" data-toggle="tab" id="trigger-%s"></a>', page.slug, page.slug));
     $('#triggers').append(tab);     
},

buildBreadcrumbs: function(self){
     var container = $('<ol class="breadcrumb"></ol>');
     self.history.forEach(function(page,index){
          var li;
          if(index == self.index){
               li = $(sprintf('<li class="active">%s</li>', page.name));
          }
          else{
               li = $(sprintf('<li><a data-href="%s">%s</li>',
                    page.slug,
                    page.name
               ));
          }
          
          container.append(li);     
     });     
     $('#breadcrumbs').empty().append(container);
     
     //TODO handle what happens when you click the a's... it should take you to PRECISELY that spot in the history and clear out anything else;resurrect #breadcrumbs
},

/**
 * Returns an array of slugs (hrefs) from the history, in the same order that the pages are in.
 */
getSlugs: function(self){
	return self.history.map(function(page){ return page.slug; });
}

});
