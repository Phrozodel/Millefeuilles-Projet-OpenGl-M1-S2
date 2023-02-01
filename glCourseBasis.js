
// =====================================================
var gl;
var shadersLoaded = 0;	//number of loaded shader (0 at the start)
var vertShaderTxt;		//source code of the vs
var fragShaderTxt;		//source code of the fs
var shaderProgram = null;	//
var vertexBuffer;
var colorBuffer;
var mvMatrix = mat4.create();	//matrice rotation et translation
var pMatrix = mat4.create();	//matrice de projection
var objMatrix = mat4.create();	//matrice de rotation
mat4.identity(objMatrix);
var images = [];
var loadedimages = [];


// =====================================================
function webGLStart() {
	var canvas = document.getElementById("WebGL-test");
	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;	//document ça permet de sortir de la fenetre tout en continuant de changer des trucs
	document.onmousemove = handleMouseMove;

	document.getElementById('rangeRed').addEventListener('input',changeColor);
	document.getElementById('rangeBlue').addEventListener('input',changeColor);
	document.getElementById('rangeGreen').addEventListener('input',changeColor);
	document.getElementById('rangeTransparence').addEventListener('input',changeColor);

	initGL(canvas);
	initBuffers();
	initTextures("langoustine/image.",500);
	//initTexture();
	loadShaders('shader');

	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

//	drawScene();
	tick();
}

// =====================================================
function initGL(canvas)
{
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.enable(gl.BLEND); // Autorise transparence
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)// Calcul la transparence. Si deux pixels se superposent, on combine les couleurs des pixels. On prend la couleur du fond, on fait couleur *alpha + nouvelle couleur *(1-alpha) = nouvelle couleur. Commencer par le fond = normal, sinon il bloquera le point de vue si on commence par le début. Nous, on commence donc par le début 
	} catch (e) {}
	if (!gl) {
		console.log("Could not initialise WebGL");
	}
}



// =====================================================
function initBuffers() {
	// Vertices (array)
	vertices = [
		-0.3, -0.3, 0.0,
		-0.3,  0.3, 0.0,
		 0.3,  0.3, 0.0,
		 0.3, -0.3, 0.0];
	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = 4;

	// Texture coords (array)
	texcoords = [ 
		  1.0, 0.0,
		  1.0, 1.0,
		  0.0, 1.0,
		  0.0, 0.0 ];
	texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
	texCoordBuffer.itemSize = 2;
	texCoordBuffer.numItems = 4;
	
	// Index buffer (array)
	//var indices = [ 0, 1, 2, 3];
	//indexBuffer = gl.createBuffer();
	//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	//gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	//indexBuffer.itemSize = 1;
	//indexBuffer.numItems = indices.length;
}


// ===================================================== FIRST INITTEXTURE
/*function initTexture()
{
	var texImage = new Image();
	texImage.src = "test3.jpg";

	texture = gl.createTexture();
	texture.image = texImage;

	texImage.onload = function () {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		//gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.uniform1i(shaderProgram.samplerUniform, 0);
		gl.activeTexture(gl.TEXTURE0);
	}
}
*/


//=======================================================SECOND ATTEMPT

function initTexture(textureName)//nom de fichier et retourne "texture". avant faut déclarer tableau vide texture1=initTexture("jdji") et deux draw
{
	var texImage = new Image();
	texImage.src = textureName;

	var texture = gl.createTexture();
	texture.image = texImage;

	texImage.onload = function () {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); 	//gere l'interprétation des textures sur le gpu
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);	//pour modif, le 2eme param devient 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.uniform1i(shaderProgram.samplerUniform, 0);
		gl.activeTexture(gl.TEXTURE0);
	}

	return texture;
}

function initTextures(fileName, nb)
{
	for (var i=1;i<nb;i++)
	{
		if (i<1000)
		{
			loadedimages.push(initTexture("images/"+fileName+"0"+i+".jpg"));
		}
		else if (i<100)
		{
			loadedimages.push(initTexture("images/"+fileName+"00"+i+".jpg"));
		}
		else if (i<10)
		{
			loadedimages.push(initTexture("images/"+fileName+"000"+i+".jpg"));
		}
		else
		{
			loadedimages.push(initTexture("images/"+fileName+"0000"+i+".jpg"));
		}
	}
}

// =====================================================
function loadShaders(shader) {
	loadShaderText(shader,'.vs');
	loadShaderText(shader,'.fs');
}

// =====================================================
function loadShaderText(filename,ext) {   // technique car lecture asynchrone...
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
			if(ext=='.vs') { vertShaderTxt = xhttp.responseText; shadersLoaded ++; }
			if(ext=='.fs') { fragShaderTxt = xhttp.responseText; shadersLoaded ++; }
			if(shadersLoaded==2) {
				initShaders(vertShaderTxt,fragShaderTxt);
				shadersLoaded=0;
			}
    }
  }
  xhttp.open("GET", filename+ext, true);
  xhttp.send();
}

// =====================================================
function initShaders(vShaderTxt,fShaderTxt) {

	vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vshader, vShaderTxt);
	gl.compileShader(vshader);
	if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(vshader));
		return null;
	}

	fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fshader, fShaderTxt);
	gl.compileShader(fshader);
	if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(fshader));
		return null;
	}

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vshader);
	gl.attachShader(shaderProgram, fshader);

	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.texCoordsAttribute = gl.getAttribLocation(shaderProgram, "texCoords");
	gl.enableVertexAttribArray(shaderProgram.texCoordsAttribute);
	
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
	
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
     	vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.texCoordsAttribute,
      	texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

}


// =====================================================
function setMatrixUniforms() {
	if(shaderProgram != null) {
		gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	}
}
function changeColor() {
	let red = document.getElementById("rangeRed").value;
	let blue = document.getElementById("rangeBlue").value;
	let green = document.getElementById("rangeGreen").value;
	let transparence = document.getElementById("rangeTransparence").value;
	gl.clearColor(red/255,green/255,blue/255,1.0);
	gl.blendFunc(gl.SRC_ALPHA, transparence);
}

// =====================================================
function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	if(shaderProgram != null) {

		//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
		mat4.identity(mvMatrix);	//matrice rotation/translation
		mat4.translate(mvMatrix, [0.0, 0.0, -5.0]);
		mat4.multiply(mvMatrix, objMatrix);

		setMatrixUniforms();

		//gl.drawElements(gl.TRIANGLE_FAN, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		for (i=0;i<loadedimages.length;i++)
		{
			gl.bindTexture(gl.TEXTURE_2D,loadedimages[i]);
			gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexBuffer.numItems);
			mat4.translate(mvMatrix, [0.0, 0.0, 0.005]);
			setMatrixUniforms();
		}
		//gl.bindTexture(gl.TEXTURE_2D,loadedimages[1]);
		//gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexBuffer.numItems);

		//entre deux draw, refrabriquer la mvMatrix qui recontient la translation, rotation t retranslation
		//un bind un draw un bind un draw un bind un draw
		//transparence alpha*couleur du fragment avant+1-alpha du nouveau fragment*couleur
		//faut commencer par afficher le fragment qui est derrière (on start par z min)
		//si rouge <0,1; discard; 
		//if call.r < seuil, discard (fs)
	}
}
