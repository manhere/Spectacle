var calculateCenter = function(ts) {
  var vs = ts.map(function(x) {
    return x.vertices;
  }).reduce(function(a,x) {
    return a.concat(x);
  });
  var center = vectorsFromVertices(vs).reduce(function(a,x) {
    return a.add(x);
  }).multiplyScalar(1/vs.length);
  return center;
};

var loopEqual = function(a, b) {
  for( var k in a ) {
    var x = a[k], y = b[k];
    if( !(Math.abs(x.x - y.x) <= 0.01 &&
	  Math.abs(x.y - y.y) <= 0.01 &&
	  Math.abs(x.z - y.z) <= 0.01 ) ) return false;
  }
  return true;
};

var rightAngle = function(x, y, z) {
  var a = x.clone().add(y.clone().multiplyScalar(-1)),
      b = y.clone().add(z.clone().multiplyScalar(-1));
  return a.clone().dot(b.clone()) == 0;
};

var facetsOverlap = function(a, b) {
  var count = 0;
  for( var k in a ) {
    var x = a[k], y = b[k];
    if( x.x == y.x && x.y == y.y && x.z == y.z ) count += 1;
  }
  return count == 3;
};

var splitComposite = function(c) {
  // require at least 12 facets and that the shape be cuboid
  if( c.length < 12 ) return [c];
  if( !recognizePrimitiveShape(c, calculateCenter(c)).match(/^Cu/) ) return [c];

  // form a list of edges and then make unique with a hashmap
  var arrows = c.map(function(x) {
    var vs = x.vertices;
    return [vs.slice(0,2), vs.slice(1)];
  }).reduce(function(a,x) {
    return a.concat(x);
  });
  arrows = getArrows(addArrows({}, arrows)).map(vectorsFromVertices);

  // find circuits emanating from the seed vertex with
  // four vertices and all edges orthogonal.
  var seed = arrows[0][0];
  var loops = findLoops(arrows, [seed]).filter(function(l) {
    for( var i = 1; i < 4; i++ )
      if( !rightAngle(l[i-1], l[i], l[i+1]) ) return false;
    return true;
  });

  // couple loops which are each other's reverse
  var revs = [], pairs = [];
  for( var k in loops ) {
    var l = loops[k];
    if( revs.filter(function(rev) { return loopEqual(rev, l) }).length == 0 ) {
      var rev = findReverse(loops, l);
      if( rev ) {
	revs.push(rev);
	pairs.push([l, rev]);
      }
    }
  }

  // the two corresponding lists of loops
  var primeLoops = pairs.map(function(x) { return x[0]; });
  var secondLoops = pairs.map(function(x) { return x[1]; });

  // find the unique directions in which loops begin
  var offshoots = loops.map(function(p) { return p.slice(0,2); });
  var offshotDirections = offshoots.map(function(vs) {
    return vs[1].clone().add(vs[0].clone().multiplyScalar(-1)).normalize();
  });
  var uniqueOffshoots = vectorsFromVertices(
    getPoints(addPoints({}, offshotDirections.map(function(v){return [v.x, v.y, v.z]}))));

  // find the basis of the vertex, that is, pull out the
  // mutually orthogonal triple of `offshoot directions`
  var shapeBasis = uniqueOffshoots.map(function(x, j) {
    return uniqueOffshoots.map(function(y, i) {
      if( i == j ) return [i];
      return x.clone().normalize().dot(y.clone().normalize()) == 0 ? [i] : null;
    }).filter(function(x) { return x; }).map(function(x) { return x[0]; });
  }).map(
    function(orthos, i) {
      return [orthos.length, i]
      }).filter(
	function(x) {
	  return x[0] >= 3;
	}).map(function(x) { return uniqueOffshoots[x[1]]; });

  // select the loops which begin in one of the directions of
  // the basis; these are our faces.
  var selectedLoops = [];
  shapeBasis.forEach(function(d) {
    var prospects = primeLoops.filter(function(l) {
      var seed = l[0].clone().multiplyScalar(-1);
      return l[1].clone().add(seed).normalize().dot(d.clone()) == 1;
    });
    selectedLoops = selectedLoops.concat(prospects.map(function(p) {
      return primeLoops.indexOf(p);
    }));
  });
  var faces = selectedLoops.map(function(i) {
    return primeLoops[i];
  });

  // group faces into separate shapes based on whether they share
  // enough vertices with the current set of faces in a shape.
  var shapes = [];
  faces.forEach(function(face) {
    var added = false;
    shapes.forEach(function(shape) {
      if( added ) return;
      var fits = shape.filter(
	facetsOverlap.bind({}, face)).length == shape.length;
      if( fits ) {
	shape.push(face);
	added = true;
      }
    });
    if( !added ) shapes.push([face]);
  });
  shapes = shapes.sort(function(a,b) { return b.length - a.length });

  // take the first vertex of the first face of the first shape; this
  // will serve as the origin from which we calculate the first shape's
  // basis
  var origin = shapes[0][0][0];
  var primeShapeBasis = shapes[0].slice(0,2).map(function(f) {
    return f.map(function(p) {
      return p.clone().add(origin.clone().multiplyScalar(-1));
    });
  });

  // form a list of triangles which compose the shape, pull them from the
  // list of input triangles, and recurse with those that remain.
  var triangles = [];
  var restTriangles = extractCube(c, origin, triangles, primeShapeBasis[0].concat(primeShapeBasis[1]));
  return [triangles].concat(splitComposite(restTriangles));
};

