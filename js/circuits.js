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

