/**
 * A sphere represents all but the vertex mesh of a sphere.
 * We represent all of the physical properties of the sphere (radius, position, velocity, mass, color, etc.)
 * We scale, translate, and draw the sphere mesh for each sphere based on these properties.
 *
 * @class Sphere
 */
class Sphere {
  /**
   * Creates an instance of Sphere.
   * @param {any} [radius=Math.random() * 2] Radius to create the sphere with
   * @param {any} [speed=Math.random() * 100] Speed to create the sphere with
   *
   * @memberOf Sphere
   */
  constructor (radius = Math.random() * 2, speed = Math.random() * 100) {
    this.radius = radius

    this.position = vec3.create()
    this.position = vec3.random(this.position, 10 - this.radius)

    let velocity = vec3.create()
    this.velocity = vec3.random(velocity, speed)

    this.mass = 1

    this.color = vec3.fromValues(Math.random(), Math.random(), Math.random())
  }

  /**
   * Getter method for the radius of the sphere.
   *
   * @memberOf Sphere
   */
  get radius () {
    return this._radius
  }

  /**
   * Setter method for the radius of the sphere.
   * @param {number} radius Radius of the sphere to set.
   *
   * @memberOf Sphere
   */
  set radius (radius) {
    this._radius = radius
  }

  /**
   * Getter method for the position of the sphere in model coordinates
   *
   * @memberOf Sphere
   */
  get position () {
    return this._position
  }

  /**
   * Setter method for the position of the sphere in model coordinates
   * @param {any} position vec3 coordinate of the position of the sphere
   *
   * @memberOf Sphere
   */
  set position (position) {
    this._position = position
  }

  /**
   * Getter method for the velocity of the sphere
   *
   * @memberOf Sphere
   */
  get velocity () {
    return this._velocity
  }

  /**
   * Setter method for the velocity of the sphere
   * Also sets the speed according to the magnitude of the velocity
   * @param {any} velocity vec3 vector of the velocity of the sphere
   *
   * @memberOf Sphere
   */
  set velocity (velocity) {
    this._velocity = velocity
    this.speed = vec3.length(this.velocity)
  }

  /**
   * Getter method for the speed of the sphere
   *
   * @memberOf Sphere
   */
  get speed () {
    return this._speed
  }

  /**
   * Setter method for the speed of the sphere.
   * Only allows for non-negative speed.
   * @param {number} speed The speed of the sphere to set
   *
   * @memberOf Sphere
   */
  set speed (speed) {
    this._speed = Math.max(speed, -speed)
  }

  /**
   * Getter method for the RGB coloring of the sphere.
   *
   * @memberOf Sphere
   */
  get color () {
    return this._color
  }

  /**
   * Setter method for the RGB coloring of the sphere.
   * @param {any} color vec3 RGB color vector of the sphere
   *
   * @memberOf Sphere
   */
  set color (color) {
    this._color = color
  }

  /**
   * Getter method for the mass in kilograms of the sphere
   *
   * @memberOf Sphere
   */
  get mass () {
    return this._mass
  }

  /**
   * Setter method for the massi n kilograms of the sphere
   * @param {number} mass Mass of the sphere
   *
   * @memberOf Sphere
   */
  set mass (mass) {
    this._mass = mass
  }

  /**
   * Static constant for the magnatude of the acceleration from gravity on Earth
   *
   * @readonly
   * @static
   *
   * @memberOf Sphere
   */
  static get GRAVITY () {
    return -9.81
  }

  /**
   * Given the time of an epoch, return the factor to scale velocity by to simulate drag on the sphere.
   *
   * @param {any} timeDelta Time elapsed during the current epoch
   * @returns Factor to scale velocity by
   *
   * @memberOf Sphere
   */
  dragFactor (timeDelta) {
    return Math.pow(0.9, timeDelta)
  }

  /**
   * Returns a vec3 representation of the vector of the force of gravity on the sphere.
   *
   * @readonly
   *
   * @memberOf Sphere
   */
  get gravityForce () {
    return vec3.fromValues(0, Sphere.GRAVITY * this.mass, 0)
  }

