// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 6000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene, renderer.domElement);

var listenForObjectSelect = function(objects) {
  [].forEach.call(
    document.querySelectorAll("#objects a"),
    function(a) {
      a.addEventListener("click", function(evt) {
        evt.preventDefault();
	renderFocus(a.href.split('#')[1]);
      });
    });
};
var renderObjects = function(objects) {
  var wrapper = document.getElementById("objects");
  wrapper.innerHTML = "";
  var ul = document.createElement("ul");
  var span = document.createElement("span");
  span.innerText = "Select an object";
  wrapper.appendChild(span);
  objects.filter(function(o) {
    return o.visible;
  }).concat([{name:"*", type:""}]).map(function(o) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.innerHTML = o.name + "<span class=\"details\">" + (o.type ? " ["+o.type+"]" : "") + "</span>";
    a.href = "#"+o.name;
    a.className = o.active ? "active" : "";
    li.appendChild(a);
    return li;
  }).forEach(function(li) {
    ul.appendChild(li);
  });
  wrapper.appendChild(ul);
  listenForObjectSelect(objects);
};

var mutators = (function() {
  var objects = [];
  var focus = "*";
  var ranges = [[6000, -6000], [6000, -6000], [6000, -6000]];
  var withinBounds = function(object) {
    var inputs = [].map.call(
      document.querySelectorAll("#visibleRange input"),
      function(range, i) {
	var maxmin = ranges[Math.floor(i/2)];
	return range.value/100 * (maxmin[1] - maxmin[0]) + maxmin[0];
      });
    var p = object.position, x = p.x, y = p.y, z = p.z;
    return segment(inputs, 2).map(function(range, i) {
      return inRange(range, [x,y,z][i]);
    }).reduce(function(a, x) { return a && x; }, true);
  };
  var renderFocusAndVisibilityOfObjects = function(f) {
    focus = typeof f == 'string' ? f : focus;
    objects.forEach(function(object) {
      var name = object.name;
      if( !withinBounds(object) ) {
	object.visible = false;
	object.active = false;
	scene.getObjectByName(name).visible = false;
      } else if( name == focus || focus == "*" ) {
	object.visible = true;
	object.active = true;
	scene.getObjectByName(name).visible = true;
	scene.getObjectByName(name).material = new THREE.MeshNormalMaterial();
      } else {
	object.visible = true;
	object.active = false;
	scene.getObjectByName(name).visible = true;
	scene.getObjectByName(name).material = new THREE.MeshBasicMaterial({
	  color: 0xc4c4c4, wireframe: true, wireframe_linewidth: 10
	});
      }
    });
    renderObjects(objects);
  };
  var renderSTL = function(triangles, name) {
    var geo = new THREE.Geometry();
    var allVs = [];
    triangles.forEach(function(triangle, i) {
      var vs = vectorsFromVertices(triangle.vertices);
      [].push.apply(allVs, vs);
      [].push.apply(geo.vertices, vs);
      geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2, vectorFromVertex(triangle.normal)));
    });
    var object = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
    object.name = name;
    object.overdraw = true;
    object.position.x = 0;
    object.position.y = 0;
    object.position.z = 0;
    scene.add(object);

    var center = allVs.reduce(function(a, x) {
      return a.add(x);
    }, new THREE.Vector3(0,0,0)).multiplyScalar(1/allVs.length);

    // update max and min
    ranges = ranges.map(function(range, i) {
      var p = [center.x, center.y, center.z][i];
      return [Math.min(p, range[0]), Math.max(p, range[1])];
    });

    // update and render object list
    objects.push({ name: name,
      position: center,
      type: recognizePrimitiveShape(triangles, center),
      active: focus == "*",
      visible: true });
    renderObjects(objects);
  };
  return { renderSTL: renderSTL,
    withinBounds: withinBounds,
    renderFocus: renderFocusAndVisibilityOfObjects };
}());
var renderSTL = mutators.renderSTL,
    withinBounds = mutators.withinBounds,
    renderFocus = mutators.renderFocus;

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
[].forEach.call(
  document.querySelectorAll("#visibleRange input"),
  function(range) {
    range.addEventListener("input", renderFocus);
    range.addEventListener("change", renderFocus);
  });

controls.render();

