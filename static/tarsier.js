// variables
ws = null;
scene = null;

function sendRequest(serverUri){

    // debug print
    console.log("SendRequest invoked");

    // build the request
    req = {};
    req["command"] = "info";
    req["queryURI"] = document.getElementById("queryUriInput").value;    
    
    $.ajax({
	url: serverUri,
	crossOrigin: true,
	method: 'POST',
	contentType: "application/json",
	data: JSON.stringify(req),	
	error: function(event){
	    console.log("[DEBUG] Connection failed!");
	    return false;
	},
	success: function(data){

	    console.log("[DEBUG] Connection ok");
	    console.log(data);

	    // get all the tables
	    opt = document.getElementById("objectPropertiesTable");
	    dpt = document.getElementById("dataPropertiesTable");
	    clt = document.getElementById("classesTable");	    
	    
	    // process data
	    while(clt.rows.length > 0) {
		clt.deleteRow(-1);
	    };
	    for (c in data["classes"]){
		newRow = clt.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.innerHTML = data["classes"][c];
	    }

	    // remove old classes and re-fill the table
	    while(dpt.rows.length > 0) {
		dpt.deleteRow(-1);
	    };
	    for (dp in data["properties"]["datatype"]){
		newRow = dpt.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.innerHTML = data["properties"]["datatype"][dp];
	    }
	    
	    // remove old data properties and re-fill the table
	    while(dpt.rows.length > 0) {
		dpt.deleteRow(-1);
	    };
	    for (dp in data["properties"]["datatype"]){
		newRow = dpt.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.innerHTML = data["properties"]["datatype"][dp];
	    }

	    // remove old object properties and re-fill the table
	    while(opt.rows.length > 0) {
		opt.deleteRow(-1);
	    };
	    for (op in data["properties"]["object"]){
		newRow = opt.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.innerHTML = data["properties"]["object"][op];
	    }
	    
	    // console.log("Time to draw!");	   	    	    
	    // draw(data);
	}
    });
    
}

function loadJSAP(){

    // check if file APIs are supported
    if ( ! window.FileReader ) {
	console.log("[ERROR] FileReader API is not supported by your browser.");
	return false;
    }

    // read the content of the field
    var $i = $('#formFile1');		
    input = $i[0];
    if ( input.files && input.files[0] ) {	
	file = input.files[0];
	
	// create a mew instance of the file reader
	fr = new FileReader();		    
	var text;
	fr.onload = function () {
	    
	    // read the content of the file
	    var decodedData = fr.result;
	    
	    // parse the JSON file
	    myJson = JSON.parse(decodedData);
	    
	    // retrieve the URLs
	    sURI = "ws://" + myJson["parameters"]["host"] + ":" + myJson["parameters"]["ports"]["ws"] + myJson["parameters"]["paths"]["subscribe"];
	    document.getElementById("subscribeUriInput").value = sURI;    
	    qURI = "http://" + myJson["parameters"]["host"] + ":" + myJson["parameters"]["ports"]["http"] + myJson["parameters"]["paths"]["query"];
	    document.getElementById("queryUriInput").value = qURI;

	    
	    // open the file

	    // get the subscribe URI and fill the proper field
	    
	};
	fr.readAsText(file);	
    }
    
};


function draw(data){

    // get the canvas
    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function(){

	// create a basic BJS Scene object
	var scene = new BABYLON.Scene(engine);
	
	// create a FreeCamera, and set its position to (x:0, y:5, z:-10)
	var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5,-10), scene);
	
	// target the camera to scene origin
	camera.setTarget(BABYLON.Vector3.Zero());
	
	// attach the camera to the canvas
	camera.attachControl(canvas, false);
	
	// create a basic light, aiming 0,1,0 - meaning, to the sky
	var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);

	// determine position for nodes
	nodes_positions = [];
	nsize = Object.keys(data["nodes"]).length;
	node_angle = 360 / nsize;
	for (i=0; i<nsize; i++){
	    nodes_positions.push([20 * Math.cos(i*node_angle / 180*Math.PI),
				  20 * Math.sin(i*node_angle / 180*Math.PI)])
	}
	console.log(nodes_positions);
	
	// parse data
	for (var k in data["nodes"]){

	    // create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
	    var sphere = BABYLON.Mesh.CreateSphere('k', 16, 0.3, scene);
	    
	    // move the sphere upward 1/2 of its height
	    var p = nodes_positions.pop();
	    sphere.position.y = p[1];
	    sphere.position.x = p[0];
	   
	    // <!-- // create a built-in "ground" shape; -->
	    // <!-- var ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene); -->
	}
	    
	// return the created scene
	return scene;
    }
    
    // call the createScene function
    var scene = createScene();
    
    // run the render loop
    engine.runRenderLoop(function(){
	scene.render();
    });
    
    // the canvas/window resize event handler
    // window.addEventListener('resize', function(){
    // 	engine.resize();
    // });
    
}
