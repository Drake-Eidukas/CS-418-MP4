/**
 * Containing class to contain all of the spheres, and
 * expose a method to advance all of the simulated objects
 * by one epoch.
 *
 * Also exposes a method to add a sphere, as well as reset
 * all spheres.
 *
 * @class PhysicsEngine
 */
class PhysicsEngine {
  /**
   * Creates an instance of PhysicsEngine.
   *
   * Instantiates the sphere list as an empty list.
   *
   * @memberOf PhysicsEngine
   */
  constructor () {
    this.sphereList = []
  }

  /**
   * Adds a sphere to the simulation.
   * The sphere will be animated starting with the next tick.
   *
   * @param {any} [toAdd=new Sphere()] Sphere to add
   *
   * @memberOf PhysicsEngine
   */
  addSphere (toAdd = new Sphere()) {
    this.sphereList.push(toAdd)
  }

  /**
   * Reset the spherelist by removing all spheres.
   * This will reset the animation the the initial stage.
   *
   * @memberOf PhysicsEngine
   */
  resetSpheres () {
    this.sphereList = []
  }

  /**
   * Performs a single epoch-- advances each projectile by
   * one epoch.
   *
   * @param {any} timeDelta Time elapsed in the given epoch
   *
   * @memberOf PhysicsEngine
   */
  tick (timeDelta) {
    this.sphereList.forEach((sphere) => {
      sphere.tick(timeDelta)
    })
  }

  /**
   * Getter method to return the sphere list used by the physics engine.
   *
   * @memberOf PhysicsEngine
   */
  get sphereList () {
    return this._sphereList
  }

  /**
   * Setter method to set the sphere list used by the physics engine.
   *
   * @memberOf PhysicsEngine
   */
  set sphereList (list) {
    this._sphereList = list
  }
}
