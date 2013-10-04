<?php
    header('Access-Control-Allow-Origin: *');
    
    //secure w/ password
    $password = $_POST['_pw'];
    if($password != "3*%2EOHitrY^") die();

    //send data to the server
    $choices = $_POST['choices']; //they choose from a list of features they want
    $comments = $_POST['comments']; //they enter comments, reviews, questions, etc.
    $email = $_POST['email'];
    $version = $_POST['version'];
    
    
    //put it into the table
    
    //constants
    define('DB_LOCATION','localhost');  
    define('USER','hathix5_neel');
    define('PASSWORD','p1GKDCPm');
    define('DATABASE','hathix5_chevre');     
    
    $dbc = new mysqli(DB_LOCATION, USER, PASSWORD, DATABASE);
    
    //clean up the passcode & projects so they can't have any injection
    $choices = $dbc->real_escape_string($choices);
    $comments = $dbc->real_escape_string($comments);
    $email = $dbc->real_escape_string($email);
    
    //build query
    $query = "INSERT INTO feedback (features, comments, email, version) VALUES('$choices', '$comments', '$email', '$version')";
    
    $res = $dbc->query($query);
    if($res === FALSE){
        //failed
        echo "Failed";
    }
    
    echo $res;
    
    $dbc->close();
?>