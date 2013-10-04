<?php
    header('Access-Control-Allow-Origin: *'); //TODO: secure with password or something so some random guy can't access this

    //grab data from the server
    //we were given passcode, fetch projects
    $passcode = $_POST['passcode'];
    
    //constants
    define('DB_LOCATION','localhost');  
    define('USER','hathix5_neel');
    define('PASSWORD','p1GKDCPm');
    define('DATABASE','hathix5_chevre');     
    
    $dbc = new mysqli(DB_LOCATION, USER, PASSWORD, DATABASE);
    
    //clean up the passcode so they can't have any injection
    $passcode = $dbc->real_escape_string($passcode);  
    
    //build query
    //simply grab the projects, using the passcode as the unique identifier
    $query = "SELECT projects FROM sync WHERE passcode='$passcode' LIMIT 1";
    
    $res = $dbc->query($query);
    if($res === FALSE){
        //failed
    }
    
    //the result should be res's first row
    $row = $res->fetch_row();
    $text = $row[0]; //project string
    $text = htmlspecialchars($text);
    //row[0] is project string
    //TODO: find some other way to add in info - another element in addition to <pre>? (jquery doesn't like <pre> inside <div>)
    
    //we've ENCODED the text so that all tags get escaped. This removes any HTML rendering errors. BUT remember to decode these entities with javascript.
    //ie > becomes &gt;
    ?><pre><?=$text?></pre><?php
    
    $dbc->close();    
?>