// global variables
ws = null;
scene = null;
lastData = null;

// mesh
mesh = {};
dpMesh = {};
dpEdgeMesh = {};
opEdgeMesh = {};
planes = {};

// other settings
meshPlaneGap = 1;
planesGap = 10;
bump = 0;

// colors and materials
rgbGroundColor = null;
rgbOrangeColor = null;
rgbPurpleColor = null;
rgbGreenColor = null;
rgbBlueColor = null;
rgbRedColor = null;
purpleMat = null;
orangeMat = null;
groundMat = null;
greenMat = null;
blueMat = null;
redMat = null;

function sendRequest(serverUri){

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

	    // store data
	    lastData = data;

	    // get all the tables
	    iis = document.getElementById("instancesTable");
	    opt = document.getElementById("objectPropertiesTable");
	    dpt = document.getElementById("dataPropertiesTable");
	    clt = document.getElementById("classesTable");	    
	    
	    // process data
	    while(clt.rows.length > 0) {
		clt.deleteRow(-1);
	    };
	    for (c in data["classes"]){
		cName = data["classes"][c];		
		newRow = clt.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.innerHTML = '<input type="checkbox" value="" id="' + cName + '_C_enabled" checked>'
		newCell = newRow.insertCell(1);
		newCell.innerHTML = cName;
	    }
	    
	    // remove old data properties and re-fill the table
	    while(dpt.rows.length > 0) {
		dpt.deleteRow(-1);
	    };
	    for (dp in data["properties"]["datatype"]){
		dpName = data["properties"]["datatype"][dp];
		newRow = dpt.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.innerHTML = '<input type="checkbox" value="" id="' + dpName + '_D_enabled" checked>'
		newCell = newRow.insertCell(1);
		newCell.innerHTML = dpName;
	    }

	    // remove old object properties and re-fill the table
	    while(opt.rows.length > 0) {
		opt.deleteRow(-1);
	    };
	    for (op in data["properties"]["object"]){
		opName = data["properties"]["object"][op];
		newRow = opt.insertRow(-1);
		newCell = newRow.insertCell(0);		
		newCell.innerHTML = '<input type="checkbox" value="" id="' + opName + '_O_enabled" checked>'
		newCell = newRow.insertCell(1);
		newCell.innerHTML = opName;
	    }
	    
	    // remove old instances and re-fill the table
	    while(iis.rows.length > 0) {
		iis.deleteRow(-1);
	    };
	    for (ii in data["instances"]){
		iiName = ii;
		newRow = iis.insertRow(-1);
		newCell = newRow.insertCell(0);		
		newCell.innerHTML = '<input type="checkbox" value="" id="' + iiName + '_I_enabled" checked>'
		newCell = newRow.insertCell(1);
		newCell.innerHTML = iiName;
	    }
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

	    // retrieve colors
	    document.getElementById("classesColor").value = myJson["extended"]["colors"]["classes"];	   
	    document.getElementById("datapropColor").value = myJson["extended"]["colors"]["dataProperties"];
	    document.getElementById("objpropColor").value = myJson["extended"]["colors"]["objectProperties"];
	    document.getElementById("rdftypeColor").value = myJson["extended"]["colors"]["rdftype"];
	    document.getElementById("instancesColor").value = myJson["extended"]["colors"]["instances"];

	    // other settings
	    document.getElementById("planePlaneGap").value = myJson["extended"]["values"]["planesGap"];	   
	    document.getElementById("meshPlaneGap").value = myJson["extended"]["values"]["meshPlaneGap"];
	    document.getElementById("lod").value = myJson["extended"]["values"]["LOD"];
	    document.getElementById("bump").value = myJson["extended"]["values"]["bump"];
	    
	    // open the file

	    // get the subscribe URI and fill the proper field
	    
	};
	fr.readAsText(file);	
    }
    
};

