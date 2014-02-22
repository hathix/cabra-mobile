<?php
    header('Access-Control-Allow-Origin: *'); //TODO: secure with password or something so some random guy can't access this
    //get data from the server
    
	//Prevent someone from accessing this page via their browser.
	$pw = $_POST['pw'];
	if($pw !== 'uU3yhE7Q63n9'){
		exit();
	}
	
	
    //constants
    define('DB_LOCATION','localhost');  
    define('USER','hathix5_neel');
    define('PASSWORD','p1GKDCPm');
    define('DATABASE','hathix5_chevre');     
    
    $dbc = new mysqli(DB_LOCATION, USER, PASSWORD, DATABASE);
	
	/*
	 * For every key in key_array, loads the corresponding value into the returned var_array.
	 * Returns it in NON SQL FRIENDLY FORM.
	 * 	Say $_POST['a'] = 5, $_POST['b'] = null.
	 * 	get_post_data(['a','b']) => ['a'=>'5','b'=>NULL]
	 */
	function get_post_data($key_array){
		global $dbc;
		$var_array = array();
		foreach($key_array as $key){
			$var_array[$key] = $_POST[$key];
			if($var_array[$key]){
				$var_array[$key] =  "{$dbc->real_escape_string($var_array[$key])}";
			}
			else{
				$var_array[$key] = NULL;
			}
		}
		return $var_array;
	}	
	
	/**
	 * Gives preliminary information about ONE project.
	 * @param {int} id	the project id - use 'search' or something to get it
	 * @return {Array} info array containing name, description, etc (assoc array) - or null if nothing found
	 */
	function get_project_info($id){
		global $dbc;
		$query = "SELECT * FROM share WHERE id='{$id}' LIMIT 1";
    	$res = $dbc->query($query);
		$row = $res->fetch_assoc();
		if(!$row){
			return null;
		}
		else{
			$info = array(
				'name'=>$row['name'],
				'description'=>$row['description'],
				'creator'=>$row['creator'],
				'date'=>$row['updated'],
				'downloads'=>$row['downloads'],
				'locked'=>($row['password'] !== NULL),
				
				'id'=>$id
			);
			return $info;
		}		
	}
	
	/** MODE
	 * 'check':
	 * 		Pass: 'id' (project you want)
	 * 		Returns: Preliminary information about this project, plus 'locked': TRUE if this project has NO passcode (you can go ahead and get it), or FALSE if it has a passcode you need to pass
	 * 				JSON-encoded: [name: String, description: String, creator: String, downloads: int, locked: boolean]
	 * 				OR, 0 if there's nothing with that id
	 * 'check_bulk':
	 * 		Lets you get information about a bunch of projects at once.
	 * 		Pass: 'type' ('all','most_downloaded','newest','random')
	 * 		Returns: info array about each matching deck (see 'check' for details)
	 * 'get':
	 * 		Pass: 'id' (project you want), 'password' (to access it; what the user gave; if there's no password pass 0)
	 * 		Returns: 'project' - (JSON-encoded project object) if they got passcode right, 0 if they got it wrong
	 * 'search':
	 * 		Pass: 'by' ('name' or 'creator'), 'searchtext' (what to look for specifically)
	 * 		Returns: info array about each matching deck (see 'check' for details)
	 */
	 $data = get_post_data(array('mode','id', 'password'));
	if($data['mode'] == "check"){
		//Check if there's a project there, and if it's locked
		//return info for just ONE project
		$yield = get_project_info($data['id']);
		if($yield)
			$yield = json_encode($yield);
		else {
			$yield = "0";
		}
		echo $yield;
	}
	if($data['mode'] == "check_bulk"){
		//Give brief info about each project
		$data2 = get_post_data(array('type'));
		$type = $data2['type'];
		
		//Let's run queries to select id's of matching projects, then load those id's into an array.
		$MAX_PROJECTS = 3; //besides 'all', every download filter will get this many decks at the top of the pile
		$query = ""; //we'll run this to get id's to use
		if($type == 'all'){
			//get 'em all
			$query = "SELECT id FROM share WHERE 1";
		}
		else if($type == 'most_downloaded'){
			//get only the few most popular (most downloaded) ones
			$query = "SELECT id FROM share ORDER BY downloads DESC LIMIT $MAX_PROJECTS";
		}
		else if($type == 'newest'){
			//get only newest
			$query = "SELECT id FROM share ORDER BY updated DESC LIMIT $MAX_PROJECTS";
		}
		else if($type == 'random'){
			//get whatever
			$query = "SELECT id FROM share ORDER BY RAND() DESC LIMIT $MAX_PROJECTS";
		}
				
		$ids = array(); //int array of ids to get info for
		$res = $dbc->query($query);
		while($row = $res->fetch_assoc()){
			//$row contains just id
			$ids []= intval($row['id']);
		}

		//convert ids to information
		$info_array = array();
		foreach($ids as $id){
			$info_array []= get_project_info($id);
		}
		$json = json_encode($info_array);
		echo $json;
	}	
	else if($data['mode'] == 'get'){
		//We're sure there's a project there, so compare the given password to the one there, if any
		//Check if there's a project there, and if it's locked
		$query = "SELECT * FROM share WHERE id='{$data['id']}' LIMIT 1";
    	$res = $dbc->query($query);
		$row = $res->fetch_assoc();
		if($row){
			$password = $row['password'];
			//echo $password;
			if( $password === NULL || $data['password'] == $password){
				//got it! give them back the project code
				$text = $row['project'];
				echo $text;
				
				//now, update the row to increment # downloads
				$downloads = $row['downloads'] + 1;
				$query = "UPDATE share SET downloads={$downloads} WHERE id='{$data['id']}'";
		    	$res = $dbc->query($query);	
			}
			else{
				//wrong password
				echo 0;
			}
		}		
	}
	else if($data['mode'] ==  'search'){
		//Look for projects to get; find list of id's they want; then give list of JSON-encoded items
		$by = $data['by'];
		$search_field = "name";
		if($by == 'name') $search_field = "name";
		else if($by == 'creator') $search_field = "creator";
		$text = $data['searchtext'];
		//TODO maybe break text into words and have a like for each word? and search description too while we're at it??
		$query = "SELECT * FROM share WHERE $search_field LIKE '%{$text}%'";
		//TODO FINISH - run query, get project infos, zip up, encode, send
	}

	/*
	$data = get_post_data(array('stamp','project_name','project_desc','project','creator','password'));
	//var_dump($data);
	
	
    //build query
    //insert it into table if the key does not exist (first time syncing); if it already exists, overwrite what used to be in that row (so that the key stays unique)
    //also update the last synced time
    $query = "INSERT INTO share (stamp, name, description, project, creator, password) VALUES({$data['stamp']},{$data['project_name']},{$data['project_desc']},{$data['project']},{$data['creator']},{$data['password']})";
	
    $res = $dbc->query($query);
    if($res === FALSE){
        //failed
    }
    
    echo $res;
    
    */
    $dbc->close();
?>