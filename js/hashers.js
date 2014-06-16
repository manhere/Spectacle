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