function draw(){

    // reset meshes
    mesh = {};
    dpMesh = {};
    dpEdgeMesh = {};
    opEdgeMesh = {};

    // get the canvas
    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function(){
	
	// create a basic BJS Scene object
	scene = new BABYLON.Scene(engine);
	scene.ambientColor = new BABYLON.Color3(1, 1, 1);

	// get colors
	getColors();
   
	// read other settings
	lod = parseInt(document.getElementById("lod").value);
	bump = parseInt(document.getElementById("bump").value);
	planesGap = parseInt(document.getElementById("planePlaneGap").value);
	meshPlaneGap = parseInt(document.getElementById("meshPlaneGap").value);
	
	// create a FreeCamera, and set its position (x,y,z)
	var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2,  Math.PI / 4, 5, BABYLON.Vector3.Zero(), scene)
	
	// target the camera to scene origin
	camera.setTarget(BABYLON.Vector3.Zero());
	
	// attach the camera to the canvas
	camera.attachControl(canvas, false);
	
	// create a basic light, aiming 0,1,0 - meaning, to the sky
	var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);
	   
	// create a plane
	// drawPlane(0);
	
	// draw classes
	n5 = Object.keys(lastData["classes"]).length;
	node_angle = 360 / n5;
	for (var k in lastData["classes"]){
	    // check if it's enabled
	    if (document.getElementById(lastData["classes"][k] + "_C_enabled").checked){	
		var sphere = BABYLON.Mesh.CreateSphere(lastData["classes"][k], lod, 1, scene);
		sphere.position.z = 5 * Math.sin(k*node_angle / 180*Math.PI);
		sphere.position.y = parseInt(meshPlaneGap);
		sphere.position.x = 5 * Math.cos(k*node_angle / 180*Math.PI);
		sphere.material = orangeMat;

		// store the mesh in an Object using the URI as the key
		mesh[lastData["classes"][k]] = sphere;
		sphere.statement = "Class: " + lastData["classes"][k];
		sphere.actionManager = new BABYLON.ActionManager(scene);
		sphere.actionManager.registerAction(
		    new BABYLON.ExecuteCodeAction(
			BABYLON.ActionManager.OnPickTrigger,
			function(evt){
			    // Find the clicked mesh
			    var meshClicked = evt.meshUnderPointer;
			    alert(meshClicked.statement);
			}
		    )
		);
			
		// draw the label
		var zChar = makeTextPlane(lastData["classes"][k], "white", 5 / 10);
		zChar.position = new BABYLON.Vector3(sphere.position.x, sphere.position.y, sphere.position.z);
	    }
	}
	
	// draw instances
	nsize = Object.keys(lastData["instances"]).length;
	node_angle = 360 / nsize;

	c = 0;
	for (var k in lastData["instances"]){

	    // check if it's enabled
	    if (document.getElementById(k + "_I_enabled").checked){	

		// TODO -- check if the individual has been already designed as a class
		// ex.: wot:Thing can be a class, but also an individual of the class owl:Class
		
		var sphere = BABYLON.Mesh.CreateSphere(k, lod, 1, scene);
		c += 1;
		sphere.position.z = 15 * Math.sin(c * node_angle / 180*Math.PI);
		sphere.position.x = 15 * Math.cos(c * node_angle / 180*Math.PI);
		sphere.position.y = parseInt(meshPlaneGap);
		sphere.material = purpleMat;
		
		// store the mesh in an Object using the URI as the key
		mesh[k] = sphere;

		// bind an action
		sphere.statement = "Individual: " + k;
		sphere.actionManager = new BABYLON.ActionManager(scene);
		sphere.actionManager.registerAction(
		    new BABYLON.ExecuteCodeAction(
			BABYLON.ActionManager.OnPickTrigger,
			function(evt){
			    // Find the clicked mesh
			    var meshClicked = evt.meshUnderPointer;
			    alert(meshClicked.statement);
			}
		    )
		);
		
		drawDataProperties(k, lastData["instances"][k], sphere, greenMat);
		drawDataPropertiesEdges(k, lastData["instances"][k], sphere, greenMat);
	    }	    
	}

	drawObjectProperties();
		
	// return the created scene
	return scene;
    }
    
    // call the createScene function
    scene = createScene();
    
    // run the render loop
    engine.runRenderLoop(function(){
	scene.render();
    });

    // draw planes
    drawPlanes();

}

function cutHex(nStr) {
    if (nStr.charAt(0) === "#") {
	return nStr.substring(1, 7);
    }
    return nStr;
};

