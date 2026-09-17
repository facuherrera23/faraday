(function () {
  'use strict';

  var container = document.getElementById('hero-bolt');
  if (!container) return;
  if (container.dataset.mobile !== 'true' && window.matchMedia('(max-width: 1023px)').matches) return;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03050a, 0.012);

  var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(0, 0, 32);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { return; }
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.appendChild(renderer.domElement);

  var composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(2, 2), 2.0, 0.4, 0.1);
  composer.addPass(bloomPass);

  var masterGroup = new THREE.Group();
  scene.add(masterGroup);

  var shape = new THREE.Shape();
  shape.moveTo(0, 9);
  shape.lineTo(-4.5, 0.5);
  shape.lineTo(-1.2, 0.5);
  shape.lineTo(-3.8, -9);
  shape.lineTo(4.5, -0.5);
  shape.lineTo(1.2, -0.5);
  shape.closePath();

  var rayoGeo = new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: true, bevelSegments: 8, steps: 3, bevelSize: 0.6, bevelThickness: 0.6 });
  rayoGeo.center();

  var rayoMat = new THREE.MeshPhysicalMaterial({
    color: 0xffa500,
    emissive: 0xff8c00,
    emissiveIntensity: 0.7,
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9
  });
  masterGroup.add(new THREE.Mesh(rayoGeo, rayoMat));

  var rayoWireMesh = new THREE.Mesh(rayoGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 }));
  rayoWireMesh.scale.set(1.03, 1.03, 1.03);
  masterGroup.add(rayoWireMesh);

  var arcLines = [];
  for (var a = 0; a < 6; a++) {
    var pts = [];
    for (var k = 0; k < 13; k++) pts.push(new THREE.Vector3(0, 0, 0));
    var g = new THREE.BufferGeometry().setFromPoints(pts);
    masterGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: a % 2 === 0 ? 0x00ffff : 0xffd700, transparent: true, opacity: 0.9 })));
    arcLines.push(g);
  }

  function updateArcs() {
    for (var j = 0; j < arcLines.length; j++) {
      var p = arcLines[j].attributes.position.array;
      var sx = (Math.random() - 0.5) * 4, sy = 8, sz = (Math.random() - 0.5) * 2;
      var ex = (Math.random() - 0.5) * 4, ey = -8, ez = (Math.random() - 0.5) * 2;
      for (var i = 0; i < p.length / 3; i++) {
        var t = i / (p.length / 3 - 1);
        p[i * 3] = sx + (ex - sx) * t + (Math.random() - 0.5) * 1.5;
        p[i * 3 + 1] = sy + (ey - sy) * t;
        p[i * 3 + 2] = sz + (ez - sz) * t + (Math.random() - 0.5) * 1.5;
      }
      arcLines[j].attributes.position.needsUpdate = true;
    }
  }

  scene.add(new THREE.AmbientLight(0x0a0e1a, 1.5));
  var coreLight = new THREE.PointLight(0xffd700, 5, 50);
  masterGroup.add(coreLight);

  var targetMouseX = 0, targetMouseY = 0, currentMouseX = 0, currentMouseY = 0;
  window.addEventListener('mousemove', function (e) {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    var w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(container);
  window.addEventListener('resize', resize);
  resize();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    updateArcs();
    composer.render();
    return;
  }

  var mobileLogin = container.dataset.mobile === 'true';
  var visible = true;
  var clock = new THREE.Clock();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) clock.getDelta();
    }, { threshold: 0 }).observe(container);
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    var t = clock.getElapsedTime();
    currentMouseX += (targetMouseX - currentMouseX) * 0.05;
    currentMouseY += (targetMouseY - currentMouseY) * 0.05;
    if (mobileLogin) {
      masterGroup.rotation.y = Math.sin(t * 0.6) * 0.55 + currentMouseX * 0.5;
      masterGroup.rotation.x = Math.sin(t * 0.5) * 0.12 - currentMouseY * 0.4;
    } else {
      masterGroup.rotation.y = t * 0.35 + currentMouseX * 0.8;
      masterGroup.rotation.x = Math.sin(t * 0.5) * 0.15 - currentMouseY * 0.6;
    }
    var pulse = Math.sin(t * 8) * 0.3 + 1.2;
    rayoMat.emissiveIntensity = 0.5 * pulse;
    coreLight.intensity = 4 * pulse;
    if (Math.random() > 0.3) updateArcs();
    composer.render();
  }
  frame();
})();
