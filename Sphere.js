/**
 * A sphere represents the vertex mesh of a sphere.
 * We will create a single model of a vertex mesh of a sphere within a 1 x 1 x 1 cube
 * then scale and translate this model to be used in drawing our scene.
 * @class Sphere
 */
class Sphere {
  constructor (radius = Math.random(), speed = Math.random() * 200) {
    this.radius = radius
    this.speed = speed

    this.position = vec3.create()
    vec3.random(this.position, 1 - this.radius)

    this.velocity = vec3.create()
    vec3.random(this.velocity, speed)
  }

  get radius () {
    return this._radius
  }

  set radius (radius) {
    this._radius = radius
    this.radiusSq = this.radius * this.radius

    this.mass = radius * radius * 0.5

    let red = 255.0 * this.mass
    let green = 255.0 * (1.0 - Math.abs(1.0 - 2.0 * this.mass))
    let blue = 255.0 * (1.0 - this.mass)
    this.color = vec3.fromValues(red, green, blue)
  }

  get position () {
    return this._position
  }

  set position (position) {
    this._position = position
  }

  get velocity () {
    return this._velocity
  }

  set velocity (velocity) {
    this._velocity = velocity
    this.speed = vec3.length(this.velocity)
  }

  get speed () {
    return this._speed
  }

  set speed (speed) {
    this._speed = Math.max(speed, -speed)
    this.speedSq = this.speed * this.speed
  }

  get color () {
    return this._color
  }

  set color (color) {
    this._color = color
  }

  get mass () {
    return this._mass
  }

  set mass (mass) {
    this._mass = mass
  }

  static get HALFCDRHO () {
    return 0.90438598515
  }

  static get GRAVITY () {
    return 9.81
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
    this.velocity = velocity

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
  handleCollisions (timeDelta, boundingRange = this.createBoundingRange(-10, 10, -10, 10, -10, 10)) {
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
    let xMax = boundingRange.x.max - this.radius
    let yMin = boundingRange.y.min + this.radius
    let yMax = boundingRange.y.max - this.radius
    let zMin = boundingRange.z.min + this.radius
    let zMax = boundingRange.z.max - this.radius

    if (x < xMin) {
      x = xMin
      xVelocity *= -1
    }

    if (x > xMax) {
      x = xMax
      xVelocity *= -1
    }

    if (y < yMin) {
      y = yMin
      yVelocity *= -3
    }

    if (y > yMax) {
      y = yMax
      yVelocity *= -1
    }

    if (z < zMin) {
      z = zMin
      zVelocity *= -1
    }

    if (z > zMax) {
      z = zMax
      zVelocity *= -1
    }

    this.position = vec3.fromValues(x, y, z)
    this.velocity = vec3.fromValues(xVelocity, yVelocity, zVelocity)

    // this.tick(maxOverlap)
  }

  tick (timeDelta) {
    this.updatePosition(timeDelta)
    this.handleCollisions(timeDelta)
  }
}
