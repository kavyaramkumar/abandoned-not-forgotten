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

  /* ---------------- The kid ----------------
   * look = { skin, shirt, pants, hair, hairColor, extra, suit }
   * A rounded, friendly figure: big head, soft shapes, eyes with highlights.
   * Feet at y = 0, about 1.6 tall, facing +z.
   */
  function kid(look) {
    const suit = !!look.suit;
    const skinHex = look.skin || "#d9a074";
    const skin = std(skinHex, { roughness: 0.55 });
    const accent = std(look.shirt || "#2f6fb5", { roughness: 0.7 });
    const white = std("#eef0f2", { roughness: 0.55 });
    const shirt = suit ? white : accent;
    const pants = suit ? white : std(look.pants || "#2b3346", { roughness: 0.8 });
    const shoe = suit ? std("#8a909c", { roughness: 0.5 }) : std("#f4f1ea", { roughness: 0.6 });
    const sole = std(suit ? "#5a606c" : "#d65a3a", { roughness: 0.7 });
    const hairHex = look.hairColor || "#2b1d14";
    const hair = std(hairHex, { roughness: 0.75, side: T.DoubleSide });
    const dark = std("#1f1a17", { roughness: 0.3 });
    const style = look.hair || (look.char === "girl" ? "ponytail" : "short");
    const g = new T.Group();
    const S = 24; // segments: smooth curves

    const capsule = (r, len, mat) => new T.Mesh(new T.CapsuleGeometry(r, len, 6, S), mat);

    // ---- legs pivot at the hips so they can swing ----
    const legs = [-0.095, 0.095].map((x) => {
      const pivot = new T.Group();
      pivot.position.set(x, 0.52, 0);
      const leg = capsule(suit ? 0.085 : 0.075, 0.3, pants);
      leg.position.y = -0.2;
      pivot.add(leg);
      // rounded sneaker (or moon boot)
      const s = new T.Mesh(new T.SphereGeometry(0.1, S, 12), shoe);
      s.scale.set(suit ? 1.05 : 0.9, suit ? 0.75 : 0.6, 1.45);
      s.position.set(0, -0.44, 0.04);
      pivot.add(s);
      const so = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.025, S), sole);
      so.scale.set(suit ? 1.05 : 0.9, 1, 1.45);
      so.position.set(0, -0.485, 0.04);
      pivot.add(so);
      g.add(pivot);
      return pivot;
    });
    // hips
    const hips = new T.Mesh(new T.SphereGeometry(0.19, S, 12), pants);
    hips.scale.set(1.05, 0.55, 0.8);
    hips.position.y = 0.55;
    g.add(hips);

    // ---- torso: a smooth lathe, wider at the shoulders ----
    const prof = [[0.0, 0], [0.17, 0], [0.18, 0.06], [0.175, 0.16], [0.2, 0.28], [0.21, 0.34], [0.17, 0.4], [0.07, 0.43], [0.0, 0.43]].map(([x, y]) => new T.Vector2(x, y));
    const torso = new T.Mesh(new T.LatheGeometry(prof, S), shirt);
    torso.scale.z = 0.78;
    torso.position.y = 0.56;
    g.add(torso);
    const collar = new T.Mesh(new T.TorusGeometry(0.075, 0.02, 8, S), suit ? std("#b9bfc8", { metalness: 0.4, roughness: 0.4 }) : accent);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.985;
    g.add(collar);
    const neck = capsule(0.055, 0.06, skin);
    neck.position.y = 1.02;
    g.add(neck);

    // ---- backpack (a life-support pack when suited up) ----
    const pack = new T.Mesh(new T.BoxGeometry(suit ? 0.36 : 0.3, suit ? 0.44 : 0.34, suit ? 0.18 : 0.14), suit ? std("#d9dde2", { roughness: 0.5 }) : std("#d65a3a", { roughness: 0.7 }));
    pack.position.set(0, 0.8, suit ? -0.22 : -0.19);
    g.add(pack);
    const packTop = new T.Mesh(new T.CylinderGeometry(suit ? 0.09 : 0.075, suit ? 0.09 : 0.075, suit ? 0.36 : 0.3, S, 1, false, 0, Math.PI), pack.material);
    packTop.rotation.z = Math.PI / 2;
    packTop.position.set(0, suit ? 1.02 : 0.97, suit ? -0.22 : -0.19);
    g.add(packTop);
    // a badge on a lanyard, or a mission patch on the suit
    let badge, strap;
    if (suit) {
      // the NASA insignia on the spacesuit, where astronauts wear it
      badge = new T.Mesh(new T.CircleGeometry(0.065, 32), new T.MeshStandardMaterial({ map: nasaTexture(), roughness: 0.6, transparent: true }));
      badge.position.set(0.08, 0.86, 0.168);
      strap = new T.Mesh(new T.TorusGeometry(0.18, 0.028, 8, S), accent);
      strap.rotation.x = Math.PI / 2;
      strap.scale.y = 0.8;
      strap.position.y = 0.62;
    } else {
      badge = new T.Mesh(new T.BoxGeometry(0.1, 0.12, 0.012), std("#f4ecdc"));
      badge.position.set(0.02, 0.76, 0.17);
      strap = new T.Mesh(new T.TorusGeometry(0.1, 0.008, 4, 16, Math.PI), std("#f2c14e"));
      strap.rotation.set(-0.25, 0, Math.PI);
      strap.position.set(0.02, 0.9, 0.13);
    }
    g.add(badge, strap);

    // ---- arms pivot at the shoulders ----
    const arms = [-0.235, 0.235].map((x) => {
      const pivot = new T.Group();
      pivot.position.set(x, 0.93, 0);
      const sleeve = new T.Mesh(new T.SphereGeometry(0.085, S, 12), shirt);
      pivot.add(sleeve);
      const upper = capsule(0.062, 0.14, shirt);
      upper.position.y = -0.1;
      pivot.add(upper);
      const fore = capsule(suit ? 0.062 : 0.052, 0.12, suit ? white : skin);
      fore.position.y = -0.26;
      pivot.add(fore);
      const hand = new T.Mesh(new T.SphereGeometry(suit ? 0.072 : 0.062, S, 12), suit ? accent : skin);
      hand.position.y = -0.37;
      pivot.add(hand);
      pivot.rotation.z = x < 0 ? -0.1 : 0.1;
      g.add(pivot);
      return pivot;
    });

    // ---- head ----
    const HR = 0.27;
    const head = new T.Group();
    head.position.y = 1.31;
    const skull = new T.Mesh(new T.SphereGeometry(HR, 40, 30), skin);
    skull.scale.set(1, 0.97, 0.95);
    head.add(skull);
    [-1, 1].forEach((k) => {
      const ear = new T.Mesh(new T.SphereGeometry(0.06, S, 12), skin);
      ear.scale.set(0.55, 1, 0.8);
      ear.position.set(k * HR * 0.98, -0.02, 0);
      head.add(ear);
    });
    const nose = new T.Mesh(new T.SphereGeometry(0.03, S, 12), std(hexShade(skinHex, -18), { roughness: 0.55 }));
    nose.scale.set(1.1, 0.85, 0.8);
    nose.position.set(0, -0.045, HR * 0.95);
    head.add(nose);
    // eyes: white, iris, pupil, sparkle
    const eyeW = std("#ffffff", { roughness: 0.2 });
    const iris = std("#3b2a20", { roughness: 0.25 });
    const spark = new T.MeshBasicMaterial({ color: "#ffffff" });
    [-0.095, 0.095].forEach((x) => {
      const e = new T.Group();
      e.position.set(x, 0.025, HR * 0.86);
      const w = new T.Mesh(new T.SphereGeometry(0.052, S, 16), eyeW);
      w.scale.set(0.9, 1.1, 0.5);
      const ir = new T.Mesh(new T.SphereGeometry(0.036, S, 16), iris);
      ir.scale.set(0.9, 1.1, 0.45);
      ir.position.z = 0.016;
      const pu = new T.Mesh(new T.SphereGeometry(0.02, 16, 12), dark);
      pu.scale.set(0.9, 1.1, 0.4);
      pu.position.z = 0.026;
      const sp = new T.Mesh(new T.SphereGeometry(0.009, 8, 6), spark);
      sp.position.set(0.012, 0.016, 0.034);
      e.add(w, ir, pu, sp);
      e.rotation.y = x * 0.9;
      head.add(e);
      // eyebrow
      const brow = capsule(0.009, 0.05, std(hexShade(hairHex, -10)));
      brow.rotation.z = Math.PI / 2 + (x < 0 ? -0.12 : 0.12);
      brow.position.set(x, 0.1, HR * 0.9);
      brow.rotation.y = x * 0.9;
      head.add(brow);
      // rosy cheek
      const cheek = new T.Mesh(new T.CircleGeometry(0.035, 20), new T.MeshBasicMaterial({ color: "#ff7a7a", transparent: true, opacity: 0.28, depthWrite: false }));
      cheek.position.set(x * 1.55, -0.06, HR * 0.84);
      cheek.rotation.y = x * 2.4;
      head.add(cheek);
    });
    const smile = new T.Mesh(new T.TorusGeometry(0.04, 0.009, 8, 20, Math.PI), std("#7a2e2a", { roughness: 0.4 }));
    smile.position.set(0, -0.105, HR * 0.9);
    smile.rotation.z = Math.PI;
    head.add(smile);

    // ---- hair (built for a 0.25 head, then scaled) ----
    const hg = new T.Group();
    hg.scale.setScalar(HR / 0.25);
    head.add(hg);
    const cap = (r, frac) => {
      const m = new T.Mesh(new T.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI * frac), hair);
      m.rotation.x = -0.45;
      hg.add(m);
      return m;
    };
    const put = (geo, x, y, z, rx, mat) => {
      const m = new T.Mesh(geo, mat || hair);
      m.position.set(x, y, z);
      if (rx) m.rotation.x = rx;
      hg.add(m);
      return m;
    };
    if (style === "buzz") cap(0.256, 0.5);
    else if (style === "curly") {
      put(new T.IcosahedronGeometry(0.31, 2), 0, 0.1, -0.1);
      [[-0.2, 0.2, 0.05], [0.2, 0.2, 0.05], [0, 0.3, 0.02], [-0.26, -0.02, -0.08], [0.26, -0.02, -0.08], [-0.12, 0.27, 0.1], [0.12, 0.27, 0.1]].forEach(([x, y, z]) => put(new T.IcosahedronGeometry(0.12, 2), x, y, z));
    } else if (style === "scarf") {
      // a headscarf wraps the head and shoulders, face stays open
      const wrap = new T.Mesh(new T.SphereGeometry(0.29, 32, 20, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.82), hair);
      hg.add(wrap);
      put(new T.CylinderGeometry(0.2, 0.3, 0.26, 28, 1, true), 0, -0.27, -0.01);
    } else {
      cap(0.266, 0.55);
      // a soft fringe over the forehead
      put(new T.SphereGeometry(0.27, 32, 10, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.22, Math.PI * 0.16), 0, 0, 0);
      if (style === "long") {
        const back = put(new T.CapsuleGeometry(0.2, 0.3, 6, 20), 0, -0.16, -0.13);
        back.scale.set(1.15, 1, 0.55);
      } else if (style === "ponytail") {
        put(new T.CapsuleGeometry(0.08, 0.3, 6, 16), 0, 0.02, -0.33, 0.5);
        put(new T.TorusGeometry(0.07, 0.025, 8, 16), 0, 0.13, -0.27, 1.1, accent);
      } else if (style === "braids") {
        [-1, 1].forEach((k) => {
          for (let i = 0; i < 5; i++) put(new T.SphereGeometry(0.055 - i * 0.003, 16, 10), k * 0.17, -0.08 - i * 0.085, -0.17);
          put(new T.SphereGeometry(0.035, 12, 8), k * 0.17, -0.5, -0.17, 0, accent);
        });
      } else if (style === "buns") {
        [-1, 1].forEach((k) => put(new T.SphereGeometry(0.11, 20, 14), k * 0.17, 0.2, -0.04));
      }
    }
    if (look.extra === "glasses") {
      const frame = std("#1f1a17", { roughness: 0.3 });
      [-0.095, 0.095].forEach((x) => {
        const ring = new T.Mesh(new T.TorusGeometry(0.06, 0.01, 8, 24), frame);
        ring.position.set(x, 0.025, HR * 0.97);
        ring.rotation.y = x * 0.9;
        head.add(ring);
      });
      const bridge = new T.Mesh(new T.BoxGeometry(0.06, 0.012, 0.012), frame);
      bridge.position.set(0, 0.035, HR * 1.0);
      head.add(bridge);
    } else if (look.extra === "cap" && style !== "scarf") {
      const crown = new T.Mesh(new T.SphereGeometry(0.275, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), accent);
      crown.rotation.x = -0.25;
      hg.add(crown);
      const brim = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.02, 24, 1, false, -Math.PI / 2, Math.PI), accent);
      brim.position.set(0, 0.11, 0.2);
      brim.rotation.x = 0.1;
      hg.add(brim);
    }

    if (suit) {
      // glass helmet bubble and a neck ring
      const glass = new T.Mesh(new T.SphereGeometry(HR * 1.68, 40, 28), new T.MeshStandardMaterial({ color: "#cfeaff", transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.3, depthWrite: false }));
      glass.position.set(0, 0.05, 0);
      head.add(glass);
      const shine = new T.Mesh(new T.TorusGeometry(HR * 1.3, 0.012, 4, 24, 0.9), new T.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.7 }));
      shine.position.set(0, 0.08, 0.2);
      shine.rotation.set(-0.5, 0, 1.9);
      head.add(shine);
      const ring = new T.Mesh(new T.TorusGeometry(0.25, 0.055, 10, 28), std("#b9bfc8", { metalness: 0.4, roughness: 0.4 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.3;
      head.add(ring);
    }
    g.add(head);

    // ground shadow blob (cheap and always visible, even from above)
    g.add(blob(0.42));
    shadowAll(g);
    g.userData = { legs, arms, head, body: [torso, pack, badge, strap] };
    return g;
  }

  function animateKid(g, t, speed, hop) {
    const { legs, arms, head } = g.userData;
    const amp = speed > 0.1 ? Math.min(0.75, 0.3 + speed * 0.06) : 0;
    const f = 6 + speed * 0.9;
    const s = Math.sin(t * f) * amp;
    legs[0].rotation.x = s;
    legs[1].rotation.x = -s;
    arms[0].rotation.x = -s * 0.9;
    arms[1].rotation.x = s * 0.9;
    // hop > 1 on worlds with low gravity: each step becomes a floaty bounce
    const bob = amp ? Math.abs(Math.cos(t * (hop > 1 ? f / 2.2 : f))) * 0.05 * (hop || 1) : Math.sin(t * 2) * 0.008;
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
  // lighten/darken a "#rrggbb" color by amt (-255..255), returns "#rrggbb"
  function hexShade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, v + amt));
    return "#" + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, "0");
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
  /* shared logo textures: the team patch, and the NASA insignia (suit and rocket only) */
  let patchTex = null, nasaTex = null;
  function patchTexture() {
    if (!patchTex && window.Art && Art.patch) patchTex = svgTexture(Art.patch(), 256);
    return patchTex;
  }
  function nasaTexture() {
    if (!nasaTex && window.Art && Art.nasa) nasaTex = svgTexture(Art.nasa(), 256);
    return nasaTex;
  }

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
    text = String(text);
    // Chinese, Japanese and Korean-style text can break between any two characters
    const cjk = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(text);
    const words = cjk ? Array.from(text) : text.split(/\s+/);
    const joiner = cjk ? "" : " ";
    const lines = [];
    let line = "";
    for (const w of words) {
      const t = line ? line + joiner + w : w;
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

  /* ---------------- High-tech museum surfaces ---------------- */
  const canvasTexture = (c, srgb) => {
    const t = new T.CanvasTexture(c);
    if (srgb) t.encoding = T.sRGBEncoding;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  /*
   * A floor of big glossy panels (one 2 m panel per tile). Seams glow.
   * Returns { map, emissive } textures, both repeating.
   */
  function techFloorTex(base, seam) {
    const N = 512, c = document.createElement("canvas"), e = document.createElement("canvas");
    c.width = c.height = e.width = e.height = N;
    const x = c.getContext("2d"), y = e.getContext("2d");
    y.fillStyle = "#000"; y.fillRect(0, 0, N, N);
    // four panels, each slightly different, with a soft sheen
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const gx = x.createLinearGradient(i * 256, j * 256, i * 256 + 256, j * 256 + 256);
      gx.addColorStop(0, hexShade(base, (i + j) % 2 ? 6 : 0));
      gx.addColorStop(0.5, hexShade(base, (i + j) % 2 ? 14 : 8));
      gx.addColorStop(1, hexShade(base, (i + j) % 2 ? 2 : -4));
      x.fillStyle = gx; x.fillRect(i * 256, j * 256, 256, 256);
      // inner bevel
      x.strokeStyle = "rgba(255,255,255,.07)"; x.lineWidth = 3; x.strokeRect(i * 256 + 10, j * 256 + 10, 236, 236);
      x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = 2; x.strokeRect(i * 256 + 14, j * 256 + 14, 228, 228);
    }
    // a small circuit motif in one corner of each panel
    [[0, 0], [256, 256]].forEach(([ox, oy]) => {
      y.strokeStyle = seam; y.globalAlpha = 0.35; y.lineWidth = 2;
      y.beginPath(); y.moveTo(ox + 30, oy + 60); y.lineTo(ox + 60, oy + 60); y.lineTo(ox + 80, oy + 40); y.lineTo(ox + 120, oy + 40); y.stroke();
      y.beginPath(); y.arc(ox + 124, oy + 40, 4, 0, Math.PI * 2); y.stroke();
      y.globalAlpha = 1;
    });
    // glowing seams between panels
    [x, y].forEach((ctx, k) => {
      ctx.strokeStyle = k ? seam : hexShade(base, -30);
      ctx.lineWidth = k ? 3 : 6;
      ctx.beginPath();
      [0, 256, 512].forEach((p) => { ctx.moveTo(p, 0); ctx.lineTo(p, N); ctx.moveTo(0, p); ctx.lineTo(N, p); });
      ctx.stroke();
    });
    return { map: canvasTexture(c, true), emissive: canvasTexture(e, true) };
  }
  /*
   * Wall panels: horizontal seams, a glowing light strip near the floor and the
   * top. Box faces stretch it sideways, so the pattern only runs horizontally.
   */
  function techWallTex(base, glow) {
    const c = document.createElement("canvas"), e = document.createElement("canvas");
    c.width = e.width = 16; c.height = e.height = 512;
    const x = c.getContext("2d"), y = e.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, hexShade(base, 18)); g.addColorStop(0.5, base); g.addColorStop(1, hexShade(base, -14));
    x.fillStyle = g; x.fillRect(0, 0, 16, 512);
    y.fillStyle = "#000"; y.fillRect(0, 0, 16, 512);
    // seams (canvas y=0 is the top of the wall)
    [0.3, 0.52, 0.74].forEach((f) => {
      x.fillStyle = "rgba(0,0,0,.22)"; x.fillRect(0, f * 512, 16, 3);
      x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(0, f * 512 + 3, 16, 2);
    });
    // light strips
    [[0.06, 6], [0.9, 8]].forEach(([f, h]) => {
      x.fillStyle = glow; x.fillRect(0, f * 512, 16, h);
      y.fillStyle = glow; y.fillRect(0, f * 512, 16, h);
    });
    return { map: canvasTexture(c, true), emissive: canvasTexture(e, true) };
  }
  /* Twinkling stars floating near the top of a room, like a planetarium. */
  let starSprite = null;
  function roomStars(n, box) {
    if (!starSprite) {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const x = c.getContext("2d");
      const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(200,230,255,.8)"); gr.addColorStop(1, "rgba(200,230,255,0)");
      x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      starSprite = new T.CanvasTexture(c);
    }
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), phase = new Float32Array(n), speed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = box.x0 + Math.random() * (box.x1 - box.x0);
      pos[i * 3 + 1] = box.y0 + Math.random() * (box.y1 - box.y0);
      pos[i * 3 + 2] = box.z0 + Math.random() * (box.z1 - box.z0);
      phase[i] = Math.random() * Math.PI * 2;
      speed[i] = 1 + Math.random() * 3;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    geo.setAttribute("color", new T.BufferAttribute(col, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ size: 0.11, map: starSprite, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pts.userData.twinkle = (t) => {
      for (let i = 0; i < n; i++) {
        const b = 0.35 + 0.65 * Math.max(0, Math.sin(t * speed[i] + phase[i]));
        col[i * 3] = b * 0.9; col[i * 3 + 1] = b * 0.95; col[i * 3 + 2] = b;
      }
      geo.attributes.color.needsUpdate = true;
    };
    pts.userData.twinkle(0);
    return pts;
  }

  return { kid, animateKid, robot, animateRobot, svgTexture, board, woodTex, tileTex, globeTex, blob, std, shadowAll, techFloorTex, techWallTex, roomStars, patchTexture, nasaTexture };
})();
