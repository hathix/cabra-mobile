/**
 * A collection of utilities. 
 */

/**
 * Loads the container with HTML from the source, with the data supplied. This uses Handlebars.
 * @param {String}  source    the name of the index. Omit the hashtag. e.g. "template-project".
 * @param {jQuery}  container the element to put the rendered HTML into.
 * @param {Object}  data      the data used to render the template.
 * @param {boolean} append    [optional; default false] if true, container will have HTML appended, not replaced.
 * @return {jQuery} the jQuery items that were loaded into the container. This is just a collection of items, so to find something inside use [return value].closest([selector]).
 */
function template(source, container, data, append){
     var sourceHTML = $('#' + source).html();
     var templateFn = Handlebars.compile(sourceHTML);
     var html = templateFn(data);
     var jQ = $(html);
     if(append)
          container.append(jQ);
     else
          container.empty().append(jQ);
     return jQ;
}

/**
 * Clones an HTML template with the given ID and returns it.
 * The template should have the class "hidden".
 * @param {String}  id  the id of the template you want to clone in the HTML (don't include the hashtag #).
 * @return {jQuery}     a copy of that template.
 */
function getClonedTemplate(id){
    id = id.remove('#'); //in case they accidentally added a #
    var clone = $('#' + id).clone().removeAttr('id').removeClass('hidden');
    return clone;
}


/**
 * Creates a toast (a small popup) temporarily. Good for showing messages (like confirmation/success) that require no input from user and aren't critical to their use of the app.
 * @param {String}  text the text to show in the toast. Can include HTML.
 * @param {Object}     options  [optional] contents: duration (int), error (boolean) /
 *   duration: how long to show the text. Default TOAST_DURATION_DEFAULT. Use TOAST_DURATION_[X] for lengths.
 *   type:		the classification of the toast; 'success', 'info', 'warning', 'danger' (or something from enum ToastTypes.) Default ToastTypes.INFO.
 */
function toast(text, options){
     var defaults = {
          duration: TOAST_DURATION_DEFAULT,
          type:		ToastTypes.INFO
     };
     var options = Object.merge(defaults, options, true, true); //custom options override
     
     //wait, first clear out old toasts
     burnToast();
     
     var toast = getClonedTemplate('template-toast');
     $('#floaters').append(toast);
     toast.find('.toast-text').html(text);
     
     //add style
     toast.alterClass('alert-*', 'alert-' + options.type);
    
     //place it partway down the page
     //horiz centered, but farther than 1/2 down the page vertically (like Android toasts)
     var windowWidth = $(window).width();
     var ourWidth = toast.width();
     var windowHeight = $(window).height();
     var ourHeight = toast.height();
     
     //x and y are top left coords; (bigger-smaller)/2
     var x = (windowWidth - ourWidth) / 2;
     var y = windowHeight * TOAST_VERTICAL_PLACEMENT - ourHeight / 2;
     
     toast.css({
     	left: x,
     	top: y,
     });
     //toast.fadeIn();
     toast.alert();
     toast.show();
     (function(){
     	burnToast();
     }).delay(options.duration);
     //TODO make it positioned near bottom of screen
}

/**
 * Destroys/hides the currently visible toast.
 * If you used TOAST_DURATION_FOREVER as the duration you'll have to call this eventually. 
 */
function burnToast(){
     $('#floaters').find('.toast').alert('close');
}

String.prototype.splitOnce = function (delim) {
    var str = this;
    var components = str.split(delim);
    var result = [components.shift()];
    if(components.length) {
        result.push(components.join(delim));
    }
    return result;
}

/**
 * Edits the proposed name (of a project, for instance) so that it does not match any of the existing names.
 * This adds "(1)", "(2)", etc. to the proposed name if it's a duplicate.
 * @param {String} proposedName    the proposed name (what the user entered) for a new item.
 * @param {String[]} existingNames a list of names of existing items.
 * @return {String} the edited proposed name so that there are no overlaps.
 */
function ensureNoDuplicateNames(proposedName, existingNames){
     while($.inArray(proposedName, existingNames) != -1){
         //there exists an item whose name matches
         //we will add a (1) to the end
         //if it (somehow) already has a (1), change to (2)
         var inParens = proposedName[0].match(/\(\d\)$/); //like (1); this only works at end
         if(inParens !== null){
              //has a (1) or something, replace
              //the results of match() always come in array form (i.e. ["3"]) so get rid of those with .last()
              var ordinal = inParens.last().match(/\d/).last().toNumber(); //like 1
              var newOrdinal = ordinal+1;
              //replace old one
              proposedName = proposedName.replace(new RegExp(sprintf("\\(%s\\)$", ordinal)), sprintf("(%s)", newOrdinal)); // (1) -> (2)
         }
         else{
              //nothing in parens, so this is the first duplicate. Just tack on a (1)
              proposedName += " (1)";
         }
     }
     
     return proposedName;
}

