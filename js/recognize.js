var recognizePrimitiveShape = function(triangles, center) {
  // Find the unique directions in which facets point.
  var uniqueNormals = [], Epsilon = 0.01;
  var nearEqual = function(a, b) {
    return Math.abs((a-b)/a) <= 0.05;
  };
  triangles.forEach(function(t) {
    var n = vectorFromVertex(t.normal);
    for( var k in uniqueNormals ) {
      var normal = uniqueNormals[k];
      if( normal.clone().add(n.clone().multiplyScalar(-1)).length() <= Epsilon ) return;
    }
    uniqueNormals.push(n);
  });

  // Calculate the structure of these directions in relation to one another.
  var orthogonalCounts = uniqueNormals.map(function(n1) {
    return uniqueNormals.filter(function(n2) {
      return n1.clone().dot(n2.clone()) == 0;
    }).length;
  }).sort(function(a,b) { return b-a; });
  var isConstant = function(xs, base) {
    base = typeof base == 'undefined' ? xs[0] : base;
    return xs.filter(function(x) { return Math.abs(x - base) > 1; }).length == 0;
  };

  var ps = triangles.map(function(t) {
    return vectorsFromVertices(t.vertices);
  }).reduce(function(a, b) {
    return a.concat(b);
  }, []);
  var deviations = ps.map(function(p) {
    return p.clone().add(center.clone().multiplyScalar(-1));
  });

  // Conclude the type of primitive
  var type;
  var d = vectorMax(deviations).add(vectorMin(deviations).multiplyScalar(-1));
  if(isConstant(orthogonalCounts, 4) &&
     uniqueNormals.length == 6) {
    return "Cu " + [d.x, d.y, d.z].join("x");
  } else if(
    isConstant(orthogonalCounts.slice(0,2)) &&
    isConstant(orthogonalCounts.slice(2)) &&
    !isConstant(orthogonalCounts) ) {
    var measures = nearEqual(d.x, d.y) ?
      [d.z, Math.round((d.x+d.y)/4)] :
      (nearEqual(d.x, d.z) ?
        [d.y, Math.round((d.x+d.z)/4)] :
	[d.x, Math.round((d.z+d.y)/4)]);
    return "Cy " + measures.join("@");
  } else if(isConstant(orthogonalCounts)) {
    return "S @" + Math.round((d.x+d.y+d.z)/6);
  } else {
    return "Unk";
  }
};

