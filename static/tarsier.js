// Global variables
lastData = null;

// babylon objects
engine = null;
camera = null;
scene = null;
advancedTexture = null;

// mesh
mesh = {};
dpMesh = {};
dpEdgeMesh = {};
opEdgeMesh = {};
planes = {};
bez = []

// diameters
classes_radius = 0;
resources_radius = 0;
bnodes_radius = 0;

// other settings
meshPlaneGap = 1;
planesGap = 10;
bump = 0;

// colors and materials
rgbGroundColor = null;
rgbClassColor = null;
rgbIndivColor = null;
rgbBnodeColor = null;
rgbDpColor = null;
rgbOpColor = null;
rgbRdftypeColor = null;
indivMat = null;
bnodeMat = null;
classMat = null;
groundMat = null;
dpMat = null;
opMat = null;
rdftypeMat = null;

// session ID
sessionID = null;
myYAML = null;

function sendRequest(serverUri, getAll){


    // Disable plot field
    document.getElementById("plotButton").classList.add("disabled");
    
    // build the request
    req = {};
    req["command"] = "info";
    req["endpoint"] = {
	"url": document.getElementById("queryUriInput").value,
	"httpVerb": document.getElementById("queryVerbInput").value,
	"httpHeaders": document.getElementById("queryHeadersInput").value,
	"queryPrefix": document.getElementById("queryPrefixInput").value
    }
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

	    // store data
	    lastData = data;
	    sessionID = lastData["sessionID"];

	    // get all the tables
	    iis = document.getElementById("resourcesTable");
	    opt = document.getElementById("objectPropertiesTable");
	    dpt = document.getElementById("dataPropertiesTable");
	    clt = document.getElementById("classesTable");
	    bln = document.getElementById("bnodesTable");
	    llt = document.getElementById("literalsTable");
	    
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
	    for (ii in data["resources"]){
		iiName = ii;
		newRow = iis.insertRow(-1);
		newCell = newRow.insertCell(0);		
		newCell.innerHTML = '<input type="checkbox" value="" id="' + iiName + '_I_enabled" checked>'
		newCell = newRow.insertCell(1);
		newCell.innerHTML = iiName;
	    }
	    
	    // blank nodes
	    while(bln.rows.length > 0) {
		bln.deleteRow(-1);
	    };
	    for (b in data["bnodes"]){
		bName = b
		newRow = bln.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.innerHTML = '<input type="checkbox" value="" id="' + bName + '_B_enabled" checked>'
		newCell = newRow.insertCell(1);
		newCell.innerHTML = bName;
	    }

	    // literals
	    while(llt.rows.length > 0) {
		llt.deleteRow(-1);
	    };
	    for (b in data["literals"]){
		lName = data["literals"][b];		
		newRow = llt.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.innerHTML = '<input type="checkbox" value="" id="' + lName + '_L_enabled" checked>'
		newCell = newRow.insertCell(1);
		newCell.innerHTML = lName;
	    }

	    ab = document.getElementById("alertBox");
	    ab.className="alert alert-success";
	    ab.innerHTML = "Ready to plot graph!";

	}
    });

    // Enable plot field
    document.getElementById("plotButton").classList.remove("disabled");

    
}

function loadEndpointConf(name){

    console.log(myYAML["endpoints"][name]);

    // load the uri
    document.getElementById("queryUriInput").value = myYAML["endpoints"][name]["host"]

    // load headers
    if (myYAML["endpoints"][name]["headers"] === null)
	document.getElementById("queryHeadersInput").value = ""
    else
	document.getElementById("queryHeadersInput").value = myYAML["endpoints"][name]["headers"]

    // load the verb    
    document.getElementById("queryVerbInput").value = myYAML["endpoints"][name]["verb"]

    // load the prefix
    if (myYAML["endpoints"][name]["queryPrefix"] === null)
	document.getElementById("queryPrefixInput").value = ""
    else
    	document.getElementById("queryPrefixInput").value = myYAML["endpoints"][name]["queryPrefix"]
    
}

function loadQuery(q){
    document.getElementById("sparql").value = myYAML["queries"][q]["sparql"]
}

function loadYAML(){

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
	    //myJson = JSON.parse(decodedData);
	    console.log("Reading YAML file");
	    myYAML = jsyaml.load(decodedData);
	    
	    ul = document.getElementById("confDropdown");
	    for (q in myYAML["endpoints"]){
		li = document.createElement("li");			
		li.setAttribute("id", q);
		li.innerHTML = q;
		li.setAttribute("onclick", "javascript:loadEndpointConf('" + q + "');");
		ul.appendChild(li);
	    };

	    ul = document.getElementById("queryDropdown");
	    for (q in myYAML["queries"]){
		li = document.createElement("li");			
		li.setAttribute("id", q);
		li.innerHTML = q;
		li.setAttribute("onclick", "javascript:loadQuery('" + q + "');");
		ul.appendChild(li);
	    };
	    
	    // retrieve colors
	    document.getElementById("classesColor").value = myYAML["colors"]["classes"];	   
	    document.getElementById("datapropColor").value = myYAML["colors"]["dataProperties"];
	    document.getElementById("objpropColor").value = myYAML["colors"]["objectProperties"];
	    document.getElementById("rdftypeColor").value = myYAML["colors"]["rdftype"];
	    document.getElementById("bnodesColor").value = myYAML["colors"]["bnodes"];
	    document.getElementById("instancesColor").value = myYAML["colors"]["instances"];

	    // other settings
	    document.getElementById("planePlaneGap").value = myYAML["values"]["planesGap"];	   
	    document.getElementById("meshPlaneGap").value = myYAML["values"]["meshPlaneGap"];
	    document.getElementById("lod").value = myYAML["values"]["LOD"];
	    document.getElementById("bump").value = myYAML["values"]["bump"];
	    
	    // open the file

	    // get the subscribe URI and fill the proper field
	    
	};
	fr.readAsText(file);	
    }

    ab = document.getElementById("alertBox");
    ab.className="alert alert-success";
    ab.innerHTML = "YAML Loaded!";
    
};

