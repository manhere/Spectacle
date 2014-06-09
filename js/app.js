// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene);
controls.position.z = 0;
controls.position.x = -200;

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
};
var handleSTL = function(evt) {
  var files = evt.target.files;
  var reader = new FileReader();
  reader.onload = function(e) {
    var bytes = new Uint8Array(e.target.result);
    var triangles = parse(bytes).data;
    renderSTL(triangles);
  };
  reader.readAsArrayBuffer(files[0]);
};
var handleJSON = function(evt) {
  var files = evt.target.files;
  var reader = new FileReader();
  reader.onload = function(e) {
    var ps = JSON.parse(e.target.result), fs = [];
    for( var i = 0; i < ps.length-1; i++ ) {
      for( var j = 0; j < ps[i].length-1; j++ ) {
        var aa = ps[i][j], ab = ps[i][j+1], ba = ps[i+1][j+1], bb = ps[i+1][j+1];
        fs.push(new Triangle(null, [aa, ab, bb], 0));
        fs.push(new Triangle(null, [bb, ba, aa], 0));
      }
    }
    renderSTL(fs);
  };
  reader.readAsBinaryString(files[0]);
};
document.getElementById('files').addEventListener('change', handleSTL, false);
document.getElementById('json').addEventListener('change', handleJSON, false);

controls.render();

