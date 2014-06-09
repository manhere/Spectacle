// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene);

var vectorFromVertex = function(v) {
  return new THREE.Vector3(v[0], v[1], v[2]);
};
var vectorsFromVertices = function(vs) {
  return vs.map(vectorFromVertex);
};
var renderSTL = function(triangles) {
  var geo = new THREE.Geometry();
  triangles.forEach(function(triangle, i) {
    var vs = vectorsFromVertices(triangle.vertices);
    [].push.apply(geo.vertices, vs);
    geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2));
    geo.computeFaceNormals();
  });
  var object = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
  object.overdraw = true;
  object.position.x = 0;
  object.position.y = 0;
  object.position.z = 0;
  scene.add(object);
  triangles.forEach(function(triangle) {
    scene.add(
      drawVector(
        vectorsFromVertices(triangle.vertices)[0], 
	vectorFromVertex(triangle.normal).normalize().multiplyScalar(10)));
  });
};
var handleSTL = function(evt) {
  var files = evt.target.files;
  var reader = new FileReader();
  reader.onload = function(e) {
    var bytes = new Uint8Array(e.target.result);
    var triangles = parse(bytes).data;
    renderSTL(triangles);
  };
  scene.children.map(scene.remove.bind(scene));
  reader.readAsArrayBuffer(files[0]);
};
document.getElementById('files').addEventListener('change', handleSTL, false);

controls.render();

