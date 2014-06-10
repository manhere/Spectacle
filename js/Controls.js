var mode = { rotate: true };
var Controls = function(render, camera, scene) {
  this.lookingVector = new THREE.Vector3(1, 0, 0);
  this.position = new THREE.Vector3(-60, 0, 0);
  this.hypZ = function() {
    return Math.sqrt(_2(this.position.x) + _2(this.position.y) + _2(this.position.z));
  };
  this.camera = camera;
  this.scene = scene;
  this.rotate = function(right, left, up, down) {
    this.lookingVector.add(new THREE.Vector3((right ? 1 : (left ? -1 : 0)) * 0.05, 0, (up ? 1 : (down ? -1 : 0)) * 0.05));
  };
  this.move = function(left, right, up, down) {
    this.position.add(new THREE.Vector3((left ? 1 : (right ? -1 : 0)) * 10, 0, (up ? 1 : (down ? -1 : 0)) * 10));
  };
  this.face = function(key) {
    this.lookingVector = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, -1)][key - 1];
    this.position = this.lookingVector.clone().normalize().multiplyScalar(-60);
  };
  document.addEventListener('keydown', function(evt) {
    if( [65, 68, 87, 83].indexOf(evt.keyCode) != -1) {
      evt.preventDefault();
      this.rotate(
        evt.keyCode == 65, evt.keyCode == 68,
        evt.keyCode == 87, evt.keyCode == 83);
    } else if( [37, 38, 39, 40].indexOf(evt.keyCode) != -1 ) {
      evt.preventDefault();
      this.move(
        evt.keyCode == 39, evt.keyCode == 37,
        evt.keyCode == 38, evt.keyCode == 40);
    } else if( [49, 50, 51, 52, 53].indexOf(evt.keyCode) != -1 ) {
      evt.preventDefault();
      this.face(evt.keyCode - 48);
    }
    render();
  }.bind(this));
  var start;
  document.addEventListener('mousedown', function(evt) {
    start = [evt.x, evt.y];
  });
  document.addEventListener('mouseup', function(evt) {
    start = undefined;
  });
  this.zoom = function(delta) {
    this.position.add(this.lookingVector.clone().multiplyScalar(-delta));
  };
  document.addEventListener('mousewheel', function(evt) {
    evt.preventDefault();
    this.zoom(evt.wheelDelta/5);
  }.bind(this));
  document.addEventListener('mousemove', function(evt) {
    if( !start ) return;
    var end = [evt.x, evt.y],
	delta = end.map(function(x, i) { return x - start[i]; }),
	x = delta[0], y = delta[1];
    start = end;
    if( mode.rotate ) {
      var dxy = -x/10 * Math.PI/50,
	  dz = y/10 * Math.PI/50;
      var xy = Math.atan2(this.position.y, this.position.x) + dxy,
          z  = Math.atan2(this.position.z, sqrt(_2(this.position.x) + _2(this.position.y))) + dz;
      var zpos = Math.sin(z) * this.hypZ(),
          r = Math.cos(z) * this.hypZ();
      this.position = new THREE.Vector3(r * Math.cos(xy), r * Math.sin(xy), zpos);
      this.lookingVector = this.position.clone().normalize().multiplyScalar(-1);
    } else if( mode.zoom ) {
      this.zoom(y);
    } else {
      // panning
      var basis = [
        this.lookingVector.clone().normalize(),
	new THREE.Vector3(-this.lookingVector.y, this.lookingVector.x, 0),
	new THREE.Vector3(0, 0, 1)];
      this.position.add(inBasis(basis, 0, x/6, y/6));
    }
  }.bind(this));
  [].map.call(
    document.querySelectorAll("#modes li a"), 
    function(elm, i, coll) {
      elm.addEventListener('click', function(evt) {
	evt.preventDefault();
	mode.rotate = elm.id == "rotate_mode";
	mode.pan = elm.id == "pan_mode";
	mode.zoom = elm.id == "zoom_mode";
	[].map.call(
	  coll, 
	  function(elm) { elm.className = ''; });
	elm.className = 'active';
      });
  });
  [].map.call(
    document.querySelectorAll("#views li a"), 
    function(elm) {
      elm.addEventListener('click', function(evt) {
	evt.preventDefault();
	var face = parseInt(elm.id.split('').pop(), 10);
	this.face(face);
      }.bind(this));
  }.bind(this));
  this.render();
};
Controls.prototype.render = function() {
  this.camera.position = this.position;
  this.camera.up = new THREE.Vector3(0,0,1);
  this.camera.lookAt(this.position.clone().add(this.lookingVector.clone().multiplyScalar(10)));
  (this.scene.renderMap || function(){}).bind(this.scene)(this.position.x, this.position.y);
  requestAnimationFrame(this.render.bind(this));
};
