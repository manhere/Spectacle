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
var functionSpace = surfaceBasisTransformer(basis);

var cylinder = function(h, theta) {
  return piecewise([
	  { range: [0, 0.3], 
	    fn: function(h) {
	      return functionSpace(function(h) {
	        return new Vector(h*100, 0);
	      })(h, theta)
	    } },
	  { range: [0.3, 0.7], 
	    fn: function(h) {
	      return functionSpace(function(h) {
		return new Vector(100, h*100);
	      })(h, theta);
	    } },
	  { range: [0.7, 1], 
	    fn: function(h) {
	      return functionSpace(function(h) {
		return new Vector((1-h)*100, 100);
	      })(h, theta);
	    } }])(h);
};

var z2 = new THREE.Vector3(0, 0, 1);
var basis2 = formBasis(z2);
var functionSpace2 = surfaceBasisTransformer(basis2);
var sphere = functionSpace2(function(h) {
  return new Vector(sqrt(square(50) - square(h*100-50)), h*100)
});

var bracket = revolvingParametric(function(h, theta) {
  return new Vector(100, h*100);
});
var cubeRadius = function(theta) {
  var tp = theta/Math.PI - 0.25, thetap = tp * Math.PI;
  if( tp >= -0.25 && tp < 0.25 ) {
    return abs(1/cos(thetap));
  } else if( tp >= 0.25 && tp < 0.75 ) {
    return abs(1/sin(thetap));
  } else if( tp >= 0.75 && tp < 1.25 ) {
    return abs(1/cos(thetap));
  } else if( tp >= 1.25 ) {
    return abs(1/sin(thetap));
  }
  throw new Error("Invalid value for theta");
};
var cube = function(theta) {
  return piecewise([
      { range: [0, 0.3],
	fn: function(h) {
	  return functionSpace(function(h) {
	    return new Vector(h*100*cubeRadius(theta), 0);
	  })(h, theta)
	} },
      { range: [0.3, 0.7],
	fn: function(h) {
	  return functionSpace(function(h) {
	    return new Vector(cubeRadius(theta)*100, h*100);
	  })(h, theta) 
	} },
      { range: [0.7, 1],
	fn: function(h) {
	  return functionSpace(function(h) {
	    return new Vector((1-h)*100*cubeRadius(theta), 100);
	  })(h, theta) 
	} }]);
};

var stlCylinder = new Surface(
  {x: 0, y: -100, z: -50},
  [0, 0, 0],
  function(u, v) {
    var t = 2 * Math.PI * u;
    return cylinder(v, t);
  });
var stlSphere = new Surface(
  {x: 0, y: 100, z: -50},
  [0, 0, 0],
  function(u, v) {
    var t = 2 * Math.PI * u;
    return sphere(v, t);
  });
var stlCube = new Surface(
  {x: 0, y: -200, z: -50},
  [0, 0, 0],
  function(u, v) {
    var t = 2 * Math.PI * u;
    return cube(t)(v);
  });

stlCylinder.addTo(scene);
stlSphere.addTo(scene);
stlCube.addTo(scene);
controls.render();

