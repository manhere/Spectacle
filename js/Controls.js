var mode = { rotate: true };
var Controls = function(render, camera, scene, elm) {
  this.sceneRender = render;
  this.focalPoint = new THREE.Vector3(0,0,0);
  this.rotationVector = new THREE.Vector3(1, 0, 0);
  this.lookingVector = function(update) {
    if( update ) {
      this.rotationVector = update;
    }
    return this.rotationVector.clone();
  };
  this._position = new THREE.Vector3(-2000, 0, 100);
  this.position = function() {
    return this.focalPoint.clone().add(this._position);
  };
  this.hypZ = function() {
    return Math.sqrt(_2(this._position.x) + _2(this._position.y) + _2(this._position.z));
  };
  this.camera = camera;
  this.scene = scene;
  this.rotate = function(right, left, up, down) {
    this.lookingVector().add(new THREE.Vector3((right ? 1 : (left ? -1 : 0)) * 0.05, 0, (up ? 1 : (down ? -1 : 0)) * 0.05));
  };
  this.face = function(key) {
    this.lookingVector([
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, -1)][key - 1]);
    this._position = this.lookingVector().clone().normalize().multiplyScalar(-this.hypZ());
  };
  var start;
  elm.addEventListener('mousedown', function(evt) {
    start = [evt.x, evt.y];
  });
  elm.addEventListener('mouseup', function(evt) {
    start = undefined;
  });
 
  this.zoom = function(delta) {
    this._position.add(this.lookingVector().clone().multiplyScalar(-delta));
  };
  elm.addEventListener('mousewheel', function(evt) {
    evt.preventDefault();
    this.zoom(evt.wheelDelta/5);
  }.bind(this));
  elm.addEventListener('mousemove', function(evt) {
    if( !start ) return;
    var end = [evt.x, evt.y],
	delta = end.map(function(x, i) { return x - start[i]; }),
	x = delta[0], y = delta[1];
    start = end;
    if( mode.rotate ) {
      var dxy = -x/10 * Math.PI/50,
	  dz = y/10 * Math.PI/50;
      var xy = Math.atan2(this._position.y, this._position.x) + dxy,
          z  = Math.atan2(this._position.z, sqrt(_2(this._position.x) + _2(this._position.y))) + dz;
      var zpos = Math.sin(z) * this.hypZ(),
          r = Math.cos(z) * this.hypZ();
      this._position = new THREE.Vector3(r * Math.cos(xy), r * Math.sin(xy), zpos);
      this.lookingVector(this._position.clone().normalize().multiplyScalar(-1));
    } else if( mode.zoom ) {
      this.zoom(y);
    } else {
      // panning
      this.focalPoint.add(new THREE.Vector3(x, -y, 0));
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
  this.camera.position = this.position();
  this.camera.up = new THREE.Vector3(0,0,1);
  this.camera.lookAt(this.position().clone().add(this.lookingVector().clone().multiplyScalar(10)));
  this.sceneRender(this.scene, this.camera);
  requestAnimationFrame(this.render.bind(this));
};
