// variables
ws = null;
scene = null;
lastData = null;
mesh = {}
dpMesh = {}
dpEdgeMesh = {}
opEdgeMesh = {}

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
		newCell.innerHTML = '<input type="checkbox" value="" id="' + cName + '_enabled" checked>'
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
		newCell.innerHTML = '<input type="checkbox" value="" id="' + dpName + '_enabled" checked>'
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
		newCell.innerHTML = '<input type="checkbox" value="" id="' + opName + '_enabled" checked>'
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
		newCell.innerHTML = '<input type="checkbox" value="" id="' + iiName + '_enabled" checked>'
		newCell = newRow.insertCell(1);
		newCell.innerHTML = iiName;
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

	    // retrieve colors
	    document.getElementById("classesColor").value = myJson["extended"]["colors"]["classes"];	   
	    document.getElementById("datapropColor").value = myJson["extended"]["colors"]["dataProperties"];
	    document.getElementById("objpropColor").value = myJson["extended"]["colors"]["objectProperties"];
	    document.getElementById("instancesColor").value = myJson["extended"]["colors"]["instances"];
	    
	    // open the file

	    // get the subscribe URI and fill the proper field
	    
	};
	fr.readAsText(file);	
    }
    
};

function draw(){

    // get the canvas
    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function(){
	
	// create a basic BJS Scene object
	var scene = new BABYLON.Scene(engine);
	scene.ambientColor = new BABYLON.Color3(1, 1, 1);

	// create the colors for:

	// - classes
	rgbOrangeColor = hexToRGB(document.getElementById("classesColor").value);
	var orangeMat = new BABYLON.StandardMaterial("orangeMat", scene);
	orangeMat.diffuseColor = new BABYLON.Color3(rgbOrangeColor[0], rgbOrangeColor[1], rgbOrangeColor[2]);	

	// - individuals
	rgbPurpleColor = hexToRGB(document.getElementById("instancesColor").value);
	var purpleMat = new BABYLON.StandardMaterial("purpleMat", scene);
	purpleMat.diffuseColor = new BABYLON.Color3(rgbPurpleColor[0], rgbPurpleColor[1], rgbPurpleColor[2]);	
	
	// - data properties
	rgbGreenColor = hexToRGB(document.getElementById("datapropColor").value);
	var greenMat = new BABYLON.StandardMaterial("greenMat", scene);
	greenMat.diffuseColor = new BABYLON.Color3(rgbGreenColor[0], rgbGreenColor[1], rgbGreenColor[2]);	
	
	// - object properties
	rgbBlueColor = hexToRGB(document.getElementById("objpropColor").value);
	var blueMat = new BABYLON.StandardMaterial("blueMat", scene);
	blueMat.diffuseColor = new BABYLON.Color3(rgbBlueColor[0], rgbBlueColor[1], rgbBlueColor[2]);

	// - object properties
	rgbGroundColor = hexToRGB(document.getElementById("groundColor").value);
	var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
	groundMat.diffuseColor = new BABYLON.Color3(rgbGroundColor[0], rgbGroundColor[1], rgbGroundColor[2]);

	// create a FreeCamera, and set its position (x,y,z)
	var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2,  Math.PI / 4, 5, BABYLON.Vector3.Zero(), scene)
	
	// target the camera to scene origin
	camera.setTarget(BABYLON.Vector3.Zero());
	
	// attach the camera to the canvas
	camera.attachControl(canvas, false);
	
	// create a basic light, aiming 0,1,0 - meaning, to the sky
	var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);
	   
	// create a plane
	var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
	groundMat.diffuseColor = new BABYLON.Color3(rgbGroundColor[0], rgbGroundColor[1], rgbGroundColor[2]);
	groundMat.alpha = 0.5;
	var myPlane = BABYLON.MeshBuilder.CreatePlane("myPlane", {width: 50, height: 50, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);	
	myPlane.material = groundMat;	
	console.log(myPlane);

	var axis = new BABYLON.Vector3(1, 0, 0);
	var angle = Math.PI / 2;
	var quaternion = new BABYLON.Quaternion.RotationAxis(axis, angle);
	myPlane.rotationQuaternion = quaternion;
	
	// draw classes
	n5 = Object.keys(lastData["classes"]).length;
	node_angle = 360 / n5;
	for (var k in lastData["classes"]){
	    // check if it's enabled
	    if (document.getElementById(lastData["classes"][k] + "_enabled").checked){	
		var sphere = BABYLON.Mesh.CreateSphere(lastData["classes"][k], 16, 1, scene);
		sphere.position.z = 5 * Math.sin(k*node_angle / 180*Math.PI);
		sphere.position.y = 1;
		sphere.position.x = 5 * Math.cos(k*node_angle / 180*Math.PI);
		sphere.material = orangeMat;

		// store the mesh in an Object using the URI as the key
		mesh[lastData["classes"][k]] = sphere;

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
	    if (document.getElementById(k + "_enabled").checked){	

		// TODO -- check if the individual has been already designed as a class
		// ex.: wot:Thing can be a class, but also an individual of the class owl:Class
		
		var sphere = BABYLON.Mesh.CreateSphere(k, 16, 1, scene);
		c += 1;
		sphere.position.z = 15 * Math.sin(c * node_angle / 180*Math.PI);
		sphere.position.x = 15 * Math.cos(c * node_angle / 180*Math.PI);
		sphere.position.y = 1;
		sphere.material = purpleMat;

		localOrigin = [sphere.position.x, sphere.position.y, sphere.position.z];
		
		// store the mesh in an Object using the URI as the key
		mesh[k] = sphere;
		
		// now it's time to draw its data properties
		// but only if they're enabled
		dpnsize = Object.keys(lastData["instances"][k]).length;
		dpnode_angle = 360 / dpnsize;

		cc = 0;
		for (dp in lastData["instances"][k]) {
		    if (document.getElementById(dp + "_enabled").checked){		
			
			cc += 1;
			
			// calculate positions
			
			// build a green sphere
			var sphere = BABYLON.Mesh.CreateSphere(dp, 16, 1, scene);
			sphere.position.x = localOrigin[0] + 2 * Math.sin(cc * dpnode_angle / 180*Math.PI);
			sphere.position.z = localOrigin[2] + 2 * Math.cos(cc * dpnode_angle / 180*Math.PI);
			sphere.position.y = 1;
			sphere.material = greenMat;
			
			// draw the edge
			var lines = BABYLON.Mesh.CreateLines("lines", [
		    	    new BABYLON.Vector3(localOrigin[0], localOrigin[1], localOrigin[2]),
			    new BABYLON.Vector3(sphere.position.x, sphere.position.y, sphere.position.z)], scene)
			lines.color = new BABYLON.Color3(rgbGreenColor[0], rgbGreenColor[1], rgbGreenColor[2]);
			
			// draw the label
			var zChar = makeTextPlane(lastData["instances"][k][dp], "white", 5 / 10);
			zChar.position = new BABYLON.Vector3(sphere.position.x, sphere.position.y, sphere.position.z);
			
			// store the sphere (as a key we use subj+prop)
			dpMesh[k + "_" + dp] = sphere;

			// store the edge (as a key we use subj+prop_EDGE)
			dpEdgeMesh[k + "_" + dp + "_EDGE"] = lines;

		    }
		}
	    }
	}
	drawObjectProperties();
		
	// return the created scene
	return scene;
    }
    
    // call the createScene function
    var scene = createScene();
    
    // run the render loop
    engine.runRenderLoop(function(){
	scene.render();
    });

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
    if (steps%2 === 0){
	bump_vector = math.range(0, (steps+2)/2-1, 1, true)._data
	bump_vector = bump_vector.concat(math.range((steps+2)/2-1, 0, -1, true)._data)
    } else { // if odd number:
	bump_vector = math.range(0, Math.floor(steps+2)/2, 1, false)._data
	bump_vector = bump_vector.concat(math.range(Math.floor(steps+2)/2, 0, -1, true)._data)
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
    for (var i=0; i<steps+2; i++){
	if (point1.position.y < point2.position.y){
	    points[i]["y"] -= bump_vector[i]*0.5
	} else {
	    points[i]["y"] += bump_vector[i]*0.5
	}
    }
    
    return points;

}

function selectAll(what, select){

    switch(what){
    case "classes":
	for (var k in lastData["classes"]){		
	    document.getElementById(lastData["classes"][k] + "_enabled").checked = select
	}
	break;
    case "objectProperties":
	for (var k in lastData["properties"]["object"]){		
	    document.getElementById(lastData["properties"]["object"][k] + "_enabled").checked = select
	}
	break;
    case "dataProperties":
	for (var k in lastData["properties"]["datatype"]){		
	    document.getElementById(lastData["properties"]["datatype"][k] + "_enabled").checked = select
	}
	break;
    case "instances":
	for (var k in lastData["instances"]){
	    document.getElementById(k + "_enabled").checked = select
	}
	break;
    }
        
}

function raise(up){

    // for all the classes selected to be raised
    // - check if they have been designed
    // - increment the 'y' coordinate
    for (var k in lastData["classes"]){
	
	// check if it's enabled
	if (document.getElementById(lastData["classes"][k] + "_enabled").checked){

	    // check if it's present in the canvas
	    if (lastData["classes"][k] in mesh){
		sphere = mesh[lastData["classes"][k]];
		if (up){
		    sphere.position.y += 3;
		}
		else {
		    sphere.position.y -= 3;
		}
	    }
	}
    }
    
    // get all the individuals
    for (var k in lastData["instances"]){
	
	// check if it's enabled
	if (document.getElementById(k + "_enabled").checked){

	    // check if it's present in the canvas
	    if (k in mesh){

		// raise the sphere
		sphere = mesh[k];		
		if (up){
		    sphere.position.y += 3;
		}
		else {
		    sphere.position.y -= 3;
		}

		// cycle over data properties
		for (dp in lastData["instances"][k]) {

		    // check if raising the dp it's requested
		    if (document.getElementById(dp + "_enabled").checked){

			// raise the sphere
			key1 = k + "_" + dp
			key2 = key1 + "_EDGE"
			if (key1 in dpMesh){
			    dpsphere = dpMesh[key1]
			    if (up)
				dpsphere.position.y += 3;
			    else dpsphere.position.y -= 3;

			}

			// delete and re-draw the edge
			if (key2 in dpEdgeMesh){
			    // draw the edge
			    var lines = BABYLON.Mesh.CreateLines("lines", [
		    		new BABYLON.Vector3(dpsphere.position.x, dpsphere.position.y, dpsphere.position.z),
				new BABYLON.Vector3(sphere.position.x, sphere.position.y, sphere.position.z)], scene)
			    lines.color = new BABYLON.Color3(rgbGreenColor[0], rgbGreenColor[1], rgbGreenColor[2]);
			    dpEdgeMesh[key2].dispose();
			    dpEdgeMesh[key2] = lines;
			}			
		    }
		}		
	    }
	}
    }

    // re-draw all the object properties
    drawObjectProperties();
}

function drawObjectProperties(){   

    // draw object properties
    console.log(lastData["properties"]["object"])
    for (var op in lastData["properties"]["object"]){
	
	// check if it's enabled
	if (document.getElementById(lastData["properties"]["object"][op] + "_enabled").checked){
	    
	    key = lastData["properties"]["object"][op]
	    console.log(key);
	    console.log(lastData["pvalues"]["object"][key]);
	    
	    // iterate over the statements with that property
	    for (statement in lastData["pvalues"]["object"][key]){
		
		// get the subject and object
		subj = lastData["pvalues"]["object"][key][statement]["s"]
		obj =  lastData["pvalues"]["object"][key][statement]["o"]		    

		// determine if both subject and object are enabled
		if (subj in mesh && obj in mesh){
		
		    // draw the edge
		    var lines = BABYLON.Mesh.CreateLines("lines", getCurvedEdge(mesh[subj], mesh[obj], 2, 10), scene)
		    lines.color = new BABYLON.Color3(rgbBlueColor[0], rgbBlueColor[1], rgbBlueColor[2]);
		    
		    // delete the old edge, if any
		    // we temporarily use the mesh named as "subj_pred_obj_EDGE"
		    k = subj + "_" + key  + "_" + obj
		    
		    // store the edge
		    if (k in opEdgeMesh){
			opEdgeMesh[k].dispose();
		    }
		    opEdgeMesh[k] = lines;
		}
		
	    }
	}
    }   
}

function resetPlanes(){

    // iterate over all the classes/individuals meshes
    for (m in mesh){
	mesh[m].position.y = 1;
    }

    // redraw all the data properties
    for (m in dpMesh){
	dpMesh[m].position.y = 1;
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