  /**
   * Returns the acceleration acting on the sphere at any given moment.
   *
   * @readonly
   *
   * @memberOf Sphere
   */
  get acceleration () {
    let gravity = this.gravityForce
    vec3.scale(gravity, gravity, 1 / this.mass)
    return gravity
  }

  /**
   * Given a time passed, calculate the new position of the sphere after the current epoch.
   *
   * @param {any} timeDelta Time elapsed in the current epoch
   * @returns Returns the new position of the sphere after the current epoch
   *
   * @memberOf Sphere
   */
  updatePosition (timeDelta) {
    let velocity = vec3.clone(this.updateVelocity(timeDelta))

    vec3.scale(velocity, velocity, timeDelta)

    let position = this.position
    vec3.add(position, position, velocity)
    this.position = position

    return this.position
  }

  /**
   * Given a time passed, calculate the new velocity of the sphere after the current epoch.
   *
   * @param {any} timeDelta Time elapsed in the current epoch
   * @returns Returns the new position of the sphere after the current epoch
   *
   * @memberOf Sphere
   */
  updateVelocity (timeDelta) {
    let acceleration = this.acceleration
    vec3.scale(acceleration, acceleration, timeDelta)

    let velocity = this.velocity
    vec3.scale(velocity, velocity, this.dragFactor(timeDelta))
    
    vec3.add(velocity, velocity, acceleration)
    this.velocity = velocity

    return this.velocity
  }

  /**
   * Convenience method to create a bounding box for a sphere.
   *
   * @param {any} minX Minimum x coordinate of the bounding box
   * @param {any} maxX Maximum x coordinate of the bounding box
   * @param {any} minY Minimum y coordinate of the bounding box
   * @param {any} maxY Maximum y coordinate of the bounding box
   * @param {any} minZ Minimum z coordinate of the bounding box
   * @param {any} maxZ Maximum z coordinate of the bounding box
   * @returns Bounding range object
   *
   * @memberOf Sphere
   */
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
   * Given a time elapsed, handle and and all collisions in the previous epoch
   *
   * @param {any} timeDelta Length of time in last epoch
   * @param {any} [boundingRange=this.createBoundingRange(-10, 10, -10, 10, -10, 10)] Bounding range to check for out of bounds issues with
   * 
   * @memberOf Sphere
   */
  handleCollisions (timeDelta, boundingRange = this.createBoundingRange(-10, 10, -10, 10, -10, 10)) {
    let [x, y, z] = this.position
    let [xVelocity, yVelocity, zVelocity] = this.velocity

    // Bounding box of position-- box - radius
    let xMin = boundingRange.x.min + this.radius
    let xMax = boundingRange.x.max - this.radius
    let yMin = boundingRange.y.min + this.radius
    let yMax = boundingRange.y.max - this.radius
    let zMin = boundingRange.z.min + this.radius
    let zMax = boundingRange.z.max - this.radius

    if (x <= xMin) {
      x = xMin
      xVelocity *= -1
    }

    if (x >= xMax) {
      x = xMax
      xVelocity *= -1
    }

    if (y <= yMin) {
      y = yMin
      yVelocity *= -1
    }

    if (y >= yMax) {
      y = yMax
      yVelocity *= -1
    }

    if (z <= zMin) {
      z = zMin
      zVelocity *= -1
    }

    if (z >= zMax) {
      z = zMax
      zVelocity *= -1
    }

    this.position = vec3.fromValues(x, y, z)
    this.velocity = vec3.fromValues(xVelocity, yVelocity, zVelocity)

    // this.tick(maxOverlap)
  }

  /**
   * Animate single epoch of this sphere
   *
   * @param {any} timeDelta Time elapsed in current epoch
   *
   * @memberOf Sphere
   */
  tick (timeDelta) {
    this.updatePosition(timeDelta)
    this.handleCollisions(timeDelta)
  }
}