function hexToRGB(hexColor){
    r = parseInt(cutHex(hexColor).substring(0,2),16).toFixed(2)/255;
    g = parseInt(cutHex(hexColor).substring(2,4),16).toFixed(2)/255;
    b = parseInt(cutHex(hexColor).substring(4,6),16).toFixed(2)/255;
    return [r,g,b]
}

function makeTextPlane(text, color) {
    var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 350, scene, true);
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, 5, 30, "bold 10px Arial", color , "transparent", true);
    var plane = BABYLON.Mesh.CreatePlane("TextPlane", 5, scene, true);
    plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
    plane.material.backFaceCulling = false;
    plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
    plane.material.diffuseTexture = dynamicTexture;
    return plane;
};

function getCurvedEdge(point1, point2, bump, steps){

    // log
    console.log("[INFO] getCurvedEdge() invoked");
    
    // TODO -- optimize this code!
    
    // initialize the array of points
    points = []
    
    // calculate difference on x, y and z
    x_diff = Math.abs(point1.position.x - point2.position.x)
    y_diff = Math.abs(point1.position.y - point2.position.y)
    z_diff = Math.abs(point1.position.z - point2.position.z)
    
    // divide the three differences by the number of steps
    x_step = x_diff / (steps+2)
    y_step = y_diff / (steps+2)
    z_step = z_diff / (steps+2)
    
    // iteratively increment x1 with the result of the division, then y1, then z1
    new_point_x = point1.position.x
    new_point_y = point1.position.y
    new_point_z = point1.position.z
    points.push(new BABYLON.Vector3(new_point_x, new_point_y, new_point_z));

    // calculate the bump
    // if even number:
    if (bump > 0){
	if (steps%2 === 0){
	    bump_vector = math.range(0, (steps+2)/2-1, 1, true)._data
	    bump_vector = bump_vector.concat(math.range((steps+2)/2-1, 0, -1, true)._data)
	} else { // if odd number:
	    bump_vector = math.range(0, Math.floor(steps+2)/2, 1, false)._data
	    bump_vector = bump_vector.concat(math.range(Math.floor(steps+2)/2, 0, -1, true)._data)
	}
	// TODO -- "normalize" bump
    }
    else {
	bump_vector = math.zeros(2 + steps);
    }
    
    // we use steps+2 because we always have the start and end of the segment
    // and the steps are only the halfway points.
    for (var i=0; i<steps+2; i++){

	// update x
	if (point1.position.x < point2.position.x){
	    new_point_x += x_step
	} else {
	    new_point_x -= x_step
	}

	// update y -- consider the bump		    	
	if (point1.position.y < point2.position.y){	    
	    new_point_y +=  y_step 
	} else {	    
	    new_point_y -=  y_step
	}

	// update z
	if (point1.position.z < point2.position.z){	    
	    new_point_z += z_step
	} else {
	    new_point_z -= z_step
	}
	points.push(new BABYLON.Vector3(new_point_x, new_point_y, new_point_z));	
    }

    // add bump
    if (bump > 0){
	for (var i=0; i<steps+2; i++){
    	    if (point1.position.y < point2.position.y){
    		points[i]["y"] -= bump_vector[i] //*0.5
    	    } else {
    		points[i]["y"] += bump_vector[i] //*0.5
    	    }
	}
    }
    
    return points;

}

function selectAll(what, select){

    switch(what){
    case "classes":
	for (var k in lastData["classes"]){		
	    document.getElementById(lastData["classes"][k] + "_C_enabled").checked = select
	}
	break;
    case "objectProperties":
	for (var k in lastData["properties"]["object"]){		
	    document.getElementById(lastData["properties"]["object"][k] + "_O_enabled").checked = select
	}
	break;
    case "dataProperties":
	for (var k in lastData["properties"]["datatype"]){		
	    document.getElementById(lastData["properties"]["datatype"][k] + "_D_enabled").checked = select
	}
	break;
    case "instances":
	for (var k in lastData["instances"]){
	    document.getElementById(k + "_I_enabled").checked = select
	}
	break;
    }
        
}

