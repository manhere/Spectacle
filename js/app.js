// renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

var scene = new THREE.Scene();
var controls = new Controls(renderer.render.bind(renderer), camera, scene);
controls.position.z = 0;
controls.position.x = -500;

var Triangle = function(normal, vertices, attr) {
  this.normal = normal;
  this.vertices = vertices;
  this.attr = attr;
};
var ReaderResponse = function(read, offset) {
  this.read = read;
  this.offset = offset;
};
var readBytes = function(buffer, offset, count) {
  // get byte values from a buffer
  return count == 0 ? [] : [buffer[offset]].concat(readBytes(buffer, offset+1, count-1));
};
var bytes = function(buffer, offset, count) {
  // get the Uint8 array form of a buffer segment
  var b = readBytes(buffer, offset, count);
  var a = new ArrayBuffer(b.length),
      view = new Uint8Array(a);
  b.forEach(function(b, i) { view[i] = b; });
  return a;
};

// A Reader constructor for iterative reading
var readArray = function(count, item) {
  return function(buffer, offset) {
    if( count == 0 ) {
      return new ReaderResponse([], offset);
    }
    var itemRead = item(buffer, offset),
        rest = readArray(count-1, item)(buffer, itemRead.offset);
    return new ReaderResponse([itemRead.read].concat(rest.read), rest.offset);
  };
};

// Readers for the header message
var readChar = function(buffer, offset) {
  return new ReaderResponse(String.fromCharCode(buffer[offset]), offset+1);
};
var readChars = function(count) {
  return function(buffer, offset) {
    var r = readArray(count, readChar)(buffer, offset);
    return new ReaderResponse(r.read.join(""), r.offset);
  };
};

// Readers for numeric data
var readUint32 = function(buffer, offset) {
  var bs = bytes(buffer, offset, 4);
  return new ReaderResponse(new Uint32Array(bs)[0], offset+4);
};
var readUint16 = function(buffer, offset) {
  var bs = bytes(buffer, offset, 2);
  return new ReaderResponse(new Uint16Array(bs)[0], offset+2);
};
var readVector = function(buffer, offset) {
  return new ReaderResponse(new Float32Array(bytes(buffer, offset, 12)), offset+12);
};

// Functions for piping reader functions
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

// A function to reduce an individual Reader's response
var perform = function(a, bytes, offset, f) {
  var r = a(bytes, offset);
  return f(r.read, r.offset);
};

// The STL binary file parser
var parse = function(bytes) {
  var meta = bind(
    readChars(80),
    readUint32,
    function(header, count) {
      return { header: header, count: count };
    });
  return perform(
    meta, bytes, 0,
    function(meta, offset) {
      var readTriangles = readArray(
        meta.count,
	bind(
	  readArray(4, readVector),
	  readUint16,
	  function(vs, attr) {
	    return new Triangle(vs[0], [1,2,3].map(function(i) { return vs[i] }), attr);
	  }));
      return {
        meta: meta,
	data: readTriangles(bytes, offset)
      };
    });
};

var handleResponse = function() {
  var bytes = new Uint8Array(this.response);
  console.log(parse(bytes).data);
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

