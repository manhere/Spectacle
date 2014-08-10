var hashFindComposites = function(triangles, cb) {
  var emanations = {};
  var prec = 1;
  var hash = function(v) {
    return [].map.call(v, function(x) { return Math.floor(x * prec); }).join(",");
  };
  var unhash = function(s) {
    return s.split(",").map(function(x) { return parseInt(x)/prec; });
  };
  var addEdge = function(es, ps) {
    var a = ps[0], b = ps[1],
        ha = hash(a), hb = hash(b);
    es[ha] = es[ha] || {};
    es[hb] = es[hb] || {};
    es[ha][hb] = true;
    es[hb][ha] = true;
  };
  var addTriangle = function(es, t) {
    var edges = [[0, 1], [1, 2], [2, 0]].map(function(xs) {
      return xs.map(function(x) { return t.vertices[x]; });
    });
    edges.forEach(addEdge.bind({}, es));
  };
  var getVertices = function(es) {
    return Object.keys(es).map(function(k) {
      return unhash(k);
    });
  };
  var removeEdge = function(es, v, d) {
    delete es[hash(v)][hash(d)];
    delete es[hash(d)][hash(v)];
  };
  var getDestinations = function(es, v) {
    var seeds = [v];
    var ds = [];
    while( seeds.length ) {
      var nextSeeds = [];
      seeds.forEach(function(seed) {
	Object.keys(es[hash(seed)]).map(unhash).map(function(d) {
	  removeEdge(es, seed, d);
	  nextSeeds.push(d);
	  ds.push(d);
	});
      });
      seeds = nextSeeds;
    }
    return ds;
  };
  var crawl = function(es, s) {
    return Object.keys(es).map(unhash);
  };
  var cleanup = function(es) {
    var clean = {};
    Object.keys(es).filter(function(e) {
      return Object.keys(es[e]).length;
    }).forEach(function(k) {
      clean[k] = es[k];
    });
    return clean;
  };
  var addPoint = function(c, x) {
    c[hash(x)] = true;
  };
  var hasPoint = function(c, x) {
    return c[hash(x)];
  };
  triangles.forEach(addTriangle.bind({}, emanations));
  while( Object.keys(emanations).length ) {
    console.log(Object.keys(emanations).length);
    var seed = getVertices(emanations)[0];
    var vs = getDestinations(emanations, seed);
    var c = {};
    vs.forEach(addPoint.bind({}, c));
    var ts = triangles.filter(function(t) {
      return hasPoint(c, t.vertices[0]);
    });
    emanations = cleanup(emanations);
    cb(ts);
  }
};
var findCompositeFacets = function(triangles, cb) {
  setTimeout(function() {
    hashFindComposites(triangles, cb);
  }, 1);
};

