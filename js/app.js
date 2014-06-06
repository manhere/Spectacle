// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene);
controls.position.z = 0;
controls.position.x = -500;

var z = new THREE.Vector3(1, 2, 3);
var basis = formBasis(z);
renderLines(basis, scene);
var functionSpace = revolvingNormalParametric(basis);

var cylinder = function(s) {
  return piecewise([
	  { range: [0, 0.3], 
	    fn: functionSpace(function(s, t) {
	      return new Vector(s*100, 0);
	    }).bind({}, s) },
	  { range: [0.3, 0.7], 
	    fn: functionSpace(function(s, t) {
	      return new Vector(100, s*100);
	    }).bind({}, s) },
	  { range: [0.7, 1], 
	    fn: functionSpace(function(s, t) {
	      return new Vector((1-s)*100, 100);
	    }).bind({}, s) }]);
};

var z2 = new THREE.Vector3(0, 0, 1);
var basis2 = formBasis(z2);
var functionSpace2 = revolvingNormalParametric(basis2);
var sphere = functionSpace2(function(s, t) {
  return new Vector(sqrt(square(50) - square(s*100-50)), s*100)
});
var stlCylinder = new Surface(
  {x: 0, y: -100, z: -50},
  [0, 0, 0],
  function(u, v) {
    var t = 2 * Math.PI * u;
    return cylinder(t)(v);
  });
var stlSphere = new Surface(
  {x: 0, y: 100, z: -50},
  [0, 0, 0],
  function(u, v) {
    var t = 2 * Math.PI * u;
    return sphere(t, v);
  });

stlCylinder.addTo(scene);
stlSphere.addTo(scene);
controls.render();

