/**
 * CONTENTS:
 * 1. Console log
 * 2. Cobra
 * 3. Cross-domain mod for jQuery's AJAX
 * 4. jQuery store
 * 5. jQuery browser (from 1.8.3; needed for jqPlot)
 * 6. jQuery Touch Punch
 * 7. jQuery alterClass
 * 8. Bootbox - Bootstrap notifications
 * 9. Handlebars #if conditional 
 * 10. FastClick
 * 11. Sugar JS
 */

// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function f(){ log.history = log.history || []; log.history.push(arguments); if(this.console) { var args = arguments, newarr; args.callee = args.callee.caller; newarr = [].slice.call(args); if (typeof console.log === 'object') log.apply.call(console.log, console, newarr); else console.log.apply(console, newarr);}};

// make it safe to use console.log always
(function(a){function b(){}for(var c="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),d;!!(d=c.pop());){a[d]=a[d]||b;}})
(function(){try{console.log();return window.console;}catch(a){return (window.console={});}}());


// place any jQuery/helper plugins in here, instead of separate, slower script files.

/* License: MIT-style License
 */

/**
 * ==Cobra==
 * A simple, lightweight JavaScript Class Library
 * http://justintulloss.github.com/cobra/
 * http://justintulloss.github.com/cobra/api/
 **/

/*global window exports GLOBAL */
/*jslint forin: true */

/** section: Cobra
 * Cobra
 * The base namespace.
 *
 * This namespace holds all of the Cobra class functionality. If you prefer
 * this type of functionality to be globally avaiable (so you don't need
 * to prepend every access with `Cobra`), check out [[Cobra.install]]
 **/
var Cobra = typeof window === 'undefined' ? exports : {};
(function() {
    var root = typeof window === 'undefined' ? GLOBAL : window;

    function toArray(iterable) {
        return Array.prototype.slice.call(iterable);
    }

    /**
     * Cobra.config -> Object
     * Configuration options for Cobra.
     *
     * Options
     * -------
     *
     * - `self`: Make "self" the first argument of every class method.
     *    Makes things easier to use, but there is a performance tradeoff.
     **/
    Cobra.config = {
        self: true
    };

    /**
     * Cobra.install() -> undefined
     *
     * This function makes all the top level cobra objects part of
     * the global namespace. Do this if you don't want to prepend every
     * call to Cobra with `Cobra`
     **/
    Cobra.install = function() {
        var key;
        for (key in Cobra) {
            if (key != 'install') {
                root[key] = Cobra[key];
            }
        }
    };

    /**
     * class Cobra.Class
     **/

    /**
     * new Cobra.Class(prototype)
     * - prototype (Object): The object to inherit from. May contain
     *   special properties that change behavior (such as `__init__` and
     *   `__extends__`). These are documented in depth below.
     *
     * The `Cobra.Class` function allows you to make very simple classes in
     * a style modeled after python.
     *
     * Everything is public. Indicate that you would prefer certain
     * things be kept private with a leading underscore (IE. `_privateThing`)
     *
     * All class methods are passed `self` as their first parameter. Self
     * is guaranteed to be the instance of the class, whether `this` is the
     * instance or not.
     *
     * Provide a constructor called `__init__` if you would like to initialize
     * things.
     *
     * Provide a base class in the `__extends__` property if you want your
     * class to inherit from that class.
     *
     * Example
     * -------
     *      var Animal = new Cobra.Class({
     *          __init__: function(self) {
     *              self.breathes = true;
     *          }
     *      });
     *      var Feline = new Cobra.Class({
     *          __extends__: Animal,
     *          __init__: function(self) {
     *              Cobra.Class.ancestor(Feline, '__init__', self);
     *              self.claws = true;
     *              self.furry = true;
     *          },
     *          says: function(self) {
     *              console.log ('GRRRRR');
     *          }
     *      });
     *      var Cat = new Cobra.Class({
     *          __extends__: Feline,
     *          __init__: function(self) {
     *              Cobra.Class.ancestor(self, '__init__', self);
     *              self.weight = 'very little';
     *          },
     *          says: function(self) {
     *              console.log('MEOW');
     *          }
     *      });
     *      var Tiger = new Cobra.Class({
     *          __extends__: Feline,
     *          __init__: function(self) {
     *              Cobra.Class.ancestor(Tiger, '__init__', self);
     *              self.weight = 'quite a bit';
     *          }
     *      });
     *
     * Usage
     * -----
     *
     *      >>> sneakers = new Cat();
     *      Object breathes=true claws=true furry=true
     *      >>> sneakers.breathes
     *      true
     *      >>> sneakers.claws
     *      true
     *      >>> sneakers.furry
     *      true
     *      >>> sneakers.weight
     *      "very little"
     *      >>> sneakers.says();
     *      MEOW
     *      >>> tigger = new Tiger()
     *      Object breathes=true claws=true furry=true
     *      >>> tigger.says()
     *      GRRRRR
     **/
    Cobra.Class = function(prototype) {
        var base, key;

        // Constructor
        function klass() {
            if (this === root) {
                throw new TypeError(
                    'You must use "new" when instantiating' +
                    'a new instance of this class');
            }

            var key, member;
            var instance;
            var base;

            // Methodize all the functions
            if (Cobra.config.self) {
                for (key in this) {
                    member = this[key];
                    // Don't wrap things on object.prototype with self
                    if (Object.prototype[key] == member) {
                        continue;
                    }
                    if (typeof member == 'function') {
                        this[key] = Cobra.Class.method(member, this);
                    }
                }
            }

            this.constructor = klass;
            instance = (this.__init__) ?
                this.__init__.apply(this, arguments) : this;

            return instance;
        }

        /* A very basic, prototype-based inheritance scheme.
         *
         * Basically, we create a wrapper "base" object that will serve as the
         * prototype for our new class. It, in turn, has our inherited class
         * prototype as its prototype. This creates an prototype based
         * inheritance chain.
         *
         * If IE supported the __proto__ property on instances, this would all
         * be a bit easier.
         */
        if (prototype.__extends__) {
            klass.__extends__ = prototype.__extends__;
            delete prototype.__extends__;
            base = function() {};
            base.prototype = klass.__extends__.prototype;
            base = new base();
            /* copy the updated prototype into the properties of base */
            for (key in prototype) {
                // Needed check in case of extension on Object.prototype
                if (prototype.hasOwnProperty(key)) {
                    base[key] = prototype[key];
                }
            }
        } else {
            base = prototype;
        }

        klass.prototype = base;

        /* Cobra.Class functions */
        klass.isChild = function(parent) {
            return Cobra.Class.isChild(this, parent);
        };

        klass.hasParent = function() {
            return Cobra.Class.hasParent(this);
        };

        return klass;
    };

    /**
     * Cobra.Class.method(callable, self) -> function
     * - callable (Function): A function to methodize.
     * - self (Object): The scope you want `this` to be defined as
     *   when this method is called.
     *
     * Makes a method out of passed function, and returns the new function
     **/
    Cobra.Class.method = function(callable, self) {
        function method() {
            var args = toArray(arguments);
            args.unshift(self);
            return callable.apply(this, args);
        }
        return method;
    };

    /* Tests to see whether child has parent somewhere in its inheritance chain
     */
    Cobra.Class.isChild = function(child, parent) {
        if (child === parent) { return true; }
        if (child.__extends__) {
            return Cobra.Class.isChild(child.__extends__, parent);
        }
        return false;
    };

    /* Returns true if the child has descended from a Cobra Class */
    Cobra.Class.hasParent = function(child) {
        return (child.__extends__ || child.constructor.__extends__);
    };

    /**
     * Cobra.Class.ancestor(child, method[, args]) -> Return Value
     * - child (Cobra.Class | Object): The class or object you want to find
     *   the ancestor of. If passing an object, the object must be an instance
     *   of a [[Cobra.Class]]
     * - method (String): The method to call on the first ancestor that has
     *   the method.
     *
     * Invokes the specified method on the first parent class that has the
     * specified method.
     *
     * Example
     * -------
     *     init: function(self, arg) {
     *         Cobra.Class.ancestor(MyCobra.Class|self, '__init__', self, arg);
     *     }
     **/
    Cobra.Class.ancestor = function(child, method) {
        var parentClass = child.__extends__ || child.constructor.__extends__;
        var args = toArray(arguments);
        if (parentClass.prototype[method]) {
            args = args.slice(2, arguments.length);
            return parentClass.prototype[method].apply(this, args);
        } else {
            args[0] = parentClass; //move up one in the inheritance stack
            return Cobra.Class.ancestor.call(this, args);
        }
    };

    /**
     * class Cobra.Singleton
     **/

    /**
     * new Cobra.Singleton(prototype)
     *
     * The Singleton class is created just like a regular [[Cobra.Class]]
     * except that a single instance is returned.
     **/

    Cobra.Singleton = new Cobra.Class({
        __init__: function(self, prototype) {
            var klass = new Cobra.Class(prototype);
            return new klass();
        }
    });

})();

/** CROSS DOMAIN MOD FOR JQUERY **/
/**
* jQuery.ajax mid - CROSS DOMAIN AJAX
* ---
* @author James Padolsey (http://james.padolsey.com)
* @version 0.11
* @updated 12-JAN-10
* ---
* Note: Read the README!
* ---
* @info http://james.padolsey.com/javascript/cross-domain-requests-with-jquery/
* 
* With this, you can use $.ajax just like normal - but it'll work just fine with cross-domain requests!
* So stuff like this works. Seriously:
*   $.ajax({
    url: 'http://news.bbc.co.uk',
    type: 'GET',
    success: function(res) {
        var headline = $(res.responseText).find('a.tsh').text();
        alert(headline);
    }
});
*/

jQuery.ajax = (function(_ajax){
    
    var protocol = location.protocol,
        hostname = location.hostname,
        exRegex = RegExp(protocol + '//' + hostname),
        YQL = 'http' + (/^https/.test(protocol)?'s':'') + '://query.yahooapis.com/v1/public/yql?callback=?',
        query = 'select * from html where url="{URL}" and xpath="*"';
    
    function isExternal(url) {
        return !exRegex.test(url) && /:\/\//.test(url);
    }
    
    return function(o) {
        
        var url = o.url;
        
        if ( /get/i.test(o.type) && !/json/i.test(o.dataType) && isExternal(url) ) {
            
            // Manipulate options so that JSONP-x request is made to YQL
            
            o.url = YQL;
            o.dataType = 'json';
            
            o.data = {
                q: query.replace(
                    '{URL}',
                    url + (o.data ?
                        (/\?/.test(url) ? '&' : '?') + jQuery.param(o.data)
                    : '')
                ),
                format: 'xml'
            };
            
            // Since it's a JSONP request
            // complete === success
            if (!o.success && o.complete) {
                o.success = o.complete;
                delete o.complete;
            }
            
            o.success = (function(_success){
                return function(data) {
                    
                    if (_success) {
                        // Fake XHR callback.
                        _success.call(this, {
                            responseText: (data.results[0] || '')
                                // YQL screws with <script>s
                                // Get rid of them
                                .replace(/<script[^>]+?\/>|<script(.|\s)*?\/script>/gi, '')
                        }, 'success');
                    }
                    
                };
            })(o.success);
            
        }
        
        return _ajax.apply(this, arguments);
    };
    
})(jQuery.ajax);


/** JQUERY STORE **/
/**
    https://github.com/whitmer/store.js
*/

/* Copyright (c) 2010 Marcus Westin
 *
 */
 
 /**
 
// Store 'marcus' at 'username'
$.store.set('username', 'marcus');

// Get 'username'
$.store.get('username');

// Remove 'username'
$.store.remove('username');

// Clear all keys
$.store.clear();

// Store an object literal - jquery.store.js uses JSON.stringify under the hood
$.store.set('user', { name: 'marcus', likes: 'javascript' });

// Get the stored object - jquery.store.js uses JSON.parse under the hood
var user = $.store.get('user');
alert(user.name + ' likes ' + user.likes);

// Modify an existing object in place - creates new object if none exists
$.store.transact('user', function(user) {
  user.name = 'fred';
});
user = $.store.get('user');
alert(user.name + ' was changed from marcus to fred');
 
 */

jQuery.store = (function(){
    var api = {},
        win = window,
        doc = win.document,
        localStorageName = 'localStorage',
        globalStorageName = 'globalStorage',
        storage

    api.disabled = false
    api.set = function(key, value) {}
    api.get = function(key) {}
    api.remove = function(key) {}
    api.clear = function() {}
    api.transact = function(key, transactionFn) {
        var val = api.get(key)
        if (typeof val == 'undefined') { val = {} }
        transactionFn(val)
        api.set(key, val)
    }

    api.serialize = function(value) {
        return JSON.stringify(value)
    }
    api.deserialize = function(value) {
        if (typeof value != 'string') { return undefined }
        return JSON.parse(value)
    }

    // Functions to encapsulate questionable FireFox 3.6.13 behavior 
    // when about.config::dom.storage.enabled === false
    // See https://github.com/marcuswestin/store.js/issues#issue/13
    function isLocalStorageNameSupported() {
        try { return (localStorageName in win && win[localStorageName]) }
        catch(err) { return false }
    }
    
    function isGlobalStorageNameSupported() {
        try { return (globalStorageName in win && win[globalStorageName] && win[globalStorageName][win.location.hostname]) }
        catch(err) { return false }
    }   

    if (isLocalStorageNameSupported()) {
        storage = win[localStorageName]
        api.set = function(key, val) { storage.setItem(key, api.serialize(val)) }
        api.get = function(key) { return api.deserialize(storage.getItem(key)) }
        api.remove = function(key) { storage.removeItem(key) }
        api.clear = function() { storage.clear() }

    } else if (isGlobalStorageNameSupported()) {
        storage = win[globalStorageName][win.location.hostname]
        api.set = function(key, val) { storage[key] = api.serialize(val) }
        api.get = function(key) { return api.deserialize(storage[key] && storage[key].value) }
        api.remove = function(key) { delete storage[key] }
        api.clear = function() { for (var key in storage ) { delete storage[key] } }

    } else if (doc.documentElement.addBehavior) {
        var storage = doc.createElement('div')
        function withIEStorage(storeFunction) {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0)
                args.unshift(storage)
                // See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
                // and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
                doc.body.appendChild(storage)
                storage.addBehavior('#default#userData')
                storage.load(localStorageName)
                var result = storeFunction.apply(api, args)
                doc.body.removeChild(storage)
                return result
            }
        }
        api.set = withIEStorage(function(storage, key, val) {
            storage.setAttribute(key, api.serialize(val))
            storage.save(localStorageName)
        })
        api.get = withIEStorage(function(storage, key) {
            return api.deserialize(storage.getAttribute(key))
        })
        api.remove = withIEStorage(function(storage, key) {
            storage.removeAttribute(key)
            storage.save(localStorageName)
        })
        api.clear = withIEStorage(function(storage) {
            var attributes = storage.XMLDocument.documentElement.attributes
            storage.load(localStorageName)
            for (var i=0, attr; attr = attributes[i]; i++) {
                storage.removeAttribute(attr.name)
            }
            storage.save(localStorageName)
        })
    } else {
        api.disabled = true
    }

    return api
})();

//from jQuery 1.8.3
(function() {

var matched, browser;

// Use of jQuery.browser is frowned upon.
// More details: http://api.jquery.com/jQuery.browser
// jQuery.uaMatch maintained for back-compat
jQuery.uaMatch = function( ua ) {
    ua = ua.toLowerCase();

    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
        /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
        /(msie) ([\w.]+)/.exec( ua ) ||
        ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
        [];

    return {
        browser: match[ 1 ] || "",
        version: match[ 2 ] || "0"
    };
};

matched = jQuery.uaMatch( navigator.userAgent );
browser = {};

if ( matched.browser ) {
    browser[ matched.browser ] = true;
    browser.version = matched.version;
}

// Chrome is Webkit, but Webkit is also Safari.
if ( browser.chrome ) {
    browser.webkit = true;
} else if ( browser.webkit ) {
    browser.safari = true;
}

jQuery.browser = browser;

jQuery.sub = function() {
    function jQuerySub( selector, context ) {
        return new jQuerySub.fn.init( selector, context );
    }
    jQuery.extend( true, jQuerySub, this );
    jQuerySub.superclass = this;
    jQuerySub.fn = jQuerySub.prototype = this();
    jQuerySub.fn.constructor = jQuerySub;
    jQuerySub.sub = this.sub;
    jQuerySub.fn.init = function init( selector, context ) {
        if ( context && context instanceof jQuery && !(context instanceof jQuerySub) ) {
            context = jQuerySub( context );
        }

        return jQuery.fn.init.call( this, selector, context, rootjQuerySub );
    };
    jQuerySub.fn.init.prototype = jQuerySub.fn;
    var rootjQuerySub = jQuerySub(document);
    return jQuerySub;
};

})();

/*
 * jQuery UI Touch Punch 0.2.2
 *
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://touchpunch.furf.com/
 * 
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function(b){b.support.touch="ontouchend" in document;if(!b.support.touch){return;}var c=b.ui.mouse.prototype,e=c._mouseInit,a;function d(g,h){if(g.originalEvent.touches.length>1){return;}g.preventDefault();var i=g.originalEvent.changedTouches[0],f=document.createEvent("MouseEvents");f.initMouseEvent(h,true,true,window,1,i.screenX,i.screenY,i.clientX,i.clientY,false,false,false,false,0,null);g.target.dispatchEvent(f);}c._touchStart=function(g){var f=this;if(a||!f._mouseCapture(g.originalEvent.changedTouches[0])){return;}a=true;f._touchMoved=false;d(g,"mouseover");d(g,"mousemove");d(g,"mousedown");};c._touchMove=function(f){if(!a){return;}this._touchMoved=true;d(f,"mousemove");};c._touchEnd=function(f){if(!a){return;}d(f,"mouseup");d(f,"mouseout");if(!this._touchMoved){d(f,"click");}a=false;};c._mouseInit=function(){var f=this;f.element.bind("touchstart",b.proxy(f,"_touchStart")).bind("touchmove",b.proxy(f,"_touchMove")).bind("touchend",b.proxy(f,"_touchEnd"));e.call(f);};})(jQuery);



	/**
	 * jQuery alterClass plugin
	 * https://gist.github.com/peteboere/1517285
	 *
	 * Remove element classes with wildcard matching. Optionally add classes:
	 * $( '#foo' ).alterClass( 'foo-* bar-*', 'foobar' )
	 *
	 * Copyright (c) 2011 Pete Boere (the-echoplex.net)
	 * Free under terms of the MIT license: http://www.opensource.org/licenses/mit-license.php
	 *
	 */
	(function($) {
		$.fn.alterClass = function(removals, additions) {
			var self = this;
			if (removals.indexOf('*') === -1) {
				// Use native jQuery methods if there is no wildcard matching
				self.removeClass(removals);
				return !additions ? self : self.addClass(additions);
			}

			var patt = new RegExp('\\s' + removals.replace(/\*/g, '[A-Za-z0-9-_]+').split(' ').join('\\s|\\s') + '\\s', 'g');

			self.each(function(i, it) {
				var cn = ' ' + it.className + ' ';
				while (patt.test(cn)) {
					cn = cn.replace(patt, ' ');
				}
				it.className = $.trim(cn);
			});

			return !additions ? self : self.addClass(additions);
		};

	})(jQuery); 

/**
 * bootbox.js v4.1.0
 *
 * http://bootboxjs.com/license.txt
 */
window.bootbox=window.bootbox||function a(b,c){"use strict";function d(a){var b=r[p.locale];return b?b[a]:r.en[a]}function e(a,c,d){a.preventDefault();var e=b.isFunction(d)&&d(a)===!1;e||c.modal("hide")}function f(a){var b,c=0;for(b in a)c++;return c}function g(a,c){var d=0;b.each(a,function(a,b){c(a,b,d++)})}function h(a){var c,d;if("object"!=typeof a)throw new Error("Please supply an object of options");if(!a.message)throw new Error("Please specify a message");return a=b.extend({},p,a),a.buttons||(a.buttons={}),a.backdrop=a.backdrop?"static":!1,c=a.buttons,d=f(c),g(c,function(a,e,f){if(b.isFunction(e)&&(e=c[a]={callback:e}),"object"!==b.type(e))throw new Error("button with key "+a+" must be an object");e.label||(e.label=a),e.className||(e.className=2>=d&&f===d-1?"btn-primary":"btn-default")}),a}function i(a,b){var c=a.length,d={};if(1>c||c>2)throw new Error("Invalid argument length");return 2===c||"string"==typeof a[0]?(d[b[0]]=a[0],d[b[1]]=a[1]):d=a[0],d}function j(a,c,d){return b.extend(!0,{},a,i(c,d))}function k(a,b,c,d){var e={className:"bootbox-"+a,buttons:l.apply(null,b)};return m(j(e,d,c),b)}function l(){for(var a={},b=0,c=arguments.length;c>b;b++){var e=arguments[b],f=e.toLowerCase(),g=e.toUpperCase();a[f]={label:d(g)}}return a}function m(a,b){var d={};return g(b,function(a,b){d[b]=!0}),g(a.buttons,function(a){if(d[a]===c)throw new Error("button key "+a+" is not allowed (options are "+b.join("\n")+")")}),a}var n={dialog:"<div class='bootbox modal' tabindex='-1' role='dialog'><div class='modal-dialog'><div class='modal-content'><div class='modal-body'><div class='bootbox-body'></div></div></div></div></div>",header:"<div class='modal-header'><h4 class='modal-title'></h4></div>",footer:"<div class='modal-footer'></div>",closeButton:"<button type='button' class='bootbox-close-button close'>&times;</button>",form:"<form class='bootbox-form'></form>",inputs:{text:"<input class='bootbox-input bootbox-input-text form-control' autocomplete=off type=text />",email:"<input class='bootbox-input bootbox-input-email form-control' autocomplete='off' type='email' />",select:"<select class='bootbox-input bootbox-input-select form-control'></select>",checkbox:"<div class='checkbox'><label><input class='bootbox-input bootbox-input-checkbox' type='checkbox' /></label></div>"}},o=b("body"),p={locale:"en",backdrop:!0,animate:!0,className:null,closeButton:!0,show:!0},q={};q.alert=function(){var a;if(a=k("alert",["ok"],["message","callback"],arguments),a.callback&&!b.isFunction(a.callback))throw new Error("alert requires callback property to be a function when provided");return a.buttons.ok.callback=a.onEscape=function(){return b.isFunction(a.callback)?a.callback():!0},q.dialog(a)},q.confirm=function(){var a;if(a=k("confirm",["cancel","confirm"],["message","callback"],arguments),a.buttons.cancel.callback=a.onEscape=function(){return a.callback(!1)},a.buttons.confirm.callback=function(){return a.callback(!0)},!b.isFunction(a.callback))throw new Error("confirm requires a callback");return q.dialog(a)},q.prompt=function(){var a,d,e,f,h,i,k;if(f=b(n.form),d={className:"bootbox-prompt",buttons:l("cancel","confirm"),value:"",inputType:"text"},a=m(j(d,arguments,["title","callback"]),["cancel","confirm"]),i=a.show===c?!0:a.show,a.message=f,a.buttons.cancel.callback=a.onEscape=function(){return a.callback(null)},a.buttons.confirm.callback=function(){var c;switch(a.inputType){case"text":case"email":case"select":c=h.val();break;case"checkbox":var d=h.find("input:checked");c=[],g(d,function(a,d){c.push(b(d).val())})}return a.callback(c)},a.show=!1,!a.title)throw new Error("prompt requires a title");if(!b.isFunction(a.callback))throw new Error("prompt requires a callback");if(!n.inputs[a.inputType])throw new Error("invalid prompt type");switch(h=b(n.inputs[a.inputType]),a.inputType){case"text":case"email":h.val(a.value);break;case"select":var o={};if(k=a.inputOptions||[],!k.length)throw new Error("prompt with select requires options");g(k,function(a,d){var e=h;if(d.value===c||d.text===c)throw new Error("given options in wrong format");d.group&&(o[d.group]||(o[d.group]=b("<optgroup/>").attr("label",d.group)),e=o[d.group]),e.append("<option value='"+d.value+"'>"+d.text+"</option>")}),g(o,function(a,b){h.append(b)}),h.val(a.value);break;case"checkbox":var p=b.isArray(a.value)?a.value:[a.value];if(k=a.inputOptions||[],!k.length)throw new Error("prompt with checkbox requires options");if(!k[0].value||!k[0].text)throw new Error("given options in wrong format");h=b("<div/>"),g(k,function(c,d){var e=b(n.inputs[a.inputType]);e.find("input").attr("value",d.value),e.find("label").append(d.text),g(p,function(a,b){b===d.value&&e.find("input").prop("checked",!0)}),h.append(e)})}return a.placeholder&&h.attr("placeholder",a.placeholder),f.append(h),f.on("submit",function(a){a.preventDefault(),e.find(".btn-primary").click()}),e=q.dialog(a),e.off("shown.bs.modal"),e.on("shown.bs.modal",function(){h.focus()}),i===!0&&e.modal("show"),e},q.dialog=function(a){a=h(a);var c=b(n.dialog),d=c.find(".modal-body"),f=a.buttons,i="",j={onEscape:a.onEscape};if(g(f,function(a,b){i+="<button data-bb-handler='"+a+"' type='button' class='btn "+b.className+"'>"+b.label+"</button>",j[a]=b.callback}),d.find(".bootbox-body").html(a.message),a.animate===!0&&c.addClass("fade"),a.className&&c.addClass(a.className),a.title&&d.before(n.header),a.closeButton){var k=b(n.closeButton);a.title?c.find(".modal-header").prepend(k):k.css("margin-top","-10px").prependTo(d)}return a.title&&c.find(".modal-title").html(a.title),i.length&&(d.after(n.footer),c.find(".modal-footer").html(i)),c.on("hidden.bs.modal",function(a){a.target===this&&c.remove()}),c.on("shown.bs.modal",function(){c.find(".btn-primary:first").focus()}),c.on("escape.close.bb",function(a){j.onEscape&&e(a,c,j.onEscape)}),c.on("click",".modal-footer button",function(a){var d=b(this).data("bb-handler");e(a,c,j[d])}),c.on("click",".bootbox-close-button",function(a){e(a,c,j.onEscape)}),c.on("keyup",function(a){27===a.which&&c.trigger("escape.close.bb")}),o.append(c),c.modal({backdrop:a.backdrop,keyboard:!1,show:!1}),a.show&&c.modal("show"),c},q.setDefaults=function(){var a={};2===arguments.length?a[arguments[0]]=arguments[1]:a=arguments[0],b.extend(p,a)},q.hideAll=function(){b(".bootbox").modal("hide")};var r={br:{OK:"OK",CANCEL:"Cancelar",CONFIRM:"Sim"},da:{OK:"OK",CANCEL:"Annuller",CONFIRM:"Accepter"},de:{OK:"OK",CANCEL:"Abbrechen",CONFIRM:"Akzeptieren"},en:{OK:"OK",CANCEL:"Cancel",CONFIRM:"OK"},es:{OK:"OK",CANCEL:"Cancelar",CONFIRM:"Aceptar"},fi:{OK:"OK",CANCEL:"Peruuta",CONFIRM:"OK"},fr:{OK:"OK",CANCEL:"Annuler",CONFIRM:"D'accord"},it:{OK:"OK",CANCEL:"Annulla",CONFIRM:"Conferma"},nl:{OK:"OK",CANCEL:"Annuleren",CONFIRM:"Accepteren"},no:{OK:"OK",CANCEL:"Avbryt",CONFIRM:"OK"},pl:{OK:"OK",CANCEL:"Anuluj",CONFIRM:"Potwierdź"},ru:{OK:"OK",CANCEL:"Отмена",CONFIRM:"Применить"},zh_CN:{OK:"OK",CANCEL:"取消",CONFIRM:"确认"},zh_TW:{OK:"OK",CANCEL:"取消",CONFIRM:"確認"}};return q.init=function(c){window.bootbox=a(c||b)},q}(window.jQuery);

/***
 * Handlebars #if conditional
 * http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/#comment-44
 * Usage: {{#compare a ">" 5}} or {{#compare a "dog"}} (default is "===")
 */
Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {

    var operators, result;
    
    if (arguments.length < 3) {
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
    }
    
    if (options === undefined) {
        options = rvalue;
        rvalue = operator;
        operator = "===";
    }
    
    operators = {
        '==': function (l, r) { return l == r; },
        '===': function (l, r) { return l === r; },
        '!=': function (l, r) { return l != r; },
        '!==': function (l, r) { return l !== r; },
        '<': function (l, r) { return l < r; },
        '>': function (l, r) { return l > r; },
        '<=': function (l, r) { return l <= r; },
        '>=': function (l, r) { return l >= r; },
        'typeof': function (l, r) { return typeof l == r; }
    };
    
    if (!operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
    }
    
    result = operators[operator](lvalue, rvalue);
    
    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }

});

