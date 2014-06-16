// Data Structures
// ===============
var Triangle = function(normal, vertices, attr) {
  // [Float] x [[Float]] x Int
  this.normal = normal;
  this.vertices = vertices;
  this.attr = attr;
};
var ReaderResponse = function(read, offset) {
  // a x Int
  this.read = read;
  this.offset = offset;
};
var STLMeta = function(header, count) {
  // String x Int
  this.header = header;
  this.count = count;
};
var STLContent = function(meta, triangles) {
  // STLMeta x [Triangle]
  this.meta = meta;
  this.data = triangles;
};

// Functions
// =========
var readBytes = function(buffer, offset, count) {
  // ArrayBuffer -> Int -> Int -> [Byte]
  var bs = [];
  for( var i = 0; i < count; i++ ) { bs.push(buffer[offset+i]); }
  return bs;
};
var bytes = function(buffer, offset, count) {
  // ArrayBuffer -> Int -> Int -> ArrayBuffer
  var b = readBytes(buffer, offset, count);
  var a = new ArrayBuffer(b.length),
      view = new Uint8Array(a);
  b.forEach(function(b, i) { view[i] = b; });
  return a;
};


var bind = function(readA, readB, joiner) {
  // (ArrayBuffer -> Int -> ReaderResponse(a)) -> (ArrayBuffer -> Int -> ReaderResponse(b)) -> (a -> b -> c) -> ReaderResponse(c)
  return function(buffer, offset) {
    var A = readA(buffer, offset),
	B = readB(buffer, A.offset);
    return new ReaderResponse(joiner(A.read, B.read), B.offset);
  };
};
var readArray = function(count, item) {
  // Int -> (ArrayBuffer -> Int -> a) -> (ArrayBuffer -> Int -> [a])
  return function(buffer, offset) {
    var xs = [];
    for(var i = 0; i < count; i++) {
      var read = item(buffer, offset);
      offset = read.offset;
      xs.push(read.read);
    }
    return new ReaderResponse(xs, offset);
  };
};

var readChar = function(buffer, offset) {
  // ArrayBuffer -> Int -> ReaderResponse(String)
  return new ReaderResponse(String.fromCharCode(buffer[offset]), offset+1);
};
var readChars = function(count) {
  // Int -> ArrayBuffer -> Int -> ReaderResponse(String)
  return function(buffer, offset) {
    var r = readArray(count, readChar)(buffer, offset);
    return new ReaderResponse(r.read.join(""), r.offset);
  };
};

var readUint32 = function(buffer, offset) {
  // ArrayBuffer -> Int -> ReaderResponse(Uint32)
  return new ReaderResponse(new Uint32Array(bytes(buffer, offset, 4))[0], offset+4);
};
var readUint16 = function(buffer, offset) {
  // ArrayBuffer -> Int -> ReaderResponse(Uint16)
  return new ReaderResponse(new Uint16Array(bytes(buffer, offset, 2))[0], offset+2);
};
var readVector = function(buffer, offset) {
  // ArrayBuffer -> Int -> ReaderResponse([Float32])
  return new ReaderResponse(new Float32Array(bytes(buffer, offset, 12)), offset+12);
};

var perform = function(a, bytes, offset, f) {
  // (ArrayBuffer -> Int -> ReaderResponse(a)) -> ArrayBuffer -> Int -> (a -> Int -> b) -> b
  var r = a(bytes, offset);
  return f(r.read, r.offset);
};

var readTriangle = function(buffer, offset) {
  var vResp = readArray(4, readVector)(buffer, offset),
      vs = vResp.read,
      attrResp = readUint16(buffer, vResp.offset),
      attr = attrResp.read,
      bump = attrResp.offset;
  var n = vs[0], v1 = vs[1], v2 = vs[2], v3 = vs[3];
  return new ReaderResponse(new Triangle(n, [v1, v2, v3], attr), bump);
};

var parse = function(bytes) {
  // ArrayBuffer -> STLContent
  var meta = bind(
    readChars(80),
    readUint32,
    function(header, count) {
      return new STLMeta(header, count);
    });
  return perform(
    meta, bytes, 0,
    function(meta, offset) {
      var readTriangles = readArray(
	Math.min(meta.count, 6000),
	readTriangle);
      return new STLContent(meta, readTriangles(bytes, offset).read);
    });
};

