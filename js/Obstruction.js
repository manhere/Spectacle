function construct(constructor, args) {
  return new (constructor.bind.apply(constructor, [null].concat(args)));
}
var Obstruction = function(Geometry, options) { 
  var position = options.position,
      parameters = options.parameters,
      gray = options.gray,
      rotation = options.rotation,
      incline = options.incline;
  var x = position.x, y = position.y, z = position.z;
  var precision = 10;
  var geometry = construct(Geometry, parameters.concat([precision, precision]));
  var cube = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());
  cube.overdraw = true;
  cube.position.x = x;
  cube.position.z = z;
  cube.position.y = y;
  this.shape = cube;
};
var ShapeData = function(position, size) {
  this.posCoords = [position.x, position.y, position.z];
  this.sizeCoords = [size.x, size.y, size.z];
  this.position = position;
  this.size = size;
};
var Surface = function(position, traits, fun) {
  ShapeData.call(this, position, []);
  this.traitsCoords = traits.concat([fun]);
  this.traits = {};
  this.traits.rotation = traits[0];
  this.traits.incline = traits[1];
  this.traits.radius = traits[2];
  this.fun = fun;
};
Surface.prototype.addTo = function(scene) {
  var cube = new Obstruction(THREE.ParametricGeometry, {
    position: this.position,
    parameters: [this.fun],
    incline: this.traits.incline,
    rotation: this.traits.rotation
  });
  scene.add(cube.shape);
};

