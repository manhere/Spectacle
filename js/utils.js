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
var vertexFromVector = function(v) {
  return [v.x, v.y, v.z];
};
var verticesFromVectors = function(vs) {
  return vs.map(vertexFromVector);
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