/**
 * Given a raw string from a text area or such, makes it more HTML-friendly.
 * @param {String/String[]} if you pass an array, prettify will be called on each string.
 * @return the string made pretty, or an array where every string has been made pretty.
 */
function prettify(raw){
     if(Object.isArray(raw)){
          raw = raw.map(function(rawString){
               return prettify(rawString);
          });
          return raw;
     }
    
    //TODO: have some sort of markdown editor/replacer (markItUp)
    
    return raw;
};

/**
 * Cleans question/answer input, getting rid of all bad tags, characters, etc. ONLY CALL THIS ONCE ON A CARD.
 * @param {String/String[]} if you pass an array, this will be called on each string.
 * @return the string made clean, or an array where every string has been made clean.
 */
function cleanInput(raw){
     if(Object.isArray(raw)){
          raw = raw.map(function(rawString){
               return cleanInput(rawString);
          });
          return raw;
     }     
     
     
    raw = raw.replace(/\n/g, "<br>"); //newlines turn to br's
    raw = raw.removeTags('script', 'link', 'img'); //no scripting! that could be evil! and images crash stuff
    
         
    return raw;
}

/**
 * Takes an HTML-friendly string from prettify and de-prettifies it, making it raw again.
 * This should be the EXACT inverse of prettify: deprettify(prettify(str)) = prettify(deprettify(str)) == str 
 */
function deprettify(pretty){
    var raw = pretty.replace(/\<br\>/g,"\n"); //br's turn to newlines
    return raw;
}

/**
 * Returnsthe given value if it's defined, or default if it isn't. For example, call this:
 * orDefault(x, 0)
 * To get x, or 0 if it isn't defined.
 */
function orDefault(supposed, def){
    if(typeof supposed == undefined || supposed == undefined) return def;
    return supposed;
}

function orIfFalsy(supposed, def){
    if(truthiness(supposed))
        return supposed;
    else
        return def;
}

/**
 * Enhanced version of the standard truthiness function.
 * If the value is any of the following, this returns false:
 *  false, 0, undefined, null, NaN, "" - standard
 *  [], {} - custom
 * 
 * @param {Object} val  any value
 * @return {Boolean} true if truthy, false if falsy - if it's falsy, it's probably not well-defined so do some default. 
 */
function truthiness(val){
    if(!val) return false;
    if(val instanceof Array && val.isEmpty()) return false;
    if(Object.equal(val, {})) return false;
  
    return true;
}

/**
 * Runs a trial. Use to simulate random events and get a result.
 * @param {float} chance    the chance something will happen. 0.5 means 50%. Higher chance means the result is more likely to be true.
 * @return {boolean} true if it will happen under the randomness, false otherwise 
 */
function pushLuck(chance){
    return Math.random() < chance;
}

/**
 * Converts a hex code to RGB. Outputs an array [r,g,b].
 * You can add the hashtag # if you want - not necessary.
 * hexToRGB('#FF0000') -> [255,0,0]
 */
function hexToRGB(hex){
     hex = hex.remove('#');
     var rgb = [ hex.substring(0,2), hex.substring(2,4), hex.substring(4,6) ];
     rgb = rgb.map(function(x){ return x.toNumber(16); });
     return rgb;
}

/**
 * Converts an rgb array [r,g,b] to hex code rrggbb.
 * Does NOT put the hashtag # in front.
 * rgbToHex([255,0,0]) -> 'FF0000' 
 */
function rgbToHex(rgb){
     var hexArray = rgb.map(function(x){ return x.pad(2,false,16); }); //['FF','00','00']
     var hexString = hexArray.reduce(function(x,y){ return x + y});
     return hexString;
}

/**
 * Safely reloads the current page. 
 */
function reloadPage(){
    location.href = "#";
    location.reload();
}


function checkInternet(yep, nope){
    try{
        $.ajax({
            url: ajaxTestURL,
            type: 'GET',
            dataType: 'text',
            complete: function(jqXHR, status){
                alert(status);
            }
        });
    }
    catch(error){
        alert(error);
    }
}

/**
 * Conveninent wrapper for Object.has(). Returns true if the given object is defined and has the given field, false otherwise. 
 */
function objectHas(val, key){
    if(!val) return false;
    
    return truthiness(val[key]);
}

/**
 * Replaces ALL occurrences of the first string with the second string.
 * This is a member function of the String so you can call it on a string.
 * Usage: "Philly".replaceAll("l","z") = "Phizzy"
 * @param {String} subject    What to find.
 * @param {String} replacement     What to replace subject with.
 * @return {String}
 */
String.prototype.replaceAll = function(subject, replacement) {
  return this.replace(new RegExp(subject, 'g'),replacement);
}

