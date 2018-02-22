// global variables
lastData = null;

// babylon objects
engine = null;
camera = null;
scene = null;

// mesh
mesh = {};
dpMesh = {};
dpEdgeMesh = {};
opEdgeMesh = {};
planes = {};
bez = []

// other settings
meshPlaneGap = 1;
planesGap = 10;
bump = 0;

// colors and materials
rgbGroundColor = null;
rgbClassColor = null;
rgbIndivColor = null;
rgbDpColor = null;
rgbOpColor = null;
rgbRdftypeColor = null;
indivMat = null;
classMat = null;
groundMat = null;
dpMat = null;
opMat = null;
rdftypeMat = null;

function sendRequest(serverUri, getAll){

    // build the request
    req = {};
    req["command"] = "info";
    req["queryURI"] = document.getElementById("queryUriInput").value;
    if (!(getAll)){
	req["sparql"] = document.getElementById("sparql").value;
    }
    
    $.ajax({
	url: serverUri,
	crossOrigin: true,
	method: 'POST',
	contentType: "application/json",
	data: JSON.stringify(req),	
	error: function(event){
	    console.log("[DEBUG] Connection failed!");
	    ab = document.getElementById("alertBox");
	    ab.className="alert alert-danger";
	    ab.innerHTML = "Connection failed!";
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

	    ab = document.getElementById("alertBox");
	    ab.className="alert alert-success";
	    ab.innerHTML = "Ready to plot graph!";

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

    ab = document.getElementById("alertBox");
    ab.className="alert alert-success";
    ab.innerHTML = "JSAP Loaded!";
    
};

function draw(){

    // reset meshes
    mesh = {};
    dpMesh = {};
    dpEdgeMesh = {};
    opEdgeMesh = {};

    // get the canvas
    var canvas = document.getElementById('renderCanvas');
    canvas.oncontextmenu = function (e) {
	e.preventDefault();
    };
    
    // load the 3D engine
    engine = new BABYLON.Engine(canvas, true);

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
	camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2,  Math.PI / 4, 5, BABYLON.Vector3.Zero(), scene)
	
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
	console.log(n5);
	console.log(typeof(n5));
	node_angle = 360 / n5;
	for (var k in lastData["classes"]){
	    // check if it's enabled
	    if (document.getElementById(lastData["classes"][k] + "_C_enabled").checked){	
		var sphere = BABYLON.Mesh.CreateSphere(lastData["classes"][k], lod, 1, scene);
		sphere.position.z = n5 * Math.sin(k*node_angle / 180*Math.PI);
		sphere.position.y = parseInt(meshPlaneGap);
		sphere.position.x = n5 * Math.cos(k*node_angle / 180*Math.PI);
		sphere.material = classMat;

		// store the mesh in an Object using the URI as the key
		mesh[lastData["classes"][k]] = sphere;
		sphere.statement = "<b>Class:</b>&nbsp;" + lastData["classes"][k];
		sphere.actionManager = new BABYLON.ActionManager(scene);
		sphere.actionManager.registerAction(
		    new BABYLON.ExecuteCodeAction(
			BABYLON.ActionManager.OnLeftPickTrigger,
			function(evt){
			    // Find the clicked mesh
			    var meshClicked = evt.meshUnderPointer;
			    ab = document.getElementById("alertBox");
			    ab.className="alert alert-success";
			    ab.innerHTML = meshClicked.statement;
			}
		    )
		);
		sphere.actionManager
		    .registerAction(
			new BABYLON.InterpolateValueAction(
			    BABYLON.ActionManager.OnRightPickTrigger,
			    sphere,
			    'visibility',
			    0.3,
			    1000
			)
		    ).then(
			new BABYLON.InterpolateValueAction(
			    BABYLON.ActionManager.OnRightPickTrigger,
			    sphere,
			    'visibility',
			    1.0,
			    1000
			)
		    );
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

		// TODO -- note: in this way we may experience problems if the number of
		// classes is equal to the number of individuals!
		var sphere = BABYLON.Mesh.CreateSphere(k, lod, 1, scene);
		c += 1;
		sphere.position.z = nsize * Math.sin(c * node_angle / 180*Math.PI);
		sphere.position.x = nsize * Math.cos(c * node_angle / 180*Math.PI);
		sphere.position.y = parseInt(meshPlaneGap);
		sphere.material = indivMat;
		
		// store the mesh in an Object using the URI as the key
		mesh[k] = sphere;

		// bind an action
		sphere.statement = "<b>Individual:</b>&nbsp;" + k;
		sphere.actionManager = new BABYLON.ActionManager(scene);
		sphere.actionManager.registerAction(
		    new BABYLON.ExecuteCodeAction(
			BABYLON.ActionManager.OnLeftPickTrigger,
			function(evt){
			    // Find the clicked mesh
			    var meshClicked = evt.meshUnderPointer;
			    ab = document.getElementById("alertBox");
			    ab.className="alert alert-success";
			    ab.innerHTML = meshClicked.statement;			    
			}
		    )
		);
		sphere.actionManager
		    .registerAction(
			new BABYLON.InterpolateValueAction(
			    BABYLON.ActionManager.OnRightPickTrigger,
			    sphere,
			    'visibility',
			    0.3,
			    1000
			)
		    ).then(
			new BABYLON.InterpolateValueAction(
			    BABYLON.ActionManager.OnRightPickTrigger,
			    sphere,
			    'visibility',
			    1.0,
			    1000
			)
		    );
		
		drawDataProperties(k, lastData["instances"][k], sphere, dpMat);
		drawDataPropertiesEdges(k, lastData["instances"][k], sphere, dpMat);
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

    // confirm
    ab = document.getElementById("alertBox");
    ab.className="alert alert-success";
    ab.innerHTML = "Graph drawn!";


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
		drawDataPropertiesEdges(k, lastData["instances"][k], sphere, dpMat);
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

		// get the points
		sta_point = mesh[subj].position.clone();
		end_point = mesh[obj].position.clone();
		mid_point = sta_point.clone(); //  mesh[subj].position.clone().add(mesh[obj].position).divide(new BABYLON.Vector3(2,2,2));
		mid_point.y += bump;

		// draw the curve
		var quadraticBezierVectors = BABYLON.Curve3.CreateQuadraticBezier(sta_point, mid_point, end_point, 15);
		lines = BABYLON.Mesh.CreateLines("qbezier", quadraticBezierVectors.getPoints(), scene);
		lines.statement = sphere.statement = "<b>Subject:</b>&nbsp;" + subj + "<br><b>Property:</b>&nbsp;" + lastData["properties"]["object"][op] + "<br><b>Object:</b>&nbsp;" + obj;		    
		if (key === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"){
		    lines.color = rdftypeMat.diffuseColor;
		} else {
		    lines.color = opMat.diffuseColor;
		}

		lines.actionManager = new BABYLON.ActionManager(scene);
		lines.actionManager.registerAction(
		    new BABYLON.ExecuteCodeAction(
		    	BABYLON.ActionManager.OnLeftPickTrigger,
		    	function(evt){
		    	    // Find the clicked mesh
		    	    var meshClicked = evt.meshUnderPointer;
			    ab = document.getElementById("alertBox");
			    ab.className="alert alert-success";
			    ab.innerHTML = meshClicked.statement;
		    	}
		    )
		);
		lines.actionManager
		    .registerAction(
		    	new BABYLON.InterpolateValueAction(
		    	    BABYLON.ActionManager.OnRightPickTrigger,
		    	    lines,
		    	    'alpha',
		    	    0.3,
		    	    1000
		    	)
		    ).then(
		    	new BABYLON.InterpolateValueAction(
		    	    BABYLON.ActionManager.OnRightPickTrigger,
		    	    lines,
		    	    'alpha',
		    	    1.0,
		    	    1000
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

    // redraw planes
    drawPlanes();
    
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
	    sphere.statement = "<b>Subject:</b>&nbsp;" + subj +"<br><b>Property:</b>&nbsp;" + dp + "<br><b>Value:</b>&nbsp;" + lastData["instances"][subj][dp];
	    
	    sphere.material = material;

	    // attach an action to the sphere
	    sphere.actionManager = new BABYLON.ActionManager(scene);
	    sphere.actionManager.registerAction(
		new BABYLON.ExecuteCodeAction(
		    BABYLON.ActionManager.OnLeftPickTrigger,
		    function(evt){
			// Find the clicked mesh
			var meshClicked = evt.meshUnderPointer;
			ab = document.getElementById("alertBox");
			ab.className="alert alert-success";
			ab.innerHTML = meshClicked.statement;			
		    }
		)
	    );
	    sphere.actionManager
		.registerAction(
		    new BABYLON.InterpolateValueAction(
			BABYLON.ActionManager.OnRightPickTrigger,
			sphere,
			'visibility',
			0.3,
			1000
		    )
		).then(
		    new BABYLON.InterpolateValueAction(
			BABYLON.ActionManager.OnRightPickTrigger,
			sphere,
			'visibility',
			1.0,
			1000
		    )
		);
	    
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
	lines.color = new BABYLON.Color3(rgbDpColor[0], rgbDpColor[1], rgbDpColor[2]);
	lines.statement = "<b>Subject:</b> " + subj + "<br><b>Predicate</b>: " + dp + "<br><b>Object:</b> " + lastData["instances"][subj][dp];
	lines.actionManager = new BABYLON.ActionManager(scene);
	lines.actionManager.registerAction(
	    new BABYLON.ExecuteCodeAction(
		BABYLON.ActionManager.OnLeftPickTrigger,
		function(evt){
		    // Find the clicked mesh
		    var meshClicked = evt.meshUnderPointer;
		    ab = document.getElementById("alertBox");
		    ab.className="alert alert-success";
		    ab.innerHTML = meshClicked.statement;
		}
	    )
	);
	lines.actionManager
	    .registerAction(
		new BABYLON.InterpolateValueAction(
		    BABYLON.ActionManager.OnRightPickTrigger,
		    lines,
		    'alpha',
		    0.3,
		    1000
		)
	    ).then(
		new BABYLON.InterpolateValueAction(
		    BABYLON.ActionManager.OnRightPickTrigger,
		    lines,
		    'alpha',
		    1.0,
		    1000
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
    rgbClassColor = hexToRGB(document.getElementById("classesColor").value);
    classMat = new BABYLON.StandardMaterial("classMat", scene);
    classMat.diffuseColor = new BABYLON.Color3(rgbClassColor[0], rgbClassColor[1], rgbClassColor[2]);	
    
    // - individuals
    rgbIndivColor = hexToRGB(document.getElementById("instancesColor").value);
    indivMat = new BABYLON.StandardMaterial("indivMat", scene);
    indivMat.diffuseColor = new BABYLON.Color3(rgbIndivColor[0], rgbIndivColor[1], rgbIndivColor[2]);	
    
    // - data properties
    rgbDpColor = hexToRGB(document.getElementById("datapropColor").value);
    dpMat = new BABYLON.StandardMaterial("dpMat", scene);
    dpMat.diffuseColor = new BABYLON.Color3(rgbDpColor[0], rgbDpColor[1], rgbDpColor[2]);	
    
    // - object properties
    rgbOpColor = hexToRGB(document.getElementById("objpropColor").value);
    opMat = new BABYLON.StandardMaterial("opMat", scene);
    opMat.diffuseColor = new BABYLON.Color3(rgbOpColor[0], rgbOpColor[1], rgbOpColor[2]);

    // - object properties
    rgbRdftypeColor = hexToRGB(document.getElementById("rdftypeColor").value);
    rdftypeMat = new BABYLON.StandardMaterial("rdftypeMat", scene);
    rdftypeMat.diffuseColor = new BABYLON.Color3(rgbRdftypeColor[0], rgbRdftypeColor[1], rgbRdftypeColor[2]);
    
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

    // determine plane size
    size = 3 * Math.max(Object.keys(lastData["instances"]).length, Object.keys(lastData["classes"]).length);
    
    // iterate over meshes
    for (m in mesh){
	
	// get the y coordinate of the mesh
	y = mesh[m].position.y - meshPlaneGap;

	// check if a plane already exists
	if (!(y in planes)){

	    // 3 - if needed, draw a plane
	    var myPlane = BABYLON.MeshBuilder.CreatePlane("myPlane", {width: size, height: size, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);	
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
	    raiseQueryResults(data, multilayer);
	    
	}
    });
    
}

///////////////////////////////////////////////////////////////////////
//
// screenshot
// 
///////////////////////////////////////////////////////////////////////
function screenshot(){

    console.log("[INFO] screenshot() invoked;");
    canvas = document.getElementById('renderCanvas');    
    BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, camera,  {width: canvas.width, height: canvas.height});
    
}

///////////////////////////////////////////////////////////////////////
//
// raiseNodes
// 
///////////////////////////////////////////////////////////////////////
function raiseQueryResults(results, multilayer){

    // debug
    console.log("[INFO] raiseNodes() invoked;");

    // read settings
    planesGap = parseInt(document.getElementById("planePlaneGap").value);
    
    // memory of raised objects
    raised = []
    
    // get the list of variables
    variables = results["head"]["vars"]

    // iterate over the results
    for (r in results["results"]["bindings"]){

	// iterate over the variables
	currentBinding = results["results"]["bindings"][r]
	for (v in variables){
	    if (variables[v] in currentBinding){

		// check if it is an URI
		if (currentBinding[variables[v]]["type"] === "uri"){

		    // retrieve the mesh -- check between both classes and instances
		    k = currentBinding[variables[v]]["value"]
		    if (k in mesh){		    
			
			if (! (raised.includes(k))){
			    
			    console.log("Raising " + k + " to layer " + v);
			    console.log(raised);
			    m = mesh[k]
			    
			    // raise the mesh (check if multilayer)
			    new_y = null;
			    console.log(multilayer);
			    if (multilayer){
				m.position.y += planesGap * (parseInt(v)+1);
				new_y = m.position.y
			    } else {
				m.position.y += planesGap;
				new_y = m.position.y
			    }

			    // iterate over data properties
			    for (dp in lastData["instances"][k]) {

				// raise the sphere
				key1 = k + "_" + dp
				console.log(key1)
				// key2 = key1 + "_EDGE"
				if (key1 in dpMesh){
				    dpsphere = dpMesh[key1];
				    dpsphere.position.y = new_y;
				}					

			    }
			    drawDataPropertiesEdges(k, lastData["instances"][k], m, dpMat);

			    // save this!
			    raised.push(currentBinding[variables[v]]["value"]);
			}			
		    }		    		    
		}
	    }
	}	
    }

    // redraw object properties
    drawObjectProperties();

    // redraw planes
    drawPlanes();
    
}

///////////////////////////////////////////////////////////////////////
//
// help
// 
///////////////////////////////////////////////////////////////////////

function help(t){

    // TODO: add other help messages here.
    
    switch(t){
    case "filter":
	alert("Input a SPARQL query. Results will be put on a new layer (if you click on Filter).\nThe multi-layer function will draw one layer for every new variable.");
	break;
    }
    
}

///////////////////////////////////////////////////////////////////////
//
// move camera
// 
///////////////////////////////////////////////////////////////////////

function moveCamera(direction, step){

    console.log("[INFO] moveCamera() invoked!");

    // get the old position
    p = camera.position.clone();
    
    switch(direction){
	
    case "up":
	p.y += step;
	break;    
    case "down":
	p.y -= step;
	break;
    case "left":
	p.x -= step;
	break;
    case "right":
	p.x += step;
	break;
    }

    // move the camera
    camera.setPosition(p);
    
}
