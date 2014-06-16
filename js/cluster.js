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

