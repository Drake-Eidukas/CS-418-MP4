/**
 * Iteratively create a plane by equally dividing the surface of a sqaure.
 *
 * @param {any} n Number of iterations
 * @param {any} minX Minimum x coordinate
 * @param {any} maxX Maximum x coordinate
 * @param {any} minY Minimum y coordinate
 * @param {any} maxY Maximum y coordinate
 * @param {any} vertexArray Vertex array to add new vertices to
 * @param {any} faceArray Face array to push face details to
 */
function planeFromIteration (n, minX, maxX, minY, maxY, vertexArray, faceArray) {
  let deltaX = (maxX - minX) / n
  let deltaY = (maxY - minY) / n
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      vertexArray.push(minX + deltaX * j)
      vertexArray.push(maxY - deltaY * i)
      vertexArray.push(0)
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let vid = i * (n + 1) + j
      faceArray.push(vid)
      faceArray.push(vid + (n + 1))
      faceArray.push(vid + 1)

      faceArray.push(vid + 1)
      faceArray.push(vid + (n + 1))
      faceArray.push((vid + 1) + (n + 1))
    }
  }
}

/**
 * Push all parts of v into vArray.
 *
 * @param {any} v 3D coordinate point
 * @param {any} vArray Vertex array
 */
function pushVertex (v, vArray) {
  for (let i = 0; i < 3; i++) {
    vArray.push(v[i])
  }
}

/**
 * Subdivides a triangle into more triangles
 *
 * @param {any} a First vertex of the triangle
 * @param {any} b Second vertex of the triangle
 * @param {any} c Final vertex of the triangle
 * @param {any} numSubDivs Number of subdivisions to perform
 * @param {any} vertexArray Vertex array to add new vertices to
 * @returns Returns number of triangles created
 */
function divideTriangle (a, b, c, numSubDivs, vertexArray) {
  if (numSubDivs > 0) {
    let numT = 0

    let ab = vec4.create()
    vec4.lerp(ab, a, b, 0.5)

    let ac = vec4.create()
    vec4.lerp(ac, a, c, 0.5)

    let bc = vec4.create()
    vec4.lerp(bc, b, c, 0.5)

    numT += divideTriangle(a, ab, ac, numSubDivs - 1, vertexArray)
    numT += divideTriangle(ab, b, bc, numSubDivs - 1, vertexArray)
    numT += divideTriangle(bc, c, ac, numSubDivs - 1, vertexArray)
    numT += divideTriangle(ab, bc, ac, numSubDivs - 1, vertexArray)

    return numT
  } else {
    // Add 3 vertices to the array
    pushVertex(a, vertexArray)
    pushVertex(b, vertexArray)
    pushVertex(c, vertexArray)
    return 1
  }
}

/**
 * Creates a plane iteratively by subdividing an existing plane
 *
 * @param {any} n Number of iterations
 * @param {any} minX Minimum x coordinate
 * @param {any} maxX Maximum x coordinate
 * @param {any} minY Minimum y coordinate
 * @param {any} maxY Maximum y coordinate
 * @param {any} vertexArray Vertex array to add new vertices to
 * @returns Returns number of triangles created
 */
function planeFromSubdivision (n, minX, maxX, minY, maxY, vertexArray) {
  let numT = 0
  let va = vec4.fromValues(minX, minY, 0, 0)
  let vb = vec4.fromValues(maxX, minY, 0, 0)
  let vc = vec4.fromValues(maxX, maxY, 0, 0)
  let vd = vec4.fromValues(minX, maxY, 0, 0)

  numT += divideTriangle(va, vb, vd, n, vertexArray)
  numT += divideTriangle(vb, vc, vd, n, vertexArray)
  return numT
}

/**
 * Create a sphere by subdividing a triangle repeatedly.
 * This is used by sphereFromSubdivision by dividing each face of the existing geometry.
 *
 * @param {any} a First vertex of the triangle
 * @param {any} b Second vertex of the triangle
 * @param {any} c Final vertex of the triangle
 * @param {any} numSubDivs Number of subdivisions to perform
 * @param {any} vertexArray Vertex array to add new vertices to
 * @param {any} normalArray Normal array to add new normal vectors to.
 * @returns number of triangles created
 */
function sphDivideTriangle (a, b, c, numSubDivs, vertexArray, normalArray) {
  if (numSubDivs > 0) {
    let numT = 0

    let ab = vec4.create()
    vec4.lerp(ab, a, b, 0.5)
    vec4.normalize(ab, ab)

    let ac = vec4.create()
    vec4.lerp(ac, a, c, 0.5)
    vec4.normalize(ac, ac)

    let bc = vec4.create()
    vec4.lerp(bc, b, c, 0.5)
    vec4.normalize(bc, bc)

    numT += sphDivideTriangle(a, ab, ac, numSubDivs - 1, vertexArray, normalArray)
    numT += sphDivideTriangle(ab, b, bc, numSubDivs - 1, vertexArray, normalArray)
    numT += sphDivideTriangle(bc, c, ac, numSubDivs - 1, vertexArray, normalArray)
    numT += sphDivideTriangle(ab, bc, ac, numSubDivs - 1, vertexArray, normalArray)
    return numT
  } else {
    // Add 3 vertices to the array
    pushVertex(a, vertexArray)
    pushVertex(b, vertexArray)
    pushVertex(c, vertexArray)

    // normals are the same as the vertices for a sphere
    pushVertex(a, normalArray)
    pushVertex(b, normalArray)
    pushVertex(c, normalArray)

    return 1
  }
}

/**
 * Creates a sphere by first creating a tetrahedron, then repeatedly subdividing each face of the existing geometry.
 *
 * @param {any} numSubDivs Number of subdivisions to use when modelling
 * @param {any} vertexArray Array to put vertices into
 * @param {any} normalArray Array to put normal vectors into
 * @returns Number of triangles created.
 */
function sphereFromSubdivision (numSubDivs, vertexArray, normalArray) {
  let numT = 0

  let a = vec4.fromValues(0.0, 0.0, -1.0, 0)
  let b = vec4.fromValues(0.0, 0.942809, 0.333333, 0)
  let c = vec4.fromValues(-0.816497, -0.471405, 0.333333, 0)
  let d = vec4.fromValues(0.816497, -0.471405, 0.333333, 0)

  numT += sphDivideTriangle(a, b, c, numSubDivs, vertexArray, normalArray)
  numT += sphDivideTriangle(d, c, b, numSubDivs, vertexArray, normalArray)
  numT += sphDivideTriangle(a, d, b, numSubDivs, vertexArray, normalArray)
  numT += sphDivideTriangle(a, c, d, numSubDivs, vertexArray, normalArray)
  return numT
}
