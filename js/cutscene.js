/*
 * CUTSCENE: the field-trip rocket ride to the Moon or Mars (needs three.js + Models)
 *   Cutscene.play({ place: "moon" | "mars", kid, robot, robotName, t, onDone }) -> Promise
 *
 * Builds its own full-screen overlay with its own canvas and WebGL renderer,
 * plays a short movie (board, countdown, liftoff, climb, space, approach,
 * landing, arrival), then removes everything, frees the GPU memory and
 * resolves the promise with { skipped }.
 * Everything is procedural: no images, models, or fonts are loaded.
 */
window.Cutscene = (function () {
  "use strict";
  const T = window.THREE;
  let current = null;

  /* ---------------- little math helpers ---------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (a, b, x) => {
    const u = clamp((x - a) / (b - a), 0, 1);
    return u * u * (3 - 2 * u);
  };
  const easeIO = (u) => {
    u = clamp(u, 0, 1);
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  };
  const easeOut = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const TAU = Math.PI * 2;

  // deterministic random numbers so the movie looks the same every time
  function seeded(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rng = seeded(1);
  const R = (a, b) => a + (b - a) * rng();

  /* ---------------- value noise (for planets and ground) ---------------- */
  function hash(x, y, z, seed) {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(seed, 1597334677);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function noise3(x, y, z, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const a = hash(xi, yi, zi, seed), b = hash(xi + 1, yi, zi, seed);
    const c = hash(xi, yi + 1, zi, seed), d = hash(xi + 1, yi + 1, zi, seed);
    const e = hash(xi, yi, zi + 1, seed), f = hash(xi + 1, yi, zi + 1, seed);
    const g = hash(xi, yi + 1, zi + 1, seed), h = hash(xi + 1, yi + 1, zi + 1, seed);
    const x1 = a + (b - a) * u, x2 = c + (d - c) * u, x3 = e + (f - e) * u, x4 = g + (h - g) * u;
    const y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v;
    return y1 + (y2 - y1) * w;
  }
  function fbm3(x, y, z, oct, seed) {
    let s = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) {
      s += amp * noise3(x * f, y * f, z * f, seed + i);
      n += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return s / n;
  }
  // tileable 2D noise (lattice wraps every P cells) for repeating ground textures
  function noise2p(x, y, P, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const w = (n) => ((n % P) + P) % P;
    const a = hash(w(xi), w(yi), 0, seed), b = hash(w(xi + 1), w(yi), 0, seed);
    const c = hash(w(xi), w(yi + 1), 0, seed), d = hash(w(xi + 1), w(yi + 1), 0, seed);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  function fbm2p(x, y, P, oct, seed) {
    let s = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) {
      s += amp * noise2p(x * f, y * f, P * f, seed + i);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  }

  /* ---------------- resource tracking ---------------- */
  let BAG = null; // every texture we make, so we can free them at the end
  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function texture(c, srgb) {
    const t = new T.CanvasTexture(c);
    if (srgb) t.encoding = T.sRGBEncoding;
    BAG.add(t);
    return t;
  }
  const std = (color, extra) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05 }, extra || {}));
  function shadows(obj, cast, receive) {
    obj.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = cast;
        o.receiveShadow = receive;
      }
    });
    return obj;
  }

  /* ---------------- procedural textures ---------------- */
  function glowTexture() {
    const c = canvas(128, 128), x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.12, "rgba(255,255,255,0.85)");
    g.addColorStop(0.35, "rgba(255,255,255,0.3)");
    g.addColorStop(0.7, "rgba(255,255,255,0.06)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return texture(c);
  }
  function puffTexture() {
    const c = canvas(128, 128), x = c.getContext("2d");
    for (let i = 0; i < 10; i++) {
      const cx = 64 + R(-20, 20), cy = 64 + R(-20, 20), r = R(24, 42);
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      const v = Math.round(R(215, 255));
      g.addColorStop(0, `rgba(${v},${v},${v},0.42)`);
      g.addColorStop(0.6, `rgba(${v},${v},${v},0.18)`);
      g.addColorStop(1, `rgba(${v},${v},${v},0)`);
      x.fillStyle = g;
      x.fillRect(0, 0, 128, 128);
    }
    return texture(c);
  }
  function dotTexture() {
    const c = canvas(32, 32), x = c.getContext("2d");
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(255,255,255,0.7)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 32, 32);
    return texture(c);
  }
  function flameTexture() {
    const c = canvas(4, 128), x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.75)");
    g.addColorStop(0.65, "rgba(255,255,255,0.22)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 4, 128);
    return texture(c);
  }
  function textTexture(text, w, h, rotate, color) {
    const c = canvas(w, h), x = c.getContext("2d");
    x.fillStyle = color || "#2a2b2f";
    x.textAlign = "center";
    x.textBaseline = "middle";
    if (rotate) {
      x.translate(w / 2, h / 2);
      x.rotate(-Math.PI / 2);
      x.font = `700 ${Math.round(w * 0.62)}px "IBM Plex Mono", monospace`;
      x.fillText(text, 0, 0);
    } else {
      x.font = `700 ${Math.round(h * 0.62)}px "IBM Plex Mono", monospace`;
      x.fillText(text, w / 2, h / 2);
    }
    return texture(c, true);
  }

  // equirectangular planet texture, sampled on the sphere so there is no seam
  function planetCanvas(W, H, fn) {
    const c = canvas(W, H), x = c.getContext("2d");
    const img = x.createImageData(W, H), d = img.data;
    const o = [0, 0, 0, 255];
    for (let j = 0; j < H; j++) {
      const lat = (0.5 - (j + 0.5) / H) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
      for (let i = 0; i < W; i++) {
        const lon = ((i + 0.5) / W) * TAU;
        o[3] = 255;
        fn(cl * Math.cos(lon), sl, cl * Math.sin(lon), lat, o);
        const k = (j * W + i) * 4;
        d[k] = o[0];
        d[k + 1] = o[1];
        d[k + 2] = o[2];
        d[k + 3] = o[3];
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  function drawCraters(c, count, maxR, strength) {
    const x = c.getContext("2d"), W = c.width, H = c.height;
    for (let i = 0; i < count; i++) {
      const lat = R(-1.25, 1.25), px = R(0, W), py = (0.5 - lat / Math.PI) * H;
      const r = Math.pow(rng(), 2.2) * maxR + 2;
      const sx = 1 / Math.max(0.3, Math.cos(lat));
      [px, px - W, px + W].forEach((cx) => {
        if (cx < -r * sx * 2 || cx > W + r * sx * 2) return;
        x.save();
        x.translate(cx, py);
        x.scale(sx, 1);
        const g = x.createRadialGradient(-r * 0.15, -r * 0.15, 0, 0, 0, r * 1.25);
        g.addColorStop(0, `rgba(0,0,0,${0.32 * strength})`);
        g.addColorStop(0.62, `rgba(0,0,0,${0.12 * strength})`);
        g.addColorStop(0.78, `rgba(255,255,255,${0.3 * strength})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = g;
        x.beginPath();
        x.arc(0, 0, r * 1.25, 0, TAU);
        x.fill();
        x.restore();
      });
    }
  }
  function earthTextures() {
    const map = planetCanvas(512, 256, (x, y, z, lat, o) => {
      const n = fbm3(x * 1.7 + 3, y * 1.7, z * 1.7, 5, 21);
      if (Math.abs(lat) > 1.22 + (n - 0.5) * 0.5) {
        o[0] = 236; o[1] = 243; o[2] = 248;
        return;
      }
      if (n > 0.53) {
        const m = fbm3(x * 4, y * 4, z * 4, 3, 33);
        const dry = smooth(0.45, 0.62, m) * (1 - smooth(0.7, 1.1, Math.abs(lat)));
        o[0] = lerp(58, 182, dry); o[1] = lerp(116, 152, dry); o[2] = lerp(56, 96, dry);
      } else {
        const deep = smooth(0.52, 0.4, n);
        o[0] = lerp(48, 16, deep); o[1] = lerp(126, 52, deep); o[2] = lerp(182, 124, deep);
      }
    });
    const clouds = planetCanvas(512, 256, (x, y, z, lat, o) => {
      const n = fbm3(x * 2.2, y * 4.6, z * 2.2, 5, 77);
      o[0] = o[1] = o[2] = 255;
      o[3] = smooth(0.5, 0.7, n) * 235;
    });
    return { map: texture(map, true), clouds: texture(clouds, true) };
  }
  function destTexture(place) {
    let c;
    if (place === "mars") {
      c = planetCanvas(768, 384, (x, y, z, lat, o) => {
        const n = fbm3(x * 2.6, y * 2.6, z * 2.6, 5, 13);
        const dark = smooth(0.5, 0.62, fbm3(x * 1.3 + 5, y * 1.3, z * 1.3, 4, 17)) * 0.8;
        if (Math.abs(lat) > 1.33 + (n - 0.5) * 0.3) {
          o[0] = 240; o[1] = 228; o[2] = 216;
          return;
        }
        o[0] = lerp(196 + (n - 0.5) * 80, 108, dark);
        o[1] = lerp(96 + (n - 0.5) * 50, 54, dark);
        o[2] = lerp(56 + (n - 0.5) * 30, 38, dark);
      });
      drawCraters(c, 70, 14, 0.5);
    } else {
      c = planetCanvas(768, 384, (x, y, z, lat, o) => {
        const n = fbm3(x * 3, y * 3, z * 3, 5, 5);
        const maria = smooth(0.54, 0.62, fbm3(x * 1.2 + 7, y * 1.2, z * 1.2, 3, 9));
        const g = 158 + (n - 0.5) * 90 - maria * 58;
        o[0] = g; o[1] = g; o[2] = g * 0.97;
      });
      drawCraters(c, 160, 22, 0.6);
    }
    return texture(c, true);
  }
  function groundTexture(kind) {
    const S = 256, c = canvas(S, S), x = c.getContext("2d");
    const img = x.createImageData(S, S), d = img.data;
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        const n = fbm2p((i / S) * 8, (j / S) * 8, 8, 5, kind === "mars" ? 3 : 7);
        const sp = hash(i, j, 9, 4);
        const speck = sp > 0.985 ? -40 : sp < 0.012 ? 28 : 0;
        let r, g, b;
        if (kind === "earth") {
          r = lerp(92, 150, n) + speck * 0.5; g = lerp(106, 128, n) + speck * 0.5; b = lerp(48, 76, n) + speck * 0.4;
        } else if (kind === "mars") {
          r = 140 + n * 70 + speck; g = 66 + n * 38 + speck * 0.6; b = 38 + n * 22 + speck * 0.4;
        } else {
          const v = 96 + n * 80 + speck;
          r = v; g = v; b = v * 0.97;
        }
        const k = (j * S + i) * 4;
        d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
      }
    x.putImageData(img, 0, 0);
    const t = texture(c, true);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(170, 170);
    t.anisotropy = 4;
    return t;
  }

  /* ---------------- sky dome (gradient + sun glow) ---------------- */
  function makeSky(o) {
    const mat = new T.ShaderMaterial({
      uniforms: {
        top: { value: new T.Color(o.top) },
        horizon: { value: new T.Color(o.horizon) },
        bottom: { value: new T.Color(o.bottom) },
        sunDir: { value: o.sunDir.clone() },
        sunCol: { value: new T.Color(o.sunCol) },
        sunAmt: { value: o.sunAmt },
        curve: { value: o.curve || 0.45 },
      },
      vertexShader: `varying vec3 vDir;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vDir = wp.xyz - cameraPosition;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom;
        uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunAmt; uniform float curve;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 c = h > 0.0 ? mix(horizon, top, pow(clamp(h, 0.0, 1.0), curve)) : mix(horizon, bottom, clamp(-h * 6.0, 0.0, 1.0));
          float s = max(dot(d, sunDir), 0.0);
          c += sunCol * (pow(s, 7.0) * 0.35 + pow(s, 90.0) * 1.1) * sunAmt;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`,
      side: T.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });
    const m = new T.Mesh(new T.SphereGeometry(1500, 32, 16), mat);
    m.renderOrder = -10;
    m.frustumCulled = false;
    return m;
  }
  function makeStars(n, radius, band, dot) {
    const g = new T.Group();
    [[n, 1.5], [Math.round(n / 14), 2.8]].forEach(([count, size]) => {
      const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
      const axis = V(1, 0, 0.35).normalize();
      for (let i = 0; i < count; i++) {
        let v;
        if (band && i < count * 0.45) {
          const a = R(0, TAU), off = (rng() + rng() + rng() - 1.5) * 0.16;
          v = V(Math.cos(a), off, Math.sin(a)).applyAxisAngle(axis, 0.95);
        } else v = V(R(-1, 1), R(-1, 1), R(-1, 1));
        v.normalize().multiplyScalar(radius);
        pos.set([v.x, v.y, v.z], i * 3);
        const b = Math.pow(R(0.25, 1), 1.6), tint = rng();
        col.set([b * (tint > 0.8 ? 1 : 0.85), b * 0.9, b * (tint < 0.3 ? 0.8 : 1)], i * 3);
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(pos, 3));
      geo.setAttribute("color", new T.BufferAttribute(col, 3));
      const p = new T.Points(geo, new T.PointsMaterial({ size, sizeAttenuation: false, map: dot, vertexColors: true, transparent: true, depthWrite: false, fog: false }));
      p.frustumCulled = false;
      p.renderOrder = -9;
      g.add(p);
    });
    g.setOpacity = (o) => g.children.forEach((p) => { p.material.opacity = o; p.visible = o > 0.01; });
    return g;
  }
  function glowSprite(tex, color, size, opacity) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: tex, color, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: opacity == null ? 1 : opacity, fog: false }));
    s.scale.set(size, size, 1);
    return s;
  }
  // sun disc + soft glare + a wide anamorphic streak (fake bloom)
  function makeSun(glow, color) {
    const g = new T.Group();
    g.add(glowSprite(glow, color, 230, 1));
    g.add(glowSprite(glow, "#ffffff", 70, 1));
    const streak = glowSprite(glow, color, 1, 0.55);
    streak.scale.set(2600, 26, 1);
    g.add(streak);
    return g;
  }

  /* ---------------- particles: camera-facing quads, no point-size limits ---------------- */
  const PVERT = `attribute vec3 offset; attribute float isize; attribute float ialpha; attribute vec3 icolor; attribute float irot;
    varying vec2 vUv; varying float vA; varying vec3 vC;
    void main() {
      vUv = uv; vA = ialpha; vC = icolor;
      vec4 mv = modelViewMatrix * vec4(offset, 1.0);
      float c = cos(irot), s = sin(irot);
      vec2 p = vec2(c * position.x - s * position.y, s * position.x + c * position.y);
      mv.xy += p * isize;
      gl_Position = projectionMatrix * mv;
    }`;
  const PFRAG = `uniform sampler2D map; varying vec2 vUv; varying float vA; varying vec3 vC;
    void main() {
      vec4 t = texture2D(map, vUv);
      gl_FragColor = vec4(vC * t.rgb, t.a * vA);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`;
  class Particles {
    constructor(max, tex, additive, opt) {
      opt = opt || {};
      this.max = max;
      this.next = 0;
      this.p = new Float32Array(max * 3);
      this.v = new Float32Array(max * 3);
      this.c0 = new Float32Array(max * 3);
      this.c1 = new Float32Array(max * 3);
      this.age = new Float32Array(max).fill(1);
      this.life = new Float32Array(max).fill(1);
      this.s0 = new Float32Array(max);
      this.s1 = new Float32Array(max);
      this.a0 = new Float32Array(max);
      this.drag = new Float32Array(max);
      this.grav = new Float32Array(max);
      this.rv = new Float32Array(max);
      this.floor = opt.floor == null ? -1e9 : opt.floor;
      this.splash = opt.splash || 0;
      this.cx = 0;
      this.cz = 0;
      this.acc = 0;
      const quad = new T.PlaneGeometry(1, 1);
      const geo = new T.InstancedBufferGeometry();
      geo.setIndex(quad.index);
      geo.setAttribute("position", quad.getAttribute("position"));
      geo.setAttribute("uv", quad.getAttribute("uv"));
      const ia = (n) => new T.InstancedBufferAttribute(new Float32Array(max * n), n).setUsage(T.DynamicDrawUsage);
      this.aOff = ia(3);
      this.aSize = ia(1);
      this.aAlpha = ia(1);
      this.aCol = ia(3);
      this.aRot = ia(1);
      for (let i = 0; i < max; i++) this.aRot.array[i] = R(0, TAU);
      geo.setAttribute("offset", this.aOff);
      geo.setAttribute("isize", this.aSize);
      geo.setAttribute("ialpha", this.aAlpha);
      geo.setAttribute("icolor", this.aCol);
      geo.setAttribute("irot", this.aRot);
      geo.instanceCount = max;
      const mat = new T.ShaderMaterial({
        uniforms: { map: { value: tex } },
        vertexShader: PVERT,
        fragmentShader: PFRAG,
        transparent: true,
        depthWrite: false,
        blending: additive ? T.AdditiveBlending : T.NormalBlending,
      });
      this.mesh = new T.Mesh(geo, mat);
      this.mesh.frustumCulled = false;
      this.mesh.renderOrder = additive ? 4 : 3;
    }
    // how many to emit this frame for a given rate per second (keeps fractions)
    count(rate, dt) {
      this.acc += rate * dt;
      const n = Math.floor(this.acc);
      this.acc -= n;
      return n;
    }
    emit(x, y, z, vx, vy, vz, life, s0, s1, a0, c0, c1, drag, grav) {
      const i = this.next;
      this.next = (i + 1) % this.max;
      this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
      this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
      this.c0[i * 3] = c0.r; this.c0[i * 3 + 1] = c0.g; this.c0[i * 3 + 2] = c0.b;
      this.c1[i * 3] = c1.r; this.c1[i * 3 + 1] = c1.g; this.c1[i * 3 + 2] = c1.b;
      this.age[i] = 0;
      this.life[i] = life;
      this.s0[i] = s0;
      this.s1[i] = s1;
      this.a0[i] = a0;
      this.drag[i] = drag;
      this.grav[i] = grav;
      this.rv[i] = R(-0.6, 0.6);
    }
    clear() {
      this.age.fill(1);
      this.life.fill(1);
      this.aSize.array.fill(0);
      this.aSize.needsUpdate = true;
    }
    update(dt) {
      const P = this.p, Vv = this.v, off = this.aOff.array, sz = this.aSize.array, al = this.aAlpha.array, col = this.aCol.array, rot = this.aRot.array;
      for (let i = 0; i < this.max; i++) {
        if (this.age[i] >= this.life[i]) {
          sz[i] = 0;
          continue;
        }
        this.age[i] += dt;
        const f = Math.min(1, this.age[i] / this.life[i]);
        const k = Math.exp(-this.drag[i] * dt);
        const j = i * 3;
        Vv[j] *= k;
        Vv[j + 1] = Vv[j + 1] * k + this.grav[i] * dt;
        Vv[j + 2] *= k;
        P[j] += Vv[j] * dt;
        P[j + 1] += Vv[j + 1] * dt;
        P[j + 2] += Vv[j + 2] * dt;
        const size = this.s0[i] + (this.s1[i] - this.s0[i]) * (1 - (1 - f) * (1 - f));
        const fl = this.floor + size * 0.28;
        if (P[j + 1] < fl) {
          P[j + 1] = fl;
          if (Vv[j + 1] < 0) {
            if (this.splash) {
              const rx = P[j] - this.cx, rz = P[j + 2] - this.cz, rl = Math.hypot(rx, rz) || 1;
              Vv[j] += (rx / rl) * -Vv[j + 1] * this.splash + R(-2, 2);
              Vv[j + 2] += (rz / rl) * -Vv[j + 1] * this.splash + R(-2, 2);
            }
            Vv[j + 1] = 0;
          }
        }
        off[j] = P[j]; off[j + 1] = P[j + 1]; off[j + 2] = P[j + 2];
        sz[i] = size;
        al[i] = this.a0[i] * Math.min(1, f * 10) * Math.pow(1 - f, 1.3);
        const cf = Math.min(1, f * 1.6);
        col[j] = this.c0[j] + (this.c1[j] - this.c0[j]) * cf;
        col[j + 1] = this.c0[j + 1] + (this.c1[j + 1] - this.c0[j + 1]) * cf;
        col[j + 2] = this.c0[j + 2] + (this.c1[j + 2] - this.c0[j + 2]) * cf;
        rot[i] += this.rv[i] * dt;
      }
      this.aOff.needsUpdate = this.aSize.needsUpdate = this.aAlpha.needsUpdate = this.aCol.needsUpdate = this.aRot.needsUpdate = true;
    }
  }

  /* ---------------- the field-trip rocket ---------------- */
  const RR = 1.5; // body radius
  const NOZZLE = 0.08; // bottom of the engine bell
  const HATCH_Y = 4.6; // floor of the hatch
  function buildRocket(glow, flameTex) {
    const g = new T.Group();
    const white = std("#f4f1ea", { roughness: 0.38, metalness: 0.08 });
    const red = std("#e0533b", { roughness: 0.42, side: T.DoubleSide });
    const blue = std("#3f7fd9", { roughness: 0.42 });
    const dark = std("#2a2b2f", { roughness: 0.6 });
    const metal = std("#8a93a6", { roughness: 0.3, metalness: 0.75, side: T.DoubleSide });
    const glass = std("#bfe0f2", { roughness: 0.1, metalness: 0.2, emissive: "#3d6f8c", emissiveIntensity: 0.5 });
    const add = (geo, mat, x, y, z) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      g.add(m);
      return m;
    };
    add(new T.CylinderGeometry(RR, RR, 9.6, 48), white, 0, 6.2, 0); // body 1.4 to 11
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      pts.push(new T.Vector2(Math.max(0.002, RR * Math.pow(1 - Math.pow(u, 1.7), 0.8)), 11 + u * 4.5));
    }
    add(new T.LatheGeometry(pts, 48), red);
    add(new T.CylinderGeometry(RR + 0.025, RR + 0.025, 0.12, 48), dark, 0, 11, 0);
    add(new T.CylinderGeometry(RR + 0.015, RR + 0.015, 0.6, 48, 1, true), blue, 0, 2.35, 0);
    add(new T.CylinderGeometry(RR + 0.02, RR + 0.02, 0.08, 48, 1, true), dark, 0, 2.72, 0);
    add(new T.CylinderGeometry(RR, RR * 0.72, 0.4, 40), metal, 0, 1.2, 0);
    add(new T.CylinderGeometry(0.5, 0.95, 0.95, 32, 1, true), metal, 0, 0.555, 0);
    const throat = add(new T.CircleGeometry(0.5, 24), new T.MeshBasicMaterial({ color: "#3a1c10" }), 0, 1.0, 0);
    throat.rotation.x = Math.PI / 2;

    // fins
    const fs = new T.Shape();
    fs.moveTo(0, 4.3);
    fs.lineTo(1.45, 1.3);
    fs.lineTo(1.5, 0.45);
    fs.lineTo(0, 1.5);
    fs.closePath();
    const fGeo = new T.ExtrudeGeometry(fs, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
    fGeo.translate(0, 0, -0.08);
    [30, 150, 270].forEach((a) => {
      const piv = new T.Group();
      piv.rotation.y = (-a * Math.PI) / 180;
      const m = new T.Mesh(fGeo, red);
      m.position.x = RR - 0.05;
      piv.add(m);
      g.add(piv);
    });

    // landing legs (fold up for flight, swing out to land)
    const legs = [];
    [90, 210, 330].forEach((a) => {
      const piv = new T.Group();
      piv.rotation.y = (-a * Math.PI) / 180;
      piv.position.y = 3.0;
      g.add(piv);
      const hinge = new T.Group();
      hinge.position.x = RR - 0.05;
      piv.add(hinge);
      const strut = new T.Mesh(new T.CylinderGeometry(0.1, 0.08, 3.35, 10), metal);
      strut.position.y = -3.35 / 2;
      hinge.add(strut);
      const foot = new T.Mesh(new T.CylinderGeometry(0.42, 0.5, 0.12, 16), dark);
      foot.position.y = -3.35;
      hinge.add(foot);
      legs.push({ hinge, foot });
    });

    // hatch: frame, warm lit interior, and a door that swings open
    add(new T.BoxGeometry(0.08, 2.0, 1.3), dark, RR - 0.01, HATCH_Y + 0.9, 0);
    const inside = add(new T.PlaneGeometry(1.1, 1.8), new T.MeshBasicMaterial({ color: "#f0c182" }), RR + 0.035, HATCH_Y + 0.9, 0);
    inside.rotation.y = Math.PI / 2;
    const door = new T.Group();
    door.position.set(RR + 0.08, HATCH_Y + 0.9, -0.58);
    g.add(door);
    const dm = new T.Mesh(new T.BoxGeometry(0.07, 1.84, 1.16), white);
    dm.position.z = 0.58;
    door.add(dm);
    const dw = new T.Mesh(new T.CircleGeometry(0.2, 18), glass);
    dw.rotation.y = Math.PI / 2;
    dw.position.set(0.04, 0.45, 0.58);
    door.add(dw);

    // round windows
    [7.3, 8.7, 10.0].forEach((y) => {
      const ring = new T.Mesh(new T.TorusGeometry(0.38, 0.07, 8, 24), dark);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(RR + 0.01, y, 0);
      g.add(ring);
      const gl = new T.Mesh(new T.CircleGeometry(0.36, 24), glass);
      gl.rotation.y = Math.PI / 2;
      gl.position.set(RR + 0.006, y, 0);
      g.add(gl);
    });

    // "FIELD TRIP" painted up the side
    const label = new T.Mesh(
      new T.CylinderGeometry(RR + 0.012, RR + 0.012, 5.6, 16, 1, true, Math.PI / 4 - 0.3, 0.6),
      new T.MeshStandardMaterial({ map: textTexture("FIELD TRIP", 96, 896, true), transparent: true, roughness: 0.5, depthWrite: false })
    );
    label.position.y = 6.6;
    g.add(label);
    // NASA insignia on both sides of the rocket
    if (window.Models && Models.nasaTexture) {
      const pm = new T.MeshStandardMaterial({ map: Models.nasaTexture(), transparent: true, roughness: 0.45, depthWrite: false });
      [[RR + 0.02, Math.PI / 2], [-(RR + 0.02), -Math.PI / 2]].forEach(([x, ry]) => {
        const p = new T.Mesh(new T.CircleGeometry(0.62, 40), pm);
        p.position.set(x, 4.2, 0);
        p.rotation.y = ry;
        g.add(p);
      });
    }
    shadows(g, true, true);

    // engine flame: two additive cones, a glow sprite and a light
    const flame = new T.Group();
    flame.position.y = NOZZLE;
    g.add(flame);
    const cone = (rt, rb, h, color) => {
      const m = new T.Mesh(
        new T.CylinderGeometry(rt, rb, h, 24, 1, true),
        new T.MeshBasicMaterial({ map: flameTex, color, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })
      );
      m.position.y = -h / 2;
      flame.add(m);
      return m;
    };
    cone(0.95, 0.3, 6, new T.Color(1.0, 0.45, 0.14));
    cone(0.62, 0.06, 3.4, new T.Color(1.8, 1.5, 1.0));
    const fglow = glowSprite(glow, new T.Color(1.0, 0.62, 0.28), 10, 1);
    fglow.position.y = -0.9;
    flame.add(fglow);
    const light = new T.PointLight("#ff8a3a", 0, 120, 1.2);
    light.position.y = -1.8;
    g.add(light);

    g.userData = {
      setLegs(k) {
        const a = lerp(0.05, 0.494, clamp(k, 0, 1));
        legs.forEach((l) => {
          l.hinge.rotation.z = a;
          l.foot.rotation.z = -a;
        });
      },
      setDoor(k) {
        door.rotation.y = clamp(k, 0, 1) * 1.9;
      },
      setThrust(k, time, len) {
        flame.visible = k > 0.01;
        const f = 0.9 + 0.12 * Math.sin(time * 37) + 0.06 * Math.sin(time * 91);
        const w = 1 + 0.05 * Math.sin(time * 53);
        flame.scale.set(w * (0.6 + 0.4 * k), Math.max(0.001, (len || 1) * k * f), w * (0.6 + 0.4 * k));
        fglow.material.opacity = clamp(k, 0, 1);
        light.intensity = k * 4.5 * (0.9 + 0.1 * Math.sin(time * 41));
      },
    };
    return g;
  }

  /* ---------------- launch site pieces ---------------- */
  function buildRamp(top, bottom, width, supports) {
    const g = new T.Group();
    const steel = std("#a3a9b2", { roughness: 0.45, metalness: 0.5 });
    const rail = std("#f2b632", { roughness: 0.5 });
    const dx = bottom.x - top.x, dy = bottom.y - top.y, L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const tilt = new T.Group();
    tilt.position.set(top.x, top.y, 0);
    tilt.rotation.z = ang;
    g.add(tilt);
    const deck = new T.BoxGeometry(L, 0.16, width);
    deck.translate(L / 2, -0.08, 0);
    tilt.add(new T.Mesh(deck, steel));
    [-1, 1].forEach((side) => {
      const z = side * (width / 2 - 0.05);
      const r = new T.BoxGeometry(L, 0.07, 0.07);
      r.translate(L / 2, 0.95, z);
      tilt.add(new T.Mesh(r, rail));
      for (let d = 0.2; d < L; d += 1.4) {
        const p = new T.Mesh(new T.BoxGeometry(0.06, 0.95, 0.06), steel);
        p.position.set(d, 0.47, z);
        tilt.add(p);
      }
    });
    // little landing in front of the hatch
    const plat = new T.Mesh(new T.BoxGeometry(1.05, 0.16, width), steel);
    plat.position.set(top.x - 0.5, top.y - 0.08, 0);
    g.add(plat);
    if (supports) {
      for (let d = 0; d < L - 1; d += 3) {
        const x = top.x + Math.cos(ang) * d, y = top.y + Math.sin(ang) * d - 0.16;
        [-1, 1].forEach((side) => {
          const c = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, y, 8), steel);
          c.position.set(x, y / 2, side * (width / 2 - 0.12));
          g.add(c);
        });
      }
    }
    shadows(g, true, true);
    return { group: g, tilt, plat };
  }
  function buildTower() {
    const g = new T.Group();
    const m = std("#c8442c", { roughness: 0.55, metalness: 0.35 });
    const H = 19, w = 2.4, step = 2.4;
    const beam = new T.BoxGeometry(1, 1, 1);
    const box = (sx, sy, sz, x, y, z, rx, ry, rz) => {
      const b = new T.Mesh(beam, m);
      b.scale.set(sx, sy, sz);
      b.position.set(x, y, z);
      b.rotation.set(rx || 0, ry || 0, rz || 0);
      g.add(b);
    };
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => box(0.22, H, 0.22, (sx * w) / 2, H / 2, (sz * w) / 2)));
    const diag = Math.hypot(w, step), da = Math.atan2(step, w);
    for (let y = step; y <= H; y += step) {
      [-1, 1].forEach((s) => {
        box(w, 0.14, 0.14, 0, y, (s * w) / 2);
        box(0.14, 0.14, w, (s * w) / 2, y, 0);
        box(diag, 0.08, 0.08, 0, y - step / 2, (s * w) / 2, 0, 0, s * da);
        box(diag, 0.08, 0.08, (s * w) / 2, y - step / 2, 0, 0, Math.PI / 2, s * da);
      });
    }
    box(w + 0.6, 0.25, w + 0.6, 0, H + 0.1, 0);
    const mast = new T.Mesh(new T.CylinderGeometry(0.05, 0.08, 4, 6), std("#d9d9d9"));
    mast.position.y = H + 2;
    g.add(mast);
    // swing arm that reaches the rocket, pulls away before launch
    const arm = new T.Group();
    arm.position.set(w / 2, 12.5, 0);
    g.add(arm);
    const a = new T.Mesh(new T.BoxGeometry(3.0, 0.4, 0.7), m);
    a.position.x = 1.5;
    arm.add(a);
    shadows(g, true, false);
    return { group: g, arm };
  }
  function buildBus() {
    const g = new T.Group();
    const yellow = std("#f2b632", { roughness: 0.45 });
    const dark = std("#2a2b2f", { roughness: 0.7 });
    const win = std("#bfe0f2", { roughness: 0.1, metalness: 0.3, emissive: "#2d4a5a", emissiveIntensity: 0.3 });
    const add = (geo, mat, x, y, z) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      g.add(m);
      return m;
    };
    add(new T.BoxGeometry(8, 2.3, 2.5), yellow, 0, 1.75, 0);
    add(new T.BoxGeometry(1.4, 1.3, 2.4), yellow, 4.6, 1.25, 0);
    add(new T.BoxGeometry(8.04, 0.12, 2.54), dark, 0, 1.45, 0);
    add(new T.BoxGeometry(7.8, 0.12, 2.3), std("#f7cf6a"), 0, 2.95, 0);
    for (let i = 0; i < 6; i++) add(new T.BoxGeometry(0.95, 0.72, 2.54), win, -3.25 + i * 1.18, 2.3, 0);
    add(new T.BoxGeometry(0.06, 0.95, 2.1), win, 4.01, 2.25, 0);
    add(new T.BoxGeometry(0.1, 0.25, 0.35), new T.MeshBasicMaterial({ color: "#fff6d0" }), 5.31, 1.3, 0.8);
    add(new T.BoxGeometry(0.1, 0.25, 0.35), new T.MeshBasicMaterial({ color: "#fff6d0" }), 5.31, 1.3, -0.8);
    const wheel = new T.CylinderGeometry(0.52, 0.52, 0.42, 18);
    [-2.6, 3.4].forEach((x) =>
      [-1.12, 1.12].forEach((z) => {
        const w = add(wheel, dark, x, 0.52, z);
        w.rotation.x = Math.PI / 2;
      })
    );
    const txt = new T.MeshBasicMaterial({ map: textTexture("FIELD TRIP", 512, 64, false), transparent: true, depthWrite: false });
    const s1 = add(new T.PlaneGeometry(3.6, 0.45), txt, -0.7, 1.05, 1.26);
    const s2 = add(new T.PlaneGeometry(3.6, 0.45), txt, -0.7, 1.05, -1.26);
    s2.rotation.y = Math.PI;
    shadows(g, true, true);
    s1.castShadow = s2.castShadow = false;
    return g;
  }

  /* ---------------- ground with gentle dunes, far hills and (Moon) craters ---------------- */
  const MUSEUM = { x: 36, z: -36 };
  function buildGround(kind) {
    const craters = [];
    if (kind === "moon") {
      for (let i = 0; i < 18; i++) {
        const a = R(0, TAU), r = R(55, 260), cx = Math.cos(a) * r, cz = Math.sin(a) * r;
        if (Math.hypot(cx - MUSEUM.x, cz - MUSEUM.z) < 50) continue;
        craters.push({ x: cx, z: cz, r: R(6, 26) });
      }
    }
    const amp = kind === "earth" ? 3 : 6;
    const hills = kind === "earth" ? 150 : kind === "mars" ? 230 : 120;
    const height = (x, z) => {
      const r = Math.hypot(x, z);
      let flat = smooth(28, 70, r);
      if (kind !== "earth") flat = Math.min(flat, smooth(24, 55, Math.hypot(x - MUSEUM.x, z - MUSEUM.z)));
      let y = (fbm3(x * 0.03, 0.5, z * 0.03, 2, 11) - 0.5) * amp * flat;
      y += smooth(240, 800, r) * fbm3(x * 0.004, 1.5, z * 0.004, 3, 5) * hills;
      for (const c of craters) {
        const d = Math.hypot(x - c.x, z - c.z) / c.r;
        if (d < 1.6) y += (d < 1 ? -(1 - d * d) * c.r * 0.22 : 0) + Math.exp(-Math.pow((d - 1) / 0.2, 2)) * c.r * 0.08;
      }
      return y;
    };
    const geo = new T.PlaneGeometry(1800, 1800, 150, 150);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, height(x, z));
      const n = fbm3(x * 0.012, 2.5, z * 0.012, 3, 29);
      let c = 0.72 + n * 0.5;
      if (kind === "mars") c = lerp(1.08, 0.62, smooth(0.5, 0.66, n));
      cols[i * 3] = c;
      cols[i * 3 + 1] = c * (kind === "mars" ? 0.96 : 1);
      cols[i * 3 + 2] = c * (kind === "mars" ? 0.92 : 1);
    }
    geo.setAttribute("color", new T.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const mesh = new T.Mesh(geo, std("#ffffff", { map: groundTexture(kind), vertexColors: true, roughness: 1, metalness: 0 }));
    mesh.receiveShadow = true;
    return { mesh, height };
  }
  function buildRocks(kind, height) {
    const n = 140;
    const mat = std(kind === "mars" ? "#7a3d26" : "#8b8b88", { roughness: 0.95, flatShading: true });
    const rocks = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), mat, n);
    const m = new T.Matrix4(), q = new T.Quaternion(), s = V(1, 1, 1), p = V(0, 0, 0), e = new T.Euler();
    let k = 0;
    for (let i = 0; i < n * 3 && k < n; i++) {
      const a = R(0, TAU), r = 8 + Math.pow(rng(), 1.6) * 160, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.hypot(x - MUSEUM.x, z - MUSEUM.z) < 22) continue;
      if (z > -30 && z < 6 && x > -2 && x < 36 && Math.abs(z + x * 0.75) < 8) continue; // keep the kids' path clear
      if (Math.abs(z) < 3 && x > 0 && x < 16) continue;
      const sc = R(0.15, 0.6) * (r > 40 ? 2.2 : 1);
      s.set(sc * R(0.8, 1.6), sc * R(0.5, 1), sc * R(0.8, 1.5));
      p.set(x, height(x, z) + s.y * 0.35, z);
      q.setFromEuler(e.set(R(0, 3), R(0, 3), R(0, 3)));
      rocks.setMatrixAt(k++, m.compose(p, q, s));
    }
    rocks.count = k;
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    return rocks;
  }

  /* ---------------- the museum: classical hall under a glass dome ---------------- */
  function buildMuseum(glow) {
    const g = new T.Group();
    const stone = std("#ece4d2", { roughness: 0.7 });
    const stone2 = std("#cfc6b2", { roughness: 0.8 });
    const warm = new T.MeshBasicMaterial({ color: new T.Color(1.4, 1.05, 0.6) });
    const add = (geo, mat, x, y, z) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      g.add(m);
      return m;
    };
    add(new T.BoxGeometry(20, 0.8, 16), stone2, 0, 0.4, 0);
    add(new T.BoxGeometry(9, 0.4, 2.2), stone2, 0, 0.2, 8.6);
    add(new T.BoxGeometry(13, 4.8, 8), stone, 0, 3.2, -1.4);
    add(new T.BoxGeometry(13.6, 0.5, 8.6), stone2, 0, 5.85, -1.4);
    for (let i = 0; i < 6; i++) {
      add(new T.CylinderGeometry(0.3, 0.36, 4.4, 14), stone, -5 + i * 2, 3.0, 4.4);
      add(new T.BoxGeometry(0.8, 0.22, 0.8), stone2, -5 + i * 2, 5.3, 4.4);
    }
    add(new T.BoxGeometry(12.4, 0.6, 2.6), stone, 0, 5.7, 4.0);
    const tri = new T.Shape();
    tri.moveTo(-6.4, 0);
    tri.lineTo(6.4, 0);
    tri.lineTo(0, 2.0);
    tri.closePath();
    const ped = add(new T.ExtrudeGeometry(tri, { depth: 2.4, bevelEnabled: false }), stone, 0, 6.0, 2.7);
    ped.castShadow = true;

    add(new T.BoxGeometry(2.2, 3.2, 0.12), warm, 0, 2.4, 2.62);
    [-4.6, -2.4, 2.4, 4.6].forEach((x) => add(new T.BoxGeometry(1.0, 1.6, 0.1), warm, x, 3.3, 2.62));
    // glass dome with metal ribs
    const R0 = 15;
    const dome = add(
      new T.SphereGeometry(R0, 48, 24, 0, TAU, 0, Math.PI / 2),
      new T.MeshPhongMaterial({ color: "#a9dcff", specular: "#ffffff", shininess: 90, transparent: true, opacity: 0.17, depthWrite: false, side: T.DoubleSide }),
      0, 0, 0
    );
    dome.renderOrder = 2;
    const rib = std("#e9eef5", { metalness: 0.6, roughness: 0.3 });
    for (let i = 0; i < 8; i++) {
      const t = new T.Mesh(new T.TorusGeometry(R0, 0.08, 6, 48, Math.PI), rib);
      t.rotation.y = (i * Math.PI) / 8;
      g.add(t);
    }
    [0.52, 0.95, 1.3].forEach((phi) => {
      const t = new T.Mesh(new T.TorusGeometry(R0 * Math.sin(phi), 0.08, 6, 64), rib);
      t.rotation.x = Math.PI / 2;
      t.position.y = R0 * Math.cos(phi);
      g.add(t);
    });
    add(new T.TorusGeometry(R0, 0.3, 8, 64), rib, 0, 0.15, 0).rotation.x = Math.PI / 2;
    shadows(g, true, true);
    dome.castShadow = false;
    const shine = glowSprite(glow, new T.Color(1, 0.85, 0.6), 16, 0.35);
    shine.position.set(0, 3.5, 4);
    g.add(shine);
    return g;
  }

  /* ---------------- walking along a path ---------------- */
  function makePath(points) {
    const P = points.map((p) => V(p[0], p[1], p[2]));
    const acc = [0];
    for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + P[i].distanceTo(P[i - 1]));
    const len = acc[acc.length - 1];
    return {
      len,
      at(s, out) {
        s = clamp(s, 0, len);
        let i = 1;
        while (i < P.length - 1 && acc[i] < s) i++;
        const a = P[i - 1], b = P[i], u = (s - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
        out.copy(a).lerp(b, u);
        return Math.atan2(b.x - a.x, b.z - a.z);
      },
    };
  }

  /* =====================================================================
   *  PLAY
   * ===================================================================== */
  function play(opts) {
    opts = opts || {};
    if (current) current.stop(true);
    return new Promise((resolve) => {
      current = run(opts, resolve);
    });
  }

  function run(opts, resolve) {
    const tr = typeof opts.t === "function" ? opts.t : window.I18N ? window.I18N.t : (k) => k;
    const place = opts.place === "mars" ? "mars" : "moon";
    const mars = place === "mars";
    // the game's "Reduce motion" setting, or the device's own setting
    const reduced = document.documentElement.classList.contains("a11y-calm") || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const vars = { dest: tr("cut.dest." + place), robot: opts.robotName || "" };
    rng = seeded(mars ? 42 : 7);
    BAG = new Set();
    const bag = BAG;

    /* ---- overlay DOM ---- */
    const root = document.createElement("div");
    root.className = "cs-root" + (reduced ? " cs-reduced" : "");
    root.dir = document.documentElement.dir || "ltr";
    if (document.documentElement.lang) root.lang = document.documentElement.lang;
    root.innerHTML = `
      <canvas class="cs-canvas" aria-hidden="true"></canvas>
      <div class="cs-vignette" aria-hidden="true"></div>
      <div class="cs-grain" aria-hidden="true"></div>
      <div class="cs-fade" aria-hidden="true"></div>
      <div class="cs-count" aria-hidden="true"></div>
      <div class="cs-bar cs-top" aria-hidden="true"></div>
      <div class="cs-bar cs-bottom"><p class="cs-cap" aria-live="polite"></p></div>
      <button type="button" class="cs-skip"><span></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l6 6-6 6M10 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    const $ = (s) => root.querySelector(s);
    const cvs = $(".cs-canvas"), fadeEl = $(".cs-fade"), capEl = $(".cs-cap"), countEl = $(".cs-count"), skipBtn = $(".cs-skip");
    skipBtn.querySelector("span").textContent = tr("cut.skip");
    fadeEl.style.opacity = "1";
    document.body.appendChild(root);
    const prevFocus = document.activeElement;
    requestAnimationFrame(() => root.classList.add("cs-on"));
    try { skipBtn.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }

    let stopped = false, raf = 0, renderer = null;
    const scenes = [];
    const loose = []; // objects that might not be in a scene when we clean up

    function stop(skipped) {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", swallow, true);
      window.removeEventListener("resize", onResize);
      root.classList.add(skipped ? "cs-out-fast" : "cs-out");
      setTimeout(() => {
        cleanup();
        root.remove();
        if (prevFocus && prevFocus.focus && document.contains(prevFocus)) {
          try { prevFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        }
        if (current && current.stop === stop) current = null;
        const result = { skipped: !!skipped, place };
        resolve(result);
        if (typeof opts.onDone === "function") {
          try { opts.onDone(result); } catch (e) { console.error(e); }
        }
      }, skipped ? 220 : 520);
    }
    function cleanup() {
      const seen = new Set();
      const free = (o) => {
        o.traverse((m) => {
          if (m.geometry && !seen.has(m.geometry)) {
            seen.add(m.geometry);
            m.geometry.dispose();
          }
          if (m.isInstancedMesh && m.dispose) m.dispose();
          const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
          mats.forEach((mat) => {
            if (seen.has(mat)) return;
            seen.add(mat);
            ["map", "bumpMap", "alphaMap", "emissiveMap", "normalMap"].forEach((k) => mat[k] && mat[k].dispose());
            if (mat.uniforms && mat.uniforms.map && mat.uniforms.map.value) mat.uniforms.map.value.dispose();
            mat.dispose();
          });
        });
      };
      scenes.forEach(free);
      loose.forEach(free);
      bag.forEach((t) => t.dispose());
      bag.clear();
      if (renderer) {
        renderer.renderLists.dispose();
        renderer.dispose();
        try { renderer.forceContextLoss(); } catch (e) { /* ignore */ }
      }
    }
    const swallow = (e) => e.stopPropagation();
    function onKey(e) {
      e.stopPropagation(); // the game underneath should not react while the movie plays
      if (e.key === "Escape") {
        e.preventDefault();
        stop(true);
      }
    }
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", swallow, true);
    skipBtn.addEventListener("click", () => stop(true));

    /* ---- renderer ---- */
    try {
      renderer = new T.WebGLRenderer({ canvas: cvs, antialias: true, powerPreference: "high-performance" });
    } catch (e) {
      console.warn("Cutscene: WebGL unavailable, skipping", e);
      setTimeout(() => stop(true), 0);
      return { stop };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const camera = new T.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 5000);
    function onResize() {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      // keep a cinematic framing on tall screens by widening the lens a bit
      camera.fov = camera.aspect < 1 ? 58 : 40;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);
    onResize();

    // build on the next frames so the black overlay paints first
    setTimeout(() => {
      if (stopped) return;
      try {
        build();
      } catch (e) {
        console.error("Cutscene failed to build", e);
        stop(true);
      }
    }, 60);

    /* ---- captions and countdown ---- */
    let capId = null;
    function caption(key) {
      if (capId === key) return;
      capId = key;
      capEl.classList.remove("on");
      void capEl.offsetWidth;
      capEl.textContent = tr(key, vars);
      capEl.classList.add("on");
    }
    let countShown = null;
    const fmt = (n) => {
      try { return new Intl.NumberFormat(document.documentElement.lang || undefined).format(n); } catch (e) { return String(n); }
    };
    function showCount(n) {
      if (n === countShown) return;
      countShown = n;
      countEl.classList.remove("go");
      void countEl.offsetWidth;
      countEl.textContent = n == null ? "" : fmt(n);
      if (n != null) countEl.classList.add("go");
    }

    /* =================================================================
     *  BUILD THE WORLD
     * ================================================================= */
    function build() {
      const glow = glowTexture(), puff = puffTexture(), dot = dotTexture(), flameTex = flameTexture();
      const rocket = buildRocket(glow, flameTex);
      const RK = rocket.userData;
      loose.push(rocket);

      // characters
      const classmates = [
        { skin: "#8a5434", shirt: "#e8a21c", pants: "#3d3d42", hair: "braids", hairColor: "#1c1714", extra: "none" },
        { skin: "#f1c7a5", shirt: "#1fa3a3", pants: "#4a6fa5", hair: "curly", hairColor: "#8e3b1f", extra: "glasses" },
        { skin: "#c98d63", shirt: "#e0607e", pants: "#5a4632", hair: "scarf", hairColor: "#7a4bb0", extra: "none" },
      ];
      const crew = [];
      const addKid = (look) => {
        const m = Models.kid(Object.assign({}, look, { suit: true }));
        const holder = new T.Group();
        holder.add(m);
        crew.push({ holder, model: m, robot: false });
      };
      addKid(opts.kid || {});
      {
        const m = Models.robot(opts.robot || {});
        m.scale.setScalar(0.85);
        const holder = new T.Group();
        holder.add(m);
        crew.push({ holder, model: m, robot: true });
      }
      classmates.forEach(addKid);
      crew.forEach((c) => loose.push(c.holder));

      /* ---------- EARTH launch site ---------- */
      const E = { scene: new T.Scene() };
      scenes.push(E.scene);
      {
        const s = E.scene;
        E.sunDir = V(-0.75, 0.2, -0.62).normalize();
        E.sky = makeSky({ top: "#2c5aa0", horizon: "#ffb26b", bottom: "#b98a5e", sunDir: E.sunDir, sunCol: "#ffd9a0", sunAmt: 1 });
        s.add(E.sky);
        s.fog = new T.Fog(new T.Color("#f2b47e"), 140, 950);
        s.add(new T.HemisphereLight("#ffd8b0", "#5a4a3a", 0.95));
        const sun = new T.DirectionalLight("#ffc48a", 2.7);
        sun.position.copy(E.sunDir).multiplyScalar(80);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 200 });
        sun.shadow.bias = -0.0005;
        s.add(sun, sun.target);
        const ground = buildGround("earth");
        s.add(ground.mesh);
        const pad = new T.Mesh(new T.CircleGeometry(16, 64), std("#bdb6a8", { roughness: 0.9 }));
        pad.rotation.x = -Math.PI / 2;
        pad.position.y = 0.02;
        pad.receiveShadow = true;
        s.add(pad);
        const scorch = new T.Mesh(new T.CircleGeometry(4.4, 40), std("#5a524b", { roughness: 1 }));
        scorch.rotation.x = -Math.PI / 2;
        scorch.position.y = 0.03;
        scorch.receiveShadow = true;
        s.add(scorch);
        const road = new T.Mesh(new T.PlaneGeometry(40, 5), std("#4b4a4c", { roughness: 0.95 }));
        road.rotation.x = -Math.PI / 2;
        road.position.set(30, 0.025, -5);
        road.rotation.z = 0.2;
        road.receiveShadow = true;
        s.add(road);
        const tower = buildTower();
        tower.group.position.set(-5.8, 0, 0);
        E.arm = tower.arm;
        s.add(tower.group);
        const ramp = buildRamp({ x: 2.45, y: HATCH_Y }, { x: 14.4, y: 0 }, 1.7, true);
        s.add(ramp.group);
        const bus = buildBus();
        bus.position.set(21, 0, -10);
        bus.rotation.y = 0.35;
        s.add(bus);
        E.sun = makeSun(glow, new T.Color(1.0, 0.75, 0.45));
        s.add(E.sun);
        E.stars = makeStars(1800, 1300, false, dot);
        E.stars.setOpacity(0);
        s.add(E.stars);
        // clouds the rocket climbs through
        E.clouds = new T.Group();
        for (let i = 0; i < 34; i++) {
          const c = new T.Sprite(new T.SpriteMaterial({ map: puff, color: new T.Color(1.0, 0.86, 0.72), transparent: true, opacity: R(0.55, 0.85), depthWrite: false, fog: false }));
          const a = R(0, TAU), r = R(16, 110), sc = R(28, 70);
          c.position.set(Math.cos(a) * r, R(150, 560), Math.sin(a) * r);
          c.scale.set(sc * 1.6, sc, 1);
          E.clouds.add(c);
        }
        s.add(E.clouds);
        E.smoke = new Particles(1800, puff, false, { floor: 0.2 });
        E.fire = new Particles(900, glow, true, { floor: 0.4, splash: 0.75 });
        s.add(E.smoke.mesh, E.fire.mesh);
        E.padGlow = new T.Mesh(new T.PlaneGeometry(26, 26), new T.MeshBasicMaterial({ map: glow, color: new T.Color(1.0, 0.5, 0.18), transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }));
        E.padGlow.rotation.x = -Math.PI / 2;
        E.padGlow.position.y = 0.06;
        s.add(E.padGlow);
        E.path = makePath([[27, 0, 3.5], [14.4, 0, 0], [2.45, HATCH_Y, 0], [0.9, HATCH_Y, 0]]);
        E.skyStops = [
          { top: new T.Color("#2c5aa0"), horizon: new T.Color("#ffb26b"), bottom: new T.Color("#b98a5e") },
          { top: new T.Color("#10285e"), horizon: new T.Color("#5d8fcf"), bottom: new T.Color("#3b5d8a") },
          { top: new T.Color("#010208"), horizon: new T.Color("#0c1c44"), bottom: new T.Color("#071026") },
        ];
      }
      const tmpC = new T.Color();
      function setSkyK(k) {
        const st = E.skyStops, u = E.sky.material.uniforms;
        const a = k < 0.5 ? st[0] : st[1], b = k < 0.5 ? st[1] : st[2], f = k < 0.5 ? k * 2 : (k - 0.5) * 2;
        u.top.value.copy(a.top).lerp(b.top, f);
        u.horizon.value.copy(a.horizon).lerp(b.horizon, f);
        u.bottom.value.copy(a.bottom).lerp(b.bottom, f);
        u.sunAmt.value = 1 - k * 0.5;
        E.scene.fog.color.copy(u.horizon.value);
        E.stars.setOpacity(smooth(0.45, 1, k));
      }

      /* ---------- SPACE ---------- */
      const S = { scene: new T.Scene() };
      scenes.push(S.scene);
      {
        const s = S.scene;
        s.background = new T.Color("#000000");
        S.sunDir = V(0.62, 0.36, 0.7).normalize();
        s.add(new T.HemisphereLight("#8fa3d0", "#2a2234", 0.8));
        const sun = new T.DirectionalLight("#fff3e0", 2.6);
        sun.position.copy(S.sunDir).multiplyScalar(60);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 140 });
        s.add(sun, sun.target);
        S.stars = makeStars(2600, 1300, true, dot);
        s.add(S.stars);
        S.sun = makeSun(glow, new T.Color(1.0, 0.9, 0.75));
        s.add(S.sun);
        const et = earthTextures();
        S.earthTex = et;
        S.earth = new T.Group();
        const em = new T.Mesh(new T.SphereGeometry(30, 64, 32), std("#ffffff", { map: et.map, roughness: 0.8, metalness: 0 }));
        S.earthClouds = new T.Mesh(new T.SphereGeometry(30.5, 64, 32), new T.MeshStandardMaterial({ map: et.clouds, transparent: true, depthWrite: false, roughness: 1 }));
        S.earth.add(em, S.earthClouds, glowSprite(glow, new T.Color(0.35, 0.65, 1.0), 30 * 2.7, 0.8));
        S.earth.rotation.z = 0.4;
        s.add(S.earth);
        const dt = destTexture(place);
        S.dest = new T.Group();
        S.dest.add(new T.Mesh(new T.SphereGeometry(50, 72, 36), std("#ffffff", { map: dt, bumpMap: dt, bumpScale: 0.6, roughness: 0.95, metalness: 0 })));
        if (mars) S.dest.add(glowSprite(glow, new T.Color(1.0, 0.55, 0.3), 50 * 2.5, 0.45));
        s.add(S.dest);
        // warp streaks
        const N = 150;
        S.streaks = new T.InstancedMesh(
          new T.BoxGeometry(0.06, 0.06, 1),
          new T.MeshBasicMaterial({ color: new T.Color(0.6, 0.78, 1.0), transparent: true, opacity: reduced ? 0.2 : 0.4, blending: T.AdditiveBlending, depthWrite: false }),
          N
        );
        S.streaks.frustumCulled = false;
        S.streakData = [];
        for (let i = 0; i < N; i++) {
          const a = R(0, TAU), r = R(5, 46);
          S.streakData.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: R(-160, 160) });
        }
        s.add(S.streaks);
        S.fire = new Particles(500, glow, true);
        s.add(S.fire.mesh);
      }
      const sm = new T.Matrix4(), sq = new T.Quaternion(), ss = V(1, 1, 1), sp = V(0, 0, 0);
      function updateStreaks(speed, dt) {
        const len = Math.max(0.5, speed * 0.14);
        S.streakData.forEach((d, i) => {
          d.z += speed * dt;
          if (d.z > 160) d.z -= 320;
          sp.set(d.x, d.y, d.z);
          ss.set(1, 1, len);
          S.streaks.setMatrixAt(i, sm.compose(sp, sq, ss));
        });
        S.streaks.instanceMatrix.needsUpdate = true;
      }

      /* ---------- LANDING SITE ---------- */
      const L = { scene: new T.Scene() };
      scenes.push(L.scene);
      {
        const s = L.scene;
        L.sunDir = V(-0.6, mars ? 0.45 : 0.3, 0.55).normalize();
        L.sky = makeSky(
          mars
            ? { top: "#9c6446", horizon: "#e6b47e", bottom: "#c99668", sunDir: L.sunDir, sunCol: "#fff1d6", sunAmt: 0.8, curve: 0.6 }
            : { top: "#000000", horizon: "#04050a", bottom: "#000000", sunDir: L.sunDir, sunCol: "#ffffff", sunAmt: 0.12 }
        );
        s.add(L.sky);
        if (mars) s.fog = new T.Fog(new T.Color("#dcaa78"), 70, 620);
        else {
          L.stars = makeStars(2200, 1300, true, dot);
          s.add(L.stars);
        }
        s.add(mars ? new T.HemisphereLight("#f3cfa3", "#7a3a22", 0.75) : new T.HemisphereLight("#8a97b0", "#262626", 0.28));
        const sun = new T.DirectionalLight(mars ? "#ffe8cc" : "#ffffff", mars ? 2.3 : 3.1);
        sun.position.copy(L.sunDir).multiplyScalar(90);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 260 });
        sun.shadow.bias = -0.0006;
        s.add(sun, sun.target);
        const ground = buildGround(place);
        L.height = ground.height;
        s.add(ground.mesh, buildRocks(place, ground.height));
        const museum = buildMuseum(glow);
        museum.position.set(MUSEUM.x, 0, MUSEUM.z);
        museum.rotation.y = -Math.PI / 4; // front door faces the landing pad
        s.add(museum);
        L.sun = makeSun(glow, mars ? new T.Color(1.0, 0.9, 0.78) : new T.Color(1, 1, 1));
        L.sun.scale.setScalar(mars ? 0.6 : 0.8);
        s.add(L.sun);
        if (!mars) {
          // home, hanging in the black sky
          L.earth = new T.Group();
          L.earth.add(new T.Mesh(new T.SphereGeometry(34, 48, 24), std("#ffffff", { map: S.earthTex.map, roughness: 0.8 })));
          L.earth.add(new T.Mesh(new T.SphereGeometry(34.6, 48, 24), new T.MeshStandardMaterial({ map: S.earthTex.clouds, transparent: true, depthWrite: false })));
          L.earth.add(glowSprite(glow, new T.Color(0.35, 0.65, 1.0), 34 * 2.6, 0.6));
          s.add(L.earth);
        }
        L.ramp = buildRamp({ x: 2.45, y: HATCH_Y }, { x: 11, y: 0 }, 1.7, false);
        s.add(L.ramp.group);
        L.dust = new Particles(3000, puff, false, { floor: 0.15 });
        L.fire = new Particles(700, glow, true, { floor: 0.35, splash: 0.9 });
        s.add(L.dust.mesh, L.fire.mesh);
        L.padGlow = new T.Mesh(new T.PlaneGeometry(30, 30), new T.MeshBasicMaterial({ map: glow, color: new T.Color(1.0, 0.5, 0.2), transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }));
        L.padGlow.rotation.x = -Math.PI / 2;
        L.padGlow.position.y = 0.08;
        s.add(L.padGlow);
        L.path = makePath([[0.9, HATCH_Y, 0], [2.45, HATCH_Y, 0], [11, 0, 0], [15.5, 0, -3], [32, 0, -26]]);
      }

      // warm up the shaders for every scene so no shot hitches on its first frame
      [L, S, E].forEach((W) => {
        W.scene.add(rocket);
        crew.forEach((c) => W.scene.add(c.holder));
        renderer.compile(W.scene, camera);
      });

      /* ---------- shared helpers for shots ---------- */
      const cur = { shake: 0, roll: 0 };
      const camPos = V(0, 0, 0), camLook = V(0, 0, 0);
      function cam(p0, p1, l0, l1, u) {
        camPos.copy(p0).lerp(p1, u);
        camLook.copy(l0).lerp(l1, u);
      }
      const tmp = V(0, 0, 0);
      function walk(path, lead, spacing, time, hop, tail) {
        crew.forEach((c, i) => {
          const s = lead - i * spacing;
          c.holder.visible = s > 0.05 && s < path.len - tail;
          const heading = path.at(s, tmp);
          c.holder.position.copy(tmp);
          c.holder.rotation.y = heading;
          const moving = s > 0 && s < path.len;
          if (c.robot) Models.animateRobot(c.model, time, moving);
          else Models.animateKid(c.model, time + i * 0.37, moving ? 4 : 0, hop);
        });
      }
      function hideCrew() {
        crew.forEach((c) => (c.holder.visible = false));
      }
      const col = (r, g, b) => new T.Color(r, g, b);
      const HOT = col(3.2, 2.4, 1.4), EMBER = col(1.3, 0.28, 0.05);
      const nozzleW = V(0, 0, 0);
      function emitFire(ps, n, spread, speedLo, speedHi, dir, s1) {
        rocket.localToWorld(nozzleW.set(0, NOZZLE - 0.2, 0));
        for (let i = 0; i < n; i++) {
          const sp = R(speedLo, speedHi);
          ps.emit(
            nozzleW.x + R(-spread, spread), nozzleW.y + R(-0.2, 0.2), nozzleW.z + R(-spread, spread),
            dir.x * sp + R(-1.2, 1.2), dir.y * sp + R(-1.2, 1.2), dir.z * sp + R(-1.2, 1.2),
            R(0.22, 0.5), R(0.8, 1.3), s1 || R(2.2, 3.6), 0.85, HOT, EMBER, 1.6, 0
          );
        }
      }
      const DOWN = V(0, -1, 0), BACK = V(0, 0, 1);

      /* =================================================================
       *  SHOTS
       * ================================================================= */
      const SMOKE_WARM = col(1.25, 0.8, 0.52), SMOKE_GRAY = col(0.62, 0.56, 0.52), VAPOR = col(0.95, 0.95, 0.98);
      const dustBase = mars ? new T.Color("#b8653c") : new T.Color("#a3a3a0");
      const DUST0 = dustBase.clone().lerp(col(1.2, 0.6, 0.25), 0.25), DUST1 = dustBase.clone().multiplyScalar(0.8);
      let touched = false, tau = 0, impulse = 0;

      const shots = [
        /* 1. boarding at golden hour */
        {
          W: E, dur: 6.5, from: reduced ? 1.5 : 0, fadeIn: 0.8, fadeOut: 0.25,
          enter() {
            E.scene.add(rocket);
            crew.forEach((c) => E.scene.add(c.holder));
            rocket.position.set(0, 0, 0);
            rocket.rotation.set(0, 0, 0);
            RK.setLegs(1);
            RK.setDoor(1);
            setSkyK(0);
            caption("cut.board");
          },
          update(lt, dt, time) {
            cam(V(31, 8.5, 33), V(17.5, 4.2, 15.5), V(4, 6.5, 0), V(6, 5.0, 0), easeIO(lt / 6.5));
            walk(E.path, 15.5 + 2.6 * lt, 1.25, time, 1, 0.3);
            RK.setDoor(1 - smooth(5.4, 6.3, lt));
            RK.setThrust(0, time);
          },
        },
        /* 2. countdown, ignition, liftoff */
        {
          W: E, dur: 6, to: reduced ? 5.6 : 6, fadeIn: 0.25, fadeOut: 0.2,
          enter() {
            hideCrew();
            RK.setDoor(0);
          },
          update(lt, dt, time) {
            if (lt < 3) {
              showCount(3 - Math.floor(lt));
              caption("cut.countdown");
            } else {
              showCount(null);
              caption("cut.liftoff");
            }
            E.arm.rotation.y = 1.4 * smooth(1.0, 2.6, lt);
            const thrust = smooth(2.95, 3.35, lt);
            const tt = lt - 3.7;
            const y = tt > 0 ? 0.9 * tt * tt + 1.1 * tt * tt * tt : 0;
            rocket.position.y = y;
            RK.setThrust(thrust, time, 1 + thrust * 0.7);
            E.fire.cx = E.fire.cz = 0;
            if (lt < 3) {
              // cold vapor venting before ignition
              for (let i = E.smoke.count(36, dt); i > 0; i--) {
                const a = R(0, TAU);
                E.smoke.emit(Math.cos(a) * 1.6, R(1.2, 6), Math.sin(a) * 1.6, Math.cos(a) * R(0.5, 1.5), R(-0.4, 0.3), Math.sin(a) * R(0.5, 1.5), R(1.4, 2.2), R(0.6, 1), R(2.4, 3.6), 0.35, VAPOR, VAPOR, 0.6, -0.4);
              }
            }
            if (thrust > 0) {
              emitFire(E.fire, E.fire.count(650 * thrust, dt), 0.35, 16, 26, DOWN);
              const near = smooth(30, 0, y);
              const n = E.smoke.count((lt < 4.3 ? 1000 : 420) * thrust * (0.25 + 0.75 * near), dt);
              for (let i = 0; i < n; i++) {
                const a = R(0, TAU), r = R(1.2, 3.2), sp = R(8, 24);
                const bx = rng() < 0.4 ? Math.sign(Math.cos(a)) * 6 : 0; // extra push down the flame trench
                E.smoke.emit(Math.cos(a) * r, R(0.6, 1.8), Math.sin(a) * r, Math.cos(a) * sp + bx, R(0.4, 3.6), Math.sin(a) * sp, R(3, 6), R(1.5, 3), R(7, 13), 0.55, SMOKE_WARM, SMOKE_GRAY, R(0.75, 1.2), 0.3);
              }
            }
            E.padGlow.material.opacity = thrust * smooth(35, 0, y) * 0.9;
            renderer.toneMappingExposure = 1.05 + (lt > 3 ? 0.55 * Math.exp(-(lt - 3) * 3) : 0);
            cam(V(-3, 1.4, 38), V(-1, 1.2, 33), V(0, 7.5, 0), V(0, 7.5, 0), easeIO(lt / 6));
            camLook.y += y * 0.9;
            cur.shake = thrust * (0.06 + 0.22 * Math.exp(-(lt - 3) * 2.2)) * (0.4 + 0.6 * smooth(40, 0, y));
            E.smoke.update(dt);
            E.fire.update(dt);
          },
        },
        /* 3. climbing through the clouds, sky turning to space */
        {
          W: E, dur: 3, to: reduced ? 2.2 : 3, fadeIn: 0.2, fadeOut: 0.35,
          enter() {
            renderer.toneMappingExposure = 1.05;
            E.padGlow.material.opacity = 0;
          },
          update(lt, dt, time) {
            caption("cut.liftoff");
            const y = 170 + 70 * lt + 40 * lt * lt;
            rocket.position.set(0, y, 0);
            rocket.rotation.z = 0.04 * Math.sin(time * 1.3);
            RK.setThrust(1, time, 1.9);
            setSkyK(lerp(0.2, 1, smooth(0, 3, lt)));
            emitFire(E.fire, E.fire.count(420, dt), 0.3, 16, 24, DOWN);
            for (let i = E.smoke.count(160, dt); i > 0; i--) {
              E.smoke.emit(R(-0.6, 0.6), y - R(1, 5), R(-0.6, 0.6), R(-2, 2), R(-10, -4), R(-2, 2), R(2.5, 4), R(1.6, 2.6), R(6, 10), 0.5, SMOKE_WARM, SMOKE_GRAY, 1.3, 0);
            }
            camPos.set(22 - lt * 1.5, y - 8, 28);
            camLook.set(0, y + 7.5, 0);
            cur.shake = 0.07;
            E.smoke.update(dt);
            E.fire.update(dt);
          },
        },
        /* 4. space cruise, Earth falling behind */
        {
          W: S, dur: 3.5, from: reduced ? 1 : 0, fadeIn: 0.35, fadeOut: 0.25,
          enter() {
            S.scene.add(rocket);
            rocket.position.set(0, 0, 7);
            rocket.rotation.set(-Math.PI / 2, 0, 0);
            RK.setLegs(0);
            setSkyK(0);
            caption("cut.space");
          },
          update(lt, dt, time) {
            const u = lt / 3.5;
            camPos.set(-17 + lt * 1.2, 6 - lt * 0.4, -26 + lt * 0.8);
            camLook.set(4, -4, 22);
            const dir = V(30, -18, 84).normalize();
            S.earth.position.copy(V(-17, 6, -26)).addScaledVector(dir, lerp(120, 460, easeOut(u)));
            S.earth.rotation.y += dt * 0.05;
            S.earthClouds.rotation.y += dt * 0.02;
            S.dest.position.set(-10, -6, -2000);
            RK.setThrust(0.85, time, 1.3);
            emitFire(S.fire, S.fire.count(260, dt), 0.25, 18, 28, BACK, R(1.6, 2.6));
            S.fire.update(dt);
            updateStreaks(reduced ? 40 : 150, dt);
            rocket.rotation.z = 0.05 * Math.sin(time * 0.8);
          },
        },
        /* 5. the destination grows ahead */
        {
          W: S, dur: 4, from: reduced ? 1 : 0, fadeIn: 0.25, fadeOut: 0.45,
          enter() {
            caption(mars ? "cut.approach.mars" : "cut.approach.moon");
            S.earth.position.set(0, 0, 3000);
          },
          update(lt, dt, time) {
            const u = lt / 4;
            cam(V(9, 8, 34), V(6, 5.5, 28), V(-4, -2, -40), V(-6, -3, -40), easeIO(u));
            S.dest.position.set(-12, -8, -lerp(640, 150, easeOut(u)));
            S.dest.rotation.y = 0.6 + lt * 0.03;
            RK.setThrust(0.6, time, 1);
            emitFire(S.fire, S.fire.count(180, dt), 0.25, 18, 26, BACK, R(1.4, 2.2));
            S.fire.update(dt);
            updateStreaks(lerp(reduced ? 40 : 150, 18, easeOut(u)), dt);
          },
        },
        /* 6. landing: the showpiece */
        {
          W: L, dur: 7.5, from: reduced ? 2 : 0, fadeIn: 0.45, fadeOut: 0.25,
          enter(start) {
            L.scene.add(rocket);
            crew.forEach((c) => L.scene.add(c.holder));
            hideCrew();
            rocket.rotation.set(0, 0, 0);
            RK.setDoor(0);
            L.ramp.group.visible = false;
            tau = start;
            touched = false;
            caption("cut.landing");
          },
          update(lt, dt, time) {
            // slow motion around touchdown
            const slow = 1 - 0.58 * smooth(3.0, 4.2, lt) * (1 - smooth(6.2, 7.4, lt));
            const sdt = dt * slow;
            tau += sdt;
            const s = clamp(tau / 4.4, 0, 1);
            const y = 62 * Math.pow(1 - s, 2.4);
            rocket.position.set(0, y, 0);
            rocket.rotation.z = 0.03 * Math.sin(tau * 2.1) * (1 - s);
            rocket.rotation.x = 0.02 * Math.sin(tau * 1.7) * (1 - s);
            RK.setLegs(smooth(1.0, 2.4, tau));
            const thrust = touched ? Math.max(0, 1 - (tau - 4.4) / 0.35) : 0.75 + 0.35 * smooth(30, 2, y);
            RK.setThrust(thrust, time, 0.9 + smooth(30, 4, y) * 0.5);
            L.fire.cx = L.fire.cz = 0;
            if (thrust > 0.02) emitFire(L.fire, L.fire.count(520 * thrust * slow, dt), 0.3, 14, 22, DOWN, R(1.8, 3));
            // the dust ring
            const near = smooth(24, 1, y) * (touched ? 0 : 1);
            const n = L.dust.count(near * (reduced ? 420 : 820) * slow, dt);
            for (let i = 0; i < n; i++) spawnDust(R(0.6, 3), 1);
            if (!touched && s >= 1) {
              touched = true;
              impulse = reduced ? 0 : 0.42;
              for (let i = 0; i < (reduced ? 120 : 260); i++) spawnDust(R(1, 3.5), 0.75);
              caption("cut.touchdown");
            }
            impulse *= Math.exp(-dt * 4);
            L.padGlow.material.opacity = thrust * smooth(26, 0, y);
            L.dust.update(sdt);
            L.fire.update(sdt);
            // ramp slides out once things settle
            const rk = smooth(6.0, 7.2, lt);
            L.ramp.group.visible = rk > 0.01;
            L.ramp.tilt.scale.x = Math.max(0.02, rk);
            // low, looking up
            cam(V(-18, 1.3, 46), V(-12, 1.1, 37), V(3, 0, -4), V(4, 0, -6), easeIO(lt / 7.5));
            camLook.y = 7 + y * 0.8;
            cur.shake = (thrust > 0.02 ? 0.05 + 0.13 * smooth(25, 0, y) : 0) * slow + impulse;
          },
        },
        /* 7. out the hatch and off to the museum */
        {
          W: L, dur: 5.5, to: reduced ? 4.5 : 5.5, fadeIn: 0.25, fadeOut: 1.3, outColor: "#fff",
          enter() {
            caption("cut.arrive");
            rocket.position.set(0, 0, 0);
            rocket.rotation.set(0, 0, 0);
            RK.setLegs(1);
            RK.setThrust(0, 0);
            L.ramp.group.visible = true;
            L.ramp.tilt.scale.x = 1;
            L.padGlow.material.opacity = 0;
            L.fire.clear();
          },
          update(lt, dt, time) {
            RK.setDoor(smooth(0, 0.6, lt));
            walk(L.path, 2.8 * (lt - 0.5), 1.35, time, mars ? 1.6 : 2.6, 0);
            L.dust.update(dt * (mars ? 2.2 : 1.6));
            cam(V(-9, 4.6, 22), V(-1, 3.2, 24), V(9, 3, -4), V(17, 2, -10), easeIO(lt / 5.5));
          },
        },
      ];
      function spawnDust(r0, power) {
        const a = R(0, TAU);
        const ca = Math.cos(a), sa = Math.sin(a);
        if (mars) {
          const sp = R(9, 24) * power;
          L.dust.emit(ca * r0, R(0.3, 1.2), sa * r0, ca * sp, R(0.4, 3.2), sa * sp, R(2.4, 4.6), R(1, 2), R(4.5, 8.5), 0.5, DUST0, DUST1, R(1.0, 1.6), -0.25);
        } else {
          const sp = R(10, 28) * power;
          L.dust.emit(ca * r0, R(0.2, 0.8), sa * r0, ca * sp, R(0.5, 4.5), sa * sp, R(1.8, 3.4), R(0.6, 1.1), R(2.4, 4.6), 0.6, DUST0, DUST1, R(0.25, 0.6), -1.6);
        }
      }

      /* =================================================================
       *  MAIN LOOP
       * ================================================================= */
      shots.forEach((s) => {
        s.from = s.from || 0;
        s.to = s.to || s.dur;
      });
      let idx = -1, lt = 0, time = 0, last = performance.now();
      function nextShot() {
        idx++;
        if (idx >= shots.length) return false;
        const s = shots[idx];
        lt = s.from;
        cur.shake = 0;
        s.enter(s.from);
        return true;
      }
      nextShot();
      const shakeV = V(0, 0, 0);
      let paused = false;
      // test hook: opts.debug = true exposes Cutscene._debug.seek(shotIndex, seconds) to jump and freeze
      if (opts.debug) {
        Cutscene._debug = {
          seek(i, at) {
            paused = true;
            idx = i - 1;
            nextShot();
            const st = 1 / 30;
            while (!stopped && lt + st < at) step(st);
            step(Math.max(0, at - lt));
            return { shot: idx, t: lt };
          },
          resume() { paused = false; },
        };
      }
      function frame(now) {
        if (stopped) return;
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;
        if (paused) return;
        step(dt);
      }
      function step(dt) {
        if (stopped) return;
        lt += dt;
        time += dt;
        if (lt >= shots[idx].to && !nextShot()) {
          stop(false);
          return;
        }
        const s = shots[idx];
        cur.shake = 0;
        s.update(lt, dt, time);
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        const sh = reduced ? 0 : cur.shake;
        if (sh > 0) {
          shakeV.set(
            (Math.sin(time * 37.1) * 0.6 + Math.sin(time * 61.7 + 1.3) * 0.4) * sh,
            (Math.sin(time * 43.3 + 0.5) * 0.6 + Math.sin(time * 71.9) * 0.4) * sh,
            0
          ).applyQuaternion(camera.quaternion);
          camera.position.add(shakeV);
          camera.rotateZ(Math.sin(time * 29.3) * sh * 0.02);
        }
        // sky, stars and sun ride along with the camera
        const W = s.W;
        if (W.sky) W.sky.position.copy(camera.position);
        if (W.stars) W.stars.position.copy(camera.position);
        if (W.sun) W.sun.position.copy(camera.position).addScaledVector(W.sunDir, 1200);
        if (W === L && L.earth) {
          L.earth.position.copy(camera.position).add(tmp.set(0.45, 0.4, -0.8).normalize().multiplyScalar(1000));
          L.earth.rotation.y += dt * 0.02;
        }
        renderer.render(W.scene, camera);
        // fades between shots
        const fin = s.fadeIn ? 1 - (lt - s.from) / s.fadeIn : 0;
        const fout = s.fadeOut ? 1 - (s.to - lt) / s.fadeOut : 0;
        fadeEl.style.opacity = String(clamp(Math.max(fin, fout), 0, 1));
        fadeEl.style.background = fout > fin && s.outColor ? s.outColor : "#000";
        if (fout > fin && s.outColor) root.classList.add("cs-white");
      }
      raf = requestAnimationFrame((now) => {
        last = now;
        frame(now);
      });
    }

    return { stop };
  }

  return { play };
})();
