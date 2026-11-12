/*
 * MODELS: 3D building blocks for the museum (needs three.js)
 *   Models.kid(look)              the player character (low-poly, built from shapes)
 *   Models.robot(look)            the robot guide, rebuilt whenever its look changes
 *   Models.svgTexture(svg, h)     turns one of the hand-drawn SVGs in art.js into a texture
 *   Models.board(opts)            a wall sign / placard drawn on a canvas
 *   Models.woodTex(), tileTex()   floor textures
 */
window.Models = (function () {
  const T = THREE;
  // treat hex colors as sRGB so walls and paint look like the colors in data.js
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  const std = (color, extra) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05 }, extra || {}));

  function shadowAll(obj) {
    obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return obj;
  }

  /* ---------------- The kid ---------------- */
  function kid(look) {
    const skin = std(look.skin || "#d9a074");
    const shirt = std(look.shirt || "#2f6fb5");
    const pants = std("#2b3346");
    const shoe = std("#f4f1ea");
    const hair = std("#2b1d14", { roughness: 0.9 });
    const g = new T.Group();

    const limb = (r, len, mat) => {
      const m = new T.Mesh(new T.CapsuleGeometry(r, len, 4, 10), mat);
      m.position.y = -len / 2 - r * 0.4;
      return m;
    };
    // legs pivot at the hips so they can swing
    const legs = [-0.1, 0.1].map((x) => {
      const pivot = new T.Group();
      pivot.position.set(x, 0.56, 0);
      pivot.add(limb(0.075, 0.36, pants));
      const s = new T.Mesh(new T.BoxGeometry(0.14, 0.08, 0.24), shoe);
      s.position.set(0, -0.52, 0.04);
      pivot.add(s);
      g.add(pivot);
      return pivot;
    });
    const torso = new T.Mesh(new T.CapsuleGeometry(0.2, 0.26, 4, 12), shirt);
    torso.position.y = 0.8;
    torso.scale.z = 0.8;
    g.add(torso);
    // backpack
    const pack = new T.Mesh(new T.BoxGeometry(0.32, 0.36, 0.14), std("#d65a3a"));
    pack.position.set(0, 0.84, -0.2);
    g.add(pack);
    // lanyard badge
    const badge = new T.Mesh(new T.BoxGeometry(0.11, 0.13, 0.01), std("#f4ecdc"));
    badge.position.set(0.02, 0.76, 0.17);
    g.add(badge);
    const strap = new T.Mesh(new T.TorusGeometry(0.11, 0.008, 4, 16, Math.PI), std("#f2c14e"));
    strap.rotation.set(-0.2, 0, Math.PI);
    strap.position.set(0.02, 0.94, 0.12);
    g.add(strap);
    // arms pivot at the shoulders
    const arms = [-0.25, 0.25].map((x) => {
      const pivot = new T.Group();
      pivot.position.set(x, 0.98, 0);
      const sleeve = new T.Mesh(new T.SphereGeometry(0.085, 10, 8), shirt);
      pivot.add(sleeve);
      pivot.add(limb(0.06, 0.3, skin));
      pivot.rotation.z = x < 0 ? -0.08 : 0.08;
      g.add(pivot);
      return pivot;
    });
    // head
    const head = new T.Group();
    head.position.y = 1.32;
    head.add(new T.Mesh(new T.SphereGeometry(0.25, 20, 16), skin));
    const hairCap = new T.Mesh(new T.SphereGeometry(0.265, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
    hairCap.rotation.x = -0.45;
    head.add(hairCap);
    [-0.09, 0.09].forEach((x) => {
      const eye = new T.Mesh(new T.SphereGeometry(0.03, 8, 6), std("#1f1a17"));
      eye.position.set(x, 0.0, 0.23);
      head.add(eye);
    });
    const smile = new T.Mesh(new T.TorusGeometry(0.05, 0.012, 4, 10, Math.PI), std("#1f1a17"));
    smile.position.set(0, -0.08, 0.235);
    smile.rotation.z = Math.PI;
    head.add(smile);
    g.add(head);

    // ground shadow blob (cheap and always visible, even from above)
    g.add(blob(0.42));
    shadowAll(g);
    g.userData = { legs, arms, head, body: [torso, pack, badge, strap] };
    return g;
  }

  function animateKid(g, t, speed) {
    const { legs, arms, head } = g.userData;
    const amp = speed > 0.1 ? Math.min(0.75, 0.3 + speed * 0.06) : 0;
    const f = 6 + speed * 0.9;
    const s = Math.sin(t * f) * amp;
    legs[0].rotation.x = s;
    legs[1].rotation.x = -s;
    arms[0].rotation.x = -s * 0.9;
    arms[1].rotation.x = s * 0.9;
    const bob = amp ? Math.abs(Math.cos(t * f)) * 0.05 : Math.sin(t * 2) * 0.008;
    g.children.forEach((c) => {
      if (c.userData.isBlob) return;
      if (c.userData.y0 == null) c.userData.y0 = c.position.y;
      c.position.y = c.userData.y0 + bob;
    });
    head.rotation.z = amp ? Math.sin(t * f) * 0.05 : 0;
  }

  function blob(r) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(0,0,0,.45)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    const m = new T.Mesh(new T.PlaneGeometry(r * 2, r * 2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    m.userData.isBlob = true;
    return m;
  }

  /* ---------------- The robot guide ---------------- */
  function shade(hex, amt) {
    const c = new T.Color(hex);
    c.offsetHSL(0, 0, amt);
    return c;
  }

  function robot(look) {
    const body = std(look.color || "#c9d3e6", { metalness: 0.35, roughness: 0.4 });
    const dark = std(shade(look.color || "#c9d3e6", -0.25), { metalness: 0.3, roughness: 0.5 });
    const glow = new T.MeshBasicMaterial({ color: look.eyes || "#5ef2ff" });
    const g = new T.Group();
    const parts = { spin: [], flames: [], antenna: null };

    // wheel base
    const base = new T.Mesh(new T.BoxGeometry(0.5, 0.14, 0.36), std("#2a3247"));
    base.position.y = 0.11;
    g.add(base);
    [-0.27, 0.27].forEach((x) => {
      const w = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.08, 14), std("#6b7790"));
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.1, 0);
      g.add(w);
    });
    // torso
    const torso = new T.Mesh(new T.BoxGeometry(0.5, 0.38, 0.36), body);
    torso.position.y = 0.38;
    g.add(torso);
    const stripe = new T.Mesh(new T.BoxGeometry(0.3, 0.05, 0.01), dark);
    stripe.position.set(0, 0.45, 0.185);
    g.add(stripe);
    // arms
    [-0.31, 0.31].forEach((x) => {
      const a = new T.Mesh(new T.CapsuleGeometry(0.055, 0.2, 4, 8), dark);
      a.position.set(x, 0.36, 0);
      g.add(a);
    });
    // neck + head
    const neck = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.08, 10), dark);
    neck.position.y = 0.6;
    g.add(neck);
    const head = new T.Group();
    head.position.y = 0.82;
    g.add(head);
    head.add(new T.Mesh(new T.BoxGeometry(0.62, 0.42, 0.44), body));
    const screen = new T.Mesh(new T.BoxGeometry(0.46, 0.24, 0.01), std("#0b1226", { roughness: 0.2 }));
    screen.position.z = 0.222;
    head.add(screen);
    const eyes = new T.Group();
    [-0.1, 0.1].forEach((x) => {
      const e = new T.Mesh(new T.CircleGeometry(0.05, 16), glow);
      e.position.set(x, 0, 0.229);
      eyes.add(e);
    });
    head.add(eyes);
    parts.eyes = eyes;
    const ant = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.16, 6), dark);
    ant.position.y = 0.29;
    head.add(ant);
    const bulb = new T.Mesh(new T.SphereGeometry(0.04, 10, 8), glow.clone());
    bulb.position.y = 0.38;
    head.add(bulb);
    parts.antenna = bulb;

    // hats
    const hat = look.hat;
    if (hat === "helmet") {
      const h = new T.Mesh(new T.SphereGeometry(0.46, 24, 16), new T.MeshStandardMaterial({ color: "#cfe8ff", transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false }));
      head.add(h);
    } else if (hat === "prop") {
      const cap = new T.Mesh(new T.SphereGeometry(0.24, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std("#e85d4a"));
      cap.position.y = 0.2;
      head.add(cap);
      const rotor = new T.Group();
      rotor.position.y = 0.48;
      const blade = new T.Mesh(new T.BoxGeometry(0.62, 0.015, 0.06), std("#333"));
      rotor.add(blade);
      const blade2 = blade.clone();
      blade2.rotation.y = Math.PI / 2;
      rotor.add(blade2);
      head.add(rotor);
      parts.spin.push(rotor);
    } else if (hat === "party") {
      const cone = new T.Mesh(new T.ConeGeometry(0.15, 0.36, 16), std("#ff6bd0"));
      cone.position.set(0.08, 0.38, 0);
      cone.rotation.z = -0.15;
      head.add(cone);
      const pom = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), std("#fff36b"));
      pom.position.set(0.11, 0.57, 0);
      head.add(pom);
    } else if (hat === "crown") {
      const crown = new T.Group();
      crown.position.y = 0.26;
      const band = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.1, 20, 1, true), std("#ffd34d", { metalness: 0.7, roughness: 0.25, side: T.DoubleSide }));
      crown.add(band);
      for (let i = 0; i < 6; i++) {
        const sp = new T.Mesh(new T.ConeGeometry(0.04, 0.12, 6), std("#ffd34d", { metalness: 0.7, roughness: 0.25 }));
        const a = (i / 6) * Math.PI * 2;
        sp.position.set(Math.cos(a) * 0.19, 0.1, Math.sin(a) * 0.19);
        crown.add(sp);
      }
      head.add(crown);
    }

    // gear
    const gear = look.gear;
    if (gear === "solar") {
      [-1, 1].forEach((s) => {
        const p = new T.Mesh(new T.BoxGeometry(0.4, 0.26, 0.02), std("#1d3b8f", { metalness: 0.5, roughness: 0.3, emissive: "#0a1a50" }));
        p.position.set(s * 0.52, 0.48, -0.08);
        p.rotation.y = s * 0.35;
        g.add(p);
      });
    } else if (gear === "jetpack") {
      [-0.12, 0.12].forEach((x) => {
        const tank = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.36, 12), std("#8a94a8", { metalness: 0.6, roughness: 0.3 }));
        tank.position.set(x, 0.42, -0.25);
        g.add(tank);
        const fl = new T.Mesh(new T.ConeGeometry(0.06, 0.2, 10), new T.MeshBasicMaterial({ color: "#ffb347" }));
        fl.rotation.x = Math.PI;
        fl.position.set(x, 0.14, -0.25);
        g.add(fl);
        parts.flames.push(fl);
      });
    } else if (gear === "record") {
      const disc = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.015, 24), std("#e8b931", { metalness: 0.8, roughness: 0.2 }));
      disc.rotation.x = Math.PI / 2;
      disc.position.set(0, 0.34, 0.19);
      g.add(disc);
    } else if (gear === "flag") {
      const pole = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.9, 6), std("#ddd"));
      pole.position.set(0.22, 0.75, -0.18);
      g.add(pole);
      const flag = new T.Mesh(new T.PlaneGeometry(0.3, 0.2), std("#5aa9ff", { side: T.DoubleSide }));
      flag.position.set(0.37, 1.08, -0.18);
      g.add(flag);
    }

    g.add(blob(0.4));
    shadowAll(g);
    g.userData = parts;
    return g;
  }

  function animateRobot(g, t, moving) {
    const p = g.userData;
    p.spin.forEach((r) => (r.rotation.y += 0.5));
    p.flames.forEach((f, i) => (f.scale.y = 0.8 + Math.abs(Math.sin(t * 30 + i)) * 0.6));
    if (p.antenna) p.antenna.visible = Math.sin(t * 3) > -0.6;
    if (p.eyes) p.eyes.scale.y = (t % 5) > 4.85 ? 0.15 : 1;
    g.position.y = moving ? Math.abs(Math.sin(t * 14)) * 0.03 : Math.sin(t * 2.2) * 0.03 + 0.03;
  }

  /* ---------------- SVG → texture ---------------- */
  let defs = "";
  function svgTexture(svg, height, onReady) {
    if (!defs) {
      const d = document.querySelector("svg defs");
      defs = d ? d.outerHTML : "";
    }
    const vb = (svg.match(/viewBox="([^"]+)"/) || [, "0 0 100 100"])[1].split(/\s+/).map(Number);
    const aspect = vb[2] / vb[3];
    const h = height || 512;
    const w = Math.round(h * aspect);
    let s = svg.replace(/<svg([^>]*)>/, (m, attrs) => {
      attrs = attrs.replace(/\s(width|height|class)="[^"]*"/g, "");
      return `<svg xmlns="http://www.w3.org/2000/svg"${attrs} width="${w}" height="${h}">${defs}`;
    });
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.anisotropy = 4;
    const img = new Image();
    img.onload = () => {
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      tex.needsUpdate = true;
      if (onReady) onReady();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    tex.userData = { aspect };
    return tex;
  }

  /* ---------------- Canvas signs + placards ---------------- */
  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  /**
   * board({ w, h, ppm, bg, fg, accent, kicker, title, body, footer, draw })
   * w,h in meters; ppm = canvas pixels per meter. Returns { mesh, canvas, tex, redraw(opts) }.
   */
  function board(o) {
    const ppm = o.ppm || 180;
    const c = document.createElement("canvas");
    c.width = Math.round(o.w * ppm);
    c.height = Math.round(o.h * ppm);
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.anisotropy = 4;
    const mesh = new T.Mesh(new T.PlaneGeometry(o.w, o.h), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
    const api = { mesh, canvas: c, tex, opts: o };
    api.redraw = (more) => {
      Object.assign(o, more || {});
      paint(c, o);
      tex.needsUpdate = true;
    };
    api.redraw();
    return api;
  }

  function paint(c, o) {
    const x = c.getContext("2d");
    const W = c.width, H = c.height;
    const u = W / 100; // 1% of width
    x.clearRect(0, 0, W, H);
    x.fillStyle = o.bg || "#f6f0e3";
    x.fillRect(0, 0, W, H);
    if (o.accent) {
      x.fillStyle = o.accent;
      x.fillRect(0, 0, W, Math.max(6, H * 0.035));
    }
    if (o.draw) return o.draw(x, W, H, u);
    const pad = o.pad != null ? o.pad * W : 6 * u;
    let y = pad + (o.accent ? H * 0.03 : 0);
    const maxW = W - pad * 2;
    const fs = o.scale || 1;
    if (o.kicker) {
      x.fillStyle = o.kickerColor || o.accent || "#b8892f";
      x.font = `700 ${3.1 * u * fs}px "IBM Plex Mono", monospace`;
      x.textBaseline = "top";
      x.fillText(o.kicker.toUpperCase(), pad, y);
      y += 5.6 * u * fs;
    }
    if (o.title) {
      x.fillStyle = o.fg || "#1f2330";
      const ts = (o.titleSize || 7) * u * fs;
      x.font = `800 ${ts}px Fraunces, Georgia, serif`;
      x.textBaseline = "top";
      for (const l of wrap(x, o.title, maxW)) { x.fillText(l, pad, y); y += ts * 1.12; }
      y += 2 * u * fs;
    }
    if (o.body) {
      x.fillStyle = o.bodyColor || o.fg || "#1f2330";
      const bs = (o.bodySize || 3.6) * u * fs;
      x.font = `400 ${bs}px "Atkinson Hyperlegible", Arial, sans-serif`;
      const paras = Array.isArray(o.body) ? o.body : [o.body];
      for (const p of paras) {
        for (const l of wrap(x, p, maxW)) { x.fillText(l, pad, y); y += bs * 1.35; }
        y += bs * 0.5;
      }
    }
    if (o.footer) {
      x.fillStyle = o.accent || "#b8892f";
      const fsz = 3 * u * fs;
      x.font = `700 ${fsz}px "IBM Plex Mono", monospace`;
      x.textBaseline = "bottom";
      x.fillText(o.footer, pad, H - pad * 0.7);
    }
  }

  /* ---------------- Floor textures ---------------- */
  function woodTex(tint) {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const x = c.getContext("2d");
    const base = new T.Color(tint || "#8a5d3c");
    for (let i = 0; i < 8; i++) {
      const col = base.clone().offsetHSL(0, 0, (Math.sin(i * 12.9) * 0.5) * 0.05);
      x.fillStyle = "#" + col.getHexString();
      x.fillRect(0, i * 64, 512, 64);
      x.fillStyle = "rgba(0,0,0,.35)";
      x.fillRect(0, i * 64 + 62, 512, 2);
      const off = (i * 197) % 512;
      x.fillRect(off, i * 64, 2, 64);
      x.strokeStyle = "rgba(0,0,0,.06)";
      for (let k = 0; k < 6; k++) {
        x.beginPath();
        const yy = i * 64 + 8 + k * 9;
        x.moveTo(0, yy);
        x.bezierCurveTo(170, yy + 4, 340, yy - 4, 512, yy);
        x.stroke();
      }
    }
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }

  function tileTex(a, b) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d");
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      x.fillStyle = (i + j) % 2 ? b : a;
      x.fillRect(i * 128, j * 128, 128, 128);
    }
    x.strokeStyle = "rgba(0,0,0,.18)";
    x.lineWidth = 2;
    x.strokeRect(0, 0, 256, 256);
    x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 256); x.moveTo(0, 128); x.lineTo(256, 128); x.stroke();
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }

  function globeTex() {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const x = c.getContext("2d");
    x.fillStyle = "#2c6fb0"; x.fillRect(0, 0, 512, 256);
    x.fillStyle = "#4d9a58";
    // rough continents, drawn as blobs (a museum globe, not a map)
    const blobs = [[95, 80, 50, 34], [120, 150, 26, 46], [250, 70, 46, 26], [270, 140, 32, 48], [360, 80, 70, 34], [420, 175, 30, 18]];
    blobs.forEach(([cx, cy, rx, ry]) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0.3, 0, Math.PI * 2); x.fill(); });
    x.fillStyle = "#eef3f6"; x.fillRect(0, 0, 512, 14); x.fillRect(0, 242, 512, 14);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }

  return { kid, animateKid, robot, animateRobot, svgTexture, board, woodTex, tileTex, globeTex, blob, std, shadowAll };
})();
