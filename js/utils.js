var cos = Math.cos.bind(Math);
var sin = Math.sin.bind(Math);
var tan = Math.tan.bind(Math);
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
  return function(t, s) {
    return new THREE.Vector3(
      cos(t) * f(s).x,
      sin(t) * f(s).x,
      f(s).y);
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
    xprime = new THREE.Vector3(-(zprime.y + 2*zprime.z)/zprime.x, 1, 2);
  } else {
    xprime = new THREE.Vector3(1, 2, -(zprime.x + 2*zprime.y)/zprime.z);
  }
  xprime.normalize();
  var yprime = new THREE.Vector3();
  yprime.crossVectors(zprime, xprime);
  yprime.normalize();
  return [xprime, yprime, zprime];
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
var revolvingNormalParametric = function(basis) {
  var xprime = basis[0];
  var yprime = basis[1];
  var zprime = basis[2];
  return function(f) {
    return function(t, s) {
      return xprime.clone().multiplyScalar(cos(t) * f(s).x).add(
	     yprime.clone().multiplyScalar(sin(t) * f(s).x).add(
	     zprime.clone().multiplyScalar(f(s).y)));
    };
  };
};

