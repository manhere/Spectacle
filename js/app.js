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
	range: [0, 0.5], 
	fn: revolvingParametric(vectorLine(0, 0, 105/210*h, -105/210*h)).bind({}, t)
      },
      {
	range: [0.5, 1], 
	fn: revolvingParametric(bezier([105/210*h, -105/210*h],
	      [178/210*h, -153/210*h],
	      [97/210*h, -210/210*h],
	      [0/210*h, -207/210*h])).bind({}, t)
      }
    ])(v);
  });

conic.addTo(scene);
controls.render();