/**
 * Compresses an object into its bare-minimum fields. Decompress it with decompress().
 * @param {Object} obj  any object.
 * @param {String/Object[]} keysToSave  a list of keys of the object to save to a compressed object. If given a string, that field of the original object will be copied straight to the compressed - works best with ints and strings. If given an Object { name: function(obj, value)}, the function will be called with the compressed object and the value at the appropriate field in the original object. You can assign directly to obj; if so don't return anything. Return a value and it'll be saved to the [name] property of the compressed object.
 * 
 * Usage:
 * compress({a:5,b:3,c:2,d:{x:"asdf"}}, ['a','b', { d: function(compressed, val){ return val.x + " :)"; }}])
 *   => {a: 5, b: 3, d: "asdf :)"}
 */
function compress(obj, keysToSave){
    var compressed = {};
    
    keysToSave.forEach(function(key){
        //key is either string (prop from obj) or object (custom handler)
        if(Object.isString(key)){
            //get the property named key from the obj and put it into the compressed
            compressed[key] = obj[key];
        }    
        else if(Object.isObject(key)){
            //custom handler; contains { name: function } pair
            var name = Object.keys(key)[0];
            var func = Object.values(key)[0];
            
            var result = func(compressed, obj[name]);
            if(result !== undefined)
                compressed[name] = result;
        }
    });
    
    return compressed;
}

/**
 * Given a primitive object stored from compress(), reinflates it into a proper object. This is Cobra-compatible.
 * @param {Object} obj  a raw, primitive object gotten from compress; or just key-value pairs
 * @param {String} className    the name of the class, such as "String". This will be called with the args.
 * @param {String[]} keysInInit the keys of the values you want to be passed to the constructor. The values will be gotten from obj.
 * @param {String/Object[]} keysOutsideInit [optional] the values at these keys (from obj) will be tacked straight on to the proper object. Specify a string to get the value (usually int/string) from the obj. Specify { name: function(obj, value)} and it'll be called with the proper object and value at the given key. You can do custom init (such as calling a setter) or manipulation. Return a value and it'll be tacked directly onto the proper object.
 * 
 * Usage:
 * decompress({a: 3, b: 5, c: { name: "A" }}, "Object", ['a'], 
 * ['b', { 'c': function(obj, value){ return value.name + " :)"} }]);
 */
function decompress(obj, className, keysInInit, keysOutsideInit){
    //apply the constructor
    //args to constructor
    //keysInInit is a list of strings
    var args = keysInInit.map(function(key){
        var value = obj[key];
        if(value === undefined){
            //nothing saved there; omit it
            return null;
        }
        return JSON.stringify(value); //turns raw strings into strings with quotes around them 
    });
    //this may have some null values in it
    args = args.compact();
    
    //make a big string and eval it
    var str = sprintf("new %s(%s)", className, args.join(","));
    var goodObj = eval(str);
    
    //add on keys outside
    if(keysOutsideInit){
        keysOutsideInit.forEach(function(key){
            //if they specified a custom handler, it's an object; else just a string
            if(Object.isString(key)){
                goodObj[key] = obj[key];
            }   
            else if(Object.isObject(key)){
                //custom handler: it's { name: function } where function returns what to assign it to
                var name = Object.keys(key)[0];
                var func = Object.values(key)[0];
                
                var result = func(goodObj, obj[name]); //pass it the value stored in the primitive object
                //if they already did it, they returned nothing; else, they returned what to set the value to
                if(result !== undefined)
                    goodObj[name] = result;
            } 
        });
    }
    
    return goodObj;
}

/**
 * Wraps the given object in a Cobra-like manner, so that it can easily be appended to a Cobra class. 
 * You can have fields and functions.
 * @param {Object} self the object that self will be when obj is called. This should be the Cobra class object that this will merge into.
 * @param {Object} obj  contains some fields and functions.
 * @return {Object} object, except rewritten in such a way that it can be harmoniously combined with an existing Cobra object.
 */
function cobraWrap(self, obj){
    var key, member;
    for (key in obj) {
        member = obj[key];
        // Don't wrap things on object.prototype with self
        if (Object.prototype[key] == member) {
            continue;
        }
        if (typeof member == 'function') {
            obj[key] = Cobra.Class.method(member, self);
        }
    }
    
    return obj;
}


/**
 * Changes the HTML of an element but does a nice fading animation in between.
 * @param {String} html  HTML to put in the element
 * @param {int} speed    [optional] the speed at which the text fades in/out. Default is FADE_SPEED.
 */
$.fn.htmlFade = function(html, speed) {
     this.fadeChange(function(self){
          self.html(html);     
     }, speed);
}

/*
 * Animates a transition but has fading in between.
 * @param {function()} func   called (param = $(this)) when it's ready.
 * @param {int} speed    [optional] the length the fade transition takes. Default is FADE_SPEED.
 * 
 * Sample usage:
 * fadeChange(function(self){
 *      self.doSomething(); //normal jQuery functions
 * })
 */
