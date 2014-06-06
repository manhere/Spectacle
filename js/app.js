// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene);
controls.position.z = 0;
controls.position.x = -500;

var rowLength = ps[0].length;
var rowCount = ps.length;
var stlCube = new Surface(
  {x: 0, y: 0, z: -50},
  [0, 0, 0],
  function(u, v) {
    var i = Math.floor(u * (rowLength-1)),
        j = Math.floor(v * (rowCount-1));
    try {
      var p = ps[j][i];
      return new THREE.Vector3(p[0], p[1], p[2]);
    } catch(e) {
      throw new Error(j+"/"+rowCount+", "+i+"/"+rowLength+" failed.");
    }
  });

stlCube.addTo(scene);
controls.render();

