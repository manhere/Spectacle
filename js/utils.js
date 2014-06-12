var cos = Math.cos.bind(Math);
var sin = Math.sin.bind(Math);
var tan = Math.tan.bind(Math);
var abs = Math.abs.bind(Math);
var normalize = function(vec) {
  return vec.map(divideBy(sqrt(vec.map(square).reduce(sum, 0))));
};
var divideBy = function(x) {
  return function(y) {
    return y/x;
  };
};
var sqrt = Math.sqrt.bind(Math);
var square = function(x) {
  return x*x;
};
var sum = function(a, b) {
  return a + b;
};
var match = function(maps, elm) {
  return maps.reduce(function(fn, map) {
    return fn || 
      (elm instanceof map[0] ? 
       map[1] : 
       undefined);
  }, undefined);
};
var inRange = function(range, x) {
  // JavaScript floats are too annoying, compare ints
  return Math.floor(x) >= Math.floor(range[0])
    && Math.floor(x) <= Math.floor(range[1]);
};
var vectorFromVertex = function(v) {
  return new THREE.Vector3(v[0], v[1], v[2]);
};
var vectorsFromVertices = function(vs) {
  return vs.map(vectorFromVertex);
};
var segment = function(xs, size) {
  if( xs.length <= size ) {
    return [xs];
  } else {
    return [xs.slice(0,2)].concat(segment(xs.slice(2), size));
  }
};
var Vector = function(x, y) {
  this.x = x;
  this.y = y;
};
Vector.prototype = {
  add: function(v2) {
    return new Vector(v2.x+this.x, v2.y+this.y);
  },
  mult: function(x) {
    return new Vector(x*this.x, x*this.y);
  }
};
var _2 = function(x) { return x*x; },
    _3 = function(x) { return _2(x)*x; };
