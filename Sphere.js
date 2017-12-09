/**
 * A sphere represents the vertex mesh of a sphere.
 * We will create a single model of a vertex mesh of a sphere within a 1 x 1 x 1 cube
 * then scale and translate this model to be used in drawing our scene.
 * @class Sphere
 */
class Sphere {
  constructor (radius = 0.1, speed = 0.05) {
    this.radius = radius
    this.speed = speed

    this.position = vec3.create()
    vec3.random(this.position)

    this.velocity = vec3.create()
    vec3.random(this.velocity, speed)
  }

  get radius () {
    return this.radius
  }

  set radius (radius) {
    this.radius = radius
    this.radSq = this.radius * this.radius

    this.mass = radius * radius * 0.5

    let red = 255.0 * this.mass
    let green = 255.0 * (1.0 - Math.abs(1.0 - 2.0 * this.mass))
    let blue = 255.0 * (1.0 - this.mass)
    this.color = vec3.fromValues(red, green, blue)
  }

  get position () {
    return this.position
  }

  set position (position) {
    this.position = position
  }

  get velocity () {
    return this.velocity
  }

  set velocity (velocity) {
    this.velocity = velocity
    this.speed = vec3.length(this.velocity)
  }

  get speed () {
    return this.speed
  }

  set speed (speed) {
    this.speed = Math.max(speed, -speed)
    this.speedSq = this.speed * this.speed
  }

  get color () {
    return this.color
  }

  set color (color) {
    this.color = color
  }

  get mass () {
    return this.mass
  }

  set mass (mass) {
    this.mass = mass
  }

  static get HALFCDRHO () {
    return 0.90438598515
  }

  static get GRAVITY () {
    return 9.8
  }

  /**
   * D = Cd * 0.5 * rho * V^2 * A
   * Drag = drag coefficient * 0.5 * air density * velocity^2 * area
   * = 0.47 * 0.5 * 1.225 * velocity^2 * pi * r^2
   * https://www.grc.nasa.gov/www/k-12/airplane/dragsphere.html
   * Mass is in kg, radius in m, velocity in m/s, etc.
   */
  get dragForce () {
    let force = Sphere.HALFCDRHO * this.speedSq * this.radiusSq // magnitude of force
    let direction = vec3.clone(this.velocity) // direction of movement
    vec3.normalize(direction, direction) // unit vector in the direction of movement
    vec3.negate(direction, direction) // unit vector in the opposite direction of movement
    vec3.scale(direction, direction, force) // vector in the opposite direction of movement with length of the force of drag

    return direction
  }

  get gravityForce () {
    return vec3.fromValues(0, -1 * Sphere.GRAVITY * this.mass, 0)
  }

  get acceleration () {
    let combinedForce = vec3.create()
    vec3.add(combinedForce, this.gravityForce, this.dragForce)
    vec3.scale(combinedForce, combinedForce, 1.0 / this.mass)

    return combinedForce
  }

  updatePosition (timeDelta) {
    let velocity = this.updateVelocity(timeDelta)
    vec3.scale(velocity, velocity, timeDelta)

    let position = this.position
    vec3.add(position, position, velocity)
    this.position = position

    return this.position
  }

  updateVelocity (timeDelta) {
    let acceleration = this.acceleration
    vec3.scale(acceleration, acceleration, timeDelta)

    let velocity = this.velocity
    vec3.add(velocity, velocity, acceleration)
    this.velocity = this.velocity

    return this.velocity
  }

  createBoundingRange (minX, maxX, minY, maxY, minZ, maxZ) {
    return {
      x: {
        min: minX,
        max: maxX
      },
      y: {
        min: minY,
        max: maxY
      },
      z: {
        min: minZ,
        max: maxZ
      }
    }
  }

  /**
   * Assuming -1 -> 1 on x, y, z
   * One numerical issue with this method is that it does not reverse changes to velocity from the original calculation of acceleration at the beginning of a tick.
   * However, we choose to allow this to happen, as it roughly translates to losing energy from crashing into walls.
   * @memberOf Sphere
   */
  handleCollisions (timeDelta, boundingRange = this.createBoundingRange(-1, 1, -1, 1, -1, 1)) {
    let position = this.position
    let x = position[0]
    let y = position[1]
    let z = position[2]

    let velocity = this.velocity
    let xVelocity = velocity[0]
    let yVelocity = velocity[1]
    let zVelocity = velocity[2]

    // Bounding box of position-- box - radius
    let xMin = boundingRange.x.min + this.radius
    let xMax = boundingRange.x.min - this.radius
    let yMin = boundingRange.y.min + this.radius
    let yMax = boundingRange.y.min - this.radius
    let zMin = boundingRange.z.min + this.radius
    let zMax = boundingRange.z.min - this.radius

    // Times since overlap occured.
    let xMinOverlap = (x - xMin) / xVelocity
    let xMaxOverlap = (x - xMax) / xVelocity
    let yMinOverlap = (y - yMin) / yVelocity
    let yMaxOverlap = (y - yMax) / yVelocity
    let zMinOverlap = (z - zMin) / zVelocity
    let zMaxOverlap = (z - zMax) / zVelocity

    // No collisions-- we can safely return
    let maxOverlap = Math.max(xMinOverlap, xMaxOverlap, yMinOverlap, yMaxOverlap, zMinOverlap, zMaxOverlap)
    if (maxOverlap <= 0) {
      return
    }

    if (xMinOverlap === maxOverlap) {
      xVelocity *= -1
    }

    if (xMaxOverlap === maxOverlap) {
      xVelocity *= -1
    }

    if (yMinOverlap === maxOverlap) {
      yVelocity *= -1
    }

    if (yMaxOverlap === maxOverlap) {
      yVelocity *= -1
    }

    if (zMinOverlap === maxOverlap) {
      zVelocity *= -1
    }

    if (zMaxOverlap === maxOverlap) {
      zVelocity *= -1
    }

    let posDelta = vec3.create()
    vec3.scale(posDelta, velocity, -maxOverlap)
    vec3.add(position, position, posDelta)

    this.position = position
    this.velocity = vec3.fromValues(xVelocity, yVelocity, zVelocity)

    this.tick(maxOverlap)
  }

  tick (timeDelta) {
    this.updatePosition(timeDelta)
    this.handleCollisions(timeDelta)
  }
}
