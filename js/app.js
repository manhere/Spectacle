// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 6000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene);

var vectorFromVertex = function(v) {
  return new THREE.Vector3(v[0], v[1], v[2]);
};
var vectorsFromVertices = function(vs) {
  return vs.map(vectorFromVertex);
};
var objectNames = [];
var listenForObjectSelect = function() {
  [].forEach.call(
    document.querySelectorAll("#objects a"),
    function(a) {
      a.addEventListener("click", function(evt) {
        var focus = a.innerText;
        evt.preventDefault();
	objectNames.forEach(function(name) {
	  if( name == focus ) {
	    scene.getObjectByName(name).material = new THREE.MeshNormalMaterial();
	  } else {
	    scene.getObjectByName(name).material = new THREE.MeshBasicMaterial({
	      color: 0xc4c4c4, wireframe: true, wireframe_linewidth: 10
	    });
	  }
	});
      });
    });
};
var renderNames = function(names) {
  var objects = document.getElementById("objects");
  objects.innerHTML = "";
  var ul = document.createElement("ul");
  var span = document.createElement("span");
  span.innerText = "Select an object";
  objects.appendChild(span);
  names.map(function(n) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.innerText = n;
    a.href = "#";
    li.appendChild(a);
    return li;
  }).forEach(function(li) {
    ul.appendChild(li);
  });
  objects.appendChild(ul);
  listenForObjectSelect();
};
var renderSTL = function(triangles, name) {
  var geo = new THREE.Geometry();
  triangles.forEach(function(triangle, i) {
    var vs = vectorsFromVertices(triangle.vertices);
    [].push.apply(geo.vertices, vs);
    geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2));
  });
  geo.computeFaceNormals();
  var object = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
  object.name = name;
  object.overdraw = true;
  object.position.x = 0;
  object.position.y = 0;
  object.position.z = 0;
  scene.add(object);
  objectNames.push(name);
  renderNames(objectNames);
};
var handleSTL = function(evt) {
  [].forEach.call(evt.target.files, function(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var bytes = new Uint8Array(e.target.result);
      var triangles = parse(bytes).data;
      renderSTL(triangles, file.name);
    };
    reader.readAsArrayBuffer(file);
  });
};
document.getElementById('files').addEventListener('change', handleSTL, false);

controls.render();

