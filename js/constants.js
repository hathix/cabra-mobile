
var ABOUT = {
    version: "0.7.0",
    codename: {
        name:       "Lezard", //some animal name
        language:   "French", //language it's in
        translation:"Dinosaur" //animal's name in english
    },
    date: Date.create("August 13, 2013"),
    changes: [ //list of noteworthy changes to alert users about, mostly new features
        "<strong>Multiple-choice flashcards now available</strong>",
        "You see studying results in a pie chart",
        "Mass card creator improvements"
    ],
    
    //TODO: show some warning if it's a beta build (not tested and ready)
}

//nav
//these are shortcuts to a certain location; NOT ACTUAL PAGES
var NAV_BACK = '_back';
var NAV_HOME = '_home';
var NAV_FORWARD = '_forward';
var NAV_BASE = 'home'; //page to start on

//pages
//PageEvents: listen for these things to happen to pages
var PageEvents = {
	LOAD: "load",
	HIDE: "hide"	
};

//cards

//uses for card dialog
var CARD_CREATE = "card_create";
var CARD_EDIT = "card_edit";

//url's
var ajaxTestURL = "http://cabra.hathix.com/chevre/test.txt";
var syncBaseURL = "http://cabra.hathix.com/chevre/"; //add sync-something.php to it
var feedbackURL = syncBaseURL + "send-feedback.php";

//importer
var NUM_SAMPLE_CARDS = 3; //# sample cards to show when importing

//feedback
/**
 * @type Number
 * We ask for feedback once it has been this many days since we last asked, or after FB_MIN_USES uses. Whichever comes first.
 */
var FB_MIN_DAYS = 15;
/**
 *@type Number
 * We ask for feedback once the user has used Cabra this many times since we last asked, or after FB_MIN_DAYS days. Whichever comes first.
 */
var FB_MIN_USES = 7;

//groups
/**
 * @type String
 * Newly-created projects are, by default, given this name 
 */
var GROUP_DEFAULT = "Unorganized";

//card manager
var CHUNK_SIZE = 50; //#cards in a chunk; this many are added at once. if it lags reduce this
var BREAK_TIME = 500; //how long, in ms, to wait between chunks. if it lags increase this.

//card
var MIN_STARS = 1;
var MAX_STARS = 5;
var STAR_COLORS = [ "#FF0000", "#FF7F00", "#FFC800", "#0094FF", "#00E500"];

//interface
var FADE_SPEED = 300; //ms it takes to fade html in/out
//toast
var TOAST_DURATION_DEFAULT = 3000;
var TOAST_DURATION_SHORT = 2000;
var TOAST_DURATION_LONG = 5000;
var TOAST_DURATION_FOREVER = 2013 * 1000; //you'll have to manually kill this
var TOAST_VERTICAL_PLACEMENT = 4/5; //how far down page (vertically) to place the toast; Android uses 2/3 for landscape and 85% for portrait. I've found that 3/4 and 4/5 both work well

/* API */
//Quizlet - https://quizlet.com/api_dashboard/
var QUIZLET = {
    //appName: "Cabra",
    clientID: "pYEkSEHmkf",
    //secretKey: "Y.WXND-z4OAymqBI1K2BFA",   
    
    //loadPerPage: 20, //most projects to show per page
    
    maxToLoad: 20 //most projects to show user to choose from when searching; Quizlet only allows us to do 50
}
//standard starting bits for URLS to make api requests
QUIZLET.api = {
    //Search for a set of cards. Tack on the search term (url encode if you want). EG http://is.gd/x3fWZR
    //Grab the ID of the set from RESPONSE.sets[0].id; get specifics with getSet
    searchSets: "https://api.quizlet.com/2.0/search/sets?client_id=" + QUIZLET.clientID + "&whitespace=1&per_page=" + QUIZLET.maxToLoad +"&q=",
    
    //If you know the ID of a set (got from searchSets), get the actual cards here. EG http://is.gd/8egN0i
    //tack id on to end
    //Grab cards with RESPONSE.terms (array of objects with .term and .definition)
    getSet: "https://api.quizlet.com/2.0/sets?client_id=" + QUIZLET.clientID + "&id="
}

/* Enums */
var StudyResult = {
    YES: "yes",
    SORT_OF: "sortof",
    NO: "no",
    SKIPPED: "skipped"
};

var StudyMode = {
    NORMAL: "normal",
    CRAM: "cram",
    PERFECTION: "perfection"
};
var StudyStyle = {
     NORMAL: "normal",
     JEOPARDY: "jeopardy",
     RANDOM: "random"
};
var SessionStatus = {
	SETUP: "setup", //setting up session; choosing cards/options
	STUDYING: "studying", //actually studying
	FINISHED: "finished" //reviewing results
};
var CardParts = {
     QUESTION: "question",
     ANSWER: "answer"
};

var FontSize = {
     SMALL:    18,
     MEDIUM:   32,
     LARGE:    44,
     XLARGE:   64,
     XXLARGE:  128
};

/*function getStudyMode(stringMode){
    var mode = StudyMode.NORMAL; //default
    Object.keys(StudyMode, function(key, value){
        if(value == stringMode)
            mode = key;    
    });
    return mode;
}*/

//save/load
var SL_KEYS = {
    PROJECTS: "chevre-projects",
    OPTIONS: "chevre-options",
    LAST_VERSION: "chevre-last-version",
    SYNC_KEY: "chevre-sync-key",
    
    //FIRST_USED: "chevre-first-used",
    //NUM_USES: "chevre-num-uses",
    
    FB_LAST_ASKED: "chevre-fb-last-asked",
    FB_USES_SINCE_ASKED: "chevre-fb-uses-since-asked"
};

var Rank = {
    A: { name: "A", baseReps: 0,  color: "#FF0000" },
    B: { name: "B", baseReps: 2,  color: "#FF7F00" },
    C: { name: "C", baseReps: 5,  color: "#FFC800" },
    D: { name: "D", baseReps: 9,  color: "#0094FF" },
    E: { name: "E", baseReps: 14, color: "#00E500" },
};

function nextRank(rank){
    switch(rank){
        case Rank.A: return Rank.B;
        case Rank.B: return Rank.C;
        case Rank.C: return Rank.D;
        case Rank.D: return Rank.E;
        case Rank.E: return Rank.E;
    }
}

//theme
var Theme = {
    //maps name -> css/slug
    BLUE:   "blue",
    GREEN:  "green",
    RED:    "red"//,
    //PURPLE: "purple"
}
