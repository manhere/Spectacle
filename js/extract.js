var triangleConstitutes = function(t, ts) {
  var vs = ts.map(function(t) {
    return vectorsFromVertices(t.vertices)
    }).reduce(function(a,x) {
      return a.concat(x);
      });
  for( var k in t.vertices ) {
    var tv = vectorFromVertex(t.vertices[k]);
    var within = false;
    for( var k in vs ) {
      var cv = vs[k];
      if( cv.clone().multiplyScalar(-1).add(tv).length() == 0 ) within = true;
    }
    if( !within ) return false;
  }
  return true;
};

var extensionFromOrigin = function(origin, x) {
  var resp = verticesFromVectors(x.map(function(v) {
    return v.clone().add(origin);
  }));
  return resp;
};

var addTriangle = function(origin, triangles, ps) {
  var a = ps[0].clone().multiplyScalar(-1).add(ps[1]),
      b = ps[1].clone().multiplyScalar(-1).add(ps[2]);
  triangles.push(new Triangle(
    vertexFromVector(a.clone().cross(b).normalize()), 
    extensionFromOrigin(origin, ps),
    null));
};

var extractCube = function(c, origin, triangles, vs) {
  addTriangle(origin, triangles, [vs[1], vs[2], vs[0]]);
  addTriangle(origin, triangles, [vs[3], vs[0], vs[2]]);
  addTriangle(origin, triangles, [
    vs[0].clone().add(vs[5+3]),
    vs[2].clone().add(vs[5+3]),
    vs[1].clone().add(vs[5+3])
  ]);
  addTriangle(origin, triangles, [
    vs[2].clone().add(vs[5+3]),
    vs[0].clone().add(vs[5+3]),
    vs[3].clone().add(vs[5+3])
  ]);
  addTriangle(origin, triangles, [vs[5+0], vs[5+2], vs[5+1]]);
  addTriangle(origin, triangles, [vs[5+2], vs[5+0], vs[5+3]]);
  addTriangle(origin, triangles, [
    vs[5+1].clone().add(vs[3]),
    vs[5+2].clone().add(vs[3]),
    vs[5+0].clone().add(vs[3])
  ]);
  addTriangle(origin, triangles, [
    vs[5+3].clone().add(vs[3]),
    vs[5+0].clone().add(vs[3]),
    vs[5+2].clone().add(vs[3])
  ]);
  addTriangle(origin, triangles, [
    vs[3],
    vs[3].clone().add(vs[5+3]),
    vs[0]
  ]);
  addTriangle(origin, triangles, [
    vs[5+3],
    vs[5+0],
    vs[5+3].clone().add(vs[3])
  ]);
  addTriangle(origin, triangles, [
    vs[1],
    vs[2].clone().add(vs[5+3]),
    vs[2]
  ]);
  addTriangle(origin, triangles, [
    vs[5+2],
    vs[5+2].clone().add(vs[3]),
    vs[5+1]
  ]);
  return c.filter(function(x) {
    return !triangleConstitutes(x, triangles);
  });
};

