class PhysicsEngine {
  constructor () {
    this.sphereList = []
  }

  addSphere (toAdd = new Sphere()) {
    this.sphereList.push(toAdd)
  }

  resetSpheres () {
    this.sphereList = []
  }

  tick (timeDelta) {
    this.sphereList.forEach((sphere) => {
      sphere.tick(timeDelta)
    })
  }

  get sphereList () {
    return this._sphereList
  }

  set sphereList (list) {
    this._sphereList = list
  }
}
