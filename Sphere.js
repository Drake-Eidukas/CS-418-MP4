/**
 * A sphere represents the vertex mesh of a sphere.
 * We will create a single model of a vertex mesh of a sphere within a 1 x 1 x 1 cube
 * then scale and translate this model to be used in drawing our scene.
 * @class Sphere
 */
class Sphere {
  constructor (radius = 1, speed = 0.05) {
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
  }

  get velocity () {
    return this.velocity
  }

  set velocity () {
    this.velocity = velocity
    this.speed = vec3.length(this.velocity)
  }

  get speed () {
    return this.speed 
  }

  set speed (speed) {
    this.speed = Math.max(speed, -speed)
  }

  get color () {

  }

  get mass () {
    
  }
}
