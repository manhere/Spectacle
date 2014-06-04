// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene);
controls.position.z = 0;
controls.position.x = -500;

var conic = new Surface(
  {x: 0, y: 0, z: 0},
  [310, -30, 0],
  function(u, v) {
    // A piecewise surface of revolution from two parametric functions.
    var r = 5, t = 2 * Math.PI * u, h = 210;
    return piecewise([
      {
	range: [0, 0.3], 
	fn: revolvingParametric(function(t, s) {
	  return new Vector((1-t)*100, 0);
	}).bind({}, t)
      },
      {
	range: [0.3, 0.7], 
	fn: revolvingParametric(function(t, s) {
	  return new Vector(100, t*100);
	}).bind({}, t)
      },
      {
	range: [0.7, 1], 
	fn: revolvingParametric(function(t, s) {
	  return new Vector((1-t)*100, 100);
	}).bind({}, t)
      }
    ])(v);
  });

conic.addTo(scene);
controls.render();

