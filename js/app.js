// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene);
controls.position.z = 0;
controls.position.x = -500;

var cylinder = function(s) {
  return piecewise([
	  { range: [0, 0.3], fn: revolvingParametric(function(s, t) { return new Vector(s*100, 0); }).bind({}, s) },
	  { range: [0.3, 0.7], fn: revolvingParametric(function(s, t) { return new Vector(100, s*100); }).bind({}, s) },
	  { range: [0.7, 1], fn: revolvingParametric(function(s, t) { return new Vector((1-s)*100, 100); }).bind({}, s) }]);
};
var sphere = revolvingParametric(function(s, t) { return new Vector(sqrt(square(50) - square(s*100-50)), s*100) });
var parametric = new Surface(
  {x: 0, y: 0, z: 0},
  [310, -30, 0],
  function(u, v) {
    // A piecewise surface of revolution from two parametric functions.
    var r = 5, t = 2 * Math.PI * u, h = 210;
    return sphere(t, v);
  });

parametric.addTo(scene);
controls.render();