var bezier = function(p0, p1, p2, p3) {
  p0 = new Vector(p0[0], p0[1]);
  p1 = new Vector(p1[0], p1[1]);
  p2 = new Vector(p2[0], p2[1]);
  p3 = new Vector(p3[0], p3[1]);
  return function(t) {
    return p0.mult(_3(1-t)).add(
           p1.mult(_2(1-t)*t*3)).add(
	   p2.mult((1-t)*_2(t)*3)).add(
	   p3.mult(_3(t)));
  };
};
var vectorLine = function(x, y, dx, dy) {
  return function(s) {
    return (new Vector(x, y)).add(
	   (new Vector(dx, dy)).mult(s));
  };
};
var piecewise = function(fns) {
  return function(x) {
    var fn = fns.filter(function(fn) {
      return x >= fn.range[0] && x <= fn.range[1];
    }).pop();
    return fn.fn((x-fn.range[0])/(fn.range[1]-fn.range[0]));
  };
};
var revolvingParametric = function(f) {
  return function(h, theta) {
    return new THREE.Vector3(
      cos(theta) * f(h).x,
      sin(theta) * f(h).x,
      f(h).y);
  };
};
var drawLine = function(d, to) {
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  geometry.vertices.push(to);
  var colors = [0xff0000, 0x00ff00, 0x0000ff];
  var material = new THREE.LineBasicMaterial({ color: colors[d] });
  return new THREE.Line(geometry, material);
};
var drawVector = function(pos, v) {
  var geometry = new THREE.Geometry();
  geometry.vertices.push(pos);
  geometry.vertices.push(pos.clone().add(v));
  var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  return new THREE.Line(geometry, material);
};
var drawVectorLine = function(pos, to) {
  var geometry = new THREE.Geometry();
  geometry.vertices.push(pos);
  geometry.vertices.push(to);
  var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  return new THREE.Line(geometry, material);
};
var formZeroBasis = function(x, y, z) {
  if( x && y && z ) {
    throw new Error("Cannot form basis around null.");
  } else if( x && y ) {
    return [new THREE.Vector3(1, 0, 0),
	    new THREE.Vector3(0, 1, 0),
	    new THREE.Vector3(0, 0, 1)];
  } else if( y && z ) {
    return [new THREE.Vector3(0, 1, 0),
	    new THREE.Vector3(0, 0, 1),
	    new THREE.Vector3(1, 0, 0)];
  } else if( x && z ) {
    return [new THREE.Vector3(0, 0, 1),
	    new THREE.Vector3(1, 0, 0),
	    new THREE.Vector3(0, 1, 0)];
  } else {
    return false;
  }
};
var formBasis = function(n) {
  var b = null;
  if( (b = formZeroBasis(n.x == 0, n.y == 0, n.z == 0)) ) {
    return b;
  }
  var zprime = n.clone();
  zprime.normalize();
  var xprime;
  if( zprime.z == 0 ) {
    xprime = new THREE.Vector3(-zprime.y/zprime.x, 1, 0);
  } else {
    xprime = new THREE.Vector3(0, 1, -zprime.y/zprime.z);
  }
  xprime.normalize();
  var yprime = new THREE.Vector3();
  yprime.crossVectors(zprime, xprime);
  yprime.normalize();
  return [xprime, yprime, zprime];
};
var inBasis = function(basis, x, y, z) {
  return basis[0].multiplyScalar(x).add(
           basis[1].multiplyScalar(y).add(
	     basis[2].multiplyScalar(z)));
};
var renderLines = function(ls, scene) {
  ls.map(function(v) {
    return v.clone().multiplyScalar(100);
  }).map(function(v, d) {
    return drawLine(d, v);
  }).forEach(function(l) {
    scene.add(l);
  });
};
var surfaceBasisTransformer = function(basis) {
  var xprime = basis[0];
  var yprime = basis[1];
  var zprime = basis[2];
  return function(f) {
    return function(h, theta) {
      return xprime.clone().multiplyScalar(cos(theta) * f(h).x).add(
	     yprime.clone().multiplyScalar(sin(theta) * f(h).x).add(
	     zprime.clone().multiplyScalar(f(h).y)));
    };
  };
};
var spliceVectors = function(vs) {
  return [
    vs.map(function(v) { return v.x; }),
    vs.map(function(v) { return v.y; }),
    vs.map(function(v) { return v.z; })];
};
var vectorMax = function(vs) {
  return vectorFromVertex(spliceVectors(vs).map(function(xs) {
    return Math.max.apply(Math, xs);
  }));
};
var vectorMin = function(vs) {
  return vectorFromVertex(spliceVectors(vs).map(function(xs) {
    return Math.min.apply(Math, xs);
  }));
};
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
  });
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
    // NB. not sufficient to distinguish from an unknown shape
    return "S @" + Math.round((d.x+d.y+d.z)/6);
  } else {
    return "Unk";
  }
};
var hashVector = function(x, y, z) {
  var xp = x*100 | 0,
      yp = y*100 | 0,
      zp = z*100 | 0;
  return [xp, yp, zp].join(",");
};
var hashArrow = function(a, b) {
  var ha = hashVector.apply([], a),
      hb = hashVector.apply([], b);
  return ha > hb ? ha + "->" + hb : hb + "->" + ha;
};
var addPoint = function(points, x) {
  var k = hashVector.apply({}, x);
  points[k] = true;
  return points;
};
var addPoints = function(points, xs) {
  for(var i in xs) {
    var x = xs[i];
    points = addPoint(points, x);
  }
  return points;
};
var addArrow = function(points, x) {
  var k = hashArrow.apply({}, x);
  points[k] = true;
  return points;
};
var addArrows = function(points, xs) {
  for(var i in xs) {
    var x = xs[i];
    points = addArrow(points, x);
  }
  return points;
};
var hasPoint = function(points, x) {
  var k = hashVector.apply({}, x);
  return points[k];
};
var hasAnyPoint = function(points, xs) {
  return xs.map(
    hasPoint.bind({}, points)).reduce(
      function(a,b){
	return a||b
      });
};
var getPoints = function(points) {
  var xs = [];
  for( var p in points ) {
    xs.push(p.split(",").map(function(x) {
      return parseFloat(x, 10)/100;
    }));
  }
  return xs;
};
var getArrows = function(points) {
  var xs = [];
  for( var p in points ) {
    xs.push(p.split("->").map(function(x) {
      var ps = {};
      ps[x] = true;
      return getPoints(ps)[0];
    }));
  }
  return xs;
};
var findCompositeFacets = function(triangles) {
  var expandComposite = function(points, composite, other) {
    var added = false,
        newComposite = composite.map(function(x){return x}),
	newOther = [];
    for(var i in other) {
      var vs = other[i].vertices;
      if( hasAnyPoint(points, vs) ) {
        newComposite.push(other[i]);
	points = addPoints(points, vs);
	added = true;
      } else {
        newOther.push(other[i]);
      }
    }
    if( !added && other.length ) {
      var ps = addPoints({}, other[0].vertices);
      return [composite].concat(expandComposite(ps, [other[0]], other.slice(1)));
    }
    if( !added ) {
      return [composite];
    }
    return expandComposite(points, newComposite, newOther);
  };
  var findComposites = function(xs) {
    var ps = addPoints({}, xs[0].vertices);
    return expandComposite(ps, [xs[0]], xs.slice(1));
  };
  return findComposites(triangles);
};
var vEqual = function(a, b) {
  for( var k in a ) {
    if( a[k] != b[k] ) return false;
  }
  return true;
};
var vContains = function(xs, y) {
  for( var k in xs ) {
    if( vEqual(xs[k], y) ) return true;
  }
  return false;
};
var findLoops = function(arrows, loop) {
  if( loop.length > 4 ) return [];

  var end = loop[loop.length - 1];
  var steps = arrows.filter(function(a) {
    return vEqual(a[0], end) || vEqual(a[1], end);
  }).map(function(a) {
    return vEqual(a[0], end) ? a[1] : a[0];
  });
  var closedLoops = loop.length == 4 ? steps.filter(function(s) { return vEqual(loop[0], s) }) : [];
  var runningLoops = steps.filter(function(s) { return !vContains(loop, s); });
  return closedLoops.map(
    function(s) {
      return loop.concat([s]);
    }).concat(
    runningLoops.map(
      function(s) {
        return findLoops(arrows, loop.concat([s]));
      }).reduce(
	function(a,b) {
	  return a.concat(b)
	}, []));
};
var renderGrid = function(grid) {
  return grid.map(function(xs) {
    return xs.map(function(x) {
      return (x*100 | 0)/100;
    }).join("\t");
  }).join("\n");
};
var renderMatrix = function(grid) {
  return grid.map(function(xs) {
    return [xs.x, xs.y, xs.z].map(function(x) {
      return (x*100 | 0)/100;
    }).join("\t");
  }).join("\n");
};
var findReverse = function(xs, y) {
  var matches = xs.filter(function(l) {
    return !vEqual(l[1], y[1]) && vEqual(l[2], y[2]);
  });
  return matches[0];
};
var splitComposite = function(c) {
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
        if( !(x.x == y.x && x.y == y.y && x.z == y.z) ) return false;
      }
      return true;
    };

    arrows = getArrows(addArrows({}, arrows)).map(vectorsFromVertices);
    var seed = arrows[2][0];
    var loops = findLoops(arrows, [seed]);
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

    // TODO: disallow diagonals in loops somehow
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
      return count > 2;
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

    shapes.forEach(function(shape) {
      console.log(shape.map(function(f) {
	return [f[0], f[2]];
      }).map(renderMatrix).join("\n\n"));
    });

    // TODO: take these shapes' share of triangles, and 
    // recurse to find more composites.

    return [c];
  } else {
    return [c];
  }
};

