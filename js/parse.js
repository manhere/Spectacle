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
	data: readTriangles(bytes, offset).read
      };
    });
};

