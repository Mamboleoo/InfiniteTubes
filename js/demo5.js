var ww = window.innerWidth;
var wh = window.innerHeight;

function Tunnel() {
  this.init();
  this.createMesh();

  this.handleEvents();

  window.requestAnimationFrame(this.render.bind(this));
}

Tunnel.prototype.init = function() {
  this.speed = 4;

  this.mouse = {
    position: new THREE.Vector2(ww * 0.5, wh * 0.5),
    ratio: new THREE.Vector2(0, 0),
    target: new THREE.Vector2(ww * 0.5, wh * 0.5)
  };

  this.renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.querySelector("#scene")
  });
  this.renderer.setSize(ww, wh);

  this.camera = new THREE.PerspectiveCamera(15, ww / wh, 0.01, 10);
  this.camera.rotation.y = Math.PI;
  this.camera.position.z = 0.4;

  this.scene = new THREE.Scene();
  this.scene.fog = new THREE.Fog(0xffffff, 1, 1.9);
};

Tunnel.prototype.createMesh = function() {
  var points = [];
  var i = 0;
  var geometry = new THREE.Geometry();

  this.scene.remove(this.tubeMesh);

  for (i = 0; i < 5; i += 1) {
    points.push(new THREE.Vector3(0, 0, 3 * (i / 4)));
  }
  points[4].y = -0.06;

  this.curve = new THREE.CatmullRomCurve3(points);
  this.curve.type = "catmullrom";

  geometry = new THREE.Geometry();
  geometry.vertices = this.curve.getPoints(120);
  this.splineMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial());

  this.tubeMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    vertexColors: THREE.FaceColors
  });

  this.tubeGeometry = new THREE.TubeGeometry(this.curve, 120, 0.02, 3, false);

  for (var i = 0; i < this.tubeGeometry.faces.length; i++) {
    f = this.tubeGeometry.faces[i];
    p = this.tubeGeometry.vertices[f.a];
      color = new THREE.Color(
        "hsl(" +
            (Math.floor(
              Math.abs(noise.simplex3(p.x * 2, p.y * 4, p.z * 2)) * 80 * 100
            ) *
              0.01 +
              180) +
          ",70%,60%)"
      );
      f.color = color;
  }

  this.tubeGeometry_o = this.tubeGeometry.clone();
  this.tubeMesh = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);

  this.scene.add(this.tubeMesh);
};

Tunnel.prototype.handleEvents = function() {
  window.addEventListener("resize", this.onResize.bind(this), false);
  document.body.addEventListener(
    "mousemove",
    this.onMouseMove.bind(this),
    false
  );
};

Tunnel.prototype.onResize = function() {
  ww = window.innerWidth;
  wh = window.innerHeight;

  this.camera.aspect = ww / wh;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(ww, wh);
};

Tunnel.prototype.onMouseMove = function(e) {
  this.mouse.target.x = e.clientX;
  this.mouse.target.y = e.clientY;
};

Tunnel.prototype.update = function() {
  this.createMesh();
};

Tunnel.prototype.updateCameraPosition = function() {
  this.mouse.position.x += (this.mouse.target.x - this.mouse.position.x) / 30;
  this.mouse.position.y += (this.mouse.target.y - this.mouse.position.y) / 30;

  this.mouse.ratio.x = this.mouse.position.x / ww;
  this.mouse.ratio.y = this.mouse.position.y / wh;

  this.camera.rotation.y = Math.PI - (this.mouse.ratio.x * 0.1 - 0.05);
  this.camera.position.x = this.mouse.ratio.x * 0.008 - 0.004;
  this.camera.position.y = this.mouse.ratio.y * 0.008 - 0.004;
};

function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r*100)*0.01, Math.round(g*100)*0.01, Math.round(b*100)*0.01];
}

Tunnel.prototype.updateCurve = function(delta) {
  var i = 0;
  var index = 0;
  var vertice_o = null;
  var vertice = null;
  for (i = 0; i < this.tubeGeometry.vertices.length; i += 1) {
    vertice_o = this.tubeGeometry_o.vertices[i];
    vertice = this.tubeGeometry.vertices[i];
    index = Math.floor(i / 120);
    vertice.x += ((vertice_o.x + this.splineMesh.geometry.vertices[index].x) - vertice.x) / 15;
    vertice.y += ((vertice_o.y + this.splineMesh.geometry.vertices[index].y) - vertice.y) / 15;
    vertice.applyAxisAngle(new THREE.Vector3(0,0,1), Math.abs(Math.cos(delta*0.001+vertice.z*5))*0.1);
  }
  this.tubeGeometry.verticesNeedUpdate = true;

  this.curve.points[2].x = 100 * (1 - this.mouse.ratio.x) - 50;
  this.curve.points[4].x = 100 * (1 - this.mouse.ratio.x) - 50;

  this.curve.points[2].y = 100 * (1 - this.mouse.ratio.y) - 50;
  this.curve.points[4].y = 100 * (1 - this.mouse.ratio.y) - 50;

  this.splineMesh.geometry.verticesNeedUpdate = true;
  this.splineMesh.geometry.vertices = this.curve.getPoints(120);

  delta *= 0.0003;
  var f, p, h, rgb;
  for (var i = 0; i < this.tubeGeometry.faces.length; i++) {
    f = this.tubeGeometry.faces[i];
    p = this.tubeGeometry.vertices[f.a];
    h = (Math.floor(Math.abs(noise.simplex3(p.x * 2, p.y * 4, p.z * 2 + delta)) * 80 * 100) * 0.01 + 180) / 360;
    rgb = hslToRgb(h, 0.7,0.6)
    color = new THREE.Color(rgb[0], rgb[1], rgb[2]);
    f.color = color;
  }
  this.tubeGeometry.elementsNeedUpdate = true;
};

Tunnel.prototype.render = function(delta) {
  this.updateCameraPosition();

  this.updateCurve(delta);

  this.renderer.render(this.scene, this.camera);

  window.requestAnimationFrame(this.render.bind(this));
};

window.onload = function() {
  window.tunnel = new Tunnel();
};
