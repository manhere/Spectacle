// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene);
controls.position.z = 0;
controls.position.x = -500;

var ReaderResponse = function(read, offset) {
  this.read = read;
  this.offset = offset;
};
var readChar = function(buffer, offset) {
  return new ReaderResponse(String.fromCharCode(buffer[offset]), offset+1);
};
var readChars = function(count) {
  return function(buffer, offset) {
    if( count == 0 ) {
      return new ReaderResponse("", offset);
    } else {
      var read = readChar(buffer, offset),
	  rest = readChars(count-1)(buffer, offset+1);
      return new ReaderResponse(read.read + rest.read, rest.offset);
    }
  };
};
var readUint32 = function(buffer, offset) {
  var bs = bytes(buffer, offset, 4);
  return new ReaderResponse(new Uint32Array(bs)[0], offset+4);
};
var readUint16 = function(buffer, offset) {
  var bs = bytes(buffer, offset, 2);
  return new ReaderResponse(new Uint16Array(bs)[0], offset+2);
};
var readBytes = function(buffer, offset, count) {
  return count == 0 ? [] : [buffer[offset]].concat(readBytes(buffer, offset+1, count-1));
};
var bytes = function(buffer, offset, count) {
  var b = readBytes(buffer, offset, count);
  var a = new ArrayBuffer(b.length),
      view = new Uint8Array(a);
  b.forEach(function(b, i) { view[i] = b; });
  return a;
};
var readVector = function(buffer, offset) {
  return new ReaderResponse(new Float32Array(bytes(buffer, offset, 12)), offset+12);
};
var readVectors = function(count) {
  return function(buffer, offset) {
    if( count == 0 ) {
      return new ReaderResponse([], offset);
    }
    var vector = readVector(buffer, offset),
        rest = readVectors(count-1)(buffer, vector.offset);
    return new ReaderResponse([vector.read].concat(rest.read), rest.offset);
  };
};
var bind = function(readA, readB, joiner) {
  return function(buffer, offset) {
    var A = readA(buffer, offset),
	B = readB(buffer, A.offset);
    return new ReaderResponse(joiner(A.read, B.read), B.offset);
  };
};
var binds = function(reads, joiner) {
  if(reads.length == 2) {
    return bind(reads[0], reads[1], joiner);
  } else {
    return bind(reads[0], binds(reads.slice(1), joiner), joiner);
  }
};
var perform = function(a, bytes, offset, f) {
  var r = a(bytes, offset);
  return f(r.read, r.offset);
};
var floatFromHex = function(hexString) {
  var a = new ArrayBuffer(4);
  var view = new Uint8Array(a);
  var bytes = hexString.replace(/\s/g, "").match(/../g);
  view[0] = parseInt(bytes[0], 16);
  view[1] = parseInt(bytes[1], 16);
  view[2] = parseInt(bytes[2], 16);
  view[3] = parseInt(bytes[3], 16);
  return new Float32Array(a)[0];
};
var Triangle = function(normal, vertices, attr) {
  this.normal = normal;
  this.vertices = vertices;
  this.attr = attr;
};
var handleResponse = function() {
  var bytes = new Uint8Array(this.response);
  var meta = bind(
    readChars(80),
    readUint32,
    function(header, count) {
      return { header: header, count: count };
    });
  perform(
    meta, bytes, 0,
    function(read, offset) {
      var count = read.count;
      bind(
        readVectors(4),
	readUint16,
	function(vs, attr) {
	  var triangle = new Triangle(vs[0], [1,2,3].map(function(i) { return vs[i] }), attr);
	  console.log(triangle);
	})(bytes, offset);
    });
};
var req = new XMLHttpRequest();
req.onload = handleResponse;
req.open("get", "http://localhost:8080/sphere.stl", true);
req.responseType = 'arraybuffer';
req.send();

/*
var rowLength = ps[0].length;
var rowCount = ps.length;
var stlCube = new Surface(
  {x: 0, y: 0, z: -50},
  [rowLength, rowCount],
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
*/
controls.render();