function raise(up){

    // read colors
    getColors();
    
    // for all the classes selected to be raised
    // - check if they have been designed
    // - increment the 'y' coordinate
    for (var k in lastData["classes"]){
	
	// check if it's enabled
	if (document.getElementById(lastData["classes"][k] + "_C_enabled").checked){

	    // check if it's present in the canvas
	    if (lastData["classes"][k] in mesh){
		sphere = mesh[lastData["classes"][k]];
		if (up){
		    sphere.position.y += planesGap;
		    drawPlane(sphere.position.y - meshPlaneGap)
		}
		else {
		    sphere.position.y -= planesGap;
		    drawPlane(sphere.position.y - meshPlaneGap)
		}
	    }
	}
    }
    
    // get all the individuals
    for (var k in lastData["instances"]){
	
	// check if it's enabled
	if (document.getElementById(k + "_I_enabled").checked){

	    // check if it's present in the canvas
	    if (k in mesh){
		// raise the sphere
		sphere = mesh[k];		
		if (up){
		    sphere.position.y += planesGap;
		}
		else {
		    sphere.position.y -= planesGap;
		}

		// cycle over data properties
		for (dp in lastData["instances"][k]) {

		    // check if raising the dp it's requested
		    if (document.getElementById(dp + "_D_enabled").checked){

			// raise the sphere
			key1 = k + "_" + dp
			key2 = key1 + "_EDGE"
			if (key1 in dpMesh){
			    dpsphere = dpMesh[key1]
			    if (up)
				dpsphere.position.y += planesGap;
			    else dpsphere.position.y -= planesGap;

			}					
		    }
		}
		drawDataPropertiesEdges(k, lastData["instances"][k], sphere, greenMat);
	    }
	}
    }

    // re-draw all the object properties
    console.log("[INFO] Re-drawing object properties");
    drawObjectProperties();

    // draw planes
    drawPlanes();
    
}



function drawObjectProperties(){   

    // log
    console.log("[INFO] drawObjectProperties() invoked");
    
    // draw object properties
    for (var op in lastData["properties"]["object"]){

	// // check if it's enabled
	// if (document.getElementById(lastData["properties"]["object"][op] + "_enabled").checked){
	// TODO -- find a way to determine when op must be hidden or not
	    
	    key = lastData["properties"]["object"][op]
	  	    
	    // iterate over the statements with that property
	    for (statement in lastData["pvalues"]["object"][key]){
		
		// get the subject and object
		subj = lastData["pvalues"]["object"][key][statement]["s"]
		obj =  lastData["pvalues"]["object"][key][statement]["o"]		    

		// determine if both subject and object are both drawn
		if (subj in mesh && obj in mesh){

		    // draw the edge
		    var lines = BABYLON.Mesh.CreateLines(op, getCurvedEdge(mesh[subj], mesh[obj], bump, 10), scene)
		    lines.statement = sphere.statement = "Property: " + lastData["properties"]["object"][op] + "\nSubject: " + subj + "\nObject: " + obj;
		    if (key === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"){
			lines.color = new BABYLON.Color3(rgbRedColor[0], rgbRedColor[1], rgbRedColor[2]);
		    } else {
			lines.color = new BABYLON.Color3(rgbBlueColor[0], rgbBlueColor[1], rgbBlueColor[2]);
		    }
		    lines.actionManager = new BABYLON.ActionManager(scene);
		    lines.actionManager.registerAction(
			new BABYLON.ExecuteCodeAction(
			    BABYLON.ActionManager.OnPickTrigger,
			    function(evt){
				// Find the clicked mesh
				var meshClicked = evt.meshUnderPointer;
				alert(meshClicked.statement);
			    }
			)
		    );
		    
		    // delete the old edge, if any
		    // we temporarily use the mesh named as "subj_pred_obj_EDGE"
		    k = subj + "_" + key  + "_" + obj
		    
		    // store the edge
		    if (k in opEdgeMesh){
			opEdgeMesh[k].dispose();
		    }
		    opEdgeMesh[k] = lines;
		}
		
	    // }
	}
    }   
}

function resetPlanes(){

    // iterate over all the classes/individuals meshes
    for (m in mesh){
	mesh[m].position.y = meshPlaneGap;
    }

    // redraw all the data properties
    for (m in dpMesh){
	dpMesh[m].position.y = meshPlaneGap;
    }

    // redraw all the data properties edges
    for (m in dpEdgeMesh){

	// delete the old one
	dpEdgeMesh[m].dispose();

	// get subject and object and redraw
	
    }
    
    // redraw object properties
    drawObjectProperties();
    
}


