function construct(constructor, args) {
  return new (constructor.bind.apply(constructor, [null].concat(args)));
}
var Obstruction = function(Geometry, options) { 
  var position = options.position,
      parameters = options.parameters,
      precision = options.precision;
  var x = position.x, y = position.y, z = position.z;
  var geometry = construct(Geometry, parameters.concat(precision));
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
var Surface = function(position, precision, fun) {
  ShapeData.call(this, position, []);
  this.precision = precision;
  this.fun = fun;
};
Surface.prototype.addTo = function(scene) {
  var cube = new Obstruction(THREE.ParametricGeometry, {
    position: this.position,
    parameters: [this.fun],
    precision: this.precision
  });
  scene.add(cube.shape);
};