/**
 * FastClick.js
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 0.6.11
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */
function FastClick(e){"use strict";var t,n=this;this.trackingClick=false;this.trackingClickStart=0;this.targetElement=null;this.touchStartX=0;this.touchStartY=0;this.lastTouchIdentifier=0;this.touchBoundary=10;this.layer=e;if(!e||!e.nodeType){throw new TypeError("Layer must be a document node")}this.onClick=function(){return FastClick.prototype.onClick.apply(n,arguments)};this.onMouse=function(){return FastClick.prototype.onMouse.apply(n,arguments)};this.onTouchStart=function(){return FastClick.prototype.onTouchStart.apply(n,arguments)};this.onTouchMove=function(){return FastClick.prototype.onTouchMove.apply(n,arguments)};this.onTouchEnd=function(){return FastClick.prototype.onTouchEnd.apply(n,arguments)};this.onTouchCancel=function(){return FastClick.prototype.onTouchCancel.apply(n,arguments)};if(FastClick.notNeeded(e)){return}if(this.deviceIsAndroid){e.addEventListener("mouseover",this.onMouse,true);e.addEventListener("mousedown",this.onMouse,true);e.addEventListener("mouseup",this.onMouse,true)}e.addEventListener("click",this.onClick,true);e.addEventListener("touchstart",this.onTouchStart,false);e.addEventListener("touchmove",this.onTouchMove,false);e.addEventListener("touchend",this.onTouchEnd,false);e.addEventListener("touchcancel",this.onTouchCancel,false);if(!Event.prototype.stopImmediatePropagation){e.removeEventListener=function(t,n,r){var i=Node.prototype.removeEventListener;if(t==="click"){i.call(e,t,n.hijacked||n,r)}else{i.call(e,t,n,r)}};e.addEventListener=function(t,n,r){var i=Node.prototype.addEventListener;if(t==="click"){i.call(e,t,n.hijacked||(n.hijacked=function(e){if(!e.propagationStopped){n(e)}}),r)}else{i.call(e,t,n,r)}}}if(typeof e.onclick==="function"){t=e.onclick;e.addEventListener("click",function(e){t(e)},false);e.onclick=null}}FastClick.prototype.deviceIsAndroid=navigator.userAgent.indexOf("Android")>0;FastClick.prototype.deviceIsIOS=/iP(ad|hone|od)/.test(navigator.userAgent);FastClick.prototype.deviceIsIOS4=FastClick.prototype.deviceIsIOS&&/OS 4_\d(_\d)?/.test(navigator.userAgent);FastClick.prototype.deviceIsIOSWithBadTarget=FastClick.prototype.deviceIsIOS&&/OS ([6-9]|\d{2})_\d/.test(navigator.userAgent);FastClick.prototype.needsClick=function(e){"use strict";switch(e.nodeName.toLowerCase()){case"button":case"select":case"textarea":if(e.disabled){return true}break;case"input":if(this.deviceIsIOS&&e.type==="file"||e.disabled){return true}break;case"label":case"video":return true}return/\bneedsclick\b/.test(e.className)};FastClick.prototype.needsFocus=function(e){"use strict";switch(e.nodeName.toLowerCase()){case"textarea":return true;case"select":return!this.deviceIsAndroid;case"input":switch(e.type){case"button":case"checkbox":case"file":case"image":case"radio":case"submit":return false}return!e.disabled&&!e.readOnly;default:return/\bneedsfocus\b/.test(e.className)}};FastClick.prototype.sendClick=function(e,t){"use strict";var n,r;if(document.activeElement&&document.activeElement!==e){document.activeElement.blur()}r=t.changedTouches[0];n=document.createEvent("MouseEvents");n.initMouseEvent(this.determineEventType(e),true,true,window,1,r.screenX,r.screenY,r.clientX,r.clientY,false,false,false,false,0,null);n.forwardedTouchEvent=true;e.dispatchEvent(n)};FastClick.prototype.determineEventType=function(e){"use strict";if(this.deviceIsAndroid&&e.tagName.toLowerCase()==="select"){return"mousedown"}return"click"};FastClick.prototype.focus=function(e){"use strict";var t;if(this.deviceIsIOS&&e.setSelectionRange&&e.type.indexOf("date")!==0&&e.type!=="time"){t=e.value.length;e.setSelectionRange(t,t)}else{e.focus()}};FastClick.prototype.updateScrollParent=function(e){"use strict";var t,n;t=e.fastClickScrollParent;if(!t||!t.contains(e)){n=e;do{if(n.scrollHeight>n.offsetHeight){t=n;e.fastClickScrollParent=n;break}n=n.parentElement}while(n)}if(t){t.fastClickLastScrollTop=t.scrollTop}};FastClick.prototype.getTargetElementFromEventTarget=function(e){"use strict";if(e.nodeType===Node.TEXT_NODE){return e.parentNode}return e};FastClick.prototype.onTouchStart=function(e){"use strict";var t,n,r;if(e.targetTouches.length>1){return true}t=this.getTargetElementFromEventTarget(e.target);n=e.targetTouches[0];if(this.deviceIsIOS){r=window.getSelection();if(r.rangeCount&&!r.isCollapsed){return true}if(!this.deviceIsIOS4){if(n.identifier===this.lastTouchIdentifier){e.preventDefault();return false}this.lastTouchIdentifier=n.identifier;this.updateScrollParent(t)}}this.trackingClick=true;this.trackingClickStart=e.timeStamp;this.targetElement=t;this.touchStartX=n.pageX;this.touchStartY=n.pageY;if(e.timeStamp-this.lastClickTime<200){e.preventDefault()}return true};FastClick.prototype.touchHasMoved=function(e){"use strict";var t=e.changedTouches[0],n=this.touchBoundary;if(Math.abs(t.pageX-this.touchStartX)>n||Math.abs(t.pageY-this.touchStartY)>n){return true}return false};FastClick.prototype.onTouchMove=function(e){"use strict";if(!this.trackingClick){return true}if(this.targetElement!==this.getTargetElementFromEventTarget(e.target)||this.touchHasMoved(e)){this.trackingClick=false;this.targetElement=null}return true};FastClick.prototype.findControl=function(e){"use strict";if(e.control!==undefined){return e.control}if(e.htmlFor){return document.getElementById(e.htmlFor)}return e.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea")};FastClick.prototype.onTouchEnd=function(e){"use strict";var t,n,r,i,s,o=this.targetElement;if(!this.trackingClick){return true}if(e.timeStamp-this.lastClickTime<200){this.cancelNextClick=true;return true}this.cancelNextClick=false;this.lastClickTime=e.timeStamp;n=this.trackingClickStart;this.trackingClick=false;this.trackingClickStart=0;if(this.deviceIsIOSWithBadTarget){s=e.changedTouches[0];o=document.elementFromPoint(s.pageX-window.pageXOffset,s.pageY-window.pageYOffset)||o;o.fastClickScrollParent=this.targetElement.fastClickScrollParent}r=o.tagName.toLowerCase();if(r==="label"){t=this.findControl(o);if(t){this.focus(o);if(this.deviceIsAndroid){return false}o=t}}else if(this.needsFocus(o)){if(e.timeStamp-n>100||this.deviceIsIOS&&window.top!==window&&r==="input"){this.targetElement=null;return false}this.focus(o);if(!this.deviceIsIOS4||r!=="select"){this.targetElement=null;e.preventDefault()}return false}if(this.deviceIsIOS&&!this.deviceIsIOS4){i=o.fastClickScrollParent;if(i&&i.fastClickLastScrollTop!==i.scrollTop){return true}}if(!this.needsClick(o)){e.preventDefault();this.sendClick(o,e)}return false};FastClick.prototype.onTouchCancel=function(){"use strict";this.trackingClick=false;this.targetElement=null};FastClick.prototype.onMouse=function(e){"use strict";if(!this.targetElement){return true}if(e.forwardedTouchEvent){return true}if(!e.cancelable){return true}if(!this.needsClick(this.targetElement)||this.cancelNextClick){if(e.stopImmediatePropagation){e.stopImmediatePropagation()}else{e.propagationStopped=true}e.stopPropagation();e.preventDefault();return false}return true};FastClick.prototype.onClick=function(e){"use strict";var t;if(this.trackingClick){this.targetElement=null;this.trackingClick=false;return true}if(e.target.type==="submit"&&e.detail===0){return true}t=this.onMouse(e);if(!t){this.targetElement=null}return t};FastClick.prototype.destroy=function(){"use strict";var e=this.layer;if(this.deviceIsAndroid){e.removeEventListener("mouseover",this.onMouse,true);e.removeEventListener("mousedown",this.onMouse,true);e.removeEventListener("mouseup",this.onMouse,true)}e.removeEventListener("click",this.onClick,true);e.removeEventListener("touchstart",this.onTouchStart,false);e.removeEventListener("touchmove",this.onTouchMove,false);e.removeEventListener("touchend",this.onTouchEnd,false);e.removeEventListener("touchcancel",this.onTouchCancel,false)};FastClick.notNeeded=function(e){"use strict";var t;var n;if(typeof window.ontouchstart==="undefined"){return true}n=+(/Chrome\/([0-9]+)/.exec(navigator.userAgent)||[,0])[1];if(n){if(FastClick.prototype.deviceIsAndroid){t=document.querySelector("meta[name=viewport]");if(t){if(t.content.indexOf("user-scalable=no")!==-1){return true}if(n>31&&window.innerWidth<=window.screen.width){return true}}}else{return true}}if(e.style.msTouchAction==="none"){return true}return false};FastClick.attach=function(e){"use strict";return new FastClick(e)};if(typeof define!=="undefined"&&define.amd){define(function(){"use strict";return FastClick})}else if(typeof module!=="undefined"&&module.exports){module.exports=FastClick.attach;module.exports.FastClick=FastClick}else{window.FastClick=FastClick}


/*
 *  Sugar Library v1.3.9
 *
 *  Freely distributable and licensed under the MIT-style license.
 *  Copyright (c) 2013 Andrew Plummer
 *  http://sugarjs.com/
 * 
 * Packages:
 * Core
 * ES5
 * Array
 * Date
 * Function
 * Number
 * Object
 * RegExp
 * String
 * Inflections
 *
 * May drop Date, which isn't overly useful but adds 7KB.
 * ---------------------------- */
(function(){var k=true,l=null,n=false;function aa(a){return function(){return a}}var p=Object,q=Array,r=RegExp,s=Date,t=String,u=Number,v=Math,ba=p.prototype.toString,ca=typeof global!=="undefined"?global:this,da={},ea=p.defineProperty&&p.defineProperties,x="Array,Boolean,Date,Function,Number,String,RegExp".split(","),ga=fa(x[0]),ha=fa(x[1]),ia=fa(x[2]),y=fa(x[3]),A=fa(x[4]),B=fa(x[5]),C=fa(x[6]);
function fa(a){var b,c;if(/String|Number|Boolean/.test(a))b=a.toLowerCase();c=a==="Array"&&q.isArray||function(d){if(b&&typeof d===b)return k;return ba.call(d)==="[object "+a+"]"};return da[a]=c}function ja(a){if(!a.SugarMethods){ka(a,"SugarMethods",{});D(a,n,n,{extend:function(b,c,d){D(a,d!==n,c,b)},sugarRestore:function(){return la(a,arguments,function(b,c,d){ka(b,c,d.method)})},sugarRevert:function(){return la(a,arguments,function(b,c,d){if(d.qa)ka(b,c,d.Ba);else delete b[c]})}})}}
function D(a,b,c,d){var e=b?a.prototype:a;ja(a);E(d,function(f,h){var i=e[f],j=F(e,f);if(typeof c==="function")h=ma(e[f],h,c);if(c!==n||!e[f])ka(e,f,h);a.SugarMethods[f]={xa:b,method:h,Ba:i,qa:j}})}function G(a,b,c,d,e){var f={};d=B(d)?d.split(","):d;d.forEach(function(h,i){e(f,h,i)});D(a,b,c,f)}function la(a,b,c){var d=b.length===0,e=H(b),f=n;E(a.SugarMethods,function(h,i){if(d||e.indexOf(h)>-1){f=k;c(i.xa?a.prototype:a,h,i)}});return f}
function ma(a,b,c){return function(){return(a&&(c===k||!c.apply(this,arguments))?a:b).apply(this,arguments)}}function ka(a,b,c){if(ea)p.defineProperty(a,b,{value:c,configurable:k,enumerable:n,writable:k});else a[b]=c}function H(a,b){var c=[],d,e;d=0;for(e=a.length;d<e;d++){c.push(a[d]);b&&b.call(a,a[d],d)}return c}function na(a,b,c){H(q.prototype.concat.apply([],q.prototype.slice.call(a,c||0)),b)}function oa(a){if(!a||!a.call)throw new TypeError("Callback is not callable");}
function I(a){return a!==void 0}function K(a){return a===void 0}function pa(a){return a&&typeof a==="object"}function L(a){return!!a&&ba.call(a)==="[object Object]"&&"hasOwnProperty"in a}function F(a,b){return p.hasOwnProperty.call(a,b)}function E(a,b){for(var c in a)if(F(a,c))if(b.call(a,c,a[c],a)===n)break}function qa(a,b){E(b,function(c){a[c]=b[c]});return a}function ra(a){qa(this,a)}ra.prototype.constructor=p;
function sa(a,b,c,d){var e=[];a=parseInt(a);for(var f=d<0;!f&&a<=b||f&&a>=b;){e.push(a);c&&c.call(this,a);a+=d||1}return e}function N(a,b,c){c=v[c||"round"];var d=v.pow(10,v.abs(b||0));if(b<0)d=1/d;return c(a*d)/d}function O(a,b){return N(a,b,"floor")}function P(a,b,c,d){d=v.abs(a).toString(d||10);d=ta(b-d.replace(/\.\d+/,"").length,"0")+d;if(c||a<0)d=(a<0?"-":"+")+d;return d}
function ua(a){if(a>=11&&a<=13)return"th";else switch(a%10){case 1:return"st";case 2:return"nd";case 3:return"rd";default:return"th"}}function va(){return"\t\n\u000b\u000c\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u2028\u2029\u3000\ufeff"}function ta(a,b){return q(v.max(0,I(a)?a:1)+1).join(b||"")}function wa(a,b){var c=a.toString().match(/[^/]*$/)[0];if(b)c=(c+b).split("").sort().join("").replace(/([gimy])\1+/g,"$1");return c}
function R(a){B(a)||(a=t(a));return a.replace(/([\\/'*+?|()\[\]{}.^$])/g,"\\$1")}function xa(a,b){var c=typeof a,d,e,f,h,i,j,g;if(c==="string")return a;f=ba.call(a);d=L(a);e=f==="[object Array]";if(a!=l&&d||e){b||(b=[]);if(b.length>1)for(j=b.length;j--;)if(b[j]===a)return"CYC";b.push(a);d=t(a.constructor);h=e?a:p.keys(a).sort();j=0;for(g=h.length;j<g;j++){i=e?j:h[j];d+=i+xa(a[i],b)}b.pop()}else d=1/a===-Infinity?"-0":t(a&&a.valueOf?a.valueOf():a);return c+f+d}
function ya(a){return/^\[object Date|Array|String|Number|RegExp|Boolean|Arguments\]$/.test(ba.call(a))||L(a)}function za(a,b,c){var d=[],e=a.length,f=b[b.length-1]!==n,h;H(b,function(i){if(ha(i))return n;if(f){i%=e;if(i<0)i=e+i}h=c?a.charAt(i)||"":a[i];d.push(h)});return d.length<2?d[0]:d}function Aa(a,b){G(b,k,n,a,function(c,d){c[d+(d==="equal"?"s":"")]=function(){return p[d].apply(l,[this].concat(H(arguments)))}})}ja(p);E(x,function(a,b){ja(ca[b])});
D(p,n,n,{keys:function(a){var b=[];if(!pa(a)&&!C(a)&&!y(a))throw new TypeError("Object required");E(a,function(c){b.push(c)});return b}});function Ba(a,b,c,d){var e=a.length,f=d==-1,h=f?e-1:0;c=isNaN(c)?h:parseInt(c>>0);if(c<0)c=e+c;if(!f&&c<0||f&&c>=e)c=h;for(;f&&c>=0||!f&&c<e;){if(a[c]===b)return c;c+=d}return-1}
function Ca(a,b,c,d){var e=a.length,f=0,h=I(c);oa(b);if(e==0&&!h)throw new TypeError("Reduce called on empty array with no initial value");else if(h)c=c;else{c=a[d?e-1:f];f++}for(;f<e;){h=d?e-f-1:f;if(h in a)c=b(c,a[h],h,a);f++}return c}function Da(a){if(a.length===0)throw new TypeError("First argument must be defined");}D(q,n,n,{isArray:function(a){return ga(a)}});
D(q,k,n,{every:function(a,b){var c=this.length,d=0;for(Da(arguments);d<c;){if(d in this&&!a.call(b,this[d],d,this))return n;d++}return k},some:function(a,b){var c=this.length,d=0;for(Da(arguments);d<c;){if(d in this&&a.call(b,this[d],d,this))return k;d++}return n},map:function(a,b){var c=this.length,d=0,e=Array(c);for(Da(arguments);d<c;){if(d in this)e[d]=a.call(b,this[d],d,this);d++}return e},filter:function(a,b){var c=this.length,d=0,e=[];for(Da(arguments);d<c;){d in this&&a.call(b,this[d],d,this)&&
e.push(this[d]);d++}return e},indexOf:function(a,b){if(B(this))return this.indexOf(a,b);return Ba(this,a,b,1)},lastIndexOf:function(a,b){if(B(this))return this.lastIndexOf(a,b);return Ba(this,a,b,-1)},forEach:function(a,b){var c=this.length,d=0;for(oa(a);d<c;){d in this&&a.call(b,this[d],d,this);d++}},reduce:function(a,b){return Ca(this,a,b)},reduceRight:function(a,b){return Ca(this,a,b,k)}});
D(Function,k,n,{bind:function(a){var b=this,c=H(arguments).slice(1),d;if(!y(this))throw new TypeError("Function.prototype.bind called on a non-function");d=function(){return b.apply(b.prototype&&this instanceof b?this:a,c.concat(H(arguments)))};d.prototype=this.prototype;return d}});D(s,n,n,{now:function(){return(new s).getTime()}});
(function(){var a=va().match(/^\s+$/);try{t.prototype.trim.call([1])}catch(b){a=n}D(t,k,!a,{trim:function(){return this.toString().trimLeft().trimRight()},trimLeft:function(){return this.replace(r("^["+va()+"]+"),"")},trimRight:function(){return this.replace(r("["+va()+"]+$"),"")}})})();
(function(){var a=new s(s.UTC(1999,11,31));a=a.toISOString&&a.toISOString()==="1999-12-31T00:00:00.000Z";G(s,k,!a,"toISOString,toJSON",function(b,c){b[c]=function(){return P(this.getUTCFullYear(),4)+"-"+P(this.getUTCMonth()+1,2)+"-"+P(this.getUTCDate(),2)+"T"+P(this.getUTCHours(),2)+":"+P(this.getUTCMinutes(),2)+":"+P(this.getUTCSeconds(),2)+"."+P(this.getUTCMilliseconds(),3)+"Z"}})})();
function Ea(a,b,c,d){var e=k;if(a===b)return k;else if(C(b)&&B(a))return r(b).test(a);else if(y(b))return b.apply(c,d);else if(L(b)&&pa(a)){E(b,function(f){Ea(a[f],b[f],c,[a[f],a])||(e=n)});return e}else return ya(a)&&ya(b)?xa(a)===xa(b):a===b}function S(a,b,c,d){return K(b)?a:y(b)?b.apply(c,d||[]):y(a[b])?a[b].call(a):a[b]}
function T(a,b,c,d){var e,f;if(c<0)c=a.length+c;f=isNaN(c)?0:c;for(c=d===k?a.length+f:a.length;f<c;){e=f%a.length;if(e in a){if(b.call(a,a[e],e,a)===n)break}else return Ga(a,b,f,d);f++}}function Ga(a,b,c){var d=[],e;for(e in a)e in a&&e>>>0==e&&e!=4294967295&&e>=c&&d.push(parseInt(e));d.sort().each(function(f){return b.call(a,a[f],f,a)});return a}function Ha(a,b,c,d,e){var f,h;T(a,function(i,j,g){if(Ea(i,b,g,[i,j,g])){f=i;h=j;return n}},c,d);return e?h:f}
function Ia(a,b){var c=[],d={},e;T(a,function(f,h){e=b?S(f,b,a,[f,h,a]):f;Ja(d,e)||c.push(f)});return c}function Ka(a,b,c){var d=[],e={};b.each(function(f){Ja(e,f)});a.each(function(f){var h=xa(f),i=!ya(f);if(La(e,h,f,i)!=c){var j=0;if(i)for(h=e[h];j<h.length;)if(h[j]===f)h.splice(j,1);else j+=1;else delete e[h];d.push(f)}});return d}function Ma(a,b,c){b=b||Infinity;c=c||0;var d=[];T(a,function(e){if(ga(e)&&c<b)d=d.concat(Ma(e,b,c+1));else d.push(e)});return d}
function Na(a){var b=[];H(a,function(c){b=b.concat(c)});return b}function La(a,b,c,d){var e=b in a;if(d){a[b]||(a[b]=[]);e=a[b].indexOf(c)!==-1}return e}function Ja(a,b){var c=xa(b),d=!ya(b),e=La(a,c,b,d);if(d)a[c].push(b);else a[c]=b;return e}
function Oa(a,b,c,d){var e,f=[],h=c==="max",i=c==="min",j=Array.isArray(a);E(a,function(g){var m=a[g];g=S(m,b,a,j?[m,parseInt(g),a]:[]);if(K(g))throw new TypeError("Cannot compare with undefined");if(g===e)f.push(m);else if(K(e)||h&&g>e||i&&g<e){f=[m];e=g}});j||(f=Ma(f,1));return d?f:f[0]}function Pa(a){if(q[Qa])a=a.toLowerCase();return a.replace(q[Ra],"")}function Sa(a,b){var c=a.charAt(b);return(q[Ta]||{})[c]||c}function Ua(a){var b=q[Va];return a?b.indexOf(a):l}
var Va="AlphanumericSortOrder",Ra="AlphanumericSortIgnore",Qa="AlphanumericSortIgnoreCase",Ta="AlphanumericSortEquivalents";D(q,n,n,{create:function(){var a=[],b;H(arguments,function(c){if(pa(c))try{b=q.prototype.slice.call(c,0);if(b.length>0)c=b}catch(d){}a=a.concat(c)});return a}});
D(q,k,n,{find:function(a,b,c){return Ha(this,a,b,c)},findAll:function(a,b,c){var d=[];T(this,function(e,f,h){Ea(e,a,h,[e,f,h])&&d.push(e)},b,c);return d},findIndex:function(a,b,c){a=Ha(this,a,b,c,k);return K(a)?-1:a},count:function(a){if(K(a))return this.length;return this.findAll(a).length},removeAt:function(a,b){var c,d;if(K(a))return this;if(K(b))b=a;c=0;for(d=b-a;c<=d;c++)this.splice(a,1);return this},include:function(a,b){return this.clone().add(a,b)},exclude:function(){return q.prototype.remove.apply(this.clone(),
arguments)},clone:function(){return qa([],this)},unique:function(a){return Ia(this,a)},flatten:function(a){return Ma(this,a)},union:function(){return Ia(this.concat(Na(arguments)))},intersect:function(){return Ka(this,Na(arguments),n)},subtract:function(){return Ka(this,Na(arguments),k)},at:function(){return za(this,arguments)},first:function(a){if(K(a))return this[0];if(a<0)a=0;return this.slice(0,a)},last:function(a){if(K(a))return this[this.length-1];return this.slice(this.length-a<0?0:this.length-
a)},from:function(a){return this.slice(a)},to:function(a){if(K(a))a=this.length;return this.slice(0,a)},min:function(a,b){return Oa(this,a,"min",b)},max:function(a,b){return Oa(this,a,"max",b)},least:function(a,b){return Oa(this.groupBy.apply(this,[a]),"length","min",b)},most:function(a,b){return Oa(this.groupBy.apply(this,[a]),"length","max",b)},sum:function(a){a=a?this.map(a):this;return a.length>0?a.reduce(function(b,c){return b+c}):0},average:function(a){a=a?this.map(a):this;return a.length>0?
a.sum()/a.length:0},inGroups:function(a,b){var c=arguments.length>1,d=this,e=[],f=N(this.length/a,void 0,"ceil");sa(0,a-1,function(h){h=h*f;var i=d.slice(h,h+f);c&&i.length<f&&sa(1,f-i.length,function(){i=i.add(b)});e.push(i)});return e},inGroupsOf:function(a,b){var c=[],d=this.length,e=this,f;if(d===0||a===0)return e;if(K(a))a=1;if(K(b))b=l;sa(0,N(d/a,void 0,"ceil")-1,function(h){for(f=e.slice(a*h,a*h+a);f.length<a;)f.push(b);c.push(f)});return c},isEmpty:function(){return this.compact().length==
0},sortBy:function(a,b){var c=this.clone();c.sort(function(d,e){var f,h;f=S(d,a,c,[d]);h=S(e,a,c,[e]);if(B(f)&&B(h)){f=f;h=h;var i,j,g,m,o=0,w=0;f=Pa(f);h=Pa(h);do{g=Sa(f,o);m=Sa(h,o);i=Ua(g);j=Ua(m);if(i===-1||j===-1){i=f.charCodeAt(o)||l;j=h.charCodeAt(o)||l}g=g!==f.charAt(o);m=m!==h.charAt(o);if(g!==m&&w===0)w=g-m;o+=1}while(i!=l&&j!=l&&i===j);f=i===j?w:i<j?-1:1}else f=f<h?-1:f>h?1:0;return f*(b?-1:1)});return c},randomize:function(){for(var a=this.concat(),b=a.length,c,d;b;){c=v.random()*b|0;
d=a[--b];a[b]=a[c];a[c]=d}return a},zip:function(){var a=H(arguments);return this.map(function(b,c){return[b].concat(a.map(function(d){return c in d?d[c]:l}))})},sample:function(a){var b=this.randomize();return arguments.length>0?b.slice(0,a):b[0]},each:function(a,b,c){T(this,a,b,c);return this},add:function(a,b){if(!A(u(b))||isNaN(b))b=this.length;q.prototype.splice.apply(this,[b,0].concat(a));return this},remove:function(){var a,b=this;H(arguments,function(c){for(a=0;a<b.length;)if(Ea(b[a],c,b,
[b[a],a,b]))b.splice(a,1);else a++});return b},compact:function(a){var b=[];T(this,function(c){if(ga(c))b.push(c.compact());else if(a&&c)b.push(c);else!a&&c!=l&&c.valueOf()===c.valueOf()&&b.push(c)});return b},groupBy:function(a,b){var c=this,d={},e;T(c,function(f,h){e=S(f,a,c,[f,h,c]);d[e]||(d[e]=[]);d[e].push(f)});b&&E(d,b);return d},none:function(){return!this.any.apply(this,arguments)}});D(q,k,n,{all:q.prototype.every,any:q.prototype.some,insert:q.prototype.add});
function Wa(a){if(a&&a.valueOf)a=a.valueOf();return p.keys(a)}function Xa(a,b){G(p,n,n,a,function(c,d){c[d]=function(e,f,h){var i=Wa(e);h=q.prototype[d].call(i,function(j){return b?S(e[j],f,e,[j,e[j],e]):Ea(e[j],f,e,[j,e[j],e])},h);if(ga(h))h=h.reduce(function(j,g){j[g]=e[g];return j},{});return h}});Aa(a,ra)}
D(p,n,n,{map:function(a,b){return Wa(a).reduce(function(c,d){c[d]=S(a[d],b,a,[d,a[d],a]);return c},{})},reduce:function(a){var b=Wa(a).map(function(c){return a[c]});return b.reduce.apply(b,H(arguments).slice(1))},each:function(a,b){oa(b);E(a,b);return a},size:function(a){return Wa(a).length}});var Ya="any,all,none,count,find,findAll,isEmpty".split(","),Za="sum,average,min,max,least,most".split(","),$a="map,reduce,size".split(","),ab=Ya.concat(Za).concat($a);
(function(){G(q,k,function(){var a=arguments;return a.length>0&&!y(a[0])},"map,every,all,some,any,none,filter",function(a,b){a[b]=function(c){return this[b](function(d,e){return b==="map"?S(d,c,this,[d,e,this]):Ea(d,c,this,[d,e,this])})}})})();
(function(){q[Va]="A\u00c1\u00c0\u00c2\u00c3\u0104BC\u0106\u010c\u00c7D\u010e\u00d0E\u00c9\u00c8\u011a\u00ca\u00cb\u0118FG\u011eH\u0131I\u00cd\u00cc\u0130\u00ce\u00cfJKL\u0141MN\u0143\u0147\u00d1O\u00d3\u00d2\u00d4PQR\u0158S\u015a\u0160\u015eT\u0164U\u00da\u00d9\u016e\u00db\u00dcVWXY\u00ddZ\u0179\u017b\u017d\u00de\u00c6\u0152\u00d8\u00d5\u00c5\u00c4\u00d6".split("").map(function(b){return b+b.toLowerCase()}).join("");var a={};T("A\u00c1\u00c0\u00c2\u00c3\u00c4,C\u00c7,E\u00c9\u00c8\u00ca\u00cb,I\u00cd\u00cc\u0130\u00ce\u00cf,O\u00d3\u00d2\u00d4\u00d5\u00d6,S\u00df,U\u00da\u00d9\u00db\u00dc".split(","),
function(b){var c=b.charAt(0);T(b.slice(1).split(""),function(d){a[d]=c;a[d.toLowerCase()]=c.toLowerCase()})});q[Qa]=k;q[Ta]=a})();Xa(Ya);Xa(Za,k);Aa($a,ra);
var U,bb,cb=["ampm","hour","minute","second","ampm","utc","offset_sign","offset_hours","offset_minutes","ampm"],db="({t})?\\s*(\\d{1,2}(?:[,.]\\d+)?)(?:{h}([0-5]\\d(?:[,.]\\d+)?)?{m}(?::?([0-5]\\d(?:[,.]\\d+)?){s})?\\s*(?:({t})|(Z)|(?:([+-])(\\d{2,2})(?::?(\\d{2,2}))?)?)?|\\s*({t}))",eb={},fb,gb,hb,ib=[],jb=[{ba:"f{1,4}|ms|milliseconds",format:function(a){return V(a,"Milliseconds")}},{ba:"ss?|seconds",format:function(a){return V(a,"Seconds")}},{ba:"mm?|minutes",format:function(a){return V(a,"Minutes")}},
{ba:"hh?|hours|12hr",format:function(a){a=V(a,"Hours");return a===0?12:a-O(a/13)*12}},{ba:"HH?|24hr",format:function(a){return V(a,"Hours")}},{ba:"dd?|date|day",format:function(a){return V(a,"Date")}},{ba:"dow|weekday",la:k,format:function(a,b,c){a=V(a,"Day");return b.weekdays[a+(c-1)*7]}},{ba:"MM?",format:function(a){return V(a,"Month")+1}},{ba:"mon|month",la:k,format:function(a,b,c){a=V(a,"Month");return b.months[a+(c-1)*12]}},{ba:"y{2,4}|year",format:function(a){return V(a,"FullYear")}},{ba:"[Tt]{1,2}",
format:function(a,b,c,d){if(b.ampm.length==0)return"";a=V(a,"Hours");b=b.ampm[O(a/12)];if(d.length===1)b=b.slice(0,1);if(d.slice(0,1)==="T")b=b.toUpperCase();return b}},{ba:"z{1,4}|tz|timezone",text:k,format:function(a,b,c,d){a=a.getUTCOffset();if(d=="z"||d=="zz")a=a.replace(/(\d{2})(\d{2})/,function(e,f){return P(f,d.length)});return a}},{ba:"iso(tz|timezone)",format:function(a){return a.getUTCOffset(k)}},{ba:"ord",format:function(a){a=V(a,"Date");return a+ua(a)}}],kb=[{$:"year",method:"FullYear",
ja:k,da:function(a){return(365+(a?a.isLeapYear()?1:0:0.25))*24*60*60*1E3}},{$:"month",method:"Month",ja:k,da:function(a,b){var c=30.4375,d;if(a){d=a.daysInMonth();if(b<=d.days())c=d}return c*24*60*60*1E3},error:0.919},{$:"week",method:"ISOWeek",da:aa(6048E5)},{$:"day",method:"Date",ja:k,da:aa(864E5)},{$:"hour",method:"Hours",da:aa(36E5)},{$:"minute",method:"Minutes",da:aa(6E4)},{$:"second",method:"Seconds",da:aa(1E3)},{$:"millisecond",method:"Milliseconds",da:aa(1)}],lb={};
function mb(a){qa(this,a);this.ga=ib.concat()}
mb.prototype={getMonth:function(a){return A(a)?a-1:this.months.indexOf(a)%12},getWeekday:function(a){return this.weekdays.indexOf(a)%7},oa:function(a){var b;return A(a)?a:a&&(b=this.numbers.indexOf(a))!==-1?(b+1)%10:1},ua:function(a){var b=this;return a.replace(r(this.num,"g"),function(c){return b.oa(c)||""})},sa:function(a){return U.units[this.units.indexOf(a)%8]},va:function(a){return this.na(a,a[2]>0?"future":"past")},ra:function(a){return this.na(nb(a),"duration")},wa:function(a){a=a||this.code;
return a==="en"||a==="en-US"?k:this.variant},za:function(a){return a===this.ampm[0]},Aa:function(a){return a&&a===this.ampm[1]},na:function(a,b){var c,d,e=a[0],f=a[1],h=a[2],i=this[b]||this.relative;if(y(i))return i.call(this,e,f,h,b);d=this.units[(this.plural&&e>1?1:0)*8+f]||this.units[f];if(this.capitalizeUnit)d=ob(d);c=this.modifiers.filter(function(j){return j.name=="sign"&&j.value==(h>0?1:-1)})[0];return i.replace(/\{(.*?)\}/g,function(j,g){switch(g){case "num":return e;case "unit":return d;
case "sign":return c.src}})},ta:function(){return this.ma?[this.ma].concat(this.ga):this.ga},addFormat:function(a,b,c,d,e){var f=c||[],h=this,i;a=a.replace(/\s+/g,"[-,. ]*");a=a.replace(/\{([^,]+?)\}/g,function(j,g){var m,o,w,z=g.match(/\?$/);w=g.match(/^(\d+)\??$/);var J=g.match(/(\d)(?:-(\d))?/),M=g.replace(/[^a-z]+$/,"");if(w)m=h.tokens[w[1]];else if(h[M])m=h[M];else if(h[M+"s"]){m=h[M+"s"];if(J){o=[];m.forEach(function(Q,Fa){var W=Fa%(h.units?8:m.length);if(W>=J[1]&&W<=(J[2]||J[1]))o.push(Q)});
m=o}m=pb(m)}if(w)w="(?:"+m+")";else{c||f.push(M);w="("+m+")"}if(z)w+="?";return w});if(b){b=qb(db,h,e);e=["t","[\\s\\u3000]"].concat(h.timeMarker);i=a.match(/\\d\{\d,\d\}\)+\??$/);rb(h,"(?:"+b+")[,\\s\\u3000]+?"+a,cb.concat(f),d);rb(h,a+"(?:[,\\s]*(?:"+e.join("|")+(i?"+":"*")+")"+b+")?",f.concat(cb),d)}else rb(h,a,f,d)}};function sb(a,b){var c;B(a)||(a="");c=lb[a]||lb[a.slice(0,2)];if(b===n&&!c)throw Error("Invalid locale.");return c||bb}
function tb(a,b){function c(g){var m=i[g];if(B(m))i[g]=m.split(",");else m||(i[g]=[])}function d(g,m){g=g.split("+").map(function(o){return o.replace(/(.+):(.+)$/,function(w,z,J){return J.split("|").map(function(M){return z+M}).join("|")})}).join("|");return g.split("|").forEach(m)}function e(g,m,o){var w=[];i[g].forEach(function(z,J){if(m)z+="+"+z.slice(0,3);d(z,function(M,Q){w[Q*o+J]=M.toLowerCase()})});i[g]=w}function f(g,m,o){g="\\d{"+g+","+m+"}";if(o)g+="|(?:"+pb(i.numbers)+")+";return g}function h(g,
m){i[g]=i[g]||m}var i,j;i=new mb(b);c("modifiers");"months,weekdays,units,numbers,articles,tokens,timeMarker,ampm,timeSuffixes,dateParse,timeParse".split(",").forEach(c);j=!i.monthSuffix;e("months",j,12);e("weekdays",j,7);e("units",n,8);e("numbers",n,10);h("code",a);h("date",f(1,2,i.digitDate));h("year","'\\d{2}|"+f(4,4));h("num",function(){var g=["\\d+"].concat(i.articles);if(i.numbers)g=g.concat(i.numbers);return pb(g)}());(function(){var g=[];i.ha={};i.modifiers.push({name:"day",src:"yesterday",
value:-1});i.modifiers.push({name:"day",src:"today",value:0});i.modifiers.push({name:"day",src:"tomorrow",value:1});i.modifiers.forEach(function(m){var o=m.name;d(m.src,function(w){var z=i[o];i.ha[w]=m;g.push({name:o,src:w,value:m.value});i[o]=z?z+"|"+w:w})});i.day+="|"+pb(i.weekdays);i.modifiers=g})();if(i.monthSuffix){i.month=f(1,2);i.months=sa(1,12).map(function(g){return g+i.monthSuffix})}i.full_month=f(1,2)+"|"+pb(i.months);i.timeSuffixes.length>0&&i.addFormat(qb(db,i),n,cb);i.addFormat("{day}",
k);i.addFormat("{month}"+(i.monthSuffix||""));i.addFormat("{year}"+(i.yearSuffix||""));i.timeParse.forEach(function(g){i.addFormat(g,k)});i.dateParse.forEach(function(g){i.addFormat(g)});return lb[a]=i}function rb(a,b,c,d){a.ga.unshift({Da:d,ya:a,Ca:r("^"+b+"$","i"),to:c})}function ob(a){return a.slice(0,1).toUpperCase()+a.slice(1)}function pb(a){return a.filter(function(b){return!!b}).join("|")}
function ub(a,b){var c;if(L(a[0]))return a;else if(A(a[0])&&!A(a[1]))return[a[0]];else if(B(a[0])&&b)return[vb(a[0]),a[1]];c={};gb.forEach(function(d,e){c[d.$]=a[e]});return[c]}function vb(a,b){var c={};if(match=a.match(/^(\d+)?\s?(\w+?)s?$/i)){if(K(b))b=parseInt(match[1])||1;c[match[2].toLowerCase()]=b}return c}
function wb(a,b){var c={},d,e;b.forEach(function(f,h){d=a[h+1];if(!(K(d)||d==="")){if(f==="year")c.Ea=d.replace(/'/,"");e=parseFloat(d.replace(/'/,"").replace(/,/,"."));c[f]=!isNaN(e)?e:d.toLowerCase()}});return c}function xb(a){a=a.trim().replace(/^just (?=now)|\.+$/i,"");return yb(a)}
function yb(a){return a.replace(fb,function(b,c,d){var e=0,f=1,h,i;if(c)return b;d.split("").reverse().forEach(function(j){j=eb[j];var g=j>9;if(g){if(h)e+=f;f*=j/(i||1);i=j}else{if(h===n)f*=10;e+=f*j}h=g});if(h)e+=f;return e})}
function zb(a,b,c,d){var e=new s,f=n,h,i,j,g,m,o,w,z,J;e.utc(d);if(ia(a))e.utc(a.isUTC()).setTime(a.getTime());else if(A(a))e.setTime(a);else if(L(a)){e.set(a,k);g=a}else if(B(a)){h=sb(b);a=xb(a);h&&E(h.ta(),function(M,Q){var Fa=a.match(Q.Ca);if(Fa){j=Q;i=j.ya;g=wb(Fa,j.to,i);g.utc&&e.utc();i.ma=j;if(g.timestamp){g=g.timestamp;return n}if(j.Da&&!B(g.month)&&(B(g.date)||h.wa(b))){z=g.month;g.month=g.date;g.date=z}if(g.year&&g.Ea.length===2)g.year=N(V(new s,"FullYear")/100)*100-N(g.year/100)*100+g.year;
if(g.month){g.month=i.getMonth(g.month);if(g.shift&&!g.unit)g.unit=i.units[7]}if(g.weekday&&g.date)delete g.weekday;else if(g.weekday){g.weekday=i.getWeekday(g.weekday);if(g.shift&&!g.unit)g.unit=i.units[5]}if(g.day&&(z=i.ha[g.day])){g.day=z.value;e.reset();f=k}else if(g.day&&(o=i.getWeekday(g.day))>-1){delete g.day;if(g.num&&g.month){J=function(){var W=e.getWeekday();e.setWeekday(7*(g.num-1)+(W>o?o+7:o))};g.day=1}else g.weekday=o}if(g.date&&!A(g.date))g.date=i.ua(g.date);if(i.Aa(g.ampm)&&g.hour<
12)g.hour+=12;else if(i.za(g.ampm)&&g.hour===12)g.hour=0;if("offset_hours"in g||"offset_minutes"in g){e.utc();g.offset_minutes=g.offset_minutes||0;g.offset_minutes+=g.offset_hours*60;if(g.offset_sign==="-")g.offset_minutes*=-1;g.minute-=g.offset_minutes}if(g.unit){f=k;w=i.oa(g.num);m=i.sa(g.unit);if(g.shift||g.edge){w*=(z=i.ha[g.shift])?z.value:0;if(m==="month"&&I(g.date)){e.set({day:g.date},k);delete g.date}if(m==="year"&&I(g.month)){e.set({month:g.month,day:g.date},k);delete g.month;delete g.date}}if(g.sign&&
(z=i.ha[g.sign]))w*=z.value;if(I(g.weekday)){e.set({weekday:g.weekday},k);delete g.weekday}g[m]=(g[m]||0)+w}if(g.year_sign==="-")g.year*=-1;hb.slice(1,4).forEach(function(W,fc){var Gb=g[W.$],Hb=Gb%1;if(Hb){g[hb[fc].$]=N(Hb*(W.$==="second"?1E3:60));g[W.$]=O(Gb)}});return n}});if(j)if(f)e.advance(g);else{e._utc&&e.reset();Ab(e,g,k,n,c)}else{if(a!=="now")e=new s(a);d&&e.addMinutes(-e.getTimezoneOffset())}if(g&&g.edge){z=i.ha[g.edge];E(hb.slice(4),function(M,Q){if(I(g[Q.$])){m=Q.$;return n}});if(m===
"year")g.fa="month";else if(m==="month"||m==="week")g.fa="day";e[(z.value<0?"endOf":"beginningOf")+ob(m)]();z.value===-2&&e.reset()}J&&J();e.utc(n)}return{ea:e,set:g}}function nb(a){var b,c=v.abs(a),d=c,e=0;hb.slice(1).forEach(function(f,h){b=O(N(c/f.da()*10)/10);if(b>=1){d=b;e=h+1}});return[d,e,a]}function Bb(a){var b=nb(a.millisecondsFromNow());if(b[1]===6)b[0]=v.abs(a.monthsFromNow());return b}
function Cb(a,b,c,d){var e,f=sb(d),h=r(/^[A-Z]/);if(a.isValid())if(Date[b])b=Date[b];else{if(y(b)){e=Bb(a);b=b.apply(a,e.concat(f))}}else return"Invalid Date";if(!b&&c){e=e||Bb(a);if(e[1]===0){e[1]=1;e[0]=1}return f.va(e)}b=b||"long";b=f[b]||b;jb.forEach(function(i){b=b.replace(r("\\{("+i.ba+")(\\d)?\\}",i.la?"i":""),function(j,g,m){j=i.format(a,f,m||1,g);m=g.length;var o=g.match(/^(.)\1+$/);if(i.la){if(m===3)j=j.slice(0,3);if(o||g.match(h))j=ob(j)}else if(o&&!i.text)j=(A(j)?P(j,m):j.toString()).slice(-m);
return j})});return b}function Db(a,b,c,d){var e,f,h,i=0,j=0,g=0;e=zb(b,l,l,d);if(c>0){j=g=c;f=k}if(!e.ea.isValid())return n;if(e.set&&e.set.fa){kb.forEach(function(m){if(m.$===e.set.fa)i=m.da(e.ea,a-e.ea)-1});b=ob(e.set.fa);if(e.set.edge||e.set.shift)e.ea["beginningOf"+b]();if(e.set.fa==="month")h=e.ea.clone()["endOf"+b]().getTime();if(!f&&e.set.sign&&e.set.fa!="millisecond"){j=50;g=-50}}f=a.getTime();b=e.ea.getTime();h=h||b+i;h=Eb(a,b,h);return f>=b-j&&f<=h+g}
function Eb(a,b,c){b=new Date(b);a=(new Date(c)).utc(a.isUTC());if(V(a,"Hours")!==23){b=b.getTimezoneOffset();a=a.getTimezoneOffset();if(b!==a)c+=(a-b).minutes()}return c}
function Ab(a,b,c,d,e){function f(g){return I(b[g])?b[g]:b[g+"s"]}function h(g){return I(f(g))}var i,j;if(A(b)&&d)b={milliseconds:b};else if(A(b)){a.setTime(b);return a}if(I(b.date))b.day=b.date;E(hb,function(g,m){var o=m.$==="day";if(h(m.$)||o&&h("weekday")){b.fa=m.$;j=+g;return n}else if(c&&m.$!=="week"&&(!o||!h("week")))Fb(a,m.method,o?1:0)});kb.forEach(function(g){var m=g.$;g=g.method;var o;o=f(m);if(!K(o)){if(d){if(m==="week"){o=(b.day||0)+o*7;g="Date"}o=o*d+V(a,g)}else m==="month"&&h("day")&&
Fb(a,"Date",15);Fb(a,g,o);if(d&&m==="month"){m=o;if(m<0)m=m%12+12;m%12!=V(a,"Month")&&Fb(a,"Date",0)}}});if(!d&&!h("day")&&h("weekday")){i=f("weekday");a.setWeekday(i)}(function(){var g=new s;return e===-1&&a>g||e===1&&a<g})()&&E(hb.slice(j+1),function(g,m){if((m.ja||m.$==="week"&&h("weekday"))&&!(h(m.$)||m.$==="day"&&h("weekday"))){a[m.ia](e);return n}});return a}function V(a,b){return a["get"+(a._utc?"UTC":"")+b]()}function Fb(a,b,c){return a["set"+(a._utc&&b!="ISOWeek"?"UTC":"")+b](c)}
function qb(a,b,c){var d={h:0,m:1,s:2},e;b=b||U;return a.replace(/{([a-z])}/g,function(f,h){var i=[],j=h==="h",g=j&&!c;if(h==="t")return b.ampm.join("|");else{j&&i.push(":");if(e=b.timeSuffixes[d[h]])i.push(e+"\\s*");return i.length===0?"":"(?:"+i.join("|")+")"+(g?"":"?")}})}function X(a,b,c){var d,e;if(A(a[1]))d=ub(a)[0];else{d=a[0];e=a[1]}return zb(d,e,b,c).ea}
s.extend({create:function(){return X(arguments)},past:function(){return X(arguments,-1)},future:function(){return X(arguments,1)},addLocale:function(a,b){return tb(a,b)},setLocale:function(a){var b=sb(a,n);bb=b;if(a&&a!=b.code)b.code=a;return b},getLocale:function(a){return!a?bb:sb(a,n)},addFormat:function(a,b,c){rb(sb(c),a,b)}},n,n);
s.extend({set:function(){var a=ub(arguments);return Ab(this,a[0],a[1])},setWeekday:function(a){if(!K(a))return Fb(this,"Date",V(this,"Date")+a-V(this,"Day"))},setISOWeek:function(a){var b=V(this,"Day")||7;if(!K(a)){this.set({month:0,date:4});this.set({weekday:1});a>1&&this.addWeeks(a-1);b!==1&&this.advance({days:b-1});return this.getTime()}},getISOWeek:function(){var a=this;a=a.clone();var b=V(a,"Day")||7;a.addDays(4-b).reset();return 1+O(a.daysSince(a.clone().beginningOfYear())/7)},getUTCOffset:function(a){var b=
this._utc?0:this.getTimezoneOffset(),c=a===k?":":"";if(!b&&a)return"Z";return P(O(-b/60),2,k)+c+P(v.abs(b%60),2)},utc:function(a){ka(this,"_utc",a===k||arguments.length===0);return this},isUTC:function(){return!!this._utc||this.getTimezoneOffset()===0},advance:function(){var a=ub(arguments,k);return Ab(this,a[0],a[1],1)},rewind:function(){var a=ub(arguments,k);return Ab(this,a[0],a[1],-1)},isValid:function(){return!isNaN(this.getTime())},isAfter:function(a,b){return this.getTime()>s.create(a).getTime()-
(b||0)},isBefore:function(a,b){return this.getTime()<s.create(a).getTime()+(b||0)},isBetween:function(a,b,c){var d=this.getTime();a=s.create(a).getTime();var e=s.create(b).getTime();b=v.min(a,e);a=v.max(a,e);c=c||0;return b-c<d&&a+c>d},isLeapYear:function(){var a=V(this,"FullYear");return a%4===0&&a%100!==0||a%400===0},daysInMonth:function(){return 32-V(new s(V(this,"FullYear"),V(this,"Month"),32),"Date")},format:function(a,b){return Cb(this,a,n,b)},relative:function(a,b){if(B(a)){b=a;a=l}return Cb(this,
a,k,b)},is:function(a,b,c){var d,e;if(this.isValid()){if(B(a)){a=a.trim().toLowerCase();e=this.clone().utc(c);switch(k){case a==="future":return this.getTime()>(new s).getTime();case a==="past":return this.getTime()<(new s).getTime();case a==="weekday":return V(e,"Day")>0&&V(e,"Day")<6;case a==="weekend":return V(e,"Day")===0||V(e,"Day")===6;case (d=U.weekdays.indexOf(a)%7)>-1:return V(e,"Day")===d;case (d=U.months.indexOf(a)%12)>-1:return V(e,"Month")===d}}return Db(this,a,b,c)}},reset:function(a){var b=
{},c;a=a||"hours";if(a==="date")a="days";c=kb.some(function(d){return a===d.$||a===d.$+"s"});b[a]=a.match(/^days?/)?1:0;return c?this.set(b,k):this},clone:function(){var a=new s(this.getTime());a.utc(!!this._utc);return a}});s.extend({iso:function(){return this.toISOString()},getWeekday:s.prototype.getDay,getUTCWeekday:s.prototype.getUTCDay});
function Ib(a,b){function c(){return N(this*b)}function d(){return X(arguments)[a.ia](this)}function e(){return X(arguments)[a.ia](-this)}var f=a.$,h={};h[f]=c;h[f+"s"]=c;h[f+"Before"]=e;h[f+"sBefore"]=e;h[f+"Ago"]=e;h[f+"sAgo"]=e;h[f+"After"]=d;h[f+"sAfter"]=d;h[f+"FromNow"]=d;h[f+"sFromNow"]=d;u.extend(h)}u.extend({duration:function(a){return sb(a).ra(this)}});
U=bb=s.addLocale("en",{plural:k,timeMarker:"at",ampm:"am,pm",months:"January,February,March,April,May,June,July,August,September,October,November,December",weekdays:"Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",units:"millisecond:|s,second:|s,minute:|s,hour:|s,day:|s,week:|s,month:|s,year:|s",numbers:"one,two,three,four,five,six,seven,eight,nine,ten",articles:"a,an,the",tokens:"the,st|nd|rd|th,of","short":"{Month} {d}, {yyyy}","long":"{Month} {d}, {yyyy} {h}:{mm}{tt}",full:"{Weekday} {Month} {d}, {yyyy} {h}:{mm}:{ss}{tt}",
past:"{num} {unit} {sign}",future:"{num} {unit} {sign}",duration:"{num} {unit}",modifiers:[{name:"sign",src:"ago|before",value:-1},{name:"sign",src:"from now|after|from|in|later",value:1},{name:"edge",src:"last day",value:-2},{name:"edge",src:"end",value:-1},{name:"edge",src:"first day|beginning",value:1},{name:"shift",src:"last",value:-1},{name:"shift",src:"the|this",value:0},{name:"shift",src:"next",value:1}],dateParse:["{num} {unit} {sign}","{sign} {num} {unit}","{month} {year}","{shift} {unit=5-7}",
"{0?} {date}{1}","{0?} {edge} of {shift?} {unit=4-7?}{month?}{year?}"],timeParse:["{0} {num}{1} {day} of {month} {year?}","{weekday?} {month} {date}{1?} {year?}","{date} {month} {year}","{date} {month}","{shift} {weekday}","{shift} week {weekday}","{weekday} {2?} {shift} week","{num} {unit=4-5} {sign} {day}","{0?} {date}{1} of {month}","{0?}{month?} {date?}{1?} of {shift} {unit=6-7}"]});hb=kb.concat().reverse();gb=kb.concat();gb.splice(2,1);
G(s,k,n,kb,function(a,b,c){function d(g){g=g/h;var m=g%1,o=b.error||0.999;if(m&&v.abs(m%1)>o)g=N(g);return parseInt(g)}var e=b.$,f=ob(e),h=b.da(),i,j;b.ia="add"+f+"s";i=function(g,m){return d(this.getTime()-s.create(g,m).getTime())};j=function(g,m){return d(s.create(g,m).getTime()-this.getTime())};a[e+"sAgo"]=j;a[e+"sUntil"]=j;a[e+"sSince"]=i;a[e+"sFromNow"]=i;a[b.ia]=function(g,m){var o={};o[e]=g;return this.advance(o,m)};Ib(b,h);c<3&&["Last","This","Next"].forEach(function(g){a["is"+g+f]=function(){return this.is(g+
" "+e)}});if(c<4){a["beginningOf"+f]=function(){var g={};switch(e){case "year":g.year=V(this,"FullYear");break;case "month":g.month=V(this,"Month");break;case "day":g.day=V(this,"Date");break;case "week":g.weekday=0}return this.set(g,k)};a["endOf"+f]=function(){var g={hours:23,minutes:59,seconds:59,milliseconds:999};switch(e){case "year":g.month=11;g.day=31;break;case "month":g.day=this.daysInMonth();break;case "week":g.weekday=6}return this.set(g,k)}}});
U.addFormat("([+-])?(\\d{4,4})[-.]?{full_month}[-.]?(\\d{1,2})?",k,["year_sign","year","month","date"],n,k);U.addFormat("(\\d{1,2})[-.\\/]{full_month}(?:[-.\\/](\\d{2,4}))?",k,["date","month","year"],k);U.addFormat("{full_month}[-.](\\d{4,4})",n,["month","year"]);U.addFormat("\\/Date\\((\\d+(?:\\+\\d{4,4})?)\\)\\/",n,["timestamp"]);U.addFormat(qb(db,U),n,cb);ib=U.ga.slice(0,7).reverse();U.ga=U.ga.slice(7).concat(ib);G(s,k,n,"short,long,full",function(a,b){a[b]=function(c){return Cb(this,b,n,c)}});
"\u3007\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07".split("").forEach(function(a,b){if(b>9)b=v.pow(10,b-9);eb[a]=b});"\uff10\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19".split("").forEach(function(a,b){eb[a]=b});fb=r("([\u671f\u9031\u5468])?([\u3007\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07\uff10\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19]+)(?!\u6628)","g");
(function(){var a="today,yesterday,tomorrow,weekday,weekend,future,past".split(","),b=U.weekdays.slice(0,7),c=U.months.slice(0,12);G(s,k,n,a.concat(b).concat(c),function(d,e){d["is"+ob(e)]=function(f){return this.is(e,0,f)}})})();(function(){s.extend({utc:{create:function(){return X(arguments,0,k)},past:function(){return X(arguments,-1,k)},future:function(){return X(arguments,1,k)}}},n,n)})();
s.extend({RFC1123:"{Dow}, {dd} {Mon} {yyyy} {HH}:{mm}:{ss} {tz}",RFC1036:"{Weekday}, {dd}-{Mon}-{yy} {HH}:{mm}:{ss} {tz}",ISO8601_DATE:"{yyyy}-{MM}-{dd}",ISO8601_DATETIME:"{yyyy}-{MM}-{dd}T{HH}:{mm}:{ss}.{fff}{isotz}"},n,n);
function Jb(a,b,c,d,e){var f;if(b!==Infinity){if(!a.timers)a.timers=[];A(b)||(b=0);a.timers.push(setTimeout(function(){a.timers.splice(f,1);c.apply(d,e||[])},b));f=a.timers.length}}
D(Function,k,n,{lazy:function(a,b){function c(){if(!f||e.length<b-1){e.push([this,arguments]);h()}return g}var d=this,e=[],f=n,h,i,j,g;a=a||1;b=b||Infinity;i=N(a,void 0,"ceil");j=N(i/a)||1;h=function(){if(!(f||e.length==0)){for(var m=v.max(e.length-j,0);e.length>m;)g=Function.prototype.apply.apply(d,e.shift());Jb(c,i,function(){f=n;h()});f=k}};return c},delay:function(a){var b=H(arguments).slice(1);Jb(this,a,this,this,b);return this},throttle:function(a){return this.lazy(a,1)},debounce:function(a){function b(){b.cancel();
Jb(b,a,c,this,arguments)}var c=this;return b},cancel:function(){if(ga(this.timers))for(;this.timers.length>0;)clearTimeout(this.timers.shift());return this},after:function(a){var b=this,c=0,d=[];if(A(a)){if(a===0){b.call();return b}}else a=1;return function(){var e;d.push(H(arguments));c++;if(c==a){e=b.call(this,d);c=0;d=[];return e}}},once:function(){return this.throttle(Infinity)},fill:function(){var a=this,b=H(arguments);return function(){var c=H(arguments);b.forEach(function(d,e){if(d!=l||e>=
c.length)c.splice(e,0,d)});return a.apply(this,c)}}});
function Kb(a,b,c,d,e,f){var h=a.toFixed(20),i=h.search(/\./);h=h.search(/[1-9]/);i=i-h;if(i>0)i-=1;e=v.max(v.min((i/3).floor(),e===n?c.length:e),-d);d=c.charAt(e+d-1);if(i<-9){e=-3;b=i.abs()-9;d=c.slice(0,1)}return(a/(f?(2).pow(10*e):(10).pow(e*3))).round(b||0).format()+d.trim()}
D(u,n,n,{random:function(a,b){var c,d;if(arguments.length==1){b=a;a=0}c=v.min(a||0,K(b)?1:b);d=v.max(a||0,K(b)?1:b)+1;return O(v.random()*(d-c)+c)}});
D(u,k,n,{log:function(a){return v.log(this)/(a?v.log(a):1)},abbr:function(a){return Kb(this,a,"kmbt",0,4)},metric:function(a,b){return Kb(this,a,"n\u03bcm kMGTPE",4,K(b)?1:b)},bytes:function(a,b){return Kb(this,a,"kMGTPE",0,K(b)?4:b,k)+"B"},isInteger:function(){return this%1==0},isOdd:function(){return!isNaN(this)&&!this.isMultipleOf(2)},isEven:function(){return this.isMultipleOf(2)},isMultipleOf:function(a){return this%a===0},format:function(a,b,c){var d,e,f,h="";if(K(b))b=",";if(K(c))c=".";d=(A(a)?
N(this,a||0).toFixed(v.max(a,0)):this.toString()).replace(/^-/,"").split(".");e=d[0];f=d[1];for(d=e.length;d>0;d-=3){if(d<e.length)h=b+h;h=e.slice(v.max(0,d-3),d)+h}if(f)h+=c+ta((a||0)-f.length,"0")+f;return(this<0?"-":"")+h},hex:function(a){return this.pad(a||1,n,16)},upto:function(a,b,c){return sa(this,a,b,c||1)},downto:function(a,b,c){return sa(this,a,b,-(c||1))},times:function(a){if(a)for(var b=0;b<this;b++)a.call(this,b);return this.toNumber()},chr:function(){return t.fromCharCode(this)},pad:function(a,
b,c){return P(this,a,b,c)},ordinalize:function(){var a=this.abs();a=parseInt(a.toString().slice(-2));return this+ua(a)},toNumber:function(){return parseFloat(this,10)}});G(u,k,n,"round,floor,ceil",function(a,b){a[b]=function(c){return N(this,c,b)}});G(u,k,n,"abs,pow,sin,asin,cos,acos,tan,atan,exp,pow,sqrt",function(a,b){a[b]=function(c,d){return v[b](this,c,d)}});
var Lb="isObject,isNaN".split(","),Mb="keys,values,select,reject,each,merge,clone,equal,watch,tap,has,toQueryString".split(",");
function Nb(a,b,c,d){var e=/^(.+?)(\[.*\])$/,f,h,i;if(d!==n&&(h=b.match(e))){i=h[1];b=h[2].replace(/^\[|\]$/g,"").split("][");b.forEach(function(j){f=!j||j.match(/^\d+$/);if(!i&&ga(a))i=a.length;F(a,i)||(a[i]=f?[]:{});a=a[i];i=j});if(!i&&f)i=a.length.toString();Nb(a,i,c)}else a[b]=c.match(/^[+-]?\d+(\.\d+)?$/)?parseFloat(c):c==="true"?k:c==="false"?n:c}
function Ob(a,b){var c;if(ga(b)||L(b)&&b.toString===ba){c=[];E(b,function(d,e){if(a)d=a+"["+d+"]";c.push(Ob(d,e))});return c.join("&")}else{if(!a)return"";return Pb(a)+"="+(ia(b)?b.getTime():Pb(b))}}function Pb(a){return!a&&a!==n&&a!==0?"":encodeURIComponent(a).replace(/%20/g,"+")}function Qb(a,b,c){var d={},e;E(a,function(f,h){e=n;na(b,function(i){if(C(i)?i.test(f):pa(i)?F(i,f):f===t(i))e=k},1);if(e===c)d[f]=h});return d}
D(p,n,k,{watch:function(a,b,c){if(ea){var d=a[b];p.defineProperty(a,b,{enumerable:k,configurable:k,get:function(){return d},set:function(e){d=c.call(a,b,d,e)}})}}});D(p,n,function(a,b){return y(b)},{keys:function(a,b){var c=p.keys(a);c.forEach(function(d){b.call(a,d,a[d])});return c}});
D(p,n,n,{isObject:function(a){return L(a)},isNaN:function(a){return A(a)&&a.valueOf()!==a.valueOf()},equal:function(a,b){return ya(a)&&ya(b)?xa(a)===xa(b):a===b},extended:function(a){return new ra(a)},merge:function(a,b,c,d){var e,f;if(a&&typeof b!="string")for(e in b)if(F(b,e)&&a){f=b[e];if(I(a[e])){if(d===n)continue;if(y(d))f=d.call(b,e,a[e],b[e])}if(c===k&&f&&pa(f))if(ia(f))f=new s(f.getTime());else if(C(f))f=new r(f.source,wa(f));else{a[e]||(a[e]=q.isArray(f)?[]:{});p.merge(a[e],b[e],c,d);continue}a[e]=
f}return a},values:function(a,b){var c=[];E(a,function(d,e){c.push(e);b&&b.call(a,e)});return c},clone:function(a,b){var c;if(ia(a)&&a.clone)return a.clone();else if(pa(a))c=a instanceof ra?new ra:new a.constructor;else return a;return p.merge(c,a,b)},fromQueryString:function(a,b){var c=p.extended();a=a&&a.toString?a.toString():"";a.replace(/^.*?\?/,"").split("&").forEach(function(d){d=d.split("=");d.length===2&&Nb(c,d[0],decodeURIComponent(d[1]),b)});return c},toQueryString:function(a,b){return Ob(b,
a)},tap:function(a,b){var c=b;y(b)||(c=function(){b&&a[b]()});c.call(a,a);return a},has:function(a,b){return F(a,b)},select:function(a){return Qb(a,arguments,k)},reject:function(a){return Qb(a,arguments,n)}});G(p,n,n,x,function(a,b){var c="is"+b;Lb.push(c);a[c]=da[b]});(function(){D(p,n,function(){return arguments.length===0},{extend:function(){var a=Lb.concat(Mb);if(typeof ab!=="undefined")a=a.concat(ab);Aa(a,p)}})})();Aa(Mb,ra);
D(r,n,n,{escape:function(a){return R(a)}});
D(r,k,n,{getFlags:function(){return wa(this)},setFlags:function(a){return r(this.source,a)},addFlag:function(a){return this.setFlags(wa(this,a))},removeFlag:function(a){return this.setFlags(wa(this).replace(a,""))}});
var Rb,Sb;
D(t,k,function(a){return C(a)||arguments.length>2},{startsWith:function(a,b,c){var d=this;if(b)d=d.slice(b);if(K(c))c=k;a=C(a)?a.source.replace("^",""):R(a);return r("^"+a,c?"":"i").test(d)},endsWith:function(a,b,c){var d=this;if(I(b))d=d.slice(0,b);if(K(c))c=k;a=C(a)?a.source.replace("$",""):R(a);return r(a+"$",c?"":"i").test(d)}});
D(t,k,n,{escapeRegExp:function(){return R(this)},escapeURL:function(a){return a?encodeURIComponent(this):encodeURI(this)},unescapeURL:function(a){return a?decodeURI(this):decodeURIComponent(this)},escapeHTML:function(){return this.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;").replace(/\//g,"&#x2f;")},unescapeHTML:function(){return this.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#x2f;/g,
"/").replace(/&amp;/g,"&")},encodeBase64:function(){return Rb(this)},decodeBase64:function(){return Sb(this)},each:function(a,b){var c,d,e;if(y(a)){b=a;a=/[\s\S]/g}else if(a)if(B(a))a=r(R(a),"gi");else{if(C(a))a=r(a.source,wa(a,"g"))}else a=/[\s\S]/g;c=this.match(a)||[];if(b){d=0;for(e=c.length;d<e;d++)c[d]=b.call(this,c[d],d,c)||c[d]}return c},shift:function(a){var b="";a=a||0;this.codes(function(c){b+=t.fromCharCode(c+a)});return b},codes:function(a){var b=[],c,d;c=0;for(d=this.length;c<d;c++){var e=
this.charCodeAt(c);b.push(e);a&&a.call(this,e,c)}return b},chars:function(a){return this.each(a)},words:function(a){return this.trim().each(/\S+/g,a)},lines:function(a){return this.trim().each(/^.*$/gm,a)},paragraphs:function(a){var b=this.trim().split(/[\r\n]{2,}/);return b=b.map(function(c){if(a)var d=a.call(c);return d?d:c})},isBlank:function(){return this.trim().length===0},has:function(a){return this.search(C(a)?a:R(a))!==-1},add:function(a,b){b=K(b)?this.length:b;return this.slice(0,b)+a+this.slice(b)},
remove:function(a){return this.replace(a,"")},reverse:function(){return this.split("").reverse().join("")},compact:function(){return this.trim().replace(/([\r\n\s\u3000])+/g,function(a,b){return b==="\u3000"?b:" "})},at:function(){return za(this,arguments,k)},from:function(a){return this.slice(a)},to:function(a){if(K(a))a=this.length;return this.slice(0,a)},dasherize:function(){return this.underscore().replace(/_/g,"-")},underscore:function(){return this.replace(/[-\s]+/g,"_").replace(t.Inflector&&
t.Inflector.acronymRegExp,function(a,b){return(b>0?"_":"")+a.toLowerCase()}).replace(/([A-Z\d]+)([A-Z][a-z])/g,"$1_$2").replace(/([a-z\d])([A-Z])/g,"$1_$2").toLowerCase()},camelize:function(a){return this.underscore().replace(/(^|_)([^_]+)/g,function(b,c,d,e){b=d;b=(c=t.Inflector)&&c.acronyms[b];b=B(b)?b:void 0;e=a!==n||e>0;if(b)return e?b:b.toLowerCase();return e?d.capitalize():d})},spacify:function(){return this.underscore().replace(/_/g," ")},stripTags:function(){var a=this;na(arguments.length>
0?arguments:[""],function(b){a=a.replace(r("</?"+R(b)+"[^<>]*>","gi"),"")});return a},removeTags:function(){var a=this;na(arguments.length>0?arguments:["\\S+"],function(b){b=r("<("+b+")[^<>]*(?:\\/>|>.*?<\\/\\1>)","gi");a=a.replace(b,"")});return a},truncate:function(a,b,c,d){var e="",f="",h=this.toString(),i="["+va()+"]+",j="[^"+va()+"]*",g=r(i+j+"$");d=K(d)?"...":t(d);if(h.length<=a)return h;switch(c){case "left":a=h.length-a;e=d;h=h.slice(a);g=r("^"+j+i);break;case "middle":a=O(a/2);f=d+h.slice(h.length-
a).trimLeft();h=h.slice(0,a);break;default:a=a;f=d;h=h.slice(0,a)}if(b===n&&this.slice(a,a+1).match(/\S/))h=h.remove(g);return e+h+f},pad:function(a,b){return ta(b,a)+this+ta(b,a)},padLeft:function(a,b){return ta(b,a)+this},padRight:function(a,b){return this+ta(b,a)},first:function(a){if(K(a))a=1;return this.substr(0,a)},last:function(a){if(K(a))a=1;return this.substr(this.length-a<0?0:this.length-a)},repeat:function(a){var b="",c=this;if(!A(a)||a<1)return"";for(;a;){if(a&1)b+=c;if(a>>=1)c+=c}return b},
toNumber:function(a){var b=this.replace(/,/g,"");return b.match(/\./)?parseFloat(b):parseInt(b,a||10)},capitalize:function(a){var b;return this.toLowerCase().replace(a?/[\s\S]/g:/^\S/,function(c){var d=c.toUpperCase(),e;e=b?c:d;b=d!==c;return e})},assign:function(){var a={};H(arguments,function(b,c){if(L(b))qa(a,b);else a[c+1]=b});return this.replace(/\{([^{]+?)\}/g,function(b,c){return F(a,c)?a[c]:b})}});D(t,k,n,{insert:t.prototype.add});
(function(a){if(this.btoa){Rb=this.btoa;Sb=this.atob}else{var b=/[^A-Za-z0-9\+\/\=]/g;Rb=function(c){var d="",e,f,h,i,j,g,m=0;do{e=c.charCodeAt(m++);f=c.charCodeAt(m++);h=c.charCodeAt(m++);i=e>>2;e=(e&3)<<4|f>>4;j=(f&15)<<2|h>>6;g=h&63;if(isNaN(f))j=g=64;else if(isNaN(h))g=64;d=d+a.charAt(i)+a.charAt(e)+a.charAt(j)+a.charAt(g)}while(m<c.length);return d};Sb=function(c){var d="",e,f,h,i,j,g=0;if(c.match(b))throw Error("String contains invalid base64 characters");c=c.replace(/[^A-Za-z0-9\+\/\=]/g,"");
do{e=a.indexOf(c.charAt(g++));f=a.indexOf(c.charAt(g++));i=a.indexOf(c.charAt(g++));j=a.indexOf(c.charAt(g++));e=e<<2|f>>4;f=(f&15)<<4|i>>2;h=(i&3)<<6|j;d+=t.fromCharCode(e);if(i!=64)d+=t.fromCharCode(f);if(j!=64)d+=t.fromCharCode(h)}while(g<c.length);return d}}})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=");
var Tb=[],Ub=[],Y=[],Vb=[],Wb={},Xb,Z;function Yb(a,b){var c=a.indexOf(b);c>-1&&a.splice(c,1)}
function Zb(a,b,c){B(b)&&Yb(Y,b);Yb(Y,c);a.unshift({ka:b,pa:c})}function $b(a,b){return a==b||a=="all"||!a}function ac(a){return Y.some(function(b){return(new r("\\b"+b+"$","i")).test(a)})}function bc(a,b){a=B(a)?a.toString():"";return a.isBlank()||ac(a)?a:cc(a,b?Tb:Ub)}function cc(a,b){E(b,function(c,d){if(a.match(d.ka)){a=a.replace(d.ka,d.pa);return n}});return a}function dc(a){return a.replace(/^\W*[a-z]/,function(b){return b.toUpperCase()})}
Z={acronym:function(a){Wb[a.toLowerCase()]=a;a=p.keys(Wb).map(function(b){return Wb[b]});Z.acronymRegExp=r(a.join("|"),"g")},plural:function(a,b){Zb(Tb,a,b)},singular:function(a,b){Zb(Ub,a,b)},irregular:function(a,b){var c=a.first(),d=a.from(1),e=b.first(),f=b.from(1),h=e.toUpperCase(),i=e.toLowerCase(),j=c.toUpperCase(),g=c.toLowerCase();Yb(Y,a);Yb(Y,b);if(j==h){Z.plural(new r("({1}){2}$".assign(c,d),"i"),"$1"+f);Z.plural(new r("({1}){2}$".assign(e,f),"i"),"$1"+f);Z.singular(new r("({1}){2}$".assign(e,
f),"i"),"$1"+d)}else{Z.plural(new r("{1}{2}$".assign(j,d)),h+f);Z.plural(new r("{1}{2}$".assign(g,d)),i+f);Z.plural(new r("{1}{2}$".assign(h,f)),h+f);Z.plural(new r("{1}{2}$".assign(i,f)),i+f);Z.singular(new r("{1}{2}$".assign(h,f)),j+d);Z.singular(new r("{1}{2}$".assign(i,f)),g+d)}},uncountable:function(a){var b=q.isArray(a)?a:H(arguments);Y=Y.concat(b)},human:function(a,b){Vb.unshift({ka:a,pa:b})},clear:function(a){if($b(a,"singulars"))Ub=[];if($b(a,"plurals"))Tb=[];if($b(a,"uncountables"))Y=[];
if($b(a,"humans"))Vb=[];if($b(a,"acronyms"))Wb={}}};Xb=["and","or","nor","a","an","the","so","but","to","of","at","by","from","into","on","onto","off","out","in","over","with","for"];Z.plural(/$/,"s");Z.plural(/s$/gi,"s");Z.plural(/(ax|test)is$/gi,"$1es");Z.plural(/(octop|vir|fung|foc|radi|alumn)(i|us)$/gi,"$1i");Z.plural(/(census|alias|status)$/gi,"$1es");Z.plural(/(bu)s$/gi,"$1ses");Z.plural(/(buffal|tomat)o$/gi,"$1oes");Z.plural(/([ti])um$/gi,"$1a");Z.plural(/([ti])a$/gi,"$1a");
Z.plural(/sis$/gi,"ses");Z.plural(/f+e?$/gi,"ves");Z.plural(/(cuff|roof)$/gi,"$1s");Z.plural(/([ht]ive)$/gi,"$1s");Z.plural(/([^aeiouy]o)$/gi,"$1es");Z.plural(/([^aeiouy]|qu)y$/gi,"$1ies");Z.plural(/(x|ch|ss|sh)$/gi,"$1es");Z.plural(/(matr|vert|ind)(?:ix|ex)$/gi,"$1ices");Z.plural(/([ml])ouse$/gi,"$1ice");Z.plural(/([ml])ice$/gi,"$1ice");Z.plural(/^(ox)$/gi,"$1en");Z.plural(/^(oxen)$/gi,"$1");Z.plural(/(quiz)$/gi,"$1zes");Z.plural(/(phot|cant|hom|zer|pian|portic|pr|quart|kimon)o$/gi,"$1os");
Z.plural(/(craft)$/gi,"$1");Z.plural(/([ft])[eo]{2}(th?)$/gi,"$1ee$2");Z.singular(/s$/gi,"");Z.singular(/([pst][aiu]s)$/gi,"$1");Z.singular(/([aeiouy])ss$/gi,"$1ss");Z.singular(/(n)ews$/gi,"$1ews");Z.singular(/([ti])a$/gi,"$1um");Z.singular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/gi,"$1$2sis");Z.singular(/(^analy)ses$/gi,"$1sis");Z.singular(/(i)(f|ves)$/i,"$1fe");Z.singular(/([aeolr]f?)(f|ves)$/i,"$1f");Z.singular(/([ht]ive)s$/gi,"$1");Z.singular(/([^aeiouy]|qu)ies$/gi,"$1y");
Z.singular(/(s)eries$/gi,"$1eries");Z.singular(/(m)ovies$/gi,"$1ovie");Z.singular(/(x|ch|ss|sh)es$/gi,"$1");Z.singular(/([ml])(ous|ic)e$/gi,"$1ouse");Z.singular(/(bus)(es)?$/gi,"$1");Z.singular(/(o)es$/gi,"$1");Z.singular(/(shoe)s?$/gi,"$1");Z.singular(/(cris|ax|test)[ie]s$/gi,"$1is");Z.singular(/(octop|vir|fung|foc|radi|alumn)(i|us)$/gi,"$1us");Z.singular(/(census|alias|status)(es)?$/gi,"$1");Z.singular(/^(ox)(en)?/gi,"$1");Z.singular(/(vert|ind)(ex|ices)$/gi,"$1ex");
Z.singular(/(matr)(ix|ices)$/gi,"$1ix");Z.singular(/(quiz)(zes)?$/gi,"$1");Z.singular(/(database)s?$/gi,"$1");Z.singular(/ee(th?)$/gi,"oo$1");Z.irregular("person","people");Z.irregular("man","men");Z.irregular("child","children");Z.irregular("sex","sexes");Z.irregular("move","moves");Z.irregular("save","saves");Z.irregular("save","saves");Z.irregular("cow","kine");Z.irregular("goose","geese");Z.irregular("zombie","zombies");Z.uncountable("equipment,information,rice,money,species,series,fish,sheep,jeans".split(","));
D(t,k,n,{pluralize:function(){return bc(this,k)},singularize:function(){return bc(this,n)},humanize:function(){var a=cc(this,Vb),b;a=a.replace(/_id$/g,"");a=a.replace(/(_)?([a-z\d]*)/gi,function(c,d,e){b=F(Wb,e)?Wb[e]:l;return(d?" ":"")+(b||e.toLowerCase())});return dc(a)},titleize:function(){var a=/[.:;!]$/,b,c,d;return this.spacify().humanize().words(function(e,f,h){b=a.test(e);d=f==0||f==h.length-1||b||c;c=b;return d||Xb.indexOf(e)===-1?dc(e):e}).join(" ")},parameterize:function(a){var b=this;
if(a===undefined)a="-";if(b.normalize)b=b.normalize();b=b.replace(/[^a-z0-9\-_]+/gi,a);if(a)b=b.replace(new r("^{sep}+|{sep}+$|({sep}){sep}+".assign({sep:R(a)}),"g"),"$1");return encodeURI(b.toLowerCase())}});t.Inflector=Z;t.Inflector.acronyms=Wb;})();