///////////////////////////////////////////////////////////////////////
//
// draw plane
//
///////////////////////////////////////////////////////////////////////

function drawPlane(y){

    // check if the plane already exists
    if (!(y in planes)){
	
	// define the material
	rgbGroundColor = hexToRGB(document.getElementById("groundColor").value);
	var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
	groundMat.diffuseColor = new BABYLON.Color3(rgbGroundColor[0], rgbGroundColor[1], rgbGroundColor[2]);
	groundMat.alpha = 0.5;
	
	// create a plane
	var myPlane = BABYLON.MeshBuilder.CreatePlane("myPlane", {width: 50, height: 50, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);	
	myPlane.material = groundMat;	
	var axis = new BABYLON.Vector3(1, 0, 0);
	var angle = Math.PI / 2;
	var quaternion = new BABYLON.Quaternion.RotationAxis(axis, angle);
	myPlane.rotationQuaternion = quaternion;
	myPlane.translate(BABYLON.Axis.Y, y, BABYLON.Space.WORLD);
	
	// store the plane
	planes[y] = myPlane;
    }
}


///////////////////////////////////////////////////////////////////////
//
// draw data properties 
//
///////////////////////////////////////////////////////////////////////

function drawDataProperties(subj, subj_dict, subj_mesh, material){

    // determine the local origin based on the subject of the triple
    localOrigin = [subj_mesh.position.x, subj_mesh.position.y, subj_mesh.position.z]
    
    // determine positions
    dpnsize = Object.keys(subj_dict).length;
    dpnode_angle = 360 / dpnsize;

    // iterate over the data properties
    cc = 0;
    for (dp in subj_dict) {

	console.log(dp);
	
	if (document.getElementById(dp + "_D_enabled").checked){		

	    // delete old sphere and edge, if any
	    key1 = subj + "_" + dp
	    if (key1 in dpMesh){
		dpMesh[key1].dispose();
	    }
	    
	    // build a green sphere
	    var sphere = BABYLON.Mesh.CreateSphere(dp, lod, 1, scene);
	    sphere.position.x = localOrigin[0] + 2 * Math.sin(cc * dpnode_angle / 180*Math.PI);
	    sphere.position.z = localOrigin[2] + 2 * Math.cos(cc * dpnode_angle / 180*Math.PI);
	    sphere.position.y = parseInt(meshPlaneGap);
	    sphere.statement = "Property: " + dp + "\nSubject: " + subj + "\nValue: " + lastData["instances"][subj][dp];
	    sphere.material = material;

	    // attach an action to the sphere
	    sphere.actionManager = new BABYLON.ActionManager(scene);
	    sphere.actionManager.registerAction(
		new BABYLON.ExecuteCodeAction(
		    BABYLON.ActionManager.OnPickTrigger,
		    function(evt){
			// Find the clicked mesh
			var meshClicked = evt.meshUnderPointer;
			alert("Property: " + meshClicked.statement);
		    }
		)
	    );
	    
	    // draw the label
	    var zChar = makeTextPlane(subj_dict[dp], "white", 5 / 10);
	    zChar.position = new BABYLON.Vector3(sphere.position.x, sphere.position.y, sphere.position.z);
	    
	    // store the sphere (as a key we use subj+prop)
	    dpMesh[key1] = sphere;

	    // increment cc
	    cc += 1;
	    
	}
    }
}


///////////////////////////////////////////////////////////////////////
//
// draw data properties edges
//
///////////////////////////////////////////////////////////////////////

function drawDataPropertiesEdges(subj, subj_dict, subj_mesh, material){

    // log
    console.log("[INFO] drawDataPropertiesEdges invoked");
    
    // determine the local origin based on the subject of the triple
    localOrigin = [subj_mesh.position.x, subj_mesh.position.y, subj_mesh.position.z]
    
    // iterate over the data properties
    for (dp in subj_dict) {

	// get the object sphere
	key1 = subj + "_" + dp
	sphere = dpMesh[key1]

	// delete old sphere and edge, if any
	key2 = subj + "_" + dp + "_EDGE"
	if (key2 in dpEdgeMesh){
	    dpEdgeMesh[key2].dispose();
	}
	    
	// draw the edge
	var lines = BABYLON.Mesh.CreateLines("lines", [
	    new BABYLON.Vector3(localOrigin[0], localOrigin[1], localOrigin[2]),
	    new BABYLON.Vector3(sphere.position.x, sphere.position.y, sphere.position.z)], scene)
	lines.color = new BABYLON.Color3(rgbGreenColor[0], rgbGreenColor[1], rgbGreenColor[2]);
	lines.statement = "Property: " + dp + "\nSubject: " + subj + "\nValue: " + lastData["instances"][subj][dp];
	lines.actionManager = new BABYLON.ActionManager(scene);
	lines.actionManager.registerAction(
	    new BABYLON.ExecuteCodeAction(
		BABYLON.ActionManager.OnPickTrigger,
		function(evt){
		    // Find the clicked mesh
		    var meshClicked = evt.meshUnderPointer;
		    alert(meshClicked.statement);
		}
	    )
	);

	
	// store the edge (as a key we use subj+prop_EDGE)
	dpEdgeMesh[key2] = lines;
	
    }
}

///////////////////////////////////////////////////////////////////////
//
// read colors
//
///////////////////////////////////////////////////////////////////////

function getColors(){
    
    // create the colors for:
    
    // - classes
    rgbOrangeColor = hexToRGB(document.getElementById("classesColor").value);
    orangeMat = new BABYLON.StandardMaterial("orangeMat", scene);
    orangeMat.diffuseColor = new BABYLON.Color3(rgbOrangeColor[0], rgbOrangeColor[1], rgbOrangeColor[2]);	
    
    // - individuals
    rgbPurpleColor = hexToRGB(document.getElementById("instancesColor").value);
    purpleMat = new BABYLON.StandardMaterial("purpleMat", scene);
    purpleMat.diffuseColor = new BABYLON.Color3(rgbPurpleColor[0], rgbPurpleColor[1], rgbPurpleColor[2]);	
    
    // - data properties
    rgbGreenColor = hexToRGB(document.getElementById("datapropColor").value);
    greenMat = new BABYLON.StandardMaterial("greenMat", scene);
    greenMat.diffuseColor = new BABYLON.Color3(rgbGreenColor[0], rgbGreenColor[1], rgbGreenColor[2]);	
    
    // - object properties
    rgbBlueColor = hexToRGB(document.getElementById("objpropColor").value);
    blueMat = new BABYLON.StandardMaterial("blueMat", scene);
    blueMat.diffuseColor = new BABYLON.Color3(rgbBlueColor[0], rgbBlueColor[1], rgbBlueColor[2]);

    // - object properties
    rgbRedColor = hexToRGB(document.getElementById("rdftypeColor").value);
    redMat = new BABYLON.StandardMaterial("redMat", scene);
    redMat.diffuseColor = new BABYLON.Color3(rgbRedColor[0], rgbRedColor[1], rgbRedColor[2]);
    
    // - ground
    rgbGroundColor = hexToRGB(document.getElementById("groundColor").value);
    groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(rgbGroundColor[0], rgbGroundColor[1], rgbGroundColor[2]);
    groundMat.alpha = 0.5;

}

///////////////////////////////////////////////////////////////////////
//
// get planes
//
///////////////////////////////////////////////////////////////////////
function drawPlanes(){

    // log
    console.log("[INFO] drawPlanes() invoked");
    
    // delete the existing planes
    for (p in planes){
	planes[p].dispose();
	delete p;
    };
    planes = {};
    
    // iterate over meshes
    for (m in mesh){
	
	// get the y coordinate of the mesh
	y = mesh[m].position.y - meshPlaneGap;

	// check if a plane already exists
	if (!(y in planes)){

	    // 3 - if needed, draw a plane
	    var myPlane = BABYLON.MeshBuilder.CreatePlane("myPlane", {width: 50, height: 50, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);	
	    myPlane.material = groundMat;	
	    var axis = new BABYLON.Vector3(1, 0, 0);
	    var angle = Math.PI / 2;
	    var quaternion = new BABYLON.Quaternion.RotationAxis(axis, angle);
	    myPlane.rotationQuaternion = quaternion;
	    myPlane.translate(BABYLON.Axis.Y, y, BABYLON.Space.WORLD);
	    
	    // store the plane using the y coordinate of the mesh (not the plane)
	    planes[y] = myPlane;	    
	}
    }
}

///////////////////////////////////////////////////////////////////////
//
// reset view
//
///////////////////////////////////////////////////////////////////////
function resetView(){

    // clear the canvas
    // TODO -- the standard way to clear the canvas does not work
    // so we are using a more brutal way
    card = document.getElementById("renderCard");
    card.innerHTML = '<canvas id="renderCanvas" style="height:100%; width:100%;"></canvas>'

    // clear the scene and all the mesh
    for (m in mesh){
	mesh[m].dispose();
    }
    for (dp in dpMesh){
	dpMesh[dp].dispose();
    }
    for (dp in dpEdgeMesh){
	dpEdgeMesh[dp].dispose();
    }
    for (op in opEdgeMesh){
	opEdgeMesh[op].dispose();
    }
    scene.dispose();
    
    
}

///////////////////////////////////////////////////////////////////////
//
// filter using sparql
// 
///////////////////////////////////////////////////////////////////////
function sparqlFilter(serverUri, multilayer){

    // get the sparql query
    sparqlQuery = document.getElementById("groundColor").value;

    // build the request
    req = {};
    req["command"] = "sparql";
    req["sparql"] = document.getElementById("sparql").value;    
    req["queryURI"] = document.getElementById("queryUriInput").value;    
    
    // do the request to the tarsier server
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

	    // analyze results of the query
	    console.log(data);
	    raiseList(data);			    
	}
    });
    
}

