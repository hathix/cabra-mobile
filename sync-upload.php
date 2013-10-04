<?php
    header('Access-Control-Allow-Origin: *'); //TODO: secure with password or something so some random guy can't access this


    //send data to the server
    //we were given passcode and projects - which is a string containing a json-encoded array
    $passcode = $_POST['passcode'];
    $projects = $_POST['projects'];
    
    //put it into the table
    
    //constants
    define('DB_LOCATION','localhost');  
    define('USER','hathix5_neel');
    define('PASSWORD','p1GKDCPm');
    define('DATABASE','hathix5_chevre');     
    
    $dbc = new mysqli(DB_LOCATION, USER, PASSWORD, DATABASE);
    
    //clean up the passcode & projects so they can't have any injection
    $passcode = $dbc->real_escape_string($passcode);
    $projects = $dbc->real_escape_string($projects);
    
    //build query
    //insert it into table if the key does not exist (first time syncing); if it already exists, overwrite what used to be in that row (so that the key stays unique)
    //also update the last synced time
    $query = "INSERT INTO sync (passcode, projects, lastsynced) VALUES('$passcode', '$projects', NOW()) ON DUPLICATE KEY UPDATE projects='$projects', lastsynced=NOW()";
    
    $res = $dbc->query($query);
    if($res === FALSE){
        //failed
    }
    
    echo $res;
    
    $dbc->close();
?>