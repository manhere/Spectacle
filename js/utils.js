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

  // Conclude the type of primitive
  var type;
  var d = vectorMax(deviations).add(vectorMin(deviations).multiplyScalar(-1));
  if(isConstant(orthogonalCounts, 4)) {
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