function raiseList(lst){

    // read colors
    getColors();

    // get the list of variables
    vList = []
    for (v in list["head"]["variables"]){
	vList.push(v);
    }
    
    // // for all the classes selected to be raised
    // // - check if they have been designed
    // // - increment the 'y' coordinate
    // for (var k in lastData["classes"]){
	
    // 	// check if it's enabled
    // 	if (document.getElementById(lastData["classes"][k] + "_enabled").checked){

    // 	    // check if it's present in the canvas
    // 	    if (lastData["classes"][k] in mesh){
    // 		sphere = mesh[lastData["classes"][k]];
    // 		if (up){
    // 		    sphere.position.y += planesGap;
    // 		    drawPlane(sphere.position.y - meshPlaneGap)
    // 		}
    // 		else {
    // 		    sphere.position.y -= planesGap;
    // 		    drawPlane(sphere.position.y - meshPlaneGap)
    // 		}
    // 	    }
    // 	}
    // }
    
    // // get all the individuals
    // for (var k in lastData["instances"]){
	
    // 	// check if it's enabled
    // 	if (document.getElementById(k + "_enabled").checked){

    // 	    // check if it's present in the canvas
    // 	    if (k in mesh){
    // 		// raise the sphere
    // 		sphere = mesh[k];		
    // 		if (up){
    // 		    sphere.position.y += planesGap;
    // 		}
    // 		else {
    // 		    sphere.position.y -= planesGap;
    // 		}

    // 		// cycle over data properties
    // 		for (dp in lastData["instances"][k]) {

    // 		    // check if raising the dp it's requested
    // 		    if (document.getElementById(dp + "_enabled").checked){

    // 			// raise the sphere
    // 			key1 = k + "_" + dp
    // 			key2 = key1 + "_EDGE"
    // 			if (key1 in dpMesh){
    // 			    dpsphere = dpMesh[key1]
    // 			    if (up)
    // 				dpsphere.position.y += planesGap;
    // 			    else dpsphere.position.y -= planesGap;

    // 			}					
    // 		    }
    // 		}
    // 		drawDataPropertiesEdges(k, lastData["instances"][k], sphere, greenMat);
    // 	    }
    // 	}
    // }

    // // re-draw all the object properties
    // console.log("[INFO] Re-drawing object properties");
    // drawObjectProperties();

    // // draw planes
    // drawPlanes();
    
}