function draw(){

    // start time
    var t0 = performance.now();
    
    // reset meshes
    mesh = {};
    dpMesh = {};
    dpEdgeMesh = {};
    opEdgeMesh = {};
    planes = {};

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

	// advanced texture
	advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");

	
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
	
	// draw classes
	n5 = Object.keys(lastData["classes"]).length;
	classes_radius = 2 * n5 / Math.PI;
	node_angle = 360 / n5;
	for (var k in lastData["classes"]){
	    // check if it's enabled
	    if (document.getElementById(lastData["classes"][k] + "_C_enabled").checked){	
		var sphere = BABYLON.Mesh.CreateSphere(lastData["classes"][k], lod, 1, scene);
		sphere.position.z = classes_radius * Math.sin(k*node_angle / 180*Math.PI);
		sphere.position.y = parseInt(meshPlaneGap);
		sphere.position.x = classes_radius * Math.cos(k*node_angle / 180*Math.PI);
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
	
	// draw individuals
	// nsize = Object.keys(lastData["resources"]).length;
	nsize = lastData["individuals_num"];
	node_angle = 360 / nsize;
	resources_radius = 2 * nsize / Math.PI;

	// radius must be greater than classes_radius + 6
	resources_radius = Math.max(resources_radius, classes_radius+6);
	
	c = 0;
	for (var k in lastData["resources"]){

	    // check if it is an individual
	    if (!(lastData["resources"][k]["drawAsRes"])){
		continue;
	    }
	    
	    // check if it's enabled
	    if (document.getElementById(k + "_I_enabled").checked){	

		// TODO -- check if the individual has been already designed as a class
		// ex.: wot:Thing can be a class, but also an individual of the class owl:Class

		// TODO -- note: in this way we may experience problems if the number of
		// classes is equal to the number of individuals!
		var sphere = BABYLON.Mesh.CreateSphere(k, lod, 1, scene);
		c += 1;
		sphere.position.z = resources_radius * Math.sin(c * node_angle / 180*Math.PI);
		sphere.position.x = resources_radius * Math.cos(c * node_angle / 180*Math.PI);
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
		
		drawDataProperties(k, lastData["resources"][k], sphere, dpMat, "individual");
		drawDataPropertiesEdges(k, lastData["resources"][k], sphere, dpMat, "individual");
	    }	    
	}


	// draw bnodes
	nsize = Object.keys(lastData["bnodes"]).length;
	node_angle = 360 / nsize;
	bnodes_radius = nsize / Math.PI;

	// radius must be greater than resources_radius + 6
	bnodes_radius = Math.max(resources_radius+6, bnodes_radius);
	
	for (var k in lastData["bnodes"]){

	    // check if it's enabled
	    if (document.getElementById(k + "_B_enabled").checked){	

		// TODO -- check if the individual has been already designed as a class
		// ex.: wot:Thing can be a class, but also an individual of the class owl:Class

		// TODO -- note: in this way we may experience problems if the number of
		// classes is equal to the number of individuals!
		var sphere = BABYLON.Mesh.CreateSphere(k, lod, 1, scene);
		c += 1;
		nsize = Object.keys(lastData["bnodes"]).length;
		sphere.position.z = bnodes_radius * Math.sin(c * node_angle / 180*Math.PI);
		sphere.position.x = bnodes_radius * Math.cos(c * node_angle / 180*Math.PI);
		sphere.position.y = parseInt(meshPlaneGap);
		sphere.material = bnodeMat;
		
		// store the mesh in an Object using the URI as the key
		mesh[k] = sphere;

		// bind an action
		sphere.statement = "<b>BNode:</b>&nbsp;" + k;
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
		
		drawDataProperties(k, lastData["bnodes"][k], sphere, dpMat, "bnode");
		drawDataPropertiesEdges(k, lastData["bnodes"][k], sphere, dpMat, "bnode");
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

    // end time
    var t1 = performance.now();
    
    // confirm
    ab = document.getElementById("alertBox");
    ab.className="alert alert-success";
    ab.innerHTML = "Graph drawn in " + (t1-t0) + " ms !";

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
    case "resources":
	for (var k in lastData["resources"]){
	    document.getElementById(k + "_I_enabled").checked = select
	}
	break;
    case "bnodes":
	for (var k in lastData["bnodes"]){		
	    document.getElementById(lastData["bnodes"][k] + "_B_enabled").checked = select
	}
	break;
    case "literals":
	for (var k in lastData["literals"]){		
	    document.getElementById(lastData["literals"][k] + "_L_enabled").checked = select
	}
	break;

    }
    
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
	    s = lastData["pvalues"]["object"][key][statement]["s"]
	    o =  lastData["pvalues"]["object"][key][statement]["o"]
	    p = lastData["properties"]["object"][op]

	    // determine if both subject and object are both drawn
	    if (s in mesh && o in mesh){

		// get the points
		sta_point = mesh[s].position.clone();
		end_point = mesh[o].position.clone();
		mid_point = sta_point.clone(); //  mesh[subj].position.clone().add(mesh[obj].position).divide(new BABYLON.Vector3(2,2,2));
		mid_point.y += bump;

		// draw the curve
		var quadraticBezierVectors = BABYLON.Curve3.CreateQuadraticBezier(sta_point, mid_point, end_point, 15);
		lines = BABYLON.Mesh.CreateLines("qbezier", quadraticBezierVectors.getPoints(), scene);
		lines.statement  = "<b>Subject:</b>&nbsp;" + s + "<br><b>Property:</b>&nbsp;" + p + "<br><b>Object:</b>&nbsp;" + o;		    
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

		// delete the old edge if any, and add the new one
		if (p in opEdgeMesh){
		    if (s in opEdgeMesh[p]){
			if (o in opEdgeMesh[p][s])
			    opEdgeMesh[p][s][o].dispose();			
		    }
		    else{
			opEdgeMesh[p][s] = {};
		    }
		}
		else{
		    opEdgeMesh[p] = {};
		    opEdgeMesh[p][s] = {};		    
		}
		opEdgeMesh[p][s][o] = lines;


		
	    }	    
	}
    }   
}

function resetPlanes(){

    // iterate over all the classes/individuals meshes
    for (m in mesh){
	mesh[m].position.y = meshPlaneGap;
    }

    // redraw all the data properties
    for (p in dpMesh){
	for (s in dpMesh[p]){
	    for (o in dpMesh[p][s]){

		// move the data property sphere
		dpMesh[p][s][o].position.y = meshPlaneGap;

		// remove the data property edges
		//dpEdgeMesh[p][s][o].dispose();
		
	    }
	}
    }
    drawAllDataPropertiesEdges();
    
    // redraw object properties
    drawObjectProperties();

    // redraw planes
    drawPlanes();
    
}


///////////////////////////////////////////////////////////////////////
//
// draw data properties 
//
///////////////////////////////////////////////////////////////////////

function drawDataProperties(subj, subj_dict, subj_mesh, material, s_type)
{
    // log
    console.log("[DEBUG] drawDataProperties() invoked!");
    
    // determine the local origin based on the subject of the triple
    localOrigin = [subj_mesh.position.x, subj_mesh.position.y, subj_mesh.position.z]
    
    // determine positions
    dpnsize = 0
    for (dp in subj_dict["statements"]) {
	switch(s_type){
	case "individual":
	    o = lastData["resources"][subj]["statements"][dp];
	    dpnsize += lastData["resources"][subj]["statements"][dp].length;
	    break;
	case "bnode":
	    o = lastData["bnodes"][subj]["statements"][dp];
	    dpnsize += lastData["bnodes"][subj]["statements"][dp].length;
	    break;
	};
    }
    dpnode_angle = 360 / dpnsize;

    // iterate over the data properties
    cc = 0;
    for (dp in subj_dict["statements"]) {

	// check if enabled
	if (document.getElementById(dp + "_D_enabled").checked){		
	    
	    // get s, p and o
	    s = subj;
	    p = dp;
	    o = null;
	    var k = null;
	    
	    switch(s_type){
	    case "individual":
		// o = lastData["resources"][subj]["statements"][dp];
		k = "resources"
		break;
	    case "bnode":
		// o = lastData["bnodes"][subj]["statements"][dp];
		k = "bnodes"
		break;
	    };

	    for (ovalue in lastData[k][subj]["statements"][dp]){
		o = lastData[k][subj]["statements"][dp][ovalue];
		console.log(o);
    		// delete old sphere and edge, if any
    		if (p in dpMesh){
    		    if (s in dpMesh[p]){
    			if (o in dpMesh[p][s]){
    			    dpMesh[p][s][o].dispose();
    			}
    		    }
    		}
    		
    		// build a green sphere
    		var sphere = BABYLON.Mesh.CreateSphere(dp, lod, 0.5, scene);
    		sphere.position.x = localOrigin[0] + 1 * Math.sin(cc * dpnode_angle / 180*Math.PI);
    		sphere.position.z = localOrigin[2] + 1 * Math.cos(cc * dpnode_angle / 180*Math.PI);
    		sphere.position.y = subj_mesh.position.y;
		
    		// bind a statement to the sphere
    		sphere.statement = "<b>Subject:</b>&nbsp;" + s +"<br><b>Property:</b>&nbsp;" + p + "<br><b>Value:</b>&nbsp;" + o;
		
    		// bind a material to the sphere
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
		
    		// store the sphere in a dictionary
    		// the main key of the dictionary is the data property,
    		// then we have another key for the subject
    		// and a third level for the value of that property
    		if (!(p in dpMesh)){
    		    dpMesh[p] = {}		
    		}
    		if (!(s in dpMesh[p])){
    		    dpMesh[p][s] = {}
    		}
    		dpMesh[p][s][o] = sphere;
		
    		// increment cc
    		cc += 1;
	    }	    
	}
    }
}

///////////////////////////////////////////////////////////////////////
//
// draw data properties edges
//
///////////////////////////////////////////////////////////////////////

function drawDataPropertiesEdges(subj, subj_dict, subj_mesh, material, s_type){

    // log
    console.log("[INFO] drawDataPropertiesEdges invoked");
    
    // determine the local origin based on the subject of the triple
    localOrigin = [subj_mesh.position.x, subj_mesh.position.y, subj_mesh.position.z]
    
    // iterate over the data properties
    for (dp in subj_dict["statements"]) {

	// check if it is enabled
	if (document.getElementById(dp + "_D_enabled").checked){
	    
	    // get s, p and o
	    s = subj;
	    p = dp;
	    var k = null;
	    o = null;
	    switch(s_type){
	    case "individual":
		k = "resources";
		o = lastData["resources"][subj]["statements"][dp];
		break;
	    case "bnode":
		k = "bnodes";
		o = lastData["bnodes"][subj]["statements"][dp];
		break;
	    };
	    
	    for (ovalue in lastData[k][subj]["statements"][dp]){

		o = lastData[k][subj]["statements"][dp][ovalue];
		console.log(o);
		
		// delete old edge, if any
		if (p in dpEdgeMesh){
		    if (s in dpEdgeMesh[p]){
			if (o in dpEdgeMesh[p][s]){
			    dpEdgeMesh[p][s][o].dispose();
			}
		    }
		}
		
		// get the object sphere
		sphere = dpMesh[p][s][o];
		
		// draw the edge
		var lines = BABYLON.Mesh.CreateLines("lines", [
		    new BABYLON.Vector3(localOrigin[0], localOrigin[1], localOrigin[2]),
		    new BABYLON.Vector3(sphere.position.x, sphere.position.y, sphere.position.z)], scene)
		lines.color = new BABYLON.Color3(rgbDpColor[0], rgbDpColor[1], rgbDpColor[2]);
		switch(s_type){
		case "individual":
		    lines.statement = "<b>Subject:</b> " + subj + "<br><b>Predicate</b>: " + dp + "<br><b>Object:</b> " + lastData["resources"][subj][dp];
		    break;
		case "bnode":
		    lines.statement = "<b>Subject:</b> " + subj + "<br><b>Predicate</b>: " + dp + "<br><b>Object:</b> " + lastData["bnodes"][subj][dp];
		    break;
		};
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

		// store the sphere in a dictionary
		// the main key of the dictionary is the data property,
		// then we have another key for the subject
		// and a third level for the value of that property
		if (!(p in dpEdgeMesh)){
		    dpEdgeMesh[p] = {}		
		}
		if (!(s in dpEdgeMesh[p])){
		    dpEdgeMesh[p][s] = {}
		}	    
		dpEdgeMesh[p][s][o] = lines;
	    }
	}
    }
}



function drawAllDataPropertiesEdges(){

    // log
    console.log("[INFO] drawDataPropertiesEdges invoked");

    // iterate over data properties
    for (p in dpMesh){
	for (s in dpMesh[p]){
	    for (o in dpMesh[p][s]){

		// erase the old one
		dpEdgeMesh[p][s][o].dispose();

		// draw a new one
		try {
		    drawDataPropertiesEdges(s, lastData["resources"][s], mesh[s], dpMat, "individual")
		} catch(err) {
		    drawDataPropertiesEdges(s, lastData["bnodes"][s], mesh[s], dpMat, "bnode")
		}
	    }
	}
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

    // - bnode
    rgbBnodeColor = hexToRGB(document.getElementById("bnodesColor").value);
    bnodeMat = new BABYLON.StandardMaterial("bnodeMat", scene);
    bnodeMat.diffuseColor = new BABYLON.Color3(rgbBnodeColor[0], rgbBnodeColor[1], rgbBnodeColor[2]);	
    
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
    
    // determine plane size
    size = 3 + (bnodes_radius * 2);

    // initialize needed planes
    var neededPlanes = []
    
    // iterate over meshes
    for (m in mesh){
	
	// get the y coordinate of the plane below the mesh
	y = mesh[m].position.y - meshPlaneGap;

	// check if a plane already exists
	if (!(neededPlanes.includes(y))){

	    // store the plane using the y coordinate of the mesh (not the plane)
	    neededPlanes.push(y);
	}
    }

    // do the same with data properties
    for (p in dpMesh){
	for (s in dpMesh[p]){
	    for (o in dpMesh[p][s]){

		// get the coordinates
		y = dpMesh[p][s][o].position.y - meshPlaneGap

		// check if a plane already exists
		if (!(neededPlanes.includes(y))){
		    
		    // store the plane using the y coordinate of the mesh (not the plane)
		    neededPlanes.push(y);
		}	
	    }
	}	   
    }
    
    // delete unneeded planes
    // iterate over the existing planes and, if they're not in needed planes we delete them
    for (p in planes){

    	if (!(neededPlanes.includes(parseInt(p)))){
	    
    	    // delete the plane, its label and the text of the label
    	    planes[p]["mesh"].dispose()
	    planes[p]["labelmesh"].dispose()
	    planes[p]["textmesh"].dispose()
    	    delete planes[p];

    	    // delete the form field for the name
    	    ind = "nameOfPlane" + p;
    	    oldField = document.getElementById(ind);
    	    oldField.remove();
	    
    	}
    }

    // create missing planes
    for (p in neededPlanes){
    	if (!(neededPlanes[p] in planes)){

    	    // draw a plane
    	    var myPlane = BABYLON.MeshBuilder.CreatePlane("myPlane", {width: size, height: size, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);	
    	    myPlane.material = groundMat;	
    	    var axis = new BABYLON.Vector3(1, 0, 0);
    	    var angle = Math.PI / 2;
    	    var quaternion = new BABYLON.Quaternion.RotationAxis(axis, angle);
    	    myPlane.rotationQuaternion = quaternion;
    	    myPlane.translate(BABYLON.Axis.Y, neededPlanes[p], BABYLON.Space.WORLD);
    	    planes[neededPlanes[p]] = {}
	    planes[neededPlanes[p]]["mesh"] = myPlane;
	    planes[neededPlanes[p]]["name"] = "plane y=" + neededPlanes[p];

	    // create a text mesh
	    var label = new BABYLON.GUI.Rectangle("label for " + myPlane.name);
	    label.background = "black"
	    label.height = "20px";
	    label.alpha = 0.5;
	    label.width = "100px";
	    label.cornerRadius = 20;
	    label.thickness = 1;
	    label.linkOffsetY = 10;
	    advancedTexture.addControl(label); 
	    label.linkWithMesh(myPlane);
	    planes[neededPlanes[p]]["labelmesh"] = label;
	    
	    var text1 = new BABYLON.GUI.TextBlock();
	    text1.text = planes[neededPlanes[p]]["name"];
	    text1.color = "white";
	    label.addControl(text1);
	    planes[neededPlanes[p]]["textmesh"] = text1;
		        	   
    	}
    }

    // delete all the form fields and build them
    for (k in Object.keys(planes)){
	try{
	    planes[k]["field"].remove()
	} catch(err){}
    }
    pn = document.getElementById("planeNames");
    pn.innerHTML = "";

    for (k in planes){
	
	// add a form field for the name
    	pn = document.getElementById("planeNames");

 	// create a label
    	pf = document.createElement("LABEL");
	pff = document.createTextNode("Plane at y: " + k);
	pf.appendChild(pff);
	pn.appendChild(pf);

	// add a new line
    	pf = document.createElement("BR");
	pn.appendChild(pf);
	
	// create a text field
    	pf = document.createElement("INPUT");
    	pf.setAttribute("type", "text");
    	pf.setAttribute("value", planes[k]["name"]);
    	pf.id = "nameOfPlane" + k
    	pn.appendChild(pf);	
	planes[k]["field"] = pf

	// add a new line
    	pf = document.createElement("BR");
	pn.appendChild(pf);
	
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
    req["sessionID"] = sessionID;
    
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

	console.log(r);
	
	// iterate over the variables
	currentBinding = results["results"]["bindings"][r]
	for (v in variables){
	    console.log("VARIABLE")
	    console.log(v)
	    console.log(variables[v])
	    console.log("CURRENT BINDING")
	    console.log(currentBinding)

	    if (variables[v] in currentBinding){

		console.log("CI SONO")

		// retrieve the mesh -- check between both classes and instances
		k = currentBinding[variables[v]]["value"]
		console.log(k)
		if (k in mesh){
		    console.log("LA MESH CE")
		    
		    if (! (raised.includes(k))){
			
			m = mesh[k]
			
			// raise the mesh (check if multilayer)
			new_y = null;
			if (multilayer){
			    m.position.y += planesGap * (parseInt(v)+1);
			    new_y = m.position.y
			} else {
			    m.position.y += planesGap;
			    new_y = m.position.y
			}
			console.log(m)

			// check if it is an URI or BNODE and re-draw data properties edges
			if (currentBinding[variables[v]]["type"] === "uri"){
			    console.log("URI")
			    console.log(lastData["resources"][k])
			    drawDataProperties(k, lastData["resources"][k], m, dpMat, "individual");
			    drawDataPropertiesEdges(k, lastData["resources"][k], m, dpMat, "individual");
			} else if (currentBinding[variables[v]]["type"] === "bnode"){
			    console.log("BNODE")
			    drawDataProperties(k, lastData["bnodes"][k], m, dpMat, "bnode");
			    drawDataPropertiesEdges(k, lastData["bnodes"][k], m, dpMat, "bnode");
			}
			console.log("END")
			
			// // check if it is an URI or BNODE and re-draw data properties edges
			// if (currentBinding[variables[v]]["type"] === "uri"){
			//     console.log("URI")
			//     drawDataPropertiesEdges(k, lastData["resources"][k], m, dpMat, "individual");
			// } else if (currentBinding[variables[v]]["type"] === "bnode"){
			//     console.log("BNODE")
			//     drawDataPropertiesEdges(k, lastData["bnodes"][k], m, dpMat, "bnode");
			// }
			// console.log("END")
			
			// save this!
			raised.push(currentBinding[variables[v]]["value"]);
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

///////////////////////////////////////////////////////////////////////
//
// raise Object Properties
// 
///////////////////////////////////////////////////////////////////////

function raiseOp(how){

    // read colors
    getColors();

    // memory of raised objects
    raised = []
       
    // cycle over op
    for (var k in lastData["properties"]["object"]){

	// for every *selected* op
	if (document.getElementById(lastData["properties"]["object"][k] + "_O_enabled").checked){
	    
	    // iterate over the statements with that property
	    key = lastData["properties"]["object"][k];
	    p = lastData["pvalues"]["object"][key];
	    for (statement in p){

		// get the subject and object
		s = p[statement]["s"]
		o = p[statement]["o"]		    
		
		// raise the object if sto, raise the subject if !sto
		switch(how){
		    
		case "StoO":
		    
		    // if the mesh exists and has not been already raised
		    // by this function call, then raise it
		    if ((o in mesh) && !(raised.includes(o))){
			sphere = mesh[o];		
			sphere.position.y += planesGap;
			raised.push(o);
		    }
		    break;
		    
		case "OtoS":
		    
		    // if the mesh exists and has not been already raised
		    // by this function call, then raise it
		    if ((s in mesh) && !(raised.includes(s))){			
			sphere = mesh[s];		
			sphere.position.y += planesGap;
			raised.push(s);
		    }
		    break;

		case "SandO":

		    // if the mesh exists and has not been already raised
		    // by this function call, then raise it
		    if ((o in mesh) && !(raised.includes(o))){			
			sphere = mesh[o];		
			sphere.position.y += planesGap;
			raised.push(o);
		    }

		    // if the mesh exists and has not been already raised
		    // by this function call, then raise it
		    if ((s in mesh) && !(raised.includes(s))){			
			sphere = mesh[s];		
			sphere.position.y += planesGap;
			raised.push(s);
		    }
		    break;
		}
	    }
	}
    }

    // iterate over the raised mesh, and raise their data properties
    for (r in raised){
	// cycle over data properties
	k = raised[r]
	try {
	    drawDataProperties(k, lastData["resources"][k], mesh[k], dpMat, "individual");
	    drawDataPropertiesEdges(k, lastData["resources"][k], mesh[k], dpMat, "individual");
	} catch(err){
	    drawDataProperties(k, lastData["bnodes"][k], mesh[k], dpMat, "bnode");
	    drawDataPropertiesEdges(k, lastData["bnodes"][k], mesh[k], dpMat, "bnode");
	}
    }
        
    // re-draw all the object properties
    console.log("[INFO] Re-drawing object properties");
    drawObjectProperties();

    // draw planes
    drawPlanes();
    
}

function raiseClasses(classes, raise){

    // parameters:
    // - classes is a boolean used to determine whether we should move the classes or their instances
    // - raise is a boolean to decide if we have to raise or lower the selected meshes

    // initialize cache of raised objects    
    raised = [];
    
    // determine the movement direction and amount
    step = null;
    if (raise)
	step = planesGap;
    else step = -1 * planesGap;
    
    // iterate over the selected classes
    if (classes){
    
	for (var k in lastData["classes"]){
	    
	    // check if it's enabled
	    if (document.getElementById(lastData["classes"][k] + "_C_enabled").checked){

		// remember that we raised this
		raised.push(lastData["classes"][k]);
		
		// retrieve the mesh
		m = mesh[lastData["classes"][k]];
		
		// push it up
		m.position.y += step;		
		
	    }
	}
    }
    
    // if !classes -> draw the instances
    else {

	// iterate over rdf:type statements
	rdftype = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
	for (statement in lastData["pvalues"]["object"][rdftype]){

	    // get subject and object
	    subj = lastData["pvalues"]["object"][rdftype][statement]["s"]
	    obj =  lastData["pvalues"]["object"][rdftype][statement]["o"]
	    
	    // check if the related class is selected
	    if (document.getElementById(obj + "_C_enabled").checked){
		if (!(raised.includes(subj))){
		    mesh[subj].position.y += step;
		    raised.push(subj);
		}
	    }
	}

	// re-draw data properties
	for (r in raised){
	    // cycle over data properties
	    k = raised[r]
	    try{
		drawDataProperties(k, lastData["resources"][k], mesh[k], dpMat, "individual");
		drawDataPropertiesEdges(k, lastData["resources"][k], mesh[k], dpMat, "individual");
	    } catch(err){
		drawDataProperties(k, lastData["bnodes"][k], mesh[k], dpMat, "bnode");
		drawDataPropertiesEdges(k, lastData["bnodes"][k], mesh[k], dpMat, "bnode");
	    }
	}
        		
    }

    // re-draw all the object properties
    drawObjectProperties();
    
    // draw planes
    drawPlanes();
    
}

/////////////////////////////////////////////////////////////////////
//
// Show / Hide Data Properties
//
/////////////////////////////////////////////////////////////////////
function showHideDP(show){

    // debug
    console.log("[DEBUG] showHideDP() invoked");

    // set thew new visib (for show=false: 0, for show=true: 1)
    newVisib = 0;
    if (show){
	newVisib = 1;
    }
    
    // get the list of all the selected data properties
    for (var k in lastData["properties"]["datatype"]){
	console.log("Data property " + k);
	
	// check if it's enabled
	if (document.getElementById(lastData["properties"]["datatype"][k] + "_D_enabled").checked){

	    // iterate over the first level (i.e. subjects)
	    p = lastData["properties"]["datatype"][k]

	    // hide spheres
	    for (ms in dpMesh[p])
		for (mo in dpMesh[p][ms])
		    dpMesh[p][ms][mo].visibility = newVisib;

	    // hide edges
	    for (ms in dpEdgeMesh[p])
		for (mo in dpEdgeMesh[p][ms])
		    dpEdgeMesh[p][ms][mo].visibility = newVisib;
	}
    }    
}

/////////////////////////////////////////////////////////////////////
//
// Show / Hide Object Properties
//
/////////////////////////////////////////////////////////////////////

function showHideOP(show){

    // debug
    console.log("[DEBUG] showHideOP() invoked");

    // set the new visib (for show=false: 0, for show=true: 1)
    newVisib = 0;
    if (show){
	newVisib = 1;
    }
    
    // get the list of all the selected object properties
    for (var k in lastData["properties"]["object"]){
	
	// check if it's enabled
	if (document.getElementById(lastData["properties"]["object"][k] + "_O_enabled").checked){

	    // get the property
	    p = lastData["properties"]["object"][k];
	    
	    // get the mesh, if present and change visibility
	    if (p in opEdgeMesh)
		for (ks in opEdgeMesh[p])
		    for (ko in opEdgeMesh[p][ks])
			opEdgeMesh[p][ks][ko].visibility = newVisib;
	}
    }   
}


/////////////////////////////////////////////////////////////////////
//
// Show / Hide Resources
//
/////////////////////////////////////////////////////////////////////

function showHideRes(show){

    // debug
    console.log("[DEBUG] showHideRes() invoked");

    // set the new visib (for show=false: 0, for show=true: 1)
    newVisib = 0;
    if (show){
	newVisib = 1;
    }
    
    // get the list of all the selected resources
    for (var k in lastData["resources"]){

	// check if it's enabled
	if (document.getElementById(k+ "_I_enabled").checked){

	    // get the mesh
	    if (k in mesh){
		mesh[k].visibility = newVisib;
	    }

	    // show/hide all the data properties
	    for (p in dpMesh){
		if (k in dpMesh[p]){
		    for (o in dpMesh[p][k]){
			dpMesh[p][k][o].visibility = newVisib;
			dpEdgeMesh[p][k][o].visibility = newVisib;
		    }
		}
	    }
	    
	    // show/hide all the object properties having k as...
	    for (p in opEdgeMesh)
		
		// subject
		if (k in opEdgeMesh[p]){
		    for (o in opEdgeMesh[p][k])
			opEdgeMesh[p][k][o].visibility = newVisib;		    
		} else {  // or object
		    for (kelse in opEdgeMesh[p])
			if (k in opEdgeMesh[p][kelse])
			    opEdgeMesh[p][kelse][k].visibility = newVisib;
		}		
	}
    }

    // even classes, data properties and object properties are resources!
    // TODO: show/hide them!
    
}

/////////////////////////////////////////////////////////////////////
//
// Show / Hide Classes
//
/////////////////////////////////////////////////////////////////////

function showHideClasses(show){

    // debug
    console.log("[DEBUG] showHideClasses() invoked");

    // set the new visib (for show=false: 0, for show=true: 1)
    newVisib = 0;
    if (show){
	newVisib = 1;
    }
    
    // get the list of all the selected classes
    for (var cls in lastData["classes"]){

	// get the class
	k = lastData["classes"][cls];

	// check if it's enabled
	if (document.getElementById(k + "_C_enabled").checked){

	    // get the mesh
	    if (k in mesh){
		mesh[k].visibility = newVisib;
	    }

	    // show/hide all the data properties
	    for (p in dpMesh){
		if (k in dpMesh[p]){
		    for (o in dpMesh[p][k]){
			dpMesh[p][k][o].visibility = newVisib;
			dpEdgeMesh[p][k][o].visibility = newVisib;
		    }
		}
	    }
	    
	    // show/hide all the object properties having k as...
	    for (p in opEdgeMesh)
		
		// subject
		if (k in opEdgeMesh[p]){
		    for (o in opEdgeMesh[p][k])
			opEdgeMesh[p][k][o].visibility = newVisib;		    
		} else {  // or object
		    for (kelse in opEdgeMesh[p])
			if (k in opEdgeMesh[p][kelse])
			    opEdgeMesh[p][kelse][k].visibility = newVisib;
		}		
	}
    }
}

/////////////////////////////////////////////////////////////////////
//
// Show / Hide Blank Nodes
//
/////////////////////////////////////////////////////////////////////

function showHideBNodes(show){

    // debug
    console.log("[DEBUG] showHideBNodes() invoked");

    // set the new visib (for show=false: 0, for show=true: 1)
    newVisib = 0;
    if (show){
	newVisib = 1;
    }
    
    // get the list of all the selected blank nodes
    for (var k in lastData["bnodes"]){

	// check if it's enabled
	if (document.getElementById(k+ "_B_enabled").checked){

	    // get the mesh
	    if (k in mesh){
		mesh[k].visibility = newVisib;
	    }

	    // show/hide all the data properties
	    for (p in dpMesh){
		if (k in dpMesh[p]){
		    for (o in dpMesh[p][k]){
			dpMesh[p][k][o].visibility = newVisib;
			dpEdgeMesh[p][k][o].visibility = newVisib;
		    }
		}
	    }
	    
	    // show/hide all the object properties having k as...
	    for (p in opEdgeMesh)
		
		// subject
		if (k in opEdgeMesh[p]){
		    for (o in opEdgeMesh[p][k])
			opEdgeMesh[p][k][o].visibility = newVisib;		    
		} else {  // or object
		    for (kelse in opEdgeMesh[p])
			if (k in opEdgeMesh[p][kelse])
			    opEdgeMesh[p][kelse][k].visibility = newVisib;
		}		
	}
    }    
}

/////////////////////////////////////////////////////////////////////
//
// Show / Hide Literals
//
/////////////////////////////////////////////////////////////////////

function showHideLiterals(show){

    // debug
    console.log("[DEBUG] showHideLiterals() invoked");

    // set the new visib (for show=false: 0, for show=true: 1)
    newVisib = 0;
    if (show){
	newVisib = 1;
    }
    
    // get the list of all the selected data properties
    for (var k in lastData["literals"]){

	// get the value
	value = lastData["literals"][k]
	
	// check if it's enabled
	if (document.getElementById(value + "_L_enabled").checked){

	    // cycle over dpMesh / dpEdgeMesh to find those related to literal with value "value"
	    for (p in dpMesh){
		for (s in dpMesh[p]){
		    if (value in dpMesh[p][s]){
			dpMesh[p][s][value].visibility = newVisib;
			dpEdgeMesh[p][s][value].visibility = newVisib;
		    }
		}
	    }
	}
    }    
}


/////////////////////////////////////////////////////////////////////
//
// Raise resources
//
/////////////////////////////////////////////////////////////////////

function raiseResources(raise){

    // parameters:
    // - raise is a boolean to decide if we have to raise or lower the selected meshes

    // initialize cache of raised objects    
    raised = [];
    
    // determine the movement direction and amount
    step = planesGap;
    if (!(raise))
	step = -1 * planesGap;

    // iterate over resources
    for (var k in lastData["resources"]){

	// check if it's enabled
	if (document.getElementById(k + "_I_enabled").checked){

	    // check if a mesh exists
	    if (k in mesh){
	    
		// remember that we raised this
		raised.push(k);
		
		// retrieve the mesh	    
		m = mesh[k];
	    
		// push it up
		m.position.y += step;

		// re-draw data properties
		drawDataProperties(k, lastData["resources"][k], m, dpMat, "individual");
		drawDataPropertiesEdges(k, lastData["resources"][k], m, dpMat, "individual");		
	    }
	}
    }
   
    // re-draw all the object properties
    drawObjectProperties();
    
    // draw planes
    drawPlanes();
    
}


/////////////////////////////////////////////////////////////////////
//
// Raise bnodes
//
/////////////////////////////////////////////////////////////////////

function raiseBNodes(raise){

    // parameters:
    // - raise is a boolean to decide if we have to raise or lower the selected meshes

    // initialize cache of raised objects    
    raised = [];
    
    // determine the movement direction and amount
    step = planesGap;
    if (!(raise))
	step = -1 * planesGap;

    // iterate over blank nodes
    for (var k in lastData["bnodes"]){

	// check if it's enabled
	if (document.getElementById(k + "_B_enabled").checked){

	    // check if a mesh exists
	    if (k in mesh){
	    
		// remember that we raised this
		raised.push(k);
		
		// retrieve the mesh	    
		m = mesh[k];
	    
		// push it up
		m.position.y += step;

		// re-draw data properties
		drawDataProperties(k, lastData["bnodes"][k], m, dpMat, "bnode");
		drawDataPropertiesEdges(k, lastData["bnodes"][k], m, dpMat, "bnode");		
	    }
	}
    }
   
    // re-draw all the object properties
    drawObjectProperties();
    
    // draw planes
    drawPlanes();
    
}

/////////////////////////////////////////////////////////////////////
//
// Raise / Lower Data Properties
//
/////////////////////////////////////////////////////////////////////
function raiseDP(raise){

    // debug
    console.log("[DEBUG] raiseDP() invoked");

    // determine the movement direction and amount
    step = planesGap;
    if (!(raise))
	step = -1 * planesGap;

    // cache for raised objects
    raised = []
    
    // get the list of all the data properties
    for (var k in lastData["properties"]["datatype"]){
	
	// check if it's enabled
	if (document.getElementById(lastData["properties"]["datatype"][k] + "_D_enabled").checked){

	    // iterate over the first level (i.e. subjects)
	    p = lastData["properties"]["datatype"][k]

	    // raise/lower object spheres
	    for (ms in dpMesh[p])
		for (mo in dpMesh[p][ms]){

		    if (!(raised.includes(mo))){ 
			
			// raise the mesh
			dpMesh[p][ms][mo].position.y += step;
			raised.push(mo);
			
			// re-draw edges
			try {
			    drawDataPropertiesEdges(ms, lastData["resources"][ms], mesh[ms], dpMat, "individual");
			} catch(err) {
			    drawDataPropertiesEdges(ms, lastData["bnodes"][ms], mesh[ms], dpMat, "bnode");
			}
		    }
		}
	}
    }
    
    // Draw planes
    drawPlanes();
    
}


/////////////////////////////////////////////////////////////////////
//
// Raise / Lower Literals
//
/////////////////////////////////////////////////////////////////////
function raiseLiterals(raise){

    // debug
    console.log("[DEBUG] raiseLiterals() invoked");

    // determine the movement direction and amount
    step = planesGap;
    if (!(raise))
	step = -1 * planesGap;

    // initialize a cache for already raised elements
    raised = []
    
    // get the list of all the data properties
    for (var k in lastData["properties"]["datatype"]){	
	console.log("STEP 1")
	// iterate over the first level (i.e. subjects)
	p = lastData["properties"]["datatype"][k]	    
	for (ms in dpMesh[p]){
	    console.log("STEP 2")
	    for (mo in dpMesh[p][ms]){
		console.log("STEP 3")
 		// check if it's enabled
		console.log(mo)
		if (document.getElementById(mo + "_L_enabled").checked){
		    console.log("STEP 4")
		    console.log(raised)
		    
		    if (!(raised.includes(dpMesh[p][ms][mo]))){
			// raise the mesh
			dpMesh[p][ms][mo].position.y += step;
			raised.push(dpMesh[p][ms][mo]);
			
			// re-draw edges
			try {
			    drawDataPropertiesEdges(ms, lastData["resources"][ms], mesh[ms], dpMat, "individual");
			} catch(err) {
			    drawDataPropertiesEdges(ms, lastData["bnodes"][ms], mesh[ms], dpMat, "bnode");
			}
		    }
		    
		}
	    }
	}
    }
    // Draw planes
    drawPlanes();
    
}

/////////////////////////////////////////////////////////////////////
//
// Edit plane names
//
/////////////////////////////////////////////////////////////////////
function editPlaneNames(raise){

    // debug
    console.log("[DEBUG] editPlaneNames() invoked");

    // iterate over all the fields (that are stored in our memory)
    for (p in planes){

	// read the field and compare it to the current name
	console.log(planes[p]["name"])
	if (planes[p]["field"].value !== planes[p]["name"]){

	    // delete the text mesh and create a new one
	    planes[p]["textmesh"].dispose()
	    var text1 = new BABYLON.GUI.TextBlock();
	    text1.text = planes[p]["field"].value	    
	    text1.color = "white";
	    planes[p]["labelmesh"].addControl(text1);
	    planes[p]["textmesh"] = text1
	    planes[p]["name"] = planes[p]["field"].value	    
	}
	
    }
    

}
