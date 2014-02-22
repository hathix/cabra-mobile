<?php
    header('Access-Control-Allow-Origin: *'); //TODO: secure with password or something so some random guy can't access this


    //send data to the server
    
	//Prevent someone from accessing this page via their browser.
	$pw = $_POST['pw'];
	if($pw !== 'uU3yhE7Q63n9'){
		exit();
	}	
	
    //put it into the table
    
    //constants
    define('DB_LOCATION','localhost');  
    define('USER','hathix5_neel');
    define('PASSWORD','p1GKDCPm');
    define('DATABASE','hathix5_chevre');     
    
    $dbc = new mysqli(DB_LOCATION, USER, PASSWORD, DATABASE);
		
	/*
	 * For every key in key_array, loads the corresponding value into the returned var_array.
	 * Returns it in SQL-friendly form!
	 * 	Say $_POST['a'] = 5, $_POST['b'] = null.
	 * 	get_post_data(['a','b']) => ['a'=>'5','b'=>NULL]
	 */
	function get_post_data($key_array){
		global $dbc;
		$var_array = array();
		foreach($key_array as $key){
			$var_array[$key] = $_POST[$key];
			if($var_array[$key]){
				$var_array[$key] =  "'{$dbc->real_escape_string($var_array[$key])}'";
			}
			else{
				$var_array[$key] = "NULL";
			}
		}
		return $var_array;
	}
	
	$data = get_post_data(array('stamp','project_name','project_desc','project','creator','password'));
	//var_dump($data);
	
	
	//hold on! we need to UPDATE the project, so if there's one already there with the same stamp, don't add a new row - update it
	$is_existing_row = false;
	$query = "SELECT id FROM share WHERE stamp={$data['stamp']} LIMIT 1";
	$res = $dbc->query($query);
	$row = $res->fetch_row();
	if($row !== NULL){
		$is_existing_row = true;
	}
	
	//Add a new row if there isn't any; update the inner info if there is one
	if(!$is_existing_row){
    	$query = "INSERT INTO share (stamp, name, description, project, creator, password) VALUES({$data['stamp']},{$data['project_name']},{$data['project_desc']},{$data['project']},{$data['creator']},{$data['password']})";		
	}
	else{
    	$query = "UPDATE share set name={$data['project_name']}, description={$data['project_desc']}, project={$data['project']}, creator={$data['creator']}, password={$data['password']}, updated=NOW() WHERE stamp={$data['stamp']}";
	}
    $res = $dbc->query($query);
    if($res === FALSE){
        //failed
    }
	
	//figure out what the ID is of the thing we just uploaded
	$query = "SELECT id FROM share WHERE stamp={$data['stamp']} LIMIT 1";
	$res = $dbc->query($query);
	$row = $res->fetch_row();
	$id = $row[0]; //the id that this proj can be accessed at; we're only getting id so that's all we need
    echo $id;
	
    $dbc->close();
?>