$.fn.fadeChange = function(func, speed){
     if(speed === undefined)
          speed = FADE_SPEED;
     this.fadeOut(speed, function() {
          func($(this));
          $(this).fadeIn(speed);
     });     
}

/**
 * Works much the same as .click(), except it unbinds any existing click events beforehand.
 * Use this if you want to quickly overwrite the click handler.
 * 
 * Pass just callback - bound to normal click
 * Pass scope & callback - bound like on('click', scope, callback)
 */
$.fn.oneClick = function(scope, callback){
    this.unbind('click');
    if(arguments.length == 1){
        //only 1 arg - that'll be named scope
        this.click(scope);
    }
    else if(arguments.length == 2){
        //2 args - that means to re-bind
        this.on('click', scope, callback);
    }
}

/**
 * Works just like bind(), except it unbinds any existing bind events so that only one is active at once.
 * @param {string} event    the type of event
 * @param {function} callback   will be called when the event is triggered 
 */
$.fn.oneBind = function(event, callback){
    this.unbind(event);
    this.bind(event, callback);
}

/**
 * Returns the actual HTML representation of this jQuery element. 
 */
$.fn.outerHTML = function(){
    return this.clone().wrap('<p>').parent().html();
}

// JQUERY PLUGIN: I append each jQuery object (in an array of
// jQuery objects) to the currently selected collection.
/**
 * Adds each jQuery object in the given array to this jQuery object.
 * 
 * Usage: 
 * $element.appendEach([$child1, $child2, ...]);
 */
$.fn.appendEach = function(arrayOfWrappers) {

    // Map the array of jQuery objects to an array of
    // raw DOM nodes.
    var rawArray = jQuery.map(arrayOfWrappers, function(value, index) {

        // Return the unwrapped version. This will return
        // the underlying DOM nodes contained within each
        // jQuery value.
        return ( value.get() );

    });

    // Add the raw DOM array to the current collection.
    this.append(rawArray);

    // Return this reference to maintain method chaining.
    return (this );

}; 

/**
 * For <input type='file'> elements.
 * This grabs the image that's been uploaded in the input and uploads it to imgur.
 * @param [function(url)]     success  It will be called with the URL of the image once it's been uploaded. (May fail on old browsers!) For instance, the URL may be "http://imgur.com/asdf.png"
 * @param [function]          failure   It will be called (no params) if uploading fails, perhaps because the internet is down.
 * 
 * Usage: $('#input').uploadImage(function(url){
 *   //do something with the URL... (success)
 * $('#image').attr('src',url);
 * console.log(url);     
 * });
 */
$.fn.uploadImage = function(success, failure){
     var file = this[0].files[0];
     //console.log(file);

     // file is from a <input> tag or from Drag'n Drop
     // Is the file an image?
     if (!file || !file.type.match(/^image.+/))
          return;

     // It is!
     // Let's build a FormData object

     var fd = new FormData();
     fd.append("image", file);
     // Append the file
     fd.append("key", "f29ad9351cf47372acb65aa6ca997cb8");
     //yes that's Cabra's key. may want to save it as a const

     //TODO jquery-fy this
     // Create the XHR (Cross-Domain XHR FTW!!!)
     var xhr = new XMLHttpRequest();
     xhr.open("POST", "http://api.imgur.com/2/upload.json");
     // Boooom!
     xhr.onload = function() {
          // Big win!
          // The URL of the image is:
          var rawURL = JSON.parse(xhr.responseText).upload.links.imgur_page;
          //this links to page, we need image link
          //we need to add extension... grab that from file name
          var chunks = file.name.split(".");
          var extension = chunks.last();
          //so like "png"
          var url = rawURL + "." + extension;
          success(url);
     }
     xhr.onerror = function(){
          if(failure) failure();
     }
     // Ok, I don't handle the errors. An exercice for the reader.
     // And now, we send the formdata
     xhr.send(fd); 
}  

/*
 * Usage:
 * sprintf('You bought %s widgets', numWidgets);
 * sprintf('That makes %d dollars and %d cents', costDollars, costCents);
 * 
 * %d - displayed as int
 * %s - displayed as string
 * 
 * More powerful sprintf (but also bigger): http://www.diveintojavascript.com/projects/javascript-sprintf
 */
function sprintf(s) {
    var bits = s.split('%');
    var out = bits[0];
    var re = /^([ds])(.*)$/;
    for (var i=1; i<bits.length; i++) {
        p = re.exec(bits[i]);
        if (!p || arguments[i]==null) continue;
        if (p[1] == 'd') {
            out += parseInt(arguments[i], 10);
        } else if (p[1] == 's') {
            out += arguments[i];
        }
        out += p[2];
    }
    return out;
}