// Ojota 3D procedural (sin modelos externos). Se compila a js/ojota3d.js con `npm run build`.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Shape, ExtrudeGeometry, CatmullRomCurve3,
  Vector2, Vector3, Color, MathUtils, CanvasTexture, SRGBColorSpace, RepeatWrapping,
  MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, DirectionalLight, ACESFilmicToneMapping,
  PMREMGenerator, CircleGeometry, RingGeometry, TorusGeometry, IcosahedronGeometry, PlaneGeometry,
  BufferGeometry, Float32BufferAttribute, TubeGeometry, AdditiveBlending
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const TAU = Math.PI * 2;
const CW = 512, CH = 600; // lienzo de cada escudo (proporción del parche en la ojota)

/* ---------- Escudos (se dibujan en canvas; los de imagen se cargan desde img/escudos) ---------- */
function shield(ctx, ins = 0) {
  const l = 70 + ins, r = 442 - ins, t = 60 + ins, b = 548 - ins;
  ctx.beginPath(); ctx.moveTo(l, t); ctx.lineTo(r, t); ctx.lineTo(r, 300);
  ctx.bezierCurveTo(r, 430, 330, 505, 256, b); ctx.bezierCurveTo(182, 505, l, 430, l, 300); ctx.closePath();
}
function drawCADG(ctx) {
  shield(ctx, 0); ctx.fillStyle = '#d9a21f'; ctx.fill();
  ctx.fillRect(70, 46, 56, 24); ctx.fillRect(386, 46, 56, 24);
  ctx.save(); shield(ctx, 16); ctx.clip();
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = '#0d0d0f'; ctx.fillRect(0, 0, 256, 300); ctx.fillRect(256, 300, 256, CH);
  ctx.restore();
  shield(ctx, 16); ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke();
  ctx.font = 'bold 132px Georgia, "Times New Roman", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.fillText('C', 170, 190); ctx.fillText('G', 336, 402);
  ctx.fillStyle = '#0d0d0f'; ctx.fillText('A', 342, 190); ctx.fillText('D', 176, 402);
}
function drawPlaceholder(ctx, label) {
  shield(ctx, 0); ctx.fillStyle = '#202228'; ctx.fill();
  ctx.setLineDash([14, 10]); ctx.lineWidth = 6; ctx.strokeStyle = '#8b8f99'; shield(ctx, 14); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#e9e9ee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 54px system-ui, Arial'; ctx.fillText('TU ESCUDO', 256, 270);
  ctx.font = '600 30px system-ui, Arial'; ctx.fillStyle = '#a9adb8'; ctx.fillText(label, 256, 336);
}
function paint(canvas, e) {
  canvas.width = CW; canvas.height = CH; // resetear también limpia el "taint" del canvas
  const ctx = canvas.getContext('2d');
  if (e.dibujo === 'cadg') drawCADG(ctx); else drawPlaceholder(ctx, e.nombre);
}

let crestCache = null;
export function crests(escudos, onUpdate = () => {}) {
  if (crestCache) return crestCache;
  crestCache = escudos.map((e, i) => {
    const canvas = document.createElement('canvas'); paint(canvas, e);
    if (e.img) {
      const img = new Image();
      img.onload = () => {
        try {
          canvas.width = CW; canvas.height = CH;
          const ctx = canvas.getContext('2d');
          const s = Math.min((CW - 30) / img.width, (CH - 30) / img.height);
          const w = img.width * s, h = img.height * s;
          ctx.drawImage(img, (CW - w) / 2, (CH - h) / 2, w, h);
          ctx.getImageData(0, 0, 1, 1); // falla si el navegador lo marca como "tainted" (file://)
          e._listo = true; onUpdate(i);
        } catch (err) { paint(canvas, e); }
      };
      img.src = e.img;
    }
    return canvas;
  });
  return crestCache;
}

