var mode = { rotate: true };
var Controls = function(render, camera, scene) {
  this.angleLR = 0;
  this.angleUD = 0;
  this.position = {x: -200, y: 0, z: 100};
  this.hypZ = function() {
    return Math.sqrt(_2(this.position.x) + _2(this.position.y) + _2(this.position.z));
  };
  this.camera = camera;
  this.scene = scene;
  this.rotate = function(right, left, up, down) {
    this.angleLR += (right ? 1 : (left ? -1 : 0)) * Math.PI/50;
    this.angleUD += (up ? 1 : (down ? -1 : 0)) * Math.PI/50;
  };
  this.move = function(left, right, up, down) {
    this.position.x += (left ? 1 : (right ? -1 : 0)) * 10;
    this.position.y += (up ? 1 : (down ? -1 : 0)) * 10;
  };
  this.sceneRender = render;
  this.face = function(key) {
    var angle = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [0, -0.99]][key - 1];
    var angleLR = angle[0] * Math.PI/2,
	angleUD = angle[1] * Math.PI/2;
    this.takeAngles(angleLR, angleUD);
  };
  document.addEventListener('keydown', function(evt) {
    if( [65, 68, 87, 83].indexOf(evt.keyCode) != -1) {
      evt.preventDefault();
      this.rotate(
        evt.keyCode == 65, evt.keyCode == 68,
        evt.keyCode == 87, evt.keyCode == 83);
      render();
    } else if( [37, 38, 39, 40].indexOf(evt.keyCode) != -1 ) {
      evt.preventDefault();
      this.move(
        evt.keyCode == 39, evt.keyCode == 37,
        evt.keyCode == 38, evt.keyCode == 40);
    } else if( [49, 50, 51, 52, 53].indexOf(evt.keyCode) != -1 ) {
      this.face(evt.keyCode - 48);
    }
  }.bind(this));
  var start;
  document.addEventListener('mousedown', function(evt) {
    start = [evt.x, evt.y];
  });
  document.addEventListener('mouseup', function(evt) {
    start = undefined;
  });
  this.zoom = function(delta) {
    this.position.x += delta * Math.cos(this.angleLR);
    this.position.y += delta * Math.sin(this.angleLR);
    this.position.z += delta * Math.tan(this.angleUD);
  };
  document.addEventListener('mousewheel', function(evt) {
    evt.preventDefault();
    this.zoom(evt.wheelDelta/5);
  }.bind(this));
  this.takeAngles = function(LR, UD) {
    if( UD <= 0 && UD >= -Math.PI/2 ) {
      var hypZ = this.hypZ();
      this.angleLR = LR;
      this.angleUD = UD;
      this.position.z = Math.sin(Math.PI+this.angleUD)*hypZ;
      var newHyp = Math.cos(this.angleUD)*hypZ;
      this.position.x = Math.cos(Math.PI+this.angleLR)*newHyp;
      this.position.y = Math.sin(Math.PI+this.angleLR)*newHyp;
    }
  };
  document.addEventListener('mousemove', function(evt) {
    if( !start ) return;
    var end = [evt.x, evt.y],
	delta = end.map(function(x, i) { return x - start[i]; }),
	x = delta[0], y = delta[1];
    var xTheta = this.angleLR - Math.PI/2,
	yTheta = this.angleUD - Math.PI/2,
	xv = [Math.cos(xTheta) * x, Math.sin(xTheta) * x, 0],
	yv = [0, Math.cos(yTheta) * y, Math.sin(yTheta) * y];
    start = end;
    if( mode.rotate ) {
      var dLR = -x/10 * Math.PI/50,
	  dUD = -y/10 * Math.PI/50;
      this.takeAngles(this.angleLR + dLR, this.angleUD + dUD);
    } else if( mode.zoom ) {
      this.zoom(y);
    } else {
      this.position.x -= (xv[0]+yv[0])/10;
      this.position.y -= (xv[1]+yv[1])/10;
      this.position.z -= (xv[2]+yv[2])/10;
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
  this.camera.lookAt(
    new THREE.Vector3(Math.cos(this.angleLR) * 200, 
      Math.sin(this.angleLR) * 200, 
      Math.tan(this.angleUD) * 200));
  this.sceneRender(this.scene, this.camera);
  requestAnimationFrame(this.render.bind(this));
};
