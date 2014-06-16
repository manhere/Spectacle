var splitComposite = function(c) {
  if( c.length < 12 ) return [c];

  var vs = c.map(function(x) {
    return x.vertices;
  }).reduce(function(a,x) {
    return a.concat(x);
  });
  var center = vectorsFromVertices(vs).reduce(function(a,x) {
    return a.add(x);
  }).multiplyScalar(1/vs.length);

  if( recognizePrimitiveShape(c, center).match(/^Cu/) ) {
    var arrows = c.map(function(x) {
      var vs = x.vertices;
      return [vs.slice(0,2), vs.slice(1)];
    }).reduce(function(a,x) {
      return a.concat(x);
    });

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

    arrows = getArrows(addArrows({}, arrows)).map(vectorsFromVertices);
    var seed = arrows[2][0];
    var loops = findLoops(arrows, [seed]).filter(function(l) {
      for( var i = 1; i < 4; i++ )
        if( !rightAngle(l[i-1], l[i], l[i+1]) ) return false;
      return true;
    });
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

    var perimeter = function(vs) {
      var seed = vs[0], p = 0;
      vs.slice(1).forEach(function(v) {
        p += v.clone().add(seed.clone().multiplyScalar(-1)).length();
      });
      return p;
    };

    var offshoots = loops.map(function(p) { return p.slice(0,2); });
    var offshotDirections = offshoots.map(function(vs) {
      return vs[1].clone().add(vs[0].clone().multiplyScalar(-1)).normalize();
    });
    var uniqueOffshoots = vectorsFromVertices(
      getPoints(addPoints({}, offshotDirections.map(function(v){return [v.x, v.y, v.z]}))));

    // the basis will have four, for example, when a point
    // sits as part of two cubes
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

    var primeLoops = pairs.map(function(x) { return x[0]; });
    var secondLoops = pairs.map(function(x) { return x[1]; });

    var selectedLoops = [[], []];
    shapeBasis.forEach(function(d) {
      var prospects = primeLoops.filter(function(l) {
	var seed = l[0].clone().multiplyScalar(-1);
        return l[1].clone().add(seed).normalize().dot(d.clone()) == 1;
      });
      // the prospects from the counter-clockwise loops
      var prospects2 = secondLoops.filter(function(l) {
	var seed = l[0].clone().multiplyScalar(-1);
        return l[1].clone().add(seed).normalize().dot(d.clone()) == 1;
      });

      selectedLoops = prospects.map(function(p) {
        return [primeLoops.indexOf(p), secondLoops.indexOf(p)];
      }).reduce(function(a, indices) {
	var i = indices[0], j = indices[1];
        return [a[0].concat(i == -1 ? [] : [i]), a[1].concat(j == -1 ? [] : [j])];
      }, selectedLoops);
    });
    var faces = selectedLoops[0].map(function(i) {
      return primeLoops[i];
    });

    var facetsOverlap = function(a, b) {
      var count = 0;
      for( var k in a ) {
	var x = a[k], y = b[k];
	if( x.x == y.x && x.y == y.y && x.z == y.z ) count += 1;
      }
      return count == 3;
    };

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

    var origin = shapes[0][0][0];
    var shapeBasis = shapes[0].slice(0,2).map(function(f) {
      return f.map(function(p) {
        return p.clone().add(origin.clone().multiplyScalar(-1));
      });
    });
    console.log(shapeBasis.map(function(f) {
      return f;
    }).map(renderMatrix).join("\n\n"));
    var extensionFromOrigin = function(x) {
      var resp = verticesFromVectors(x.map(function(v) {
        return v.clone().add(origin);
      }));
      return resp;
    };
    var triangles = [];
    var addTriangle = function(triangles, ps) {
      var a = ps[0].clone().multiplyScalar(-1).add(ps[1]),
          b = ps[1].clone().multiplyScalar(-1).add(ps[2]);
      triangles.push(new Triangle(
	vertexFromVector(a.clone().cross(b).normalize()), 
	extensionFromOrigin(ps),
	null));
    };
    var triangleConstitutes = function(t, ts) {
      var vs = ts.map(function(t) { return vectorsFromVertices(t.vertices) }).reduce(function(a,x) { return a.concat(x); });
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
    var extractCube = function(triangles, vs) {
      addTriangle(triangles, [vs[1], vs[2], vs[0]]);
      addTriangle(triangles, [vs[3], vs[0], vs[2]]);
      addTriangle(triangles, [
	vs[0].clone().add(vs[5+3]),
	vs[2].clone().add(vs[5+3]),
	vs[1].clone().add(vs[5+3])
      ]);
      addTriangle(triangles, [
	vs[2].clone().add(vs[5+3]),
	vs[0].clone().add(vs[5+3]),
	vs[3].clone().add(vs[5+3])
      ]);
      addTriangle(triangles, [vs[5+0], vs[5+2], vs[5+1]]);
      addTriangle(triangles, [vs[5+2], vs[5+0], vs[5+3]]);
      addTriangle(triangles, [
	vs[5+1].clone().add(vs[3]),
	vs[5+2].clone().add(vs[3]),
	vs[5+0].clone().add(vs[3])
      ]);
      addTriangle(triangles, [
	vs[5+3].clone().add(vs[3]),
	vs[5+0].clone().add(vs[3]),
	vs[5+2].clone().add(vs[3])
      ]);
      addTriangle(triangles, [
	vs[3],
	vs[3].clone().add(vs[5+3]),
	vs[0]
      ]);
      addTriangle(triangles, [
	vs[5+3],
	vs[5+0],
	vs[5+3].clone().add(vs[3])
      ]);
      addTriangle(triangles, [
	vs[1],
	vs[2].clone().add(vs[5+3]),
	vs[2]
      ]);
      addTriangle(triangles, [
	vs[5+2],
	vs[5+2].clone().add(vs[3]),
	vs[5+1]
      ]);
      return c.filter(function(x) { return !triangleConstitutes(x, triangles); });
    };

    var restTriangles = extractCube(triangles, shapeBasis[0].concat(shapeBasis[1]));
    return [triangles].concat(splitComposite(restTriangles));
  } else {
    return [c];
  }
};