/* ---------- Helpers de textura ---------- */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new CanvasTexture(c);
  if (repeat) { t.wrapS = t.wrapT = RepeatWrapping; }
  return t;
}
const stripesTex = () => canvasTex(128, 128, (c) => {
  for (let i = 0; i < 8; i++) {
    const g = c.createLinearGradient(i * 16, 0, i * 16 + 16, 0);
    g.addColorStop(0, '#000'); g.addColorStop(.5, '#fff'); g.addColorStop(1, '#000');
    c.fillStyle = g; c.fillRect(i * 16, 0, 16, 128);
  }
}, true);
const wavesTex = () => canvasTex(128, 128, (c, w, h) => {
  const im = c.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = 0.5 + 0.5 * Math.sin((y / h) * TAU * 6 + Math.sin((x / w) * TAU * 2) * 1.4);
    const k = (y * w + x) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = v * 255; im.data[k + 3] = 255;
  }
  c.putImageData(im, 0, 0);
}, true);
const radialTex = (stops) => canvasTex(256, 256, (c) => {
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([p, col]) => g.addColorStop(p, col)); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
});
const labelTex = (txt) => {
  const t = canvasTex(512, 160, (c) => {
    c.fillStyle = '#d9dbe2'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '800 96px "Arial Black", Impact, system-ui, sans-serif'; c.fillText(txt.toUpperCase(), 256, 84);
  });
  t.colorSpace = SRGBColorSpace; return t;
};

/* ---------- Geometría ---------- */
const FOOT = [[0, -4.0], [0.95, -3.8], [1.35, -2.9], [1.30, -1.6], [1.45, -0.2], [1.75, 1.2], [1.7, 2.4], [1.25, 3.5],
  [0.2, 4.05], [-0.9, 3.7], [-1.5, 2.6], [-1.7, 1.3], [-1.45, -0.2], [-1.05, -1.6], [-1.15, -2.9], [-0.9, -3.8]];
