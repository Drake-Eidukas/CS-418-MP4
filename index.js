var gl
var canvas

var shaderProgram
var vertexShader
var fragmentShader

var now = Date.now()
var then = 0

var vertexPositionBuffer
var sphereVertexPositionBuffer
var sphereVertexNormalBuffer

var eyePt = vec3.fromValues(0.0, 0.0, 150.0)
var viewDir = vec3.fromValues(0.0, 0.0, -1.0)
var up = vec3.fromValues(0.0, 1.0, 0.0)
var viewPt = vec3.fromValues(0.0, 0.0, 0.0)

var nMatrix = mat3.create()
var mvMatrix = mat4.create()
var pMatrix = mat4.create()

var currentlyPressedKeys = {}

var mvMatrixStack = []

var physics = new PhysicsEngine()

function setupSphereBuffers() {
  let sphereSoup = []
  let sphereNormals = []

  let numT = sphereFromSubdivision(6, sphereSoup, sphereNormals)

  console.log(`Generated ${numT} triangles.`)

  sphereVertexPositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW)

  sphereVertexPositionBuffer.itemSize = 3
  sphereVertexPositionBuffer.numItems = numT * 3
  console.log(`sphereSoup.length / 9: ${sphereSoup.length / 9}`)

  // Specify normals to be able to do lighting calculations
  sphereVertexNormalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals), gl.STATIC_DRAW)
  sphereVertexNormalBuffer.itemSize = 3
  sphereVertexNormalBuffer.numItems = numT * 3

  console.log(`Normals: ${sphereNormals.length / 3}`)
}

function drawSphere() {
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer)
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0)

  // Bind normal buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer)
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0)
  gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems)
}

function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix)
}

function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix)
}

function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix, mvMatrix)
  mat3.transpose(nMatrix, nMatrix)
  mat3.invert(nMatrix, nMatrix)
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix)
}

function mvPushMatrix() {
  var copy = mat4.clone(mvMatrix)
  mvMatrixStack.push(copy)
}

function mvPopMatrix() {
  if (mvMatrixStack.length === 0) {
    throw Error('Invalid popMatrix!')
  }

  mvMatrix = mvMatrixStack.pop()
}

function setMatrixUniforms() {
  uploadModelViewMatrixToShader()
  uploadNormalMatrixToShader()
  uploadProjectionMatrixToShader()
}

function degToRad(degrees) {
  return degrees * Math.PI / 180
}

function createGLContext(canvas) {
  var names = ['webgl', 'experimental-webgl']
  var context = null
  for (var i = 0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i])
    } catch (e) { }
    if (context) {
      break
    }
  }
  if (context) {
    context.viewportWidth = canvas.width
    context.viewportHeight = canvas.height
  } else {
    window.alert('Failed to create WebGL context!')
  }
  return context
}

function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id)

  // If we don't find an element with the specified id
  // we do an early exit
  if (!shaderScript) {
    return null
  }

  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = ''
  var currentChild = shaderScript.firstChild
  while (currentChild) {
    if (currentChild.nodeType === 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent
    }
    currentChild = currentChild.nextSibling
  }

  var shader
  if (shaderScript.type === 'x-shader/x-fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER)
  } else if (shaderScript.type === 'x-shader/x-vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER)
  } else {
    return null
  }

  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    window.alert(gl.getShaderInfoLog(shader))
    return null
  }
  return shader
}

function setupShaders() {
  vertexShader = loadShaderFromDOM('vshader')
  fragmentShader = loadShaderFromDOM('fshader')

  shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    window.alert('Failed to setup shaders')
  }

  gl.useProgram(shaderProgram)

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition')
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute)

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, 'aVertexNormal')
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute)

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix')
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix')
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, 'uNMatrix')

  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, 'uLightPosition')
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, 'uAmbientLightColor')
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, 'uDiffuseLightColor')
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, 'uSpecularLightColor')

  shaderProgram.uniformAmbientMatColorLoc = gl.getUniformLocation(shaderProgram, 'uAmbientMatColor')
  shaderProgram.uniformDiffuseMatColorLoc = gl.getUniformLocation(shaderProgram, 'uDiffuseMatColor')
  shaderProgram.uniformSpecularMatColorLoc = gl.getUniformLocation(shaderProgram, 'uSpecularMatColor')
}

function uploadLightsToShader(location, ambient, diffuse, specular) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, location)
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, ambient)
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, diffuse)
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, specular)
}

function uploadMaterialToShader(ambient, diffuse, specular) {
  gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, ambient)
  gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, diffuse)
  gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, specular)
}

function setupBuffers() {
  setupSphereBuffers()
}

function draw() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  var transformVec = vec3.create()
  vec3.set(transformVec, 5.0, 5.0, 5.0)

  var Ia = vec3.fromValues(1.0, 1.0, 1.0)
  var Id = vec3.fromValues(1.0, 1.0, 1.0)
  var Is = vec3.fromValues(1.0, 1.0, 1.0)

  mat4.perspective(pMatrix, degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0)

  physics.sphereList.forEach(sphere => {
    vec3.add(viewPt, eyePt, viewDir)
    mat4.lookAt(mvMatrix, eyePt, viewPt, up)

    var lightPosEye4 = vec4.fromValues(0.0, 0.0, 50.0, 1.0)
    lightPosEye4 = vec4.transformMat4(lightPosEye4, lightPosEye4, mvMatrix)
    var lightPosEye = vec3.fromValues(lightPosEye4[0], lightPosEye4[1], lightPosEye4[2])

    ka = vec3.fromValues(0.0, 0.0, 0.0)
    kd = sphere.color
    ks = sphere.color

    mat4.scale(mvMatrix, mvMatrix, vec3.fromValues(sphere.radius, sphere.radius, sphere.radius))

    mat4.translate(mvMatrix, mvMatrix, sphere.position)

    uploadLightsToShader(lightPosEye, Ia, Id, Is)
    uploadMaterialToShader(ka, kd, ks)
    setMatrixUniforms()
    drawSphere()
  })
}

/**
 * Handle user pressing keys on their keyboard
 * @param {*} event 
 */
function handleKeyDown(event) {
  currentlyPressedKeys[event.keyCode] = true
}

/**
 * Handle a keyup event.
 * @param {*} event 
 */
function handleKeyUp(event) {
  if (event.keyCode === 32) {
    physics.addSphere()
  }
  // currentlyPressedKeys[event.keyCode] = false
}

/**
 * Manage keys pressed
 */
function handleKeys() {
  // let space = currentlyPressedKeys[32]

  // if (space) {
  //   physics.addSphere()
  // }
}

function animate() {
  if (then === 0) {
    then = Date.now()
  } else {
    now = Date.now()

    // Convert to seconds
    now *= 0.001

    // Animate the rotation using the difference between current time and previous time
    handleKeys()
    physics.tick(0.1)

    // Remember the current time for the next frame.
    then = now
  }
}

function startup() {
  canvas = document.getElementById('canvas')
  gl = createGLContext(canvas)

  setupShaders()
  setupBuffers()

  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.enable(gl.DEPTH_TEST)
  tick()
}

function tick() {
  requestAnimFrame(tick)
  animate()
  draw()
}