function outline(s) {
  const c = new CatmullRomCurve3(FOOT.map(([x, z]) => new Vector3(x * s, -z * s, 0)), true, 'centripetal');
  return new Shape(c.getPoints(180).map((p) => new Vector2(p.x, p.y)));
}
function solid(scale, depth, bevel) {
  const g = new ExtrudeGeometry(outline(scale), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 1, steps: 1 });
  g.rotateX(-Math.PI / 2); return g;
}
const A = 1.48, B = 1.18, T = 0.22, STRAP_D = 1.9, STRAP_Z = 1.25, STRAP_Y = 0.58, BEV = 0.08;
function strapGeo() {
  const s = new Shape(), N = 72;
  s.moveTo(A, 0);
  for (let i = 1; i <= N; i++) { const a = (i / N) * Math.PI; s.lineTo(A * Math.cos(a), B * Math.sin(a)); }
  s.lineTo(-(A - T), 0);
  for (let i = N; i >= 0; i--) { const a = (i / N) * Math.PI; s.lineTo((A - T) * Math.cos(a), (B - T) * Math.sin(a)); }
  const g = new ExtrudeGeometry(s, { depth: STRAP_D, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 4, steps: 1 });
  g.translate(0, 0, -STRAP_D / 2); return g;
}
function ellipseNormal(th) { const nx = B * Math.cos(th), ny = A * Math.sin(th), l = Math.hypot(nx, ny); return [nx / l, ny / l]; }
function decalGeo() {
  const nx = 16, nz = 12, Wd = 1.35, Hd = 1.58, off = BEV + 0.014, pos = [], uv = [], idx = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const u = (i / nx) * 2 - 1, v = (j / nz) * 2 - 1, th = Math.PI / 2 - u * (Wd / 2) / A, [qx, qy] = ellipseNormal(th);
    pos.push(A * Math.cos(th) + qx * off, B * Math.sin(th) + qy * off - (B + off), v * Hd / 2);
    uv.push((u + 1) / 2, (1 - v) / 2);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function stitch(zOff) {
  const pts = [], off = BEV + 0.004;
  for (let i = 0; i <= 48; i++) { const th = (i / 48) * Math.PI, [qx, qy] = ellipseNormal(th); pts.push(new Vector3(A * Math.cos(th) + qx * off, B * Math.sin(th) + qy * off, zOff)); }
  return new TubeGeometry(new CatmullRomCurve3(pts), 96, 0.014, 6);
}

/* ---------- Escena ---------- */
export function init(container, opts) {
  const { escudos, onChange = () => {}, onProgress = () => {}, nombre = 'PISADA' } = opts;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const el = renderer.domElement; el.style.touchAction = 'pan-y'; el.style.cursor = 'grab';
  el.setAttribute('aria-label', 'Ojota 3D: arrastrá para girarla'); el.setAttribute('role', 'img');
  container.appendChild(el);

  const scene = new Scene();
  scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  const camera = new PerspectiveCamera(30, 1, 0.1, 100); const EL = 0.5;

  const accent = new Color(escudos[0].color), accentTo = new Color(escudos[0].color);
  const key = new DirectionalLight(0xffffff, 2.4); key.position.set(4, 8, 6); scene.add(key);
  const rim = new DirectionalLight(accent, 3.2); rim.position.set(-6, 3, -5); scene.add(rim);

  // Escenario: brillo, sombra y anillos
  const stage = new Group(); scene.add(stage);
  const glowMat = new MeshBasicMaterial({ map: radialTex([[0, 'rgba(255,255,255,.95)'], [.5, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]), color: accent, transparent: true, opacity: .7, blending: AdditiveBlending, depthWrite: false });
  const glow = new Mesh(new CircleGeometry(7, 64), glowMat); glow.rotation.x = -Math.PI / 2; glow.position.y = -0.3; stage.add(glow);
  const shadow = new Mesh(new CircleGeometry(5.2, 48), new MeshBasicMaterial({ map: radialTex([[0, 'rgba(0,0,0,.65)'], [.6, 'rgba(0,0,0,.25)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.2; stage.add(shadow);
  const ringMat = (o) => new MeshBasicMaterial({ color: accent, transparent: true, opacity: o, depthWrite: false });
  const ring1 = new Mesh(new RingGeometry(5.0, 5.05, 128), ringMat(.7)), ring2 = new Mesh(new RingGeometry(6.1, 6.14, 128), ringMat(.3)), pulse = new Mesh(new RingGeometry(4.9, 5.0, 128), ringMat(0));
  [ring1, ring2, pulse].forEach((r) => { r.rotation.x = -Math.PI / 2; r.position.y = -0.25; stage.add(r); });

  // Ojota
  const rubber = new MeshPhysicalMaterial({ color: 0x0f1012, roughness: .5, clearcoat: .3, clearcoatRoughness: .45 });
  const bedBump = stripesTex(), strapBump = wavesTex();
  const bedMat = new MeshStandardMaterial({ color: 0x17181b, roughness: .72, bumpMap: bedBump, bumpScale: 0.9 });
  const strapMat = new MeshPhysicalMaterial({ color: 0x111214, roughness: .45, clearcoat: .45, clearcoatRoughness: .4, bumpMap: strapBump, bumpScale: 0.9 });
  const ojota = new Group();
  ojota.add(new Mesh(solid(1, .5, .1), rubber));
  const bed = new Mesh(solid(.9, .1, .07), bedMat); bed.position.y = .58; ojota.add(bed);
  const strap = new Mesh(strapGeo(), strapMat); strap.position.set(0, STRAP_Y, STRAP_Z); ojota.add(strap);
  const thread = new MeshStandardMaterial({ color: 0x2c2e33, roughness: .8 });
  [-1, 1].forEach((s) => { const m = new Mesh(stitch(s * (STRAP_D / 2 - .06)), thread); m.position.set(0, STRAP_Y, STRAP_Z); ojota.add(m); });
  const label = new Mesh(new PlaneGeometry(2, .62), new MeshStandardMaterial({ map: labelTex(nombre), transparent: true, roughness: .8, opacity: .8 }));
  label.rotation.x = -Math.PI / 2; const labelG = new Group(); labelG.position.set(0, .755, -2.3); labelG.add(label); ojota.add(labelG);

  // Escudo (parche curvo sobre la tira)
  const textures = crests(escudos).map((c) => { const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; });
  const decalMat = new MeshPhysicalMaterial({ map: textures[0], transparent: true, alphaTest: .02, roughness: .4, clearcoat: .6, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
  const decal = new Mesh(decalGeo(), decalMat); decal.position.set(0, STRAP_Y + B + BEV + 0.014, STRAP_Z); ojota.add(decal);

  const tiltG = new Group(); tiltG.add(ojota);
  const spinG = new Group(); spinG.add(tiltG); scene.add(spinG);

  // Flotantes
  const floaters = new Group(); scene.add(floaters);
  const fm = new MeshStandardMaterial({ color: accent, roughness: .3, metalness: .35 });
  const bits = [[new TorusGeometry(.38, .09, 16, 40), -4.3, 2.4, -1], [new IcosahedronGeometry(.3, 0), 4.2, 1.6, 1.5], [new TorusGeometry(.26, .07, 16, 36), 3.6, 3.2, -2.5],
    [new IcosahedronGeometry(.22, 0), -3.8, .9, 2.8], [new TorusGeometry(.2, .06, 16, 32), 0.5, 3.9, -3.6], [new IcosahedronGeometry(.18, 0), -1.8, 3.4, 3.2]]
    .map(([g, x, y, z], i) => { const m = new Mesh(g, fm); m.position.set(x, y, z); m.userData = { y, ph: i * 1.3 }; floaters.add(m); return m; });

  // Estado / animación
  let cur = 0, spin = 0.5, vel = reduce ? .35 : .9, lastTurns = 0, drag = null, pop = { ph: 0, t: 0, to: 0 };
  const auto = reduce ? .35 : .9, ease = (t) => t * t, back = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
  function goTo(i, fresh) {
    i = (i + escudos.length) % escudos.length; if (i === cur && !fresh) return;
    pop = { ph: 1, t: 0, to: i }; accentTo.set(escudos[i].color); pulse.userData.t = 0;
    cur = i; onChange(i, escudos[i]);
  }
  const next = () => goTo(cur + 1);
  const refreshTex = (i) => { if (textures[i]) textures[i].needsUpdate = true; };

  el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, t: performance.now() }; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return; const now = performance.now(), dx = e.clientX - drag.x, dt = Math.max(1, now - drag.t) / 1000;
    drag.x = e.clientX; drag.t = now; spin += dx * .012; vel = MathUtils.clamp(dx * .012 / dt, -14, 14);
  });
  const end = () => { drag = null; el.style.cursor = 'grab'; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);

  function fit() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const vt = Math.tan(MathUtils.degToRad(camera.fov / 2)), ht = vt * camera.aspect;
    // Vertical (celular): la ojota "parada" apoyada en el talón, mirando la plantilla. Horizontal: acostada.
    const up = camera.aspect < 1.1, flip = up ? Math.PI : 0;
    tiltG.rotation.x = up ? 1.05 : -0.1; ojota.rotation.y = flip; decal.rotation.y = flip; labelG.rotation.y = flip;
    stage.position.y = up ? -3.2 : 0; stage.scale.setScalar(up ? .62 : 1);
    floaters.position.set(up ? 0 : 2.2, up ? -2.4 : 0, 0);
    const d = up ? Math.max(3.4 / ht, 7.6 / vt) : Math.max(4.5 / ht, 3.6 / vt);
    const sx = !up && camera.aspect > 1.2 ? w * 0.14 : 0, sy = up ? h * 0.045 : 0;
    camera.setViewOffset(w, h, -sx, sy, w, h);
    camera.position.set(0, d * Math.sin(EL), d * Math.cos(EL)); camera.lookAt(0, up ? .2 : .45, 0);
  }
  new ResizeObserver(fit).observe(container); fit();

  let last = 0, raf = 0, visible = true;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now; const t = now / 1000;
    if (!drag) { vel += (auto - vel) * (1 - Math.exp(-dt * 1.8)); spin += vel * dt; }
    spinG.rotation.y = spin; ojota.position.y = Math.sin(t * 1.4) * .12;
    const turns = Math.floor(spin / TAU); if (turns > lastTurns) { lastTurns = turns; next(); } else lastTurns = turns;
    onProgress(((spin / TAU) % 1 + 1) % 1);

    if (pop.ph === 1) { pop.t += dt / .22; decal.scale.setScalar(Math.max(1 - ease(Math.min(1, pop.t)), .001)); if (pop.t >= 1) { decalMat.map = textures[pop.to]; decalMat.needsUpdate = true; pop.ph = 2; pop.t = 0; } }
    else if (pop.ph === 2) { pop.t += dt / .6; decal.scale.setScalar(Math.max(back(Math.min(1, pop.t)), .001)); if (pop.t >= 1) { pop.ph = 0; decal.scale.setScalar(1); } }
    if (pulse.userData.t !== undefined && pulse.userData.t < 1) { pulse.userData.t += dt / .9; const k = pulse.userData.t; pulse.scale.setScalar(.7 + k * .9); pulse.material.opacity = Math.max(0, .8 * (1 - k)); }

    accent.lerp(accentTo, 1 - Math.exp(-dt * 4));
    [glowMat, ring1.material, ring2.material, pulse.material, fm, rim].forEach((m) => m.color.copy(accent));
    floaters.rotation.y = t * .15; bits.forEach((m) => { m.rotation.x = t * .6 + m.userData.ph; m.rotation.y = t * .4; m.position.y = m.userData.y + Math.sin(t * .9 + m.userData.ph) * .25; });
    ring1.rotation.z = t * .1; ring2.rotation.z = -t * .07;
    renderer.render(scene, camera);
  }
  const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(container);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  decal.scale.setScalar(1); start();

  return { goTo, next, current: () => cur, refreshTex };
}
