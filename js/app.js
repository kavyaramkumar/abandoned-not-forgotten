/*
 * REACH FOR THE STARS MUSEUM: a door-maze adventure
 * ------------------------------------------------------------
 * The museum is a hidden network of rooms (see js/maze.js). You only ever see
 * the room you're in and its doors; you never see a map. Each door shows a
 * symbol, and you don't know where it leads until you open it. Every new
 * adventure builds a new network, so the doors never lead to the same places twice.
 *
 * Goal: collect every signal piece (each one is held by a machine; hear its
 * story to get it), then reach the sealed Mission Control room. There, your
 * robot checks the route you found, door by door.
 *
 *   Walk:   click the floor, or WASD / arrow keys
 *   Doors:  click a door (or walk up and press Enter)
 *   Camera: drag to turn, scroll to zoom, Q / E
 */
(function () {
  const M = window.MUSEUM;
  const T = THREE;
  const $ = (s, el = document) => el.querySelector(s);
  const SAVE_KEY = "silent-explorers-v3";
  const SYM = Maze.SYMBOLS;

  const t = I18N.t;
  const SKINS = ["#f7d7c4", "#f1c7a5", "#e0ac83", "#c98d63", "#a8693f", "#8a5434", "#6b4228", "#4a2c1c"];
  const HAIR_COLORS = ["#1c1714", "#3b2516", "#6b4226", "#8e3b1f", "#c98a3c", "#e2c27a", "#3a5fcd", "#d85a9a"];
  const SHIRTS = ["#2f6fb5", "#c4472d", "#2f8a5b", "#7a4bb0", "#e8a21c", "#e0607e", "#1fa3a3", "#f2efe6"];
  const PANTS = ["#2b3346", "#4a6fa5", "#5a4632", "#7d8a5a", "#3d3d42", "#8a3a52"];
  const EXTRAS = ["none", "glasses", "cap"];
  const PLACES = ["earth", "moon", "mars"];
  // low gravity makes every step a bounce
  const HOP = { earth: 1, moon: 2.6, mars: 1.6 };

  /* ---------------- content ---------------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wings = M.wings.filter((w) => !w.comingSoon);
  const allEx = wings.flatMap((w) => w.exhibits.map((e, i) => ({ ...e, wing: w, code: `${w.code}-${String(i + 1).padStart(2, "0")}` })));
  const TREASURE_WING = { name: "Secret room", color: "#e8b53a", wall: "#1d1b24" };
  const treasures = M.treasures.map((t, i) => ({ ...t, wing: TREASURE_WING, code: `T-${String(i + 1).padStart(2, "0")}` }));
  const everything = allEx.concat(treasures);
  const exById = (id) => everything.find((e) => e.id === id);

  /* ---------------- saved state ---------------- */
  const fresh = () => ({
    player: "",
    robotName: "Echo",
    kid: { skin: SKINS[3], shirt: SHIRTS[0], pants: PANTS[0], hair: "short", hairColor: HAIR_COLORS[0], extra: "none" },
    level: "medium",
    mode: "game",   // "learn" | "game"
    place: "earth", // where the museum is: earth | moon | mars
    lang: "en",
    // accessibility: text size n | l | xl, and on/off switches
    a11y: { text: "n", contrast: false, motion: !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches), font: false, speak: false },
    stars: 0,
    owned: ["c-silver", "e-cyan", "h-none", "g-none"],
    look: { color: "#c9d3e6", eyes: "#5ef2ff", hat: "none", gear: "none" },
    met: {},      // every machine you've heard, across all adventures
    best: {},     // fewest doors per level
    run: null,    // the current adventure
  });
  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = Object.assign(fresh(), JSON.parse(raw));
        // older saves picked "boy" or "girl"; turn that into a hairstyle
        if (s.kid.char && !s.kid.hair) s.kid.hair = s.kid.char === "girl" ? "ponytail" : "short";
        delete s.kid.char;
        s.kid = Object.assign(fresh().kid, s.kid);
        s.a11y = Object.assign(fresh().a11y, s.a11y);
        return s;
      }
    } catch (e) {}
    return fresh();
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

  const R = () => S.run;
  const G = () => S.run.graph;
  const LV = () => Maze.LEVELS[S.run.level];
  const room = (id) => G().rooms[id];
  const allCollected = () => G().pieces.every((p) => R().collected.includes(p));
  const isLearn = () => !!(S.run && S.run.level === "learn");
  const PLACE = () => (S.run && S.run.place) || S.place;
  function roomName(id) {
    const r = room(id);
    if (r.type === "atrium") return t("room.atrium");
    if (r.type === "mc") return t("room.mc");
    if (r.type === "exhibit") return exById(r.exhibit).name;
    if (r.type === "hall") return t(`hall.${r.hall}.name`);
    if (r.type === "hidden" && r.find === "treasure" && isLearn()) return exById(r.treasure).name;
    return t("room.secret");
  }
  const levelLabel = (lv) => t(`level.${lv}`);

  /* =========================================================
   * INTRO
   * ========================================================= */
  function buildIntro() {
    $("#busWrap").innerHTML = Art.bus();
    // the team patch is only the browser-tab icon
    $("#favicon").href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(Art.patch().replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
    const lists = { skin: SKINS, shirt: SHIRTS, pants: PANTS, hairColor: HAIR_COLORS };
    document.querySelectorAll(".swatches").forEach((box) => {
      const key = box.dataset.look;
      box.innerHTML = lists[key].map((c) => `<button type="button" class="swatch" style="--c:${c}" data-val="${c}"></button>`).join("");
      box.addEventListener("click", (e) => {
        const b = e.target.closest(".swatch");
        if (!b) return;
        S.kid[key] = b.dataset.val;
        drawMaker();
      });
    });
    $("#hairPick").addEventListener("click", (e) => {
      const b = e.target.closest("[data-hair]");
      if (!b) return;
      S.kid.hair = b.dataset.hair;
      drawMaker();
    });
    $("#extraPick").addEventListener("click", (e) => {
      const b = e.target.closest("[data-extra]");
      if (!b) return;
      S.kid.extra = b.dataset.extra;
      drawMaker();
    });
    $("#placePick").addEventListener("click", (e) => {
      const b = e.target.closest("[data-place]");
      if (!b) return;
      S.place = b.dataset.place;
      drawPicks();
    });
    $("#modePick").addEventListener("click", (e) => {
      const b = e.target.closest("[data-mode]");
      if (!b) return;
      S.mode = b.dataset.mode;
      drawPicks();
    });
    $("#levelPick").addEventListener("click", (e) => {
      const b = e.target.closest("[data-level]");
      if (!b) return;
      S.level = b.dataset.level;
      drawPicks();
    });
    document.querySelectorAll(".lang-select").forEach((sel) => {
      sel.innerHTML = I18N.LANGS.map((l) => `<option value="${l.code}">${l.name}</option>`).join("");
      sel.addEventListener("change", () => setLang(sel.value));
    });
    if (S.level === "learn") S.level = "medium";
    $("#playerName").value = S.player;
    $("#robotName").value = S.robotName;
    drawMaker();
    drawPicks();
    drawIntroText();
  }
  function drawIntroText() {
    // hairstyles are pictures only, no names
    $("#hairPick").innerHTML = Art.HAIR_STYLES.map((h, i) => `<button type="button" data-hair="${h}" aria-label="${esc(t("look.hair"))} ${i + 1}"><span class="cp-art">${Art.kid({ ...S.kid, hair: h, extra: "none" })}</span></button>`).join("");
    $("#extraPick").innerHTML = EXTRAS.map((x) => `<button type="button" data-extra="${x}">${esc(t("extra." + x))}</button>`).join("");
    document.querySelectorAll(".swatch").forEach((b) => b.setAttribute("aria-label", `${t("look." + b.parentElement.dataset.look)} ${b.dataset.val}`));
    if (S.run && !S.run.done) {
      $("#continueBtn").hidden = false;
      $("#continueBtn").textContent = t("intro.continue", { level: `${levelLabel(S.run.level)} · ${t("place." + (S.run.place || "earth"))}` });
    }
    $("#startBtn").textContent = t(S.mode === "learn" ? "intro.startLearn" : "intro.start");
    drawMaker();
  }
  /* The explorer preview is a little 3D scene: it turns slowly, drag to spin it. */
  let pv = null;
  function drawPreview3D() {
    const box = $("#kidPreview");
    if (!pv) {
      let r;
      try { r = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { box.innerHTML = Art.kid(S.kid); return; }
      r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      r.outputEncoding = T.sRGBEncoding;
      r.toneMapping = T.ACESFilmicToneMapping;
      box.innerHTML = "";
      box.appendChild(r.domElement);
      const sc = new T.Scene();
      sc.add(new T.HemisphereLight("#fff4e0", "#6a5a4c", 1.3));
      const key = new T.DirectionalLight("#ffffff", 1.2); key.position.set(2, 3, 4);
      const rim = new T.DirectionalLight("#9fd0ff", 0.8); rim.position.set(-3, 2, -3);
      sc.add(key, rim);
      const cam = new T.PerspectiveCamera(28, 1, 0.1, 20);
      pv = { r, sc, cam, model: null, yaw: 0.4, drag: null, w: 0, h: 0 };
      const el = r.domElement;
      el.addEventListener("pointerdown", (e) => { pv.drag = e.clientX; el.setPointerCapture(e.pointerId); });
      el.addEventListener("pointermove", (e) => { if (pv.drag != null) { pv.yaw += (e.clientX - pv.drag) * 0.02; pv.drag = e.clientX; } });
      el.addEventListener("pointerup", () => (pv.drag = null));
      const loop = (ms) => {
        if (!$("#intro").hidden && pv.model) {
          const w = box.clientWidth, h = box.clientHeight;
          if (w && h && (w !== pv.w || h !== pv.h)) {
            pv.w = w; pv.h = h;
            r.setSize(w, h, false);
            cam.aspect = w / h;
            // fit the whole explorer, head to toe
            const fov = (cam.fov * Math.PI) / 180;
            const dist = Math.max(1.05 / Math.tan(fov / 2), 0.55 / (Math.tan(fov / 2) * cam.aspect));
            cam.position.set(0, 0.95, dist);
            cam.lookAt(0, 0.85, 0);
            cam.updateProjectionMatrix();
          }
          if (pv.drag == null) pv.yaw += 0.008;
          pv.model.rotation.y = pv.yaw;
          Models.animateKid(pv.model, ms / 1000, 0, 1);
          r.render(sc, cam);
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    if (pv.model) {
      pv.sc.remove(pv.model);
      pv.model.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
    }
    pv.model = Models.kid({ ...S.kid, suit: false });
    pv.sc.add(pv.model);
  }
  function drawMaker() {
    drawPreview3D();
    $("#rocketWrap").innerHTML = Art.rocket(S.kid);
    $("#hairPick").querySelectorAll("[data-hair]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.hair === S.kid.hair));
      $(".cp-art", b).innerHTML = Art.kid({ ...S.kid, hair: b.dataset.hair, extra: "none" });
    });
    $("#extraPick").querySelectorAll("[data-extra]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.extra === S.kid.extra)));
    document.querySelectorAll(".swatches").forEach((box) => box.querySelectorAll(".swatch").forEach((x) => x.setAttribute("aria-pressed", String(S.kid[box.dataset.look] === x.dataset.val))));
  }
  function drawPicks() {
    $("#placePick").querySelectorAll("[data-place]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.place === S.place)));
    $("#intro").dataset.place = S.place;
    $("#modePick").querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.mode === S.mode)));
    $("#levelField").hidden = S.mode !== "game";
    $("#levelPick").querySelectorAll("[data-level]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.level === S.level)));
    $("#startBtn").textContent = t(S.mode === "learn" ? "intro.startLearn" : "intro.start");
  }
  function readIntro() {
    S.player = $("#playerName").value.trim() || t("intro.namePh");
    S.robotName = $("#robotName").value.trim() || "Echo";
  }
  $("#introForm").addEventListener("submit", (e) => {
    e.preventDefault();
    readIntro();
    newRun(S.mode === "learn" ? "learn" : S.level);
    // off Earth, the trip starts with a short movie: board the rocket, fly, land
    if (PLACE() !== "earth" && window.Cutscene) {
      Cutscene.play({ place: PLACE(), kid: S.kid, robot: S.look, robotName: S.robotName, t })
        .catch((err) => console.warn("cutscene skipped:", err))
        .then(() => enterMuseum(true));
    } else enterMuseum(true);
  });
  $("#continueBtn").addEventListener("click", () => {
    readIntro();
    if (S.run && !S.run.place) S.run.place = S.place; // older saves didn't record where the museum was
    save();
    enterMuseum(false);
  });
  $("#skipIntro").addEventListener("click", () => $("#intro").classList.add("skipped"));

  // which hall opens each wing on the learning tour
  const WING_HALL = { moon: 2, mars: 3, deep: 4 };
  function newRun(level) {
    const seed = 1000 + Math.floor(Math.random() * 9000);
    const graph = level === "learn"
      ? Maze.tour({ wings: wings.map((w) => ({ hall: WING_HALL[w.id] != null ? WING_HALL[w.id] : 0, exhibits: w.exhibits.map((e) => e.id) })), treasures: treasures.map((x) => x.id) })
      : Maze.generate(level, seed, {
        exhibits: allEx.map((e) => e.id),
        treasures: treasures.map((x) => x.id),
        halls: M.halls.length,
      });
    const L = Maze.LEVELS[level];
    if (level !== "learn") S.level = level;
    S.run = {
      seed, level, graph, place: S.place, cur: 0, collected: [], route: [], known: {}, revealed: {}, solved: {},
      visited: [0], visits: {}, scans: L.scanner === "always" ? -1 : L.scanner, note: null, sawMC: false, done: false,
    };
    save();
  }

  /* =========================================================
   * THREE.JS SETUP
   * ========================================================= */
  const WALL_H = 4.2, CUT_H = 0.45, WALL_T = 0.3, R_PLAYER = 0.35;
  const X0 = -8, X1 = 8, Z0 = -6, Z1 = 6;
  const DOOR_W = 2.4;
  const SLOT_POS = {
    N0: { side: "N", along: 0 }, N1: { side: "N", along: -4.6 }, N2: { side: "N", along: 4.6 },
    W1: { side: "W", along: -2.6 }, W2: { side: "W", along: 2.6 }, E1: { side: "E", along: -2.6 }, E2: { side: "E", along: 2.6 },
  };

  let renderer, scene, camera, sun, kid, robot, roomGroup, ground, skyPlace = null, userZoomed = false;
  let sides = [], wallMeshes = [], pickables = [], obstacles = [], spots = [], doorObjs = [], spin = [];
  const boards = [];
  const ray = new T.Raycaster();
  const V = (x, y, z) => new T.Vector3(x, y, z);

  function initThree() {
    renderer = new T.WebGLRenderer({ canvas: $("#scene"), antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene();
    scene.background = skyFor(PLACE());
    camera = new T.PerspectiveCamera(45, 1, 0.1, 300);
    scene.add(new T.HemisphereLight("#fff4e0", "#4a3a2c", 1.25));
    scene.add(new T.AmbientLight("#ffffff", 0.25));
    sun = new T.DirectionalLight("#fff1d6", 1.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
    sun.shadow.bias = -0.0008;
    sun.position.set(7, 18, 9);
    scene.add(sun, sun.target);
    ground = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshBasicMaterial({ color: "#14120f" }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);
    resize();
    addEventListener("resize", resize);
  }
  function resize() {
    if (!renderer) return;
    const st = $("#stage");
    renderer.setSize(st.clientWidth, st.clientHeight, false);
    camera.aspect = st.clientWidth / st.clientHeight;
    camera.fov = camera.aspect < 1 ? 60 : 45;
    camera.updateProjectionMatrix();
    // pull the camera back far enough to fit the room's width (tall phone screens need more)
    if (!userZoomed) {
      const hf = 2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
      want.dist = Math.max(12.5, Math.min(21, 8.6 / Math.tan(hf / 2)));
    }
  }
  // what you see past the cut-away walls: an evening sky on Earth, black space on
  // the Moon (with Earth hanging in it), a dusty butterscotch sky on Mars
  const SKY = {
    // fog: the far ground fades into this color, so the world meets the sky with no black edge
    earth: { top: "#3f7fd0", bottom: "#cfe4f2", stars: 0, ground: "#5f9a4a", fog: "#cfe4f2" },
    moon: { top: "#000003", bottom: "#05060c", stars: 900, ground: "#8d8b86", earth: true, fog: "#07080d" },
    mars: { top: "#8a5a40", bottom: "#d9a77a", stars: 0, ground: "#b5603a", fog: "#d4a079" },
  };
  function skyFor(place) {
    const p = SKY[place] || SKY.earth;
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, p.top); g.addColorStop(1, p.bottom);
    x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < p.stars; i++) {
      x.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.7})`;
      x.beginPath(); x.arc(rnd() * 1024, rnd() * 1024, rnd() < 0.08 ? 1.8 : 0.9, 0, Math.PI * 2); x.fill();
    }
    if (p.earth) {
      // Earth seen from the Moon
      const ex = 760, ey = 210, er = 70;
      const eg = x.createRadialGradient(ex - 20, ey - 20, 10, ex, ey, er);
      eg.addColorStop(0, "#8fc4ff"); eg.addColorStop(1, "#1f4f9e");
      x.fillStyle = eg; x.beginPath(); x.arc(ex, ey, er, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#4f9a52";
      [[-20, -10, 26, 16], [18, 18, 20, 12], [-6, 30, 14, 9]].forEach(([dx, dy, rx, ry]) => { x.beginPath(); x.ellipse(ex + dx, ey + dy, rx, ry, 0.4, 0, Math.PI * 2); x.fill(); });
      x.fillStyle = "rgba(255,255,255,.6)";
      [[-30, -40, 30, 6], [10, -8, 34, 5], [-10, 50, 28, 5]].forEach(([dx, dy, rx, ry]) => { x.beginPath(); x.ellipse(ex + dx, ey + dy, rx, ry, 0.1, 0, Math.PI * 2); x.fill(); });
      x.fillStyle = "rgba(0,0,10,.55)"; x.beginPath(); x.arc(ex + 30, ey, er, -Math.PI / 2, Math.PI / 2); x.ellipse(ex + 30, ey, 30, er, 0, Math.PI / 2, -Math.PI / 2, true); x.fill();
    }
    if (place === "mars") {
      // a small, pale sun
      const sg = x.createRadialGradient(300, 260, 0, 300, 260, 90);
      sg.addColorStop(0, "rgba(255,250,235,1)"); sg.addColorStop(0.25, "rgba(255,240,210,.7)"); sg.addColorStop(1, "rgba(255,220,180,0)");
      x.fillStyle = sg; x.fillRect(200, 160, 200, 200);
    }
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    return tex;
  }
  /* ---------- the world outside: grass and trees, Moon craters, or Mars rocks ---------- */
  function groundTex(place) {
    return canvasTex(512, 512, (x, W, H) => {
      const base = SKY[place].ground;
      x.fillStyle = base; x.fillRect(0, 0, W, H);
      let seed = 11;
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      if (place === "earth") {
        // grass: lots of little blades of slightly different greens
        for (let i = 0; i < 5000; i++) {
          x.fillStyle = ["#6aa653", "#548c40", "#77b35e", "#4e8239"][i % 4];
          x.fillRect(rnd() * W, rnd() * H, 2, 5);
        }
      } else {
        // dusty ground with speckles, plus craters (Moon) or pebbles (Mars)
        for (let i = 0; i < 3500; i++) {
          x.fillStyle = `rgba(${place === "moon" ? "0,0,0" : "60,20,5"},${0.05 + rnd() * 0.12})`;
          x.fillRect(rnd() * W, rnd() * H, 2, 2);
        }
        const n = place === "moon" ? 14 : 30;
        for (let i = 0; i < n; i++) {
          const cx = rnd() * W, cy = rnd() * H, r = place === "moon" ? 8 + rnd() * 40 : 2 + rnd() * 7;
          if (place === "moon") {
            const g = x.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.2, cx, cy, r);
            g.addColorStop(0, "rgba(0,0,0,.28)"); g.addColorStop(0.8, "rgba(0,0,0,.08)"); g.addColorStop(1, "rgba(255,255,255,.18)");
            x.fillStyle = g;
          } else x.fillStyle = "rgba(70,25,10,.45)";
          x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
        }
      }
    });
  }
  let world = null;
  function buildWorld(place) {
    if (world) {
      scene.remove(world);
      world.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    }
    world = new T.Group();
    scene.add(world);
    const tex = groundTex(place);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(24, 24);
    const g = new T.Mesh(new T.PlaneGeometry(240, 240), new T.MeshStandardMaterial({ map: tex, roughness: 1 }));
    g.rotation.x = -Math.PI / 2;
    g.position.y = -0.03;
    g.receiveShadow = true;
    world.add(g);
    // a paved plaza (Earth) or a landing pad (Moon, Mars) right around the museum
    const pad = new T.Mesh(new T.PlaneGeometry(24, 20), new T.MeshStandardMaterial({ color: place === "earth" ? "#cfc7b8" : place === "moon" ? "#6f6e6a" : "#8a4a2c", roughness: 0.9 }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = -0.02;
    world.add(pad);
    let seed = 5;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const around = (min, max) => { const a = rnd() * Math.PI * 2, d = min + rnd() * (max - min); return [Math.cos(a) * d, Math.sin(a) * d * 0.8]; };
    if (place === "earth") {
      const trunk = new T.MeshStandardMaterial({ color: "#6b4a32", roughness: 0.9 });
      const leaf = [new T.MeshStandardMaterial({ color: "#3f7a4a", roughness: 0.9, flatShading: true }), new T.MeshStandardMaterial({ color: "#4f8f4f", roughness: 0.9, flatShading: true })];
      for (let i = 0; i < 46; i++) {
        const [x, z] = around(15, 60);
        const tree = new T.Group();
        const h = 1.5 + rnd() * 1.5;
        const tr = new T.Mesh(new T.CylinderGeometry(0.15, 0.22, h, 8), trunk);
        tr.position.y = h / 2;
        const top = new T.Mesh(rnd() < 0.5 ? new T.ConeGeometry(1.3, 3, 9) : new T.IcosahedronGeometry(1.4, 1), leaf[i % 2]);
        top.position.y = h + 1.2;
        tree.add(tr, top);
        tree.position.set(x, 0, z);
        tree.scale.setScalar(0.8 + rnd() * 0.7);
        world.add(tree);
      }
    } else {
      const rock = new T.MeshStandardMaterial({ color: place === "moon" ? "#77756f" : "#7e3a20", roughness: 1, flatShading: true });
      for (let i = 0; i < (place === "moon" ? 40 : 70); i++) {
        const [x, z] = around(13, 70);
        const r = new T.Mesh(new T.DodecahedronGeometry(0.3 + rnd() * (place === "mars" ? 1.4 : 0.9), 0), rock);
        r.position.set(x, 0.1, z);
        r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        r.scale.y = 0.6;
        world.add(r);
      }
      if (place === "moon") {
        // raised crater rims
        const rim = new T.MeshStandardMaterial({ color: "#9a9893", roughness: 1 });
        for (let i = 0; i < 12; i++) {
          const [x, z] = around(16, 60);
          const c = new T.Mesh(new T.TorusGeometry(2 + rnd() * 4, 0.35, 6, 28), rim);
          c.rotation.x = -Math.PI / 2;
          c.scale.z = 0.4;
          c.position.set(x, 0, z);
          world.add(c);
        }
      } else {
        // soft dunes
        const dune = new T.MeshStandardMaterial({ color: "#c06a40", roughness: 1 });
        for (let i = 0; i < 10; i++) {
          const [x, z] = around(25, 70);
          const d = new T.Mesh(new T.SphereGeometry(6 + rnd() * 6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), dune);
          d.scale.y = 0.18;
          d.position.set(x, -0.05, z);
          world.add(d);
        }
      }
      // the glass dome's base ring around the museum
      const ring = new T.Mesh(new T.TorusGeometry(11.5, 0.18, 8, 96), new T.MeshStandardMaterial({ color: "#c9d6e6", metalness: 0.6, roughness: 0.3 }));
      ring.rotation.x = -Math.PI / 2;
      ring.scale.y = 0.85;
      world.add(ring);
    }
  }
  function applyPlace() {
    const pl = PLACE();
    if (!scene || skyPlace === pl) return;
    skyPlace = pl;
    if (scene.background && scene.background.dispose) scene.background.dispose();
    scene.background = skyFor(pl);
    scene.fog = new T.Fog(SKY[pl].fog, 32, 95);
    ground.visible = false;
    buildWorld(pl);
    // daylight on Earth, harsh white sun on the Moon, warm hazy light on Mars
    sun.color.set(pl === "moon" ? "#ffffff" : pl === "mars" ? "#ffd9b0" : "#fff1d6");
  }

  /* ---------------- materials ---------------- */
  /* High-tech surfaces: glossy floor panels with glowing seams, paneled walls with light strips */
  const texCache = {};
  const FLOORS = {
    "tech-light": "#c3cdd9", "tech-dark": "#1c2338", "tech-mid": "#2c3446", "tech-violet": "#241f33",
  };
  function floorMat(kind, glow) {
    const key = kind + glow;
    if (!texCache[key]) texCache[key] = Models.techFloorTex(FLOORS[kind] || FLOORS["tech-dark"], glow);
    const tx = texCache[key];
    const map = tx.map.clone(), em = tx.emissive.clone();
    [map, em].forEach((x) => { x.needsUpdate = true; x.repeat.set((X1 - X0) / 4, (Z1 - Z0) / 4); });
    return new T.MeshStandardMaterial({ map, emissiveMap: em, emissive: "#ffffff", emissiveIntensity: 0.9, roughness: 0.22, metalness: 0.2 });
  }
  function wallMats(color, glow) {
    glow = glow || "#5ef2ff";
    const key = "w" + color + glow;
    if (!texCache[key]) texCache[key] = Models.techWallTex(color, glow);
    const face = new T.MeshStandardMaterial({ map: texCache[key].map, emissiveMap: texCache[key].emissive, emissive: "#ffffff", emissiveIntensity: 0.85, roughness: 0.45, metalness: 0.15 });
    const top = new T.MeshStandardMaterial({ color: "#20242e", roughness: 0.6, metalness: 0.3 });
    return [face, face, top, face, face, face];
  }
  const add = (o) => { roomGroup.add(o); return o; };
  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }

  /* =========================================================
   * BUILD ONE ROOM
   * ========================================================= */
  function theme(r) {
    if (r.type === "atrium") return { wall: "#cfd8e2", floor: "tech-light", glow: "#5ef2ff", kind: t("kind.start") };
    if (r.type === "mc") return { wall: "#1c2846", floor: "tech-dark", glow: "#5ef2ff", kind: t("kind.final") };
    if (r.type === "hidden") return { wall: "#24212e", floor: "tech-violet", glow: "#e8b53a", kind: t("kind.secret") };
    if (r.type === "hall") return { wall: M.halls[r.hall].wall, floor: "tech-mid", glow: "#5ef2ff", kind: t("kind.hall") };
    const ex = exById(r.exhibit);
    return { wall: ex.wing.wall, floor: "tech-dark", glow: ex.wing.color, kind: t("kind.machine", { wing: t("wing." + ex.wing.id) }) };
  }

  function clearRoom() {
    if (roomGroup) {
      scene.remove(roomGroup);
      roomGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        const keep = new Set(Object.values(texCache).flatMap((v) => [v.map, v.emissive]));
        mats.forEach((m) => {
          [m.map, m.emissiveMap].forEach((tx) => { if (tx && !keep.has(tx)) tx.dispose(); });
          m.dispose();
        });
      });
    }
    roomGroup = new T.Group();
    scene.add(roomGroup);
    sides = []; wallMeshes = []; pickables = []; obstacles = []; spots = []; doorObjs = []; spin = [];
    boards.length = 0;
    nearSpot = null;
    $("#prompt").hidden = true;
  }

  function buildRoom(id) {
    clearRoom();
    spotCursor = -1;
    const r = room(id);
    const th = theme(r);
    const floor = add(new T.Mesh(new T.PlaneGeometry(X1 - X0, Z1 - Z0), floorMat(th.floor, th.glow)));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.floor = true;
    pickables.push(floor);

    // which doors are visible right now (secret ones only once found)
    const visibleDoors = r.doors.filter((d) => !d.hidden || R().revealed[`${id}:${d.i}`]);
    buildWalls(th.wall, visibleDoors, th.glow);
    // twinkling stars float up near the ceiling in every room
    const stars = add(Models.roomStars(r.type === "atrium" ? 220 : 120, { x0: X0 + 0.5, x1: X1 - 0.5, y0: 2.9, y1: 4.1, z0: Z0 + 0.5, z1: Z1 - 0.5 }));
    spin.push({ o: stars, twinkle: true });
    visibleDoors.forEach((d) => buildDoor(id, d));
    r.doors.filter((d) => d.hidden && !R().revealed[`${id}:${d.i}`]).forEach((d) => buildSecretPanel(id, d));
    // windows on the side walls wherever there's no door (and no secret door), and a skylight frame overhead
    const used = new Set(r.doors.map((d) => d.slot));
    ["W1", "W2", "E1", "E2"].concat(r.type === "hall" || r.type === "mc" ? ["N1", "N2"] : []).filter((sl) => !used.has(sl)).forEach((sl) => buildWindow(SLOT_POS[sl]));
    buildSkylight();

    if (r.type === "atrium") buildAtrium();
    else if (r.type === "exhibit") buildExhibit(r);
    else if (r.type === "hall") buildHall(r);
    else if (r.type === "hidden") buildHidden(r);
    else if (r.type === "mc") buildMissionControl();
    updateHint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => boards.forEach((b) => b.redraw()));
  }

  function buildWalls(color, doors, glow) {
    const mats = wallMats(color, glow);
    // a glowing trim line where the wall meets the floor
    const base = new T.MeshBasicMaterial({ color: glow || "#5ef2ff", toneMapped: false });
    const defs = [
      { side: "N", n: [0, 1], line: Z0, from: X0, to: X1 },
      { side: "S", n: [0, -1], line: Z1, from: X0, to: X1 },
      { side: "W", n: [1, 0], line: X0, from: Z0 + WALL_T, to: Z1 - WALL_T },
      { side: "E", n: [-1, 0], line: X1, from: Z0 + WALL_T, to: Z1 - WALL_T },
    ];
    defs.forEach((dfn) => {
      const alongX = dfn.n[0] === 0;
      const gaps = doors.filter((d) => SLOT_POS[d.slot].side === dfn.side).map((d) => [SLOT_POS[d.slot].along - DOOR_W / 2, SLOT_POS[d.slot].along + DOOR_W / 2]);
      const segs = [];
      let start = dfn.from;
      gaps.sort((a, b) => a[0] - b[0]).forEach(([g0, g1]) => { if (g0 > start) segs.push([start, g0]); start = Math.max(start, g1); });
      if (dfn.to > start) segs.push([start, dfn.to]);
      const group = add(new T.Group());
      const decor = add(new T.Group());
      const sgn = alongX ? dfn.n[1] : dfn.n[0];
      const inner = dfn.line + sgn * WALL_T;
      const mid = dfn.line + sgn * WALL_T / 2;
      const s = { side: dfn.side, n: V(dfn.n[0], 0, dfn.n[1]), group, decor, h: WALL_H, inner, mid, alongX };
      segs.forEach(([a, b]) => {
        const len = b - a, c = (a + b) / 2;
        const box = new T.Mesh(new T.BoxGeometry(alongX ? len : WALL_T, WALL_H, alongX ? WALL_T : len), mats);
        box.position.set(alongX ? c : mid, WALL_H / 2, alongX ? mid : c);
        box.castShadow = box.receiveShadow = true;
        box.userData.side = s;
        group.add(box);
        wallMeshes.push(box);
        const bb = new T.Mesh(new T.BoxGeometry(alongX ? len : 0.04, 0.05, alongX ? 0.04 : len), base);
        const bi = inner + sgn * 0.02;
        bb.position.set(alongX ? c : bi, 0.03, alongX ? bi : c);
        group.add(bb);
      });
      sides.push(s);
    });
  }
  const sideOf = (name) => sides.find((s) => s.side === name);
  // a point "out" meters in front of a wall, at "along" on it
  function wallPoint(s, along, out) {
    const sgn = s.alongX ? s.n.z : s.n.x;
    const c = s.inner + sgn * out;
    return s.alongX ? [along, c] : [c, along];
  }
  function onWall(s, mesh, along, y, out) {
    const [x, z] = wallPoint(s, along, out || 0.03);
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.atan2(s.n.x, s.n.z);
    s.decor.add(mesh);
    return mesh;
  }
  function addBoard(s, opts, along, y) {
    const b = Models.board(opts);
    boards.push(b);
    onWall(s, b.mesh, along, y, 0.04);
    return b;
  }

  /* ---------------- doors ---------------- */
  function doorState(roomId, d) {
    if (d.sealed) return allCollected() ? "open-mc" : "sealed";
    if (d.lock && !R().solved[d.lock.id]) return "locked";
    return d.oneWay ? "oneway" : "normal";
  }
  // draw a door symbol as a shape (fonts draw ● and ■ too small)
  function drawSymbol(x, idx, cx, cy, size, color) {
    const r = size / 2;
    x.save();
    x.fillStyle = color;
    x.beginPath();
    if (idx === 0) { x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.95, cy + r * 0.75); x.lineTo(cx - r * 0.95, cy + r * 0.75); }
    else if (idx === 1) x.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
    else if (idx === 2) x.rect(cx - r * 0.75, cy - r * 0.75, r * 1.5, r * 1.5);
    else if (idx === 3) for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    else if (idx === 4) { x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.75, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r * 0.75, cy); }
    else { const w = r * 0.36; x.rect(cx - w, cy - r * 0.9, w * 2, r * 1.8); x.rect(cx - r * 0.9, cy - w, r * 1.8, w * 2); }
    x.closePath();
    x.fill();
    x.restore();
  }

  function drawDoorPanel(x, W, H, d, state) {
    const sym = SYM[d.sym];
    x.fillStyle = "#1f2330"; x.fillRect(0, 0, W, H);
    x.strokeStyle = sym.color; x.lineWidth = 14; x.strokeRect(14, 14, W - 28, H - 28);
    drawSymbol(x, d.sym, W / 2, H * 0.4, W * 0.5, sym.color);
    x.textAlign = "center"; x.textBaseline = "middle";
    const label = d.next ? t("door.next") : d.back ? t("door.back") : { sealed: t("door.sealed"), locked: t("door.locked"), oneway: t("door.oneway"), "open-mc": t("door.open") }[state];
    if (label) {
      x.fillStyle = state === "sealed" || state === "locked" ? "#f2c230" : "#f6f0e3";
      fitText(x, label, W - 30, W * 0.11, 700, '"IBM Plex Mono", monospace');
      x.fillText(label, W / 2, H * 0.74);
      if (state === "sealed") {
        const txt = t("door.pieces", { n: R().collected.length, k: G().pieces.length });
        fitText(x, txt, W - 30, W * 0.085, 700, '"IBM Plex Mono", monospace');
        x.fillText(txt, W / 2, H * 0.84);
      }
      if (state === "oneway" || d.next || d.back) {
        x.font = `700 ${W * 0.16}px "IBM Plex Mono", monospace`;
        x.fillText(d.back ? "←" : "→", W / 2, H * 0.86);
      }
    }
  }
  // shrink a font until the text fits (some languages run long)
  function fitText(x, text, maxW, size, weight, family) {
    let fs = size;
    x.font = `${weight} ${fs}px ${family}`;
    while (x.measureText(text).width > maxW && fs > 8) { fs -= 1; x.font = `${weight} ${fs}px ${family}`; }
  }
  function buildDoor(roomId, d) {
    const slot = SLOT_POS[d.slot];
    const s = sideOf(slot.side);
    const sym = SYM[d.sym];
    const rot = Math.atan2(s.n.x, s.n.z);
    const state = doorState(roomId, d);
    const frameMat = new T.MeshStandardMaterial({ color: sym.color, roughness: 0.5, metalness: 0.2 });
    // pillars
    [-1, 1].forEach((k) => {
      const p = new T.Mesh(new T.BoxGeometry(0.32, WALL_H, 0.32), frameMat);
      const [x, z] = wallPoint(s, slot.along + k * (DOOR_W / 2 + 0.06), -0.1);
      p.position.set(x, WALL_H / 2, z);
      p.castShadow = true;
      s.group.add(p);
    });
    // the door itself: a panel that slides up when it opens
    const panelTex = canvasTex(256, 340, (x, W, H) => drawDoorPanel(x, W, H, d, state));
    const dark = new T.MeshStandardMaterial({ color: "#1f2330", roughness: 0.4 });
    const panel = new T.Mesh(new T.BoxGeometry(DOOR_W - 0.1, 3.1, 0.12), [dark, dark, dark, dark, new T.MeshBasicMaterial({ map: panelTex, toneMapped: false }), dark]);
    const [px, pz] = wallPoint(s, slot.along, -WALL_T / 2);
    panel.position.set(px, 1.55, pz);
    panel.rotation.y = rot;
    s.group.add(panel);
    // behind the door: a glowing portal of light in the door's color (not the dark outside)
    const portal = new T.Mesh(new T.PlaneGeometry(DOOR_W - 0.1, 3.1), new T.MeshBasicMaterial({ map: portalTex(sym.color), transparent: true, toneMapped: false, depthWrite: false }));
    const [qx, qz] = wallPoint(s, slot.along, -WALL_T - 0.02);
    portal.position.set(qx, 1.55, qz);
    portal.rotation.y = rot;
    s.group.add(portal);
    spin.push({ o: portal, shimmer: true });
    // a short hallway behind the door, so every door leads somewhere (seen from outside as a roofed corridor)
    const th = theme(room(roomId));
    const HALL_D = 3.4, HALL_H = 3.7;
    const hall = new T.Mesh(new T.BoxGeometry(DOOR_W + 0.9, HALL_H, HALL_D), wallMats(th.wall, th.glow));
    const [hx, hz] = wallPoint(s, slot.along, -WALL_T - 0.05 - HALL_D / 2);
    hall.position.set(hx, HALL_H / 2, hz);
    hall.rotation.y = rot;
    hall.castShadow = hall.receiveShadow = true;
    s.group.add(hall);
    // a glowing skylight strip along the hallway roof, in the door's color
    const strip = new T.Mesh(new T.PlaneGeometry(0.5, HALL_D - 0.5), new T.MeshBasicMaterial({ color: sym.color, toneMapped: false }));
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = -rot;
    strip.position.set(hx, HALL_H + 0.01, hz);
    s.group.add(strip);
    // lintel + sign above the door: "?" until you've been through it
    const lintel = new T.Mesh(new T.BoxGeometry(DOOR_W + 0.3, WALL_H - 3.1, WALL_T), wallMats(theme(room(roomId)).wall, theme(room(roomId)).glow));
    const [lx, lz] = wallPoint(s, slot.along, -WALL_T / 2);
    lintel.position.set(lx, 3.1 + (WALL_H - 3.1) / 2, lz);
    lintel.rotation.y = rot;
    s.decor.add(lintel);
    const known = R().known[`${roomId}:${d.i}`];
    const signText = d.sealed ? t("door.mc") : LV().learn ? roomName(d.to) : !known ? "?" : LV().signs === "names" ? roomName(d.to) : t("door.been");
    const sign = Models.board({ w: DOOR_W + 0.1, h: 0.66, ppm: 260, bg: "#1f2330", draw: (x, W, H) => {
      x.fillStyle = sym.color; x.fillRect(0, H - 10, W, 10);
      x.fillStyle = signText === "?" ? sym.color : "#f6f0e3";
      let fs = signText === "?" ? H * 0.7 : H * 0.36;
      x.font = `800 ${fs}px Fraunces, Georgia, serif`;
      while (x.measureText(signText).width > W - 24 && fs > 10) { fs -= 2; x.font = `800 ${fs}px Fraunces, Georgia, serif`; }
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(signText, W / 2, H * 0.47);
    } });
    boards.push(sign);
    onWall(s, sign.mesh, slot.along, 3.65, 0.04);
    // floor mat with the symbol (always visible, even when the wall is lowered)
    const matTex = canvasTex(256, 140, (x, W, H) => {
      x.fillStyle = sym.color; x.globalAlpha = 0.85; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
      x.strokeStyle = "#fff"; x.lineWidth = 6; x.strokeRect(8, 8, W - 16, H - 16);
      drawSymbol(x, d.sym, W / 2, H / 2, H * 0.6, "#fff");
    });
    const mat = add(new T.Mesh(new T.PlaneGeometry(DOOR_W - 0.2, 1.2), new T.MeshStandardMaterial({ map: matTex, roughness: 0.8 })));
    const [mx, mz] = wallPoint(s, slot.along, 0.75);
    mat.position.set(mx, 0.012, mz);
    mat.rotation.set(-Math.PI / 2, 0, rot);
    mat.receiveShadow = true;
    const [sx, sz] = wallPoint(s, slot.along, 1.55);
    const spot = addSpot({ kind: "door", door: d, pos: [sx, sz], face: rot + Math.PI, meshes: [panel, mat] });
    doorObjs.push({ door: d, panel, mat, spot, side: s, slot, rot });
  }

  /* a window onto the world outside: Earth's park, the Moon's craters and Earth in the sky, or Mars's dunes */
  function windowTex(place) {
    const key = "window-" + place;
    if (texCache[key]) return texCache[key].map;
    const tex = canvasTex(320, 256, (x, W, H) => {
      const sky = { earth: ["#4f8fd6", "#cfe6f5"], moon: ["#000004", "#0a0c16"], mars: ["#9a6a4c", "#e2b48c"] }[place];
      const gnd = { earth: "#5f9a4a", moon: "#8d8b86", mars: "#b5603a" }[place];
      const g = x.createLinearGradient(0, 0, 0, H * 0.7);
      g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      let seed = 3;
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      if (place === "moon") {
        for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.6})`; x.fillRect(rnd() * W, rnd() * H * 0.6, 1.5, 1.5); }
        // Earth hanging in the black sky
        const eg = x.createRadialGradient(232, 62, 4, 240, 70, 30);
        eg.addColorStop(0, "#9fd0ff"); eg.addColorStop(1, "#1f4f9e");
        x.fillStyle = eg; x.beginPath(); x.arc(240, 70, 28, 0, Math.PI * 2); x.fill();
        x.fillStyle = "#4f9a52"; x.beginPath(); x.ellipse(234, 66, 10, 6, 0.4, 0, Math.PI * 2); x.fill();
        x.fillStyle = "rgba(0,0,10,.5)"; x.beginPath(); x.arc(252, 70, 28, -Math.PI / 2, Math.PI / 2); x.fill();
      } else if (place === "mars") {
        x.fillStyle = "rgba(255,248,230,.9)"; x.beginPath(); x.arc(80, 60, 12, 0, Math.PI * 2); x.fill();
      } else {
        x.fillStyle = "#ffe9a8"; x.beginPath(); x.arc(250, 50, 18, 0, Math.PI * 2); x.fill();
        x.fillStyle = "#ffffffcc"; [[70, 50, 40], [140, 80, 30]].forEach(([cx, cy, r]) => { x.beginPath(); x.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2); x.fill(); });
      }
      // distant hills or crater rims, then the ground
      x.fillStyle = place === "earth" ? "#4c7f3c" : place === "moon" ? "#6f6d68" : "#9a4a2a";
      x.beginPath(); x.moveTo(0, H * 0.66);
      for (let i = 0; i <= 8; i++) x.lineTo((i / 8) * W, H * (0.58 + rnd() * 0.1));
      x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.fillStyle = gnd; x.fillRect(0, H * 0.72, W, H);
      if (place === "earth") {
        for (let i = 0; i < 7; i++) {
          const tx = 20 + rnd() * (W - 40), ty = H * 0.72 + rnd() * 20;
          x.fillStyle = "#6b4a32"; x.fillRect(tx - 2, ty - 10, 4, 12);
          x.fillStyle = "#3f7a4a"; x.beginPath(); x.arc(tx, ty - 16, 11, 0, Math.PI * 2); x.fill();
        }
      } else {
        for (let i = 0; i < 9; i++) {
          x.fillStyle = place === "moon" ? "rgba(0,0,0,.25)" : "rgba(80,25,10,.5)";
          x.beginPath(); x.ellipse(rnd() * W, H * 0.78 + rnd() * H * 0.2, 6 + rnd() * 14, 3 + rnd() * 4, 0, 0, Math.PI * 2); x.fill();
        }
      }
    });
    texCache[key] = { map: tex, emissive: tex };
    return tex;
  }
  function buildWindow(slot) {
    const s = sideOf(slot.side);
    const w = new T.Group();
    const frame = new T.Mesh(new T.BoxGeometry(2.1, 1.75, 0.08), new T.MeshStandardMaterial({ color: "#2a3040", metalness: 0.6, roughness: 0.3 }));
    const view = new T.Mesh(new T.PlaneGeometry(1.9, 1.55), new T.MeshBasicMaterial({ map: windowTex(PLACE()), toneMapped: false }));
    view.position.z = 0.045;
    const bar = new T.Mesh(new T.BoxGeometry(0.06, 1.55, 0.03), frame.material);
    bar.position.z = 0.06;
    const sill = new T.Mesh(new T.BoxGeometry(2.3, 0.08, 0.22), frame.material);
    sill.position.set(0, -0.9, 0.08);
    w.add(frame, view, bar, sill);
    onWall(s, w, slot.along, 2.25, 0.05);
  }
  /* a glass skylight frame across the top of the room */
  function buildSkylight() {
    // light and see-through, so it frames the room without blocking the view
    const mat = new T.MeshBasicMaterial({ color: "#dfe9f7", transparent: true, opacity: 0.35, depthWrite: false });
    const g = add(new T.Group());
    const y = WALL_H + 0.02;
    const beam = (len, x, z, alongX) => {
      const b = new T.Mesh(new T.BoxGeometry(alongX ? len : 0.05, 0.05, alongX ? 0.05 : len), mat);
      b.position.set(x, y, z);
      g.add(b);
    };
    [-4, 4].forEach((x) => beam(Z1 - Z0 - 0.6, x, 0, false));
    beam(X1 - X0 - 0.6, 0, 0, true);
    // very faint glass so the skylight reads as a roof without hiding the room
    const glass = new T.Mesh(new T.PlaneGeometry(X1 - X0 - 0.6, Z1 - Z0 - 0.6), new T.MeshBasicMaterial({ color: "#cfe8ff", transparent: true, opacity: 0.05, depthWrite: false }));
    glass.rotation.x = -Math.PI / 2;
    glass.position.y = y;
    g.add(glass);
  }

  const portalCache = {};
  function portalTex(color) {
    if (portalCache[color]) return portalCache[color].map;
    const tex = canvasTex(256, 340, (x, W, H) => {
      const g = x.createRadialGradient(W / 2, H * 0.55, 8, W / 2, H * 0.55, H * 0.7);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.18, "#fdf6e0"); g.addColorStop(0.55, color); g.addColorStop(1, "#0b1020");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // light rays and sparkles: a tunnel of light leading to the next room
      x.globalCompositeOperation = "lighter";
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        x.strokeStyle = "rgba(255,255,255,.10)"; x.lineWidth = 10;
        x.beginPath(); x.moveTo(W / 2, H * 0.55); x.lineTo(W / 2 + Math.cos(a) * W, H * 0.55 + Math.sin(a) * H); x.stroke();
      }
      for (let i = 0; i < 40; i++) {
        x.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.6})`;
        x.beginPath(); x.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 0.5, 0, Math.PI * 2); x.fill();
      }
    });
    portalCache[color] = { map: tex, emissive: tex }; // cached so leaving a room doesn't throw it away
    texCache["portal" + color] = portalCache[color];
    return tex;
  }

  function buildSecretPanel(roomId, d) {
    const slot = SLOT_POS[d.slot];
    const s = sideOf(slot.side);
    // a faint glowing crack in the wall, shaped like a door
    const tex = canvasTex(256, 340, (x, W, H) => {
      x.clearRect(0, 0, W, H);
      x.strokeStyle = "rgba(140,230,255,.55)"; x.lineWidth = 4;
      x.beginPath(); x.moveTo(20, H); x.lineTo(24, 30); x.lineTo(W - 22, 26); x.lineTo(W - 18, H); x.stroke();
      x.strokeStyle = "rgba(140,230,255,.3)"; x.lineWidth = 2;
      x.beginPath(); x.moveTo(60, 120); x.lineTo(90, 150); x.lineTo(80, 200); x.stroke();
    });
    const crack = new T.Mesh(new T.PlaneGeometry(DOOR_W - 0.2, 3.1), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    onWall(s, crack, slot.along, 1.55, 0.03);
    spin.push({ o: crack, flicker: true });
    const [sx, sz] = wallPoint(s, slot.along, 1.55);
    addSpot({ kind: "secret", door: d, pos: [sx, sz], face: Math.atan2(s.n.x, s.n.z) + Math.PI, meshes: [crack] });
  }

  /* ---------------- room contents ---------------- */
  function buildAtrium() {
    const N = sideOf("N");
    const k = G().pieces.length;
    addBoard(N, isLearn() ? {
      w: 5.6, h: 2.6, accent: "#b8892f", kicker: t("atrium.kicker"), title: t("atrium.learnTitle"), titleSize: 6.6,
      body: [t("atrium.learnBody")], bodySize: 3.6, footer: `${t("atrium.learnFooter")} · ${t("place." + PLACE()).toUpperCase()}`,
    } : {
      w: 5.6, h: 2.6, accent: "#b8892f", kicker: t("atrium.kicker"), title: t("atrium.title"), titleSize: 6.6,
      body: [t("atrium.body", { k })],
      bodySize: 3.6, footer: `${t("atrium.footer", { seed: R().seed })} · ${t("place." + PLACE()).toUpperCase()}`,
    }, 0, 2.3);
    buildOrrery(0, -1.2);
    buildKiosk(-4.2, -2.4, null);
    // Robot Bay pad
    const bx = -4.2, bz = 3.2;
    const pad = add(new T.Mesh(new T.CylinderGeometry(1.2, 1.3, 0.12, 40), new T.MeshStandardMaterial({ color: "#1f2330", roughness: 0.4, metalness: 0.4 })));
    pad.position.set(bx, 0.06, bz);
    const ring = add(new T.Mesh(new T.TorusGeometry(1.0, 0.05, 8, 48), new T.MeshBasicMaterial({ color: "#5ef2ff", transparent: true })));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(bx, 0.14, bz);
    spin.push({ o: ring, pulse: true });
    addSpot({ kind: "bay", pos: [bx, bz], face: 0, meshes: [pad] });
    // Signal console: one light per piece (not on the learning tour)
    if (isLearn()) { [[-7, -5], [7, -5]].forEach(([x, z]) => plant(x, z)); return; }
    const cx = 4.2, cz = 3.2;
    const base = add(new T.Mesh(new T.CylinderGeometry(0.7, 0.8, 1.0, 24), new T.MeshStandardMaterial({ color: "#2b2520" })));
    base.position.set(cx, 0.5, cz);
    const dish = add(new T.Mesh(new T.SphereGeometry(0.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3.2), new T.MeshStandardMaterial({ color: "#d9d6cc", side: T.DoubleSide, metalness: 0.3, roughness: 0.4 })));
    dish.position.set(cx, 1.9, cz);
    dish.rotation.x = Math.PI + 0.5;
    Models.shadowAll(base); Models.shadowAll(dish);
    G().pieces.forEach((p, i) => {
      const a = (i / k) * Math.PI * 2;
      const got = R().collected.includes(p);
      const l = add(new T.Mesh(new T.OctahedronGeometry(0.13), new T.MeshBasicMaterial({ color: got ? "#ffd34d" : "#3a3f50" })));
      l.position.set(cx + Math.cos(a) * 0.85, 1.05, cz + Math.sin(a) * 0.85);
    });
    obstacles.push({ x: cx, z: cz, r: 0.95 });
    addSpot({ kind: "console", pos: [cx - 0.2, cz - 1.6], face: Math.PI, meshes: [base, dish] });
    [[-7, -5], [7, -5]].forEach(([x, z]) => plant(x, z));
  }

  /*
   * The lobby centerpiece: the whole solar system, turning slowly above a
   * glowing pedestal. Click it to learn about the museum's wings.
   */
  const PLANETS = [
    // [name, color, size, orbit, speed]
    ["mercury", "#a7a29a", 0.07, 0.75, 1.6],
    ["venus", "#e3b56a", 0.11, 1.0, 1.2],
    ["earth", null, 0.12, 1.28, 1.0],
    ["mars", "#c4572d", 0.09, 1.55, 0.8],
    ["jupiter", "bands:#d7b48a:#b07d52", 0.26, 1.95, 0.45],
    ["saturn", "bands:#e6cf9a:#c8a868", 0.2, 2.4, 0.33],
    ["uranus", "#9fd8e0", 0.14, 2.75, 0.24],
    ["neptune", "#4f6fd9", 0.14, 3.05, 0.18],
  ];
  function bandTex(a, b) {
    return canvasTex(64, 128, (x, W, H) => {
      for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect(0, (i * H) / 16, W, H / 16 + 1); }
      x.fillStyle = "rgba(255,255,255,.15)"; x.fillRect(0, H * 0.55, W, 4);
    });
  }
  function buildOrrery(cx, cz) {
    const g = add(new T.Group());
    g.position.set(cx, 0, cz);
    const Y = 2.45;
    // pedestal with a glowing ring, and a slim pole up to the Sun
    const ped = new T.Mesh(new T.CylinderGeometry(0.75, 0.95, 0.5, 40), new T.MeshStandardMaterial({ color: "#20263a", roughness: 0.3, metalness: 0.5 }));
    ped.position.y = 0.25;
    const glowRing = new T.Mesh(new T.TorusGeometry(0.8, 0.03, 8, 48), new T.MeshBasicMaterial({ color: "#5ef2ff", toneMapped: false }));
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.48;
    const pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.06, Y - 0.5, 12), new T.MeshStandardMaterial({ color: "#b8c2d6", metalness: 0.7, roughness: 0.3 }));
    pole.position.y = 0.5 + (Y - 0.5) / 2;
    g.add(ped, glowRing, pole);
    // the Sun, with a soft glow
    const sunM = new T.Mesh(new T.SphereGeometry(0.4, 32, 24), new T.MeshBasicMaterial({ color: "#ffd05a", toneMapped: false }));
    sunM.position.y = Y;
    const halo = new T.Sprite(new T.SpriteMaterial({ map: canvasTex(128, 128, (x) => {
      const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,210,90,.9)"); gr.addColorStop(0.35, "rgba(255,170,60,.35)"); gr.addColorStop(1, "rgba(255,150,50,0)");
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    }), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    halo.scale.set(2.2, 2.2, 1);
    halo.position.y = Y;
    const light = new T.PointLight("#ffd27a", 1.2, 7, 1.5);
    light.position.y = Y;
    g.add(sunM, halo, light);
    spin.push({ o: sunM, s: 0.2 });
    // planets on their orbits
    const pick = [ped, pole, sunM];
    PLANETS.forEach(([name, col, size, orbit, speed], i) => {
      const ringLine = new T.Mesh(new T.RingGeometry(orbit - 0.006, orbit + 0.006, 96), new T.MeshBasicMaterial({ color: "#9fc4ff", transparent: true, opacity: 0.28, side: T.DoubleSide, depthWrite: false }));
      ringLine.rotation.x = -Math.PI / 2;
      ringLine.position.y = Y;
      g.add(ringLine);
      const arm = new T.Group();
      arm.position.y = Y;
      arm.rotation.y = i * 2.1;
      const mat = name === "earth"
        ? new T.MeshStandardMaterial({ map: Models.globeTex(), roughness: 0.6 })
        : col.startsWith("bands")
          ? new T.MeshStandardMaterial({ map: bandTex(col.split(":")[1], col.split(":")[2]), roughness: 0.7 })
          : new T.MeshStandardMaterial({ color: col, roughness: 0.75 });
      const p = new T.Mesh(new T.SphereGeometry(size, 28, 20), mat);
      p.position.x = orbit;
      arm.add(p);
      if (name === "saturn") {
        const ring = new T.Mesh(new T.RingGeometry(size * 1.35, size * 2.2, 48), new T.MeshBasicMaterial({ color: "#e8d4a0", transparent: true, opacity: 0.75, side: T.DoubleSide }));
        ring.position.x = orbit;
        ring.rotation.x = -Math.PI / 2 + 0.45;
        arm.add(ring);
      }
      if (name === "earth") {
        // the Moon circles the Earth
        const mArm = new T.Group();
        mArm.position.x = orbit;
        const moon = new T.Mesh(new T.SphereGeometry(0.035, 16, 12), new T.MeshStandardMaterial({ color: "#d8d4cc" }));
        moon.position.x = 0.22;
        mArm.add(moon);
        arm.add(mArm);
        spin.push({ o: mArm, s: 2.4 });
      }
      spin.push({ o: p, s: 1.2 });
      spin.push({ o: arm, s: speed * 0.35 });
      g.add(arm);
      pick.push(p);
    });
    Models.shadowAll(ped);
    obstacles.push({ x: cx, z: cz, r: 1.15 });
    addSpot({ kind: "orrery", pos: [cx, cz + 1.9], face: Math.PI, meshes: pick });
  }

  /* A glowing chat kiosk: "Ask me anything! Click here to chat" */
  function buildKiosk(x, z, ex) {
    const g = add(new T.Group());
    g.position.set(x, 0, z);
    g.rotation.y = Math.atan2(-x * 0.3, 1);
    const post = new T.Mesh(new T.CylinderGeometry(0.08, 0.12, 1.0, 16), new T.MeshStandardMaterial({ color: "#20263a", metalness: 0.5, roughness: 0.3 }));
    post.position.y = 0.5;
    const foot = new T.Mesh(new T.CylinderGeometry(0.35, 0.4, 0.06, 28), post.material);
    foot.position.y = 0.03;
    const screen = Models.board({ w: 1.0, h: 0.66, ppm: 300, bg: "#0e1428", draw: (c, W, H) => {
      c.fillStyle = "#0e1428"; c.fillRect(0, 0, W, H);
      c.strokeStyle = "#5ef2ff"; c.lineWidth = 8; c.strokeRect(6, 6, W - 12, H - 12);
      // chat bubble icon
      c.fillStyle = "#5ef2ff";
      c.beginPath(); c.roundRect ? c.roundRect(W / 2 - 46, 26, 92, 64, 14) : c.rect(W / 2 - 46, 26, 92, 64); c.fill();
      c.beginPath(); c.moveTo(W / 2 - 22, 88); c.lineTo(W / 2 - 34, 112); c.lineTo(W / 2 - 2, 88); c.fill();
      c.fillStyle = "#0e1428"; [-22, 0, 22].forEach((dx) => { c.beginPath(); c.arc(W / 2 + dx, 58, 7, 0, Math.PI * 2); c.fill(); });
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#f6f0e3";
      fitText(c, t("chat.kiosk"), W - 30, H * 0.13, 800, "Fraunces, Georgia, serif");
      c.fillText(t("chat.kiosk"), W / 2, H * 0.66);
      c.fillStyle = "#5ef2ff";
      fitText(c, t("chat.kioskSub"), W - 30, H * 0.09, 700, '"IBM Plex Mono", monospace');
      c.fillText(t("chat.kioskSub"), W / 2, H * 0.84);
    } });
    boards.push(screen);
    screen.mesh.position.set(0, 1.35, 0.02);
    screen.mesh.rotation.x = -0.35;
    g.add(post, foot, screen.mesh);
    const glow = new T.Mesh(new T.RingGeometry(0.42, 0.5, 40), new T.MeshBasicMaterial({ color: "#5ef2ff", transparent: true, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.07;
    g.add(glow);
    spin.push({ o: glow, pulse: true });
    Models.shadowAll(post);
    obstacles.push({ x, z, r: 0.5 });
    addSpot({ kind: "kiosk", ex, pos: [x, z + 1.1], face: Math.PI, meshes: [post, screen.mesh] });
  }

  function plant(x, z) {
    const pot = add(new T.Mesh(new T.CylinderGeometry(0.32, 0.26, 0.55, 16), new T.MeshStandardMaterial({ color: "#c4472d", roughness: 0.8 })));
    pot.position.set(x, 0.28, z);
    [[0, 0.95, 0, 0.45], [0.22, 1.2, 0.1, 0.34], [-0.18, 1.25, -0.1, 0.32], [0, 1.5, 0, 0.27]].forEach(([dx, y, dz, r]) => {
      const b = add(new T.Mesh(new T.IcosahedronGeometry(r, 1), new T.MeshStandardMaterial({ color: "#3f7a4a", roughness: 0.9, flatShading: true })));
      b.position.set(x + dx, y, z + dz);
      b.castShadow = true;
    });
    obstacles.push({ x, z, r: 0.45 });
  }

  let pieceMesh = null, pieceHalo = null;
  function buildExhibit(r) {
    const ex = exById(r.exhibit);
    const N = sideOf("N");
    photoFrame(N, ex);
    const g = buildCase(ex, 0, Z0 + WALL_T + 1.45, 1.2);
    // the machine's name on a stand
    const label = Models.board({ w: 1.3, h: 0.6, ppm: 380, draw: (x, W, H) => drawLabel(x, W, H, ex) });
    boards.push(label);
    label.mesh.position.set(0, 0.5, 0.605);
    g.add(label.mesh);
    pickables.push(label.mesh);
    // the signal piece it's holding
    pieceMesh = null; pieceHalo = null;
    if (r.piece && !R().collected.includes(r.id)) {
      pieceMesh = add(new T.Mesh(new T.OctahedronGeometry(0.28), new T.MeshStandardMaterial({ color: "#ffd34d", emissive: "#ffb100", emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.3 })));
      pieceMesh.position.set(0, 2.75, Z0 + WALL_T + 1.45);
      spin.push({ o: pieceMesh, s: 1.4, bob: 2.75 });
      pieceHalo = add(new T.Mesh(new T.RingGeometry(0.42, 0.5, 32), new T.MeshBasicMaterial({ color: "#ffd34d", transparent: true, opacity: 0.6, side: T.DoubleSide })));
      pieceHalo.position.copy(pieceMesh.position);
      spin.push({ o: pieceHalo, face: true, follow: pieceMesh });
    }
    buildKiosk(2.7, -3.3, ex);
    const spot = addSpot({ kind: "exhibit", ex, pos: [0, Z0 + WALL_T + 3.6], face: Math.PI, meshes: g.userData.pick.concat([label.mesh]) });
    spot.labelBoard = label;
    obstacles.push({ x: 0, z: Z0 + WALL_T + 1.45, r: 1.15 });
  }

  /*
   * The picture on the north wall: a real NASA photo of the mission when we
   * have one (js/photos.js), otherwise the drawn diorama. Sized to the photo.
   */
  const photoLoader = new T.TextureLoader();
  function photoFrame(wall, ex) {
    const ph = window.PHOTOS && PHOTOS[ex.id];
    const maxW = 3.6, maxH = 2.3;
    let w = 3.3, h = 2.2, map;
    if (ph) {
      const a = ph.w / ph.h;
      w = Math.min(maxW, maxH * a); h = w / a;
      map = photoLoader.load(ph.src);
      map.encoding = T.sRGBEncoding;
      map.anisotropy = 4;
    } else map = Models.svgTexture(Art.backdrop(ex.backdrop), 420);
    const frame = new T.Group();
    const fr = new T.Mesh(new T.BoxGeometry(w + 0.24, h + 0.24, 0.08), new T.MeshStandardMaterial({ color: "#1b2030", metalness: 0.6, roughness: 0.3 }));
    const edge = new T.Mesh(new T.BoxGeometry(w + 0.3, h + 0.3, 0.04), new T.MeshBasicMaterial({ color: ex.wing.color, toneMapped: false }));
    edge.position.z = -0.03;
    const pic = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map, toneMapped: false }));
    pic.position.z = 0.045;
    frame.add(edge, fr, pic);
    if (ph) {
      // a small credit plate under the photo
      const plate = Models.board({ w: Math.min(w, 2.6), h: 0.2, ppm: 300, bg: "#1b2030", draw: (c, W, H) => {
        c.fillStyle = "#1b2030"; c.fillRect(0, 0, W, H);
        c.fillStyle = "#cfd8e2"; c.textAlign = "center"; c.textBaseline = "middle";
        fitText(c, `${t("photo.credit")}: ${ph.credit}`, W - 16, H * 0.5, 600, '"IBM Plex Mono", monospace');
        c.fillText(`${t("photo.credit")}: ${ph.credit}`, W / 2, H / 2);
      } });
      boards.push(plate);
      plate.mesh.position.set(0, -h / 2 - 0.26, 0.05);
      frame.add(plate.mesh);
    }
    onWall(wall, frame, 0, 2.6 + (maxH - h) / 4, 0.05);
    return frame;
  }

  function buildCase(ex, x, z, h) {
    const g = add(new T.Group());
    g.position.set(x, 0, z);
    const ped = new T.Mesh(new T.BoxGeometry(1.7, 0.95, 1.2), new T.MeshStandardMaterial({ color: "#2b2520", roughness: 0.6 }));
    ped.position.y = 0.475;
    const trim = new T.Mesh(new T.BoxGeometry(1.76, 0.06, 1.26), new T.MeshStandardMaterial({ color: "#b8892f", metalness: 0.6, roughness: 0.3 }));
    trim.position.y = 0.95;
    const glass = new T.Mesh(new T.BoxGeometry(1.6, 1.35, 1.1), new T.MeshStandardMaterial({ color: "#dff2ff", transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.2, depthWrite: false }));
    glass.position.y = 1.655;
    const edges = new T.LineSegments(new T.EdgesGeometry(glass.geometry), new T.LineBasicMaterial({ color: "#f3e6c4", transparent: true, opacity: 0.7 }));
    edges.position.copy(glass.position);
    const hw = Models.svgTexture(Art.hardware(ex.art), 512);
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: hw, toneMapped: false, alphaTest: 0.05 }));
    sprite.center.set(0.5, 0);
    sprite.scale.set(h * hw.userData.aspect, h, 1);
    sprite.position.y = 1.0;
    g.add(ped, trim, glass, edges, sprite, lightPool(3.6));
    Models.shadowAll(ped);
    g.userData.pick = [ped, glass, sprite];
    return g;
  }

  function drawLabel(x, W, H, ex) {
    x.fillStyle = "#f6f0e3"; x.fillRect(0, 0, W, H);
    x.fillStyle = ex.wing.color; x.fillRect(0, 0, 10, H);
    x.fillStyle = "#4a4f5c"; x.font = `700 ${H * 0.13}px "IBM Plex Mono", monospace`; x.textBaseline = "top";
    x.fillText(`${ex.code} · ${ex.year}`, 26, H * 0.12);
    x.fillStyle = "#1f2330";
    let fs = H * 0.24;
    x.font = `800 ${fs}px Fraunces, Georgia, serif`;
    while (x.measureText(ex.name).width > W - 40 && fs > H * 0.12) { fs -= 1; x.font = `800 ${fs}px Fraunces, Georgia, serif`; }
    x.fillText(ex.name, 26, H * 0.34);
    x.fillStyle = "#4a4f5c"; x.font = `400 ${H * 0.12}px "Atkinson Hyperlegible", Arial, sans-serif`;
    x.fillText(ex.place, 26, H * 0.66);
    const v = R().visits[ex.id];
    if (v && v.story) {
      x.save();
      x.translate(W - 70, H * 0.5); x.rotate(-0.25);
      x.strokeStyle = "#c4472d"; x.lineWidth = 5; x.strokeRect(-56, -22, 112, 44);
      x.fillStyle = "#c4472d"; x.font = `700 26px "IBM Plex Mono", monospace`; x.textAlign = "center"; x.textBaseline = "middle";
      fitText(x, t("door.visited"), 100, 26, 700, '"IBM Plex Mono", monospace');
      x.fillText(t("door.visited"), 0, 2);
      x.restore();
    }
  }

  function lightPool(size) {
    const t = canvasTex(128, 128, (x) => {
      const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,230,170,.35)"); gr.addColorStop(1, "rgba(255,230,170,0)");
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    });
    const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0.015, 1.4);
    return m;
  }

  function buildHall(r) {
    const h = M.halls[r.hall];
    const g = add(new T.Group());
    g.position.set(0, 0, -0.6);
    const white = new T.MeshStandardMaterial({ color: "#f1eee6", roughness: 0.5 });
    const black = new T.MeshStandardMaterial({ color: "#26272c", roughness: 0.5 });
    if (h.deco === "rocket") {
      // a Saturn V style model
      const stack = [[0.42, 1.3, white], [0.42, 0.12, black], [0.42, 0.9, white], [0.34, 0.12, black], [0.34, 0.6, white], [0.22, 0.35, white]];
      let y = 0.35;
      const plinth = new T.Mesh(new T.CylinderGeometry(0.9, 1.0, 0.35, 24), new T.MeshStandardMaterial({ color: "#2b2520" }));
      plinth.position.y = 0.175;
      g.add(plinth);
      stack.forEach(([rad, len, m]) => {
        const c = new T.Mesh(new T.CylinderGeometry(rad, rad, len, 20), m);
        c.position.y = y + len / 2; y += len; g.add(c);
      });
      const nose = new T.Mesh(new T.ConeGeometry(0.22, 0.5, 20), white);
      nose.position.y = y + 0.25; g.add(nose);
      [0, 1, 2, 3].forEach((i) => {
        const fin = new T.Mesh(new T.BoxGeometry(0.05, 0.45, 0.32), black);
        const a = (i * Math.PI) / 2;
        fin.position.set(Math.cos(a) * 0.45, 0.6, Math.sin(a) * 0.45);
        fin.rotation.y = -a;
        g.add(fin);
      });
    } else if (h.deco === "planets") {
      // an orrery: planets circling a glowing Sun
      const pole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.6, 8), black);
      pole.position.y = 0.8; g.add(pole);
      const sunM = new T.Mesh(new T.SphereGeometry(0.42, 24, 16), new T.MeshBasicMaterial({ color: "#ffcf5a" }));
      sunM.position.y = 1.8; g.add(sunM);
      const arms = new T.Group(); arms.position.y = 1.8; g.add(arms);
      [["#9a9a9a", 0.08, 0.8], ["#e3b56a", 0.12, 1.15], ["#3f7fd9", 0.13, 1.5], ["#c4572d", 0.1, 1.85], ["#d7b48a", 0.26, 2.3]].forEach(([c, rad, d], i) => {
        const arm = new T.Group(); arm.rotation.y = i * 1.3;
        const p = new T.Mesh(new T.SphereGeometry(rad, 16, 12), new T.MeshStandardMaterial({ color: c, roughness: 0.6 }));
        p.position.x = d; arm.add(p);
        arms.add(arm);
        spin.push({ o: arm, s: 0.6 / (i + 1) });
      });
    } else if (h.deco === "moon" || h.deco === "mars") {
      const ped = new T.Mesh(new T.CylinderGeometry(0.8, 1.0, 0.8, 28), new T.MeshStandardMaterial({ color: "#2b2520" }));
      ped.position.y = 0.4; g.add(ped);
      const ball = new T.Mesh(new T.IcosahedronGeometry(1.0, 3), new T.MeshStandardMaterial({ color: h.deco === "moon" ? "#bdb8ae" : "#c0643c", roughness: 0.95, flatShading: true }));
      ball.position.y = 1.85; g.add(ball);
      spin.push({ o: ball, s: 0.2 });
      if (h.deco === "moon") {
        // bootprints on the floor
        for (let i = 0; i < 6; i++) {
          const fp = add(new T.Mesh(new T.CircleGeometry(0.16, 12), new T.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.2 })));
          fp.scale.set(0.7, 1.4, 1);
          fp.rotation.x = -Math.PI / 2;
          fp.position.set(-3 + i * 1.2, 0.013, 3.2 + (i % 2) * 0.35);
        }
      } else {
        [[-3.5, 3], [3.2, 2.6], [-2.4, -3.6]].forEach(([x, z], i) => {
          const rock = add(new T.Mesh(new T.DodecahedronGeometry(0.35 + i * 0.1, 0), new T.MeshStandardMaterial({ color: "#8a4127", roughness: 1, flatShading: true })));
          rock.position.set(x, 0.25, z); rock.castShadow = true;
          obstacles.push({ x, z, r: 0.5 });
        });
      }
    } else {
      // a radio dish, like the Deep Space Network
      const mount = new T.Mesh(new T.CylinderGeometry(0.3, 0.5, 1.4, 16), new T.MeshStandardMaterial({ color: "#8a8d93" }));
      mount.position.y = 0.7; g.add(mount);
      const head = new T.Group(); head.position.y = 1.6; g.add(head);
      const dsh = new T.Mesh(new T.SphereGeometry(1.4, 28, 12, 0, Math.PI * 2, 0, Math.PI / 3.4), new T.MeshStandardMaterial({ color: "#e6e3da", side: T.DoubleSide, roughness: 0.4 }));
      dsh.rotation.x = Math.PI + 0.7; head.add(dsh);
      const feed = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.1, 6), black);
      feed.position.set(0, 0.35, 0.35); feed.rotation.x = 0.7; head.add(feed);
      spin.push({ o: head, s: 0.25 });
    }
    Models.shadowAll(g);
    obstacles.push({ x: 0, z: -0.6, r: h.deco === "planets" ? 1.2 : 1.1 });
    const pick = [];
    g.traverse((o) => { if (o.isMesh) pick.push(o); });
    addSpot({ kind: "fact", hall: h, pos: [0, 1.6], face: Math.PI, meshes: pick });
  }

  function buildHidden(r) {
    const g = add(new T.Group());
    g.add(lightPool(5));
    if (r.find === "treasure") {
      const t = exById(r.treasure);
      photoFrame(sideOf("N"), t);
      const c = buildCase(t, 0, -1.6, 0.9);
      addSpot({ kind: "exhibit", ex: t, pos: [0, 0.6], face: Math.PI, meshes: c.userData.pick });
      obstacles.push({ x: 0, z: -1.6, r: 1.15 });
    } else {
      // a lectern with an old note from an earlier explorer
      const stand = add(new T.Mesh(new T.BoxGeometry(0.9, 1.05, 0.6), new T.MeshStandardMaterial({ color: "#5a3a26", roughness: 0.7 })));
      stand.position.set(0, 0.52, -1.4);
      const top = add(new T.Mesh(new T.BoxGeometry(1.1, 0.06, 0.8), new T.MeshStandardMaterial({ color: "#6b4a32" })));
      top.position.set(0, 1.08, -1.4); top.rotation.x = -0.3;
      const paper = add(new T.Mesh(new T.PlaneGeometry(0.6, 0.45), new T.MeshStandardMaterial({ color: "#f4ecd6", roughness: 0.9 })));
      paper.position.set(0, 1.13, -1.38);
      paper.rotation.x = -Math.PI / 2 - 0.3;
      Models.shadowAll(stand);
      obstacles.push({ x: 0, z: -1.4, r: 0.8 });
      addSpot({ kind: "note", pos: [0, 0.2], face: Math.PI, meshes: [stand, top, paper] });
    }
  }

  function buildMissionControl() {
    const N = sideOf("N");
    const k = G().pieces.length, have = R().collected.length;
    addBoard(N, { w: 6.2, h: 2.6, bg: "#0e1428", draw: (x, W, H, u) => {
      x.fillStyle = "#0e1428"; x.fillRect(0, 0, W, H);
      x.fillStyle = "#5ef2ff"; x.font = `700 ${3.4 * u}px "IBM Plex Mono", monospace`; x.textBaseline = "top";
      fitText(x, t("mc.board"), W - 12 * u, 3.4 * u, 700, '"IBM Plex Mono", monospace');
      x.fillText(t("mc.board"), 6 * u, 6 * u);
      x.fillStyle = "#f6f0e3";
      const big = isLearn() ? t("mc.learn") : have === k ? t("mc.ready") : t("mc.count", { n: have, k });
      fitText(x, big, W - 12 * u, 8 * u, 800, "Fraunces, Georgia, serif");
      x.fillText(big, 6 * u, 14 * u);
      for (let i = 0; i < k; i++) {
        const cx = 10 * u + i * 13 * u, cy = H - 12 * u;
        x.fillStyle = i < have ? "#ffd34d" : "#2a3350";
        x.beginPath(); x.moveTo(cx, cy - 5 * u); x.lineTo(cx + 4 * u, cy); x.lineTo(cx, cy + 5 * u); x.lineTo(cx - 4 * u, cy); x.closePath(); x.fill();
      }
    } }, 0, 2.4);
    // consoles
    [[-4.5, -3.6, 0.5], [4.5, -3.6, -0.5]].forEach(([x, z, ry]) => {
      const desk = add(new T.Mesh(new T.BoxGeometry(2.4, 0.9, 0.9), new T.MeshStandardMaterial({ color: "#2b3350", roughness: 0.5 })));
      desk.position.set(x, 0.45, z); desk.rotation.y = ry;
      const scr = add(new T.Mesh(new T.PlaneGeometry(2.0, 0.6), new T.MeshBasicMaterial({ color: "#3fd6ff" })));
      scr.position.set(x, 0.92, z + 0.05); scr.rotation.set(-Math.PI / 2 + 0.4, ry, 0, "YXZ");
      Models.shadowAll(desk);
      obstacles.push({ x, z, r: 1.2 });
    });
    const launch = add(new T.Mesh(new T.CylinderGeometry(0.5, 0.6, 1.0, 24), new T.MeshStandardMaterial({ color: "#2b3350" })));
    launch.position.set(0, 0.5, -1.2);
    const btn = add(new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.12, 24), new T.MeshBasicMaterial({ color: "#e0533b" })));
    btn.position.set(0, 1.06, -1.2);
    spin.push({ o: btn, pulseScale: true });
    Models.shadowAll(launch);
    obstacles.push({ x: 0, z: -1.2, r: 0.8 });
    addSpot({ kind: "launch", pos: [0, 0.4], face: Math.PI, meshes: [launch, btn] });
  }

  /* ---------------- interactables ---------------- */
  function addSpot(o) {
    const ring = add(new T.Mesh(new T.RingGeometry(0.5, 0.62, 40), new T.MeshBasicMaterial({ color: "#e8b53a", transparent: true, opacity: 0, depthWrite: false })));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(o.pos[0], 0.03, o.pos[1]);
    o.ring = ring;
    spots.push(o);
    (o.meshes || []).forEach((m) => { m.userData.spot = o; pickables.push(m); });
    return o;
  }

  /* scanner arrow: Easy shows it all the time, Medium on request */
  let hintArrow = null, hintUntil = 0;
  function updateHint() {
    if (hintArrow) { roomGroup.remove(hintArrow); hintArrow = null; }
    if (!R() || R().done) return;
    const always = LV().scanner === "always";
    if (!always && performance.now() > hintUntil) return;
    const h = Maze.hint(G(), R().cur, { collected: R().collected });
    if (!h || h.here) return;
    const d = doorObjs.find((o) => o.door.i === h.door);
    if (!d) return;
    hintArrow = new T.Group();
    const ring = new T.Mesh(new T.RingGeometry(0.75, 0.95, 40), new T.MeshBasicMaterial({ color: "#5ef2ff", transparent: true, opacity: 0.9, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    const arrow = new T.Mesh(new T.ConeGeometry(0.28, 0.6, 4), new T.MeshBasicMaterial({ color: "#5ef2ff" }));
    arrow.rotation.x = Math.PI;
    arrow.position.y = 2.2;
    hintArrow.add(ring, arrow);
    hintArrow.position.set(d.spot.pos[0], 0.04, d.spot.pos[1]);
    roomGroup.add(hintArrow);
    hintArrow.userData.door = d;
  }

  /* =========================================================
   * WALKING
   * ========================================================= */
  const INSET = WALL_T + R_PLAYER;
  function walkable(x, z) {
    if (!(x > X0 + INSET && x < X1 - INSET && z > Z0 + INSET && z < Z1 - INSET)) return false;
    return !obstacles.some((o) => (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + R_PLAYER * 0.6) ** 2);
  }
  function settle(p) {
    for (const o of obstacles) {
      const dx = p[0] - o.x, dz = p[1] - o.z, d = Math.hypot(dx, dz);
      if (d < o.r + 0.4) { const k = (o.r + 0.5) / (d || 1); p = [o.x + dx * k, o.z + dz * k]; }
    }
    return [Math.max(X0 + INSET + 0.05, Math.min(X1 - INSET - 0.05, p[0])), Math.max(Z0 + INSET + 0.05, Math.min(Z1 - INSET - 0.05, p[1]))];
  }
  function segHits(a, b, o) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((o.x - a[0]) * dx + (o.z - a[1]) * dz) / L2));
    const px = a[0] + dx * t - o.x, pz = a[1] + dz * t - o.z;
    return px * px + pz * pz < (o.r + 0.45) ** 2 && Math.hypot(b[0] - o.x, b[1] - o.z) > o.r + 0.1;
  }
  function planPath(from, to) {
    const out = [];
    let prev = from;
    for (let guard = 0; guard < 4; guard++) {
      const hit = obstacles.find((o) => segHits(prev, to, o));
      if (!hit) break;
      const dx = to[0] - prev[0], dz = to[1] - prev[1], L = Math.hypot(dx, dz) || 1;
      let nx = -dz / L, nz = dx / L;
      const t = Math.max(0, Math.min(1, ((hit.x - prev[0]) * dx + (hit.z - prev[1]) * dz) / (L * L)));
      if ((prev[0] + dx * t - hit.x) * nx + (prev[1] + dz * t - hit.z) * nz < 0) { nx = -nx; nz = -nz; }
      let w = [hit.x + nx * (hit.r + 0.95), hit.z + nz * (hit.r + 0.95)];
      if (!walkable(w[0], w[1])) w = [hit.x - nx * (hit.r + 0.95), hit.z - nz * (hit.r + 0.95)];
      out.push(w);
      prev = w;
    }
    out.push(to);
    return out;
  }

  const P = { x: 0, z: 3.6, heading: Math.PI, speed: 0, path: [], onArrive: null, faceTo: null, stuck: 0 };
  const Rb = { x: 0.9, z: 4.4, heading: Math.PI, moving: false };
  const crumbs = [];
  let transit = null;

  function walkTo(pt, onArrive, faceTo) {
    if (transit) return;
    P.path = planPath([P.x, P.z], settle(pt));
    P.onArrive = onArrive || null;
    P.faceTo = faceTo == null ? null : faceTo;
    P.stuck = 0;
    hideIdleHint();
  }
  function goToSpot(s) { walkTo(s.pos, () => activate(s), s.face); }

  /* =========================================================
   * CAMERA + CUTAWAY WALLS
   * ========================================================= */
  const cam = { yaw: 0, pitch: 0.95, dist: 13, tx: 0, tz: 1 };
  const want = { yaw: 0, pitch: 0.95, dist: 13 };
  function updateCamera(dt) {
    const k = Math.min(1, dt * 5);
    let dy = want.yaw - cam.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    cam.yaw += dy * k;
    cam.pitch += (want.pitch - cam.pitch) * k;
    cam.dist += (want.dist - cam.dist) * k;
    // aim between you and the middle of the room, so the whole room stays in view
    cam.tx += (P.x * 0.55 - cam.tx) * k;
    cam.tz += (P.z * 0.55 + 0.6 - cam.tz) * k;
    const cp = Math.cos(cam.pitch);
    camera.position.set(cam.tx + Math.sin(cam.yaw) * cp * cam.dist, 0.9 + Math.sin(cam.pitch) * cam.dist, cam.tz + Math.cos(cam.yaw) * cp * cam.dist);
    camera.lookAt(cam.tx, 0.9, cam.tz);
  }
  const tmpDir = V(0, 0, 0);
  function updateWalls(dt) {
    const f = V(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
    sides.forEach((s) => (s.blocking = false));
    tmpDir.set(P.x, 1.2, P.z).sub(camera.position);
    const dist = tmpDir.length();
    ray.set(camera.position, tmpDir.normalize());
    ray.far = dist;
    ray.intersectObjects(wallMeshes, false).forEach((h) => (h.object.userData.side.blocking = true));
    ray.far = Infinity;
    sides.forEach((s) => {
      const target = s.n.dot(f) > 0.35 || s.blocking ? CUT_H : WALL_H;
      s.h += (target - s.h) * Math.min(1, dt * 7);
      s.group.scale.y = s.h / WALL_H;
      s.decor.visible = s.h > WALL_H * 0.9;
    });
  }
  $("#rotL").addEventListener("click", (e) => { e.stopPropagation(); want.yaw -= Math.PI / 4; });
  $("#rotR").addEventListener("click", (e) => { e.stopPropagation(); want.yaw += Math.PI / 4; });

  /* =========================================================
   * MAIN LOOP
   * ========================================================= */
  let last = performance.now(), clock = 0;
  const held = new Set();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    if (!document.querySelector("dialog[open]:not(.docked)")) step(dt);
    updateCamera(dt);
    updateWalls(dt);
    spin.forEach((s) => {
      if (s.twinkle) { if (!S.a11y.motion) s.o.userData.twinkle(clock); }
      else if (s.pulse) s.o.material.opacity = 0.6 + Math.sin(clock * 3) * 0.4;
      else if (s.flicker) s.o.material.opacity = 0.55 + Math.sin(clock * 5) * 0.25 + Math.sin(clock * 13) * 0.15;
      else if (s.pulseScale) s.o.scale.setScalar(1 + Math.sin(clock * 4) * 0.08);
      else if (s.shimmer) s.o.material.opacity = S.a11y.motion ? 0.95 : 0.85 + Math.sin(clock * 3 + s.o.position.x) * 0.15;
      else if (s.face) { s.o.position.copy(s.follow.position); s.o.lookAt(camera.position); }
      else { s.o.rotation.y += s.s * dt; if (s.bob) s.o.position.y = s.bob + Math.sin(clock * 2) * 0.12; }
    });
    if (hintArrow) {
      hintArrow.children[1].position.y = 2.2 + Math.sin(clock * 4) * 0.2;
      if (LV().scanner !== "always" && performance.now() > hintUntil) updateHint();
    }
    spots.forEach((s) => (s.ring.material.opacity += ((s === nearSpot ? 0.95 : 0) - s.ring.material.opacity) * Math.min(1, dt * 8)));
    renderer.render(scene, camera);
    placeSay();
    requestAnimationFrame(tick);
  }

  function step(dt) {
    if (transit) return stepTransit(dt);
    let kx = 0, kz = 0;
    if (held.has("ArrowUp") || held.has("w")) kz -= 1;
    if (held.has("ArrowDown") || held.has("s")) kz += 1;
    if (held.has("ArrowLeft") || held.has("a")) kx -= 1;
    if (held.has("ArrowRight") || held.has("d")) kx += 1;
    let vx = 0, vz = 0, speed = 0;
    if (kx || kz) {
      P.path = []; P.onArrive = null; P.faceTo = null;
      const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
      vx = fx * -kz + rx * kx; vz = fz * -kz + rz * kx;
      const L = Math.hypot(vx, vz); vx /= L; vz /= L;
      speed = 4.4;
    } else if (P.path.length) {
      const [tx, tz] = P.path[0];
      const dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz);
      if (d < 0.15) { P.path.shift(); if (!P.path.length) arrive(); }
      else { vx = dx / d; vz = dz / d; speed = Math.min(4.4, d / dt); }
    }
    if (speed > 0) {
      const nx = P.x + vx * speed * dt, nz = P.z + vz * speed * dt, ox = P.x, oz = P.z;
      if (walkable(nx, nz)) { P.x = nx; P.z = nz; }
      else if (walkable(nx, P.z)) P.x = nx;
      else if (walkable(P.x, nz)) P.z = nz;
      const moved = Math.hypot(P.x - ox, P.z - oz);
      if (P.path.length && moved < speed * dt * 0.2) {
        if ((P.stuck += dt) > 0.4) { P.path.shift(); P.stuck = 0; if (!P.path.length) arrive(); }
      } else P.stuck = 0;
      if (moved > 0.001) P.heading = turnToward(P.heading, Math.atan2(vx, vz), dt * 12);
      P.speed = moved / dt;
    } else {
      P.speed = 0;
      if (P.faceTo != null) P.heading = turnToward(P.heading, P.faceTo, dt * 8);
    }
    placeActors(dt);
    let near = null, best = 1.5;
    for (const s of spots) {
      const d = Math.hypot(s.pos[0] - P.x, s.pos[1] - P.z);
      if (d < best) { best = d; near = s; }
    }
    if (near !== nearSpot) setNear(near);
  }

  function placeActors(dt) {
    kid.position.set(P.x, 0, P.z);
    kid.rotation.y = P.heading;
    Models.animateKid(kid, clock, P.speed, S.a11y.motion ? 1 : HOP[PLACE()] || 1);
    const lastC = crumbs[crumbs.length - 1];
    if (!lastC || Math.hypot(lastC[0] - P.x, lastC[1] - P.z) > 0.25) { crumbs.push([P.x, P.z]); if (crumbs.length > 60) crumbs.shift(); }
    let goal = null, acc = 0;
    for (let i = crumbs.length - 1; i > 0; i--) {
      acc += Math.hypot(crumbs[i][0] - crumbs[i - 1][0], crumbs[i][1] - crumbs[i - 1][1]);
      if (acc > 1.4) { goal = crumbs[i - 1]; break; }
    }
    if (!goal) goal = [P.x - Math.sin(P.heading) * 1.1 + Math.cos(P.heading) * 0.6, P.z - Math.cos(P.heading) * 1.1 - Math.sin(P.heading) * 0.6];
    const rdx = goal[0] - Rb.x, rdz = goal[1] - Rb.z, rd = Math.hypot(rdx, rdz);
    Rb.moving = rd > 0.08;
    if (Rb.moving) {
      const sp = Math.min(rd * 4, 10) * dt;
      Rb.x += (rdx / rd) * sp; Rb.z += (rdz / rd) * sp;
      Rb.heading = turnToward(Rb.heading, Math.atan2(rdx, rdz), dt * 8);
    } else Rb.heading = turnToward(Rb.heading, Math.atan2(P.x - Rb.x, P.z - Rb.z), dt * 4);
    robot.position.x = Rb.x; robot.position.z = Rb.z;
    robot.rotation.y = Rb.heading;
    Models.animateRobot(robot, clock, Rb.moving);
  }

  function arrive() {
    const cb = P.onArrive;
    P.onArrive = null;
    if (cb) cb();
  }
  function turnToward(a, b, k) {
    let d = b - a;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    return a + d * Math.min(1, k);
  }

  /* =========================================================
   * GOING THROUGH A DOOR
   * ========================================================= */
  function useDoor(d) {
    if (d.sealed && !allCollected()) {
      R().sawMC = true; save();
      const left = G().pieces.length - R().collected.length;
      return say(t("echo.sealed", { k: G().pieces.length, left }), 7000);
    }
    if (d.lock && !R().solved[d.lock.id]) return openRiddle(d);
    const obj = doorObjs.find((o) => o.door === d);
    const [ix, iz] = wallPoint(obj.side, obj.slot.along, -0.6);
    transit = { t: 0, obj, from: [P.x, P.z], to: [ix, iz], switched: false };
    $("#fadeSym").textContent = SYM[d.sym].ch;
    $("#fadeSym").style.color = SYM[d.sym].color;
    // stepping through: a burst of the door's light, not a black screen
    $("#fade").style.background = `radial-gradient(circle at 50% 50%, #ffffff 0%, ${SYM[d.sym].color} 45%, #0b1020 100%)`;
    $("#prompt").hidden = true;
  }
  function stepTransit(dt) {
    const tr = transit;
    tr.t += dt;
    if (tr.switched) {
      // already in the new room: just let the fade clear
      P.speed = 0;
      placeActors(dt);
      if (tr.t > 1.0) { transit = null; $("#fade").classList.remove("on"); }
      return;
    }
    tr.obj.panel.position.y = 1.55 + Math.min(1, tr.t / 0.45) * 3.0;
    const k = Math.min(1, Math.max(0, (tr.t - 0.2) / 0.5));
    P.x = tr.from[0] + (tr.to[0] - tr.from[0]) * k;
    P.z = tr.from[1] + (tr.to[1] - tr.from[1]) * k;
    P.heading = turnToward(P.heading, Math.atan2(tr.to[0] - tr.from[0], tr.to[1] - tr.from[1]), dt * 12);
    P.speed = k < 1 ? 4 : 0;
    placeActors(dt);
    if (tr.t > 0.45 && !tr.faded) { tr.faded = true; $("#fade").classList.add("on"); }
    if (tr.t > 0.85) {
      tr.switched = true;
      travel(tr.obj.door);
    }
  }

  function travel(d) {
    const run = R();
    const from = run.cur;
    run.route.push({ from, door: d.i });
    run.known[`${from}:${d.i}`] = true;
    trackNote(from, d.i);
    run.cur = d.to;
    const first = !run.visited.includes(d.to);
    if (first) run.visited.push(d.to);
    // the door back (if there is one) is now known too, and secret doors are found from the inside
    const back = room(d.to).doors.find((b) => b.to === from);
    if (back) {
      run.known[`${d.to}:${back.i}`] = true;
      if (back.hidden) run.revealed[`${d.to}:${back.i}`] = true;
    }
    save();
    buildRoom(d.to);
    if (back) {
      const o = doorObjs.find((x) => x.door === back);
      P.x = o.spot.pos[0]; P.z = o.spot.pos[1];
      P.heading = o.rot;
    } else {
      P.x = 0; P.z = 3.6; P.heading = Math.PI;
      hatch();
    }
    P.path = []; P.onArrive = null; P.faceTo = null;
    Rb.x = P.x + Math.sin(P.heading + 2.4) * 1.1; Rb.z = P.z + Math.cos(P.heading + 2.4) * 1.1;
    crumbs.length = 0;
    cam.tx = P.x * 0.55; cam.tz = P.z * 0.55 + 0.6;
    updateHUD();
    setTimeout(() => arrived(d.to, first, !back), 350);
  }
  function hatch() {
    const tex = canvasTex(128, 128, (x) => {
      x.fillStyle = "#2b3350"; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#f2c230"; x.lineWidth = 8; x.stroke();
      x.fillStyle = "#f2c230"; fitText(x, t("door.airlock"), 100, 20, 700, "'IBM Plex Mono', monospace"); x.textAlign = "center"; x.fillText(t("door.airlock"), 64, 70);
    });
    const m = add(new T.Mesh(new T.CircleGeometry(0.8, 32), new T.MeshBasicMaterial({ map: tex })));
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0.014, 4.4);
  }

  let noteChecked = false;
  function arrived(id, first, oneWay) {
    const r = room(id);
    showBanner(id);
    if (r.type === "mc") return setTimeout(() => openFinale(), 900);
    let line = "";
    if (noteChecked) {
      noteChecked = false;
      return say(t("echo.noteOk"), 9000);
    }
    if (oneWay) line = t("echo.oneWay") + " ";
    if (first) {
      if (r.type === "exhibit" && r.piece) line += t("echo.piece");
      else if (r.type === "exhibit") line += t(isLearn() ? "echo.learnExhibit" : "echo.noPiece");
      else if (r.type === "hall") line += esc(t(`hall.${r.hall}.fact`));
      else if (r.type === "hidden") line += r.find === "note" ? t("echo.secretNote") : t("echo.secretTreasure");
      else if (r.type === "atrium") line += t("echo.atrium");
    } else if (r.type === "exhibit" && r.piece && !R().collected.includes(id)) line += t("echo.stillPiece");
    if (!line && LV().scanner === "always" && !isLearn()) {
      const h = Maze.hint(G(), id, { collected: R().collected });
      if (h && !h.here) line = t("echo.scannerLikes", { sym: `<b style="color:${SYM[room(id).doors[h.door].sym].color}">${SYM[room(id).doors[h.door].sym].ch}</b>` });
    }
    if (line) say(line, 7000);
  }

  /* ---------------- explorer's note: checking a route by following it ---------------- */
  function trackNote(from, door) {
    const n = R().note;
    if (!n || n.done) return;
    const stepN = n.steps[n.prog];
    if (stepN && stepN.room === from && stepN.door === door) n.prog++;
    else n.prog = n.steps[0].room === from && n.steps[0].door === door ? 1 : 0;
    if (n.prog === n.steps.length) {
      n.done = true;
      award(2, "note");
      noteChecked = true;
    }
    drawNote();
  }
  function drawNote() {
    const n = R() && R().note;
    const p = $("#notePanel");
    if (!n) { p.hidden = true; return; }
    p.hidden = false;
    p.innerHTML = `<p class="np-kick">${esc(t("note.kick"))}${n.done ? " · " + esc(t("note.checked")) : ""}</p>
      <p class="np-from">${esc(t("note.from"))}</p>
      <ol class="np-steps">${n.steps.map((s, i) => `<li class="${i < n.prog ? "ok" : ""}" style="--c:${SYM[s.sym].color}"><span>${SYM[s.sym].ch}</span></li>`).join("")}</ol>
      <p class="np-end">${esc(n.done ? t("note.done") : t("note.q"))}</p>`;
  }

  /* =========================================================
   * OVERLAYS + PROMPTS
   * ========================================================= */
  const proj = V(0, 0, 0);
  function toScreen(x, y, z) {
    proj.set(x, y, z).project(camera);
    const st = $("#stage");
    return { x: (proj.x * 0.5 + 0.5) * st.clientWidth, y: (-proj.y * 0.5 + 0.5) * st.clientHeight };
  }
  function placeSay() {
    const say = $("#say"), W = $("#stage").clientWidth;
    const rh = toScreen(Rb.x, 1.15, Rb.z), kh = toScreen(P.x, 2.0, P.z);
    const bw = say.offsetWidth || 290;
    const left = Math.max(8, Math.min(W - bw - 8, rh.x - 44));
    say.style.left = left + "px";
    say.style.top = Math.max(say.offsetHeight + 8, Math.min(rh.y, kh.y) - 14) + "px";
    say.style.setProperty("--tail", Math.max(14, Math.min(bw - 30, rh.x - left - 8)) + "px");
  }

  let bannerTimer;
  function showBanner(id) {
    const r = room(id);
    $("#rbKind").textContent = theme(r).kind;
    $("#rbName").textContent = roomName(id);
    $("#roomBanner").classList.add("show");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => $("#roomBanner").classList.remove("show"), 3500);
  }

  let nearSpot = null;
  function setNear(s) {
    nearSpot = s;
    const pr = $("#prompt");
    if (!s || transit) { pr.hidden = true; return; }
    let txt;
    if (s.kind === "door") {
      const d = s.door, sym = SYM[d.sym];
      const st = doorState(R().cur, d);
      txt = st === "sealed" ? t("pr.mcSealed") : st === "locked" ? t("pr.riddle") : d.next || d.back ? `${t(d.next ? "door.next" : "door.back")}: ${roomName(d.to)}` : t("pr.open");
      txt = `<span style="color:${sym.color};filter:brightness(1.4)">${sym.ch}</span> ${esc(txt)}`;
    } else {
      const k = { secret: "pr.secret", bay: "pr.bay", console: "pr.console", fact: "pr.fact", note: "pr.note", launch: "pr.launch", orrery: "pr.orrery" }[s.kind];
      if (s.kind === "kiosk") txt = esc(s.ex ? t("pr.kiosk", { name: s.ex.name }) : t("pr.help", { robot: S.robotName }));
      else txt = esc(k ? (s.kind === "launch" && isLearn() ? t("fin.learnTitle") : t(k)) : t("pr.look", { name: s.ex.name }));
    }
    pr.innerHTML = `${txt}<kbd>Enter</kbd>`;
    pr.hidden = false;
  }
  function activate(s) {
    if (!s || transit) return;
    if (s.kind === "door") useDoor(s.door);
    else if (s.kind === "secret") revealSecret(s.door);
    else if (s.kind === "bay") openWorkshop();
    else if (s.kind === "kiosk") openChat(s.ex);
    else if (s.kind === "orrery") openRules("wings");
    else if (s.kind === "console") say(`${t("echo.console", { n: R().collected.length, k: G().pieces.length })} ${t(allCollected() ? "echo.consoleAll" : "echo.consoleMore")}`);
    else if (s.kind === "fact") say(esc(t(`hall.${M.halls.indexOf(s.hall)}.fact`)), 8000);
    else if (s.kind === "note") readNote();
    else if (s.kind === "launch") openFinale();
    else openExhibit(s.ex);
  }
  $("#prompt").addEventListener("click", (e) => { e.stopPropagation(); activate(nearSpot); });

  function revealSecret(d) {
    R().revealed[`${R().cur}:${d.i}`] = true;
    save();
    const px = P.x, pz = P.z;
    buildRoom(R().cur);
    P.x = px; P.z = pz;
    award(1, "secret");
    say(t("echo.secretDoor"));
  }

  function readNote() {
    const r = room(R().cur);
    if (!R().note) {
      R().note = { steps: r.note.steps, prog: 0, done: false, from: r.id };
      save();
    }
    drawNote();
    say(t("echo.note", { steps: r.note.steps.map((s) => `<span style="color:${SYM[s.sym].color}">${SYM[s.sym].ch}</span>`).join(esc(t("echo.then"))) }), 9000);
  }

  /* ---------------- pointer + keyboard ---------------- */
  let drag = null;
  function bindPointer() {
    const c = $("#scene");
    c.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId }; c.setPointerCapture(e.pointerId); });
    c.addEventListener("pointermove", (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 7) return;
      drag.moved = true;
      want.yaw -= dx * 0.008;
      want.pitch = Math.max(0.45, Math.min(1.35, want.pitch + dy * 0.005));
      drag.x = e.clientX; drag.y = e.clientY;
    });
    c.addEventListener("pointerup", (e) => { if (!drag) return; const was = drag.moved; drag = null; if (!was) clickAt(e.clientX, e.clientY); });
    c.addEventListener("pointercancel", () => (drag = null));
    c.addEventListener("wheel", (e) => { e.preventDefault(); userZoomed = true; want.dist = Math.max(6, Math.min(22, want.dist * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
  }
  function clickAt(cx, cy) {
    if (transit) return;
    const rect = $("#scene").getBoundingClientRect();
    ray.setFromCamera(new T.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1), camera);
    for (const h of ray.intersectObjects(pickables, false)) {
      let o = h.object, vis = true;
      while (o) { if (!o.visible) vis = false; o = o.parent; }
      if (!vis) continue;
      if (h.object.userData.spot) return goToSpot(h.object.userData.spot);
      if (h.object.userData.floor) return walkTo([h.point.x, h.point.z]);
    }
  }
  const MOVE_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"];
  addEventListener("keydown", (e) => {
    if (document.querySelector("dialog[open]:not(.docked)") || $("#museum").hidden) return;
    // never steal keys from text boxes, menus, or anything inside the docked chat
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable], dialog.docked")) return;
    // a focused button handles its own Enter/Space
    if ((e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest("button, a")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (MOVE_KEYS.includes(k)) { held.add(k); e.preventDefault(); hideIdleHint(); }
    if (k === "q") want.yaw -= Math.PI / 4;
    if (k === "e") want.yaw += Math.PI / 4;
    if ((k === "Enter" || k === " ") && nearSpot) { e.preventDefault(); activate(nearSpot); }
    if (k === "n" || k === "p") { e.preventDefault(); cycleSpot(k === "n" ? 1 : -1); }
  });
  addEventListener("keyup", (e) => held.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  addEventListener("blur", () => held.clear());

  let idleHintTimer;
  function hideIdleHint() {
    $("#hint").classList.add("faded");
    clearTimeout(idleHintTimer);
    idleHintTimer = setTimeout(() => $("#hint").classList.remove("faded"), 25000);
  }

  let sayTimer;
  function say(html, ms = 5500) {
    const b = $("#say");
    b.innerHTML = `<span class="who">${esc(S.robotName)}</span>${html}`;
    if (S.a11y.speak) speak(html);
    if (S.a11y.text !== "n" || S.a11y.speak) ms = Math.round(ms * 1.6); // more time to read or listen
    b.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => b.classList.remove("show"), ms);
  }

  /* read text aloud in the player's language, when the device has a voice for it */
  function speak(html) {
    if (!("speechSynthesis" in window)) return;
    const text = String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith(I18N.lang));
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : I18N.lang;
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }

  /* ---------------- settings and accessibility ---------------- */
  function applyA11y() {
    const h = document.documentElement, a = S.a11y;
    h.classList.toggle("a11y-text-l", a.text === "l");
    h.classList.toggle("a11y-text-xl", a.text === "xl");
    h.classList.toggle("a11y-contrast", a.contrast);
    h.classList.toggle("a11y-calm", a.motion);
    h.classList.toggle("a11y-font", a.font);
    $("#a11yText").querySelectorAll("[data-size]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.size === a.text)));
    $("#a11yContrast").checked = a.contrast;
    $("#a11yMotion").checked = a.motion;
    $("#a11yFont").checked = a.font;
    $("#a11ySpeak").checked = a.speak;
    if (!a.speak && "speechSynthesis" in window) speechSynthesis.cancel();
  }
  document.querySelectorAll(".a11y-open").forEach((b) => b.addEventListener("click", () => { applyA11y(); $("#a11yDialog").showModal(); }));
  $("#a11yText").addEventListener("click", (e) => {
    const b = e.target.closest("[data-size]");
    if (!b) return;
    S.a11y.text = b.dataset.size; save(); applyA11y();
  });
  [["#a11yContrast", "contrast"], ["#a11yMotion", "motion"], ["#a11yFont", "font"], ["#a11ySpeak", "speak"]].forEach(([sel, key]) =>
    $(sel).addEventListener("change", (e) => {
      S.a11y[key] = e.target.checked; save(); applyA11y();
      if (key === "speak" && e.target.checked) speak(t("a11y.speak"));
    }));

  /* keyboard: N / P walk to the next or previous door, machine, or kiosk in the room */
  let spotCursor = -1;
  function cycleSpot(dir) {
    if (!spots.length || transit) return;
    const list = spots.filter((x) => x.kind !== "secret");
    spotCursor = (spotCursor + dir + list.length) % list.length;
    const sp = list[spotCursor];
    walkTo(sp.pos, null, sp.face); // walk there and wait: Enter opens or looks closer
    let name;
    if (sp.kind === "door") name = sp.door.sealed ? t("room.mc") : `${SYM[sp.door.sym].ch} ${R().known[`${R().cur}:${sp.door.i}`] || LV().learn ? roomName(sp.door.to) : "?"}`;
    else name = sp.ex ? sp.ex.name : sp.hall ? t(`hall.${M.halls.indexOf(sp.hall)}.name`) : t({ bay: "hud.bay", console: "pr.console", launch: "pr.launch", note: "pr.note", orrery: "pr.orrery", kiosk: "chat.kiosk" }[sp.kind] || "pr.look");
    toast(t("a11y.target", { name }));
  }

  const disposeModel = (m) => m && m.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !o.material.map) o.material.dispose(); });
  function drawActors() {
    if (kid) { scene.remove(kid); disposeModel(kid); }
    if (robot) { scene.remove(robot); disposeModel(robot); }
    // off Earth, everyone suits up before going inside
    kid = Models.kid({ ...S.kid, suit: PLACE() !== "earth" });
    kid.scale.setScalar(1.15);
    robot = Models.robot(S.look);
    robot.scale.setScalar(0.85);
    scene.add(kid, robot);
  }

  /* ---------------- scanner (Medium) ---------------- */
  $("#scanBtn").addEventListener("click", () => {
    const run = R();
    if (run.scans === 0) return say(t("echo.noBattery"));
    run.scans--;
    save();
    updateHUD();
    hintUntil = performance.now() + 15000;
    const r = room(run.cur);
    const secret = r.doors.find((d) => d.hidden && !run.revealed[`${run.cur}:${d.i}`]);
    if (secret) {
      revealSecret(secret);
      return;
    }
    updateHint();
    const h = Maze.hint(G(), run.cur, { collected: run.collected });
    if (h && h.here) say(t("echo.pieceHere"));
    else if (h) say(t("echo.scanning", { sym: `<b style="color:${SYM[r.doors[h.door].sym].color}">${SYM[r.doors[h.door].sym].ch}</b>`, n: run.scans }));
  });

  /* =========================================================
   * ENTER THE MUSEUM
   * ========================================================= */
  function enterMuseum(isNew) {
    $("#intro").classList.add("leaving");
    setTimeout(() => {
      $("#intro").hidden = true;
      $("#museum").hidden = false;
      if (!scene) {
        initThree();
        bindPointer();
        requestAnimationFrame((t) => { last = t; tick(t); });
      }
      applyPlace();
      drawActors();
      resize();
      buildRoom(R().cur);
      P.x = 0; P.z = 3.6; P.heading = Math.PI; Rb.x = 0.9; Rb.z = 4.4; crumbs.length = 0;
      if (R().cur !== 0) { P.z = 1.8; Rb.z = 2.6; }
      cam.tx = P.x * 0.55; cam.tz = P.z * 0.55 + 0.6;
      $("#hudName").textContent = S.player;
      $("#chatFabLabel").textContent = t("chat.fab", { robot: S.robotName });
      $("#chatFab").classList.add("pulse");
      updateHUD();
      drawNote();
      showBanner(R().cur);
      if (isNew) setTimeout(openStory, 500);
      else say(isLearn() ? t("echo.learnWelcomeBack") : t("echo.welcomeBack", { n: R().collected.length, k: G().pieces.length }));
    }, isNew ? 600 : 0);
  }

  function openStory() {
    fillStory();
    $("#storyDialog").showModal();
  }
  function fillStory() {
    const k = G().pieces.length;
    const vars = { robot: esc(S.robotName), k };
    const pl = PLACE();
    // off Earth, the trip starts with a rocket ride and spacesuits
    const trip = pl !== "earth" ? `<p class="story-place">${esc(t("story.trip." + pl))}</p>` : "";
    const place = `<p class="story-place">${esc(t("echo.place." + pl))}</p>`;
    if (isLearn()) {
      $("#storyKicker").textContent = t("story.learnKicker");
      $("#storyTitle").textContent = t("story.learnTitle");
      $("#storyBody").innerHTML = trip + ["story.learn1", "story.learn2", "story.learn3"].map((key) => `<p>${t(key, vars)}</p>`).join("") + place;
    } else {
      $("#storyKicker").textContent = t("story.kicker");
      $("#storyTitle").textContent = t("story.title");
      $("#storyBody").innerHTML = trip + ["story.p1", "story.p2", "story.p3", "story.p4"].map((key) => `<p>${t(key, vars)}</p>`).join("") + place +
        `<p class="story-level">${t("story.level", { level: `<b>${esc(levelLabel(R().level))}</b>`, k, seed: R().seed })}${G().par ? " · " + t("story.gold", { n: G().par }) : ""}</p>`;
    }
  }
  /* ---------------- How to play: the mission, the wings, the rules ---------------- */
  const WING_ICON = { moon: "moon", mars: "mars", deep: "deep" };
  function openRules(focus) {
    const learn = isLearn();
    const k = S.run ? G().pieces.length : 4;
    const robot = esc(S.robotName);
    const wingCards = wings.map((w) => `
      <div class="wing-card" style="--wc:${w.color}">
        <span class="wing-orb ${WING_ICON[w.id] || "deep"}"></span>
        <div><p>${t("rules." + w.id)}</p>
        <p class="wing-list">${esc(t("rules.machines", { list: w.exhibits.map((e) => e.name).join(", ") }))}</p></div>
      </div>`).join("");
    const rules = learn ? ["rules.r1", "rules.r7"] : ["rules.r1", "rules.r2", "rules.r3", "rules.r4", "rules.r5", "rules.r6", "rules.r7"];
    $("#rulesBody").innerHTML = `
      <section><h3>${esc(t("rules.goalTitle"))}</h3>
        <p class="big">${esc(plain(learn ? t("rules.goalLearn") : t("rules.goalGame", { k })))}</p>
        ${S.run ? `<p class="rules-level">${esc(t("rules.level", { level: levelLabel(R().level) }))}${learn ? "" : " · " + esc(t("level." + R().level + "Desc"))}</p>` : ""}
      </section>
      <section><h3>${esc(t("rules.aboutTitle"))}</h3><p>${esc(t("rules.about"))}</p></section>
      <section id="rulesWings"><h3>${esc(t("rules.wingsTitle"))}</h3><div class="wing-cards">${wingCards}</div></section>
      <section><h3>${esc(t("rules.howTitle"))}</h3><ul class="rules-list">${rules.map((key) => `<li>${esc(t(key))}</li>`).join("")}</ul></section>
      <p class="rules-chat">${t("rules.chat", { robot })}</p>`;
    $("#rulesDialog").showModal();
    if (focus === "wings") $("#rulesWings").scrollIntoView({ block: "start" });
    else $("#rulesBody").scrollTop = 0;
  }
  $("#rulesBtn").addEventListener("click", () => openRules());
  $("#rulesDialog").addEventListener("close", () => {
    if (pendingTip) { say(pendingTip, 9000); pendingTip = null; }
  });
  let pendingTip = null;

  $("#storyDialog").addEventListener("close", () => {
    if (R().route.length === 0 && R().cur === 0) {
      // first time in each mode: show How to play right after the story
      S.seenRules = S.seenRules || {};
      const mode = isLearn() ? "learn" : "game";
      const tip = isLearn() ? `${t("echo.learnStart")} ${t("echo.chatTip", { robot: esc(S.robotName) })}` : null;
      if (!S.seenRules[mode]) {
        S.seenRules[mode] = true;
        save();
        const L = LV();
        pendingTip = tip || `${t("echo.tipStart")} ${L.scanner === "always" ? t("echo.tipAlways") : L.scanner > 0 ? t("echo.tipScans", { n: L.scanner }) : t("echo.tipNone")} ${t("echo.chatTip", { robot: esc(S.robotName) })}`;
        return setTimeout(() => openRules(), 200);
      }
      if (isLearn()) return say(tip, 9000);
      const L = LV();
      const tip2 = L.scanner === "always" ? t("echo.tipAlways") : L.scanner > 0 ? t("echo.tipScans", { n: L.scanner }) : t("echo.tipNone");
      say(`${t("echo.tipStart")} ${tip2} ${t("echo.chatTip", { robot: esc(S.robotName) })}`, 9000);
    }
  });

  /* =========================================================
   * HUD + JOURNAL
   * ========================================================= */
  function updateHUD(pop) {
    $("#starCount").textContent = S.stars;
    if (!R()) return;
    const g = G();
    $("#hudPlace").textContent = t("place." + PLACE());
    $("#hudLevel").textContent = levelLabel(R().level);
    $("#hudSeed").textContent = isLearn() ? "" : `· ${t("hud.layout", { seed: "#" + R().seed })}`;
    $("#pieces").hidden = isLearn();
    $("#pieces").innerHTML = g.pieces.map((p) => `<i class="${R().collected.includes(p) ? "got" : ""}"></i>`).join("") + `<span class="sr-only">${t("echo.console", { n: R().collected.length, k: g.pieces.length }).replace(/<[^>]+>/g, "")}</span>`;
    $("#doorsCount").dataset.i18nTip = isLearn() ? "tip.rooms" : "tip.doors";
    I18N.apply($("#doorsCount").parentElement);
    $("#doorsCount").innerHTML = isLearn()
      ? t("hud.rooms", { n: R().visited.length, m: g.rooms.length })
      : `${esc(t("hud.doors"))} <b>${R().route.length}</b>${g.par ? `<small> / ${esc(t("hud.gold", { n: g.par }))}</small>` : ""}`;
    const sc = R().scans;
    $("#scanBtn").hidden = isLearn() || sc === -1 || LV().scanner === 0;
    $("#scanBtn").textContent = t("hud.scan", { n: sc });
    if (pop) {
      const el = $("#starCount").parentElement;
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    }
  }
  function award(n, why) {
    if (!n) return;
    S.stars += n;
    save();
    updateHUD(true);
    toast(t("toast.stars", { n, why: t("why." + why) }));
  }
  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  $("#journalBtn").addEventListener("click", () => {
    const met = everything.filter((e) => S.met[e.id]).length;
    $("#jTitle").textContent = t("j.title", { n: met, m: everything.length });
    $("#journalGrid").innerHTML = everything.map((e) => `
      <div class="j-cell${S.met[e.id] ? " got" : ""}" style="--wc:${e.wing.color}">
        <span class="j-art">${Art.hardware(e.art)}</span>
        <span class="j-name">${S.met[e.id] ? esc(e.name) : "???"}</span>
        <span class="j-stamp">${esc(S.met[e.id] ? (e.treasure ? t("j.treasure") : t("j.met")) : e.treasure ? t("j.secret") : t("j.notYet"))}</span>
      </div>`).join("");
    $("#journalDialog").showModal();
  });

  /* =========================================================
   * RIDDLE LOCKS (identify the machine)
   * ========================================================= */
  let riddleDoor = null;
  function openRiddle(d) {
    riddleDoor = d;
    const ans = exById(d.lock.exhibit);
    const r = Math.random;
    const others = allEx.filter((e) => e.id !== ans.id).sort(() => r() - 0.5).slice(0, 2);
    const opts = [ans].concat(others).sort(() => r() - 0.5);
    const L = LV();
    $("#riddleQ").textContent = `"${ans.riddle}"`;
    $("#riddleOpts").innerHTML = opts.map((o) => `
      <button data-ans="${o.id === ans.id ? 1 : 0}" style="--wc:${L.riddleNames ? o.wing.color : "#d5ccb9"}">
        <span class="ro-art">${Art.hardware(o.art)}</span>
        ${L.riddleNames ? `<span class="ro-name">${esc(o.name)}</span>` : `<span class="ro-name">?</span>`}
      </button>`).join("");
    $("#riddleFb").textContent = L.riddleHint ? t("riddle.hint", { wing: t("wing." + ans.wing.id) }) : L.riddleNames ? "" : t("riddle.noNames");
    if (!$("#riddleDialog").open) $("#riddleDialog").showModal();
  }
  $("#riddleOpts").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ans]");
    if (!b) return;
    if (b.dataset.ans !== "1") {
      b.disabled = true; b.classList.add("no");
      $("#riddleFb").textContent = t("riddle.no");
      return;
    }
    b.classList.add("yes");
    $("#riddleOpts").querySelectorAll("button").forEach((x) => (x.disabled = true));
    const d = riddleDoor, fromRoom = R().cur;
    if (!d || R().solved[d.lock.id]) return;
    const ans = exById(d.lock.exhibit);
    $("#riddleFb").textContent = t("riddle.yes", { name: ans.name });
    R().solved[d.lock.id] = true;
    save();
    award(1, "riddle");
    setTimeout(() => {
      if ($("#riddleDialog").open) $("#riddleDialog").close();
      if (R().cur !== fromRoom || transit) return; // the player already went somewhere else
      const px = P.x, pz = P.z, ph = P.heading;
      buildRoom(R().cur);
      P.x = px; P.z = pz; P.heading = ph;
      useDoor(room(R().cur).doors[d.i]);
    }, 1100);
  });

  /* =========================================================
   * SPACE WORDS: clickable definitions, and the Learn more page
   * ========================================================= */
  const GL = window.GLOSSARY || {};
  // every way a word can appear, longest first so "solar wind" wins over "solar"
  const glossMatches = Object.entries(GL).flatMap(([key, g]) => g.match.map((m) => [m, key])).sort((a, b) => b[0].length - a[0].length);
  const glossRe = glossMatches.length ? new RegExp(`\\b(${glossMatches.map(([m]) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi") : null;
  const glossKey = (word) => (glossMatches.find(([m]) => m.toLowerCase() === word.toLowerCase()) || [])[1];
  // turn plain text into safe HTML with each space word clickable (once per piece of text)
  function linkify(text) {
    const safe = esc(text);
    if (!glossRe) return safe;
    const used = new Set();
    return safe.replace(glossRe, (m) => {
      const key = glossKey(m);
      if (!key || used.has(key)) return m;
      used.add(key);
      return `<button type="button" class="term" data-term="${key}">${m}</button>`;
    });
  }
  function showTerm(key, anchor) {
    const g = GL[key];
    if (!g) return;
    const pop = $("#termPop");
    pop.innerHTML = `<b>${esc(g.term)}</b><p lang="en" dir="ltr">${esc(g.def)}</p>
      <button type="button" class="btn small ask-cta" data-ask-term="${key}">${esc(t("term.ask", { robot: S.robotName }))}</button>`;
    pop.hidden = false;
    // keep the pop-up inside whichever dialog is open, so it shows above it
    const host = anchor.closest("dialog") || document.body;
    if (pop.parentElement !== host) host.appendChild(pop);
    const r = anchor.getBoundingClientRect(), hr = host === document.body ? { left: 0, top: 0 } : host.getBoundingClientRect();
    const w = Math.min(320, innerWidth - 24);
    pop.style.width = w + "px";
    pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left)) - hr.left + "px";
    pop.style.top = r.bottom + 8 - hr.top + "px";
    // not enough room below? open upward instead
    const h = pop.offsetHeight, limit = host === document.body ? innerHeight : hr.top + host.clientHeight;
    if (r.bottom + 8 + h > limit - 8) pop.style.top = Math.max(8, r.top - h - 8) - hr.top + "px";
  }
  function hideTerm() { $("#termPop").hidden = true; }
  document.addEventListener("click", (e) => {
    const term = e.target.closest(".term");
    if (term) { e.preventDefault(); e.stopPropagation(); return showTerm(term.dataset.term, term); }
    const ask = e.target.closest("[data-ask-term]");
    if (ask) {
      const g = GL[ask.dataset.askTerm];
      hideTerm();
      openChat(null);
      $("#chatInput").value = `What does "${g.term}" mean?`;
      return $("#chatForm").requestSubmit();
    }
    if (!e.target.closest("#termPop")) hideTerm();
  }, true);
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    hideTerm();
    const dlg = $("#chatDialog");
    if (dlg.open && dlg.classList.contains("docked")) dlg.close(); // non-modal dialogs don't close on Esc by themselves
  });
  // "what is the Kuiper Belt?" answered from the glossary when the AI server isn't running
  function glossaryAnswer(q) {
    if (!glossRe) return null;
    // only "what is X?", "what are X?", "what does X mean?", "define X": questions about the word itself
    if (!/^\s*(what('s| is| are| was| does)|define|meaning of|explain)\b/i.test(q)) return null;
    const m = q.match(glossRe);
    if (!m) return null;
    const rest = q.replace(m[0], " ").toLowerCase().replace(/\b(what|what's|is|are|was|does|do|a|an|the|mean|means|meaning|of|define|explain|word|it)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    if (rest.split(" ").filter(Boolean).length > 1) return null; // there's more to the question than the word
    const g = GL[glossKey(m[0])];
    return g ? `${g.term}: ${g.def}` : null;
  }


  let learnTab = "words";
  function openLearn(tabId) {
    learnTab = tabId || learnTab;
    const tabs = [{ id: "words", label: t("learn.words") }].concat((window.LEARN || []).map((x) => ({ id: x.id, label: t("learn." + x.id) })));
    $("#learnTabs").innerHTML = tabs.map((x) => `<button role="tab" data-ltab="${x.id}" aria-selected="${x.id === learnTab}">${esc(x.label)}</button>`).join("");
    const body = $("#learnBody");
    if (learnTab === "words") {
      const words = Object.entries(GL).sort((a, b) => a[1].term.localeCompare(b[1].term));
      body.innerHTML = `<p class="learn-lead">${esc(t("learn.wordsLead"))}</p>
        <dl class="glossary" lang="en" dir="ltr">${words.map(([k, g]) => `<dt id="g-${k}">${esc(g.term)}</dt><dd>${esc(g.def)}</dd>`).join("")}</dl>${englishNote()}`;
    } else {
      const L = LEARN.find((x) => x.id === learnTab);
      body.innerHTML = `<div lang="en" dir="ltr"><p class="learn-lead">${esc(L.lead)}</p>${L.sections.map((sec) => `
        <section><h3>${esc(sec.h)}</h3>${(sec.p || []).map((p) => `<p>${linkify(p)}</p>`).join("")}${sec.list ? `<ul>${sec.list.map((li) => `<li>${li}</li>`).join("")}</ul>` : ""}</section>`).join("")}
        ${L.sources && L.sources.length ? `<p class="src-line"><b>${esc(t("fact.sources"))}:</b> ${L.sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join(" · ")}</p>` : ""}</div>${englishNote()}`;
    }
    body.scrollTop = 0;
    if (!$("#learnDialog").open) $("#learnDialog").showModal();
  }
  $("#learnBtn").addEventListener("click", () => openLearn());
  $("#learnTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ltab]");
    if (b) openLearn(b.dataset.ltab);
  });
  $("#learnDialog").addEventListener("close", hideTerm);

  /* =========================================================
   * EXHIBIT PLACARD
   * ========================================================= */
  const TABS = [
    { id: "story", has: (e) => e.story },
    { id: "facts", has: (e) => window.FACTS && FACTS[e.id] },
    { id: "orbit", has: (e) => window.ORBIT && ORBIT[e.id] },
    { id: "listen", has: (e) => window.SOUNDS && SOUNDS[e.id] },
    { id: "left", has: (e) => e.leftBehind },
    { id: "learned", has: (e) => e.discovery },
    { id: "next", has: (e) => e.next },
    { id: "quiz", has: (e) => e.quiz },
  ];
  let ex = null, tab = "story", page = 0, tries = 0, tabs = TABS;
  const visit = (id) => (R() ? (R().visits[id] = R().visits[id] || {}) : {});

  function openExhibit(e) {
    ex = e;
    tabs = TABS.filter((t) => t.has(e));
    tab = "story"; page = 0; tries = 0;
    const ph = window.PHOTOS && PHOTOS[e.id];
    $("#exVisual").innerHTML = ph
      ? `<figure class="ex-photo"><img src="${ph.src}" alt="${esc(ph.caption)}"><figcaption>${esc(ph.caption)} <span>${esc(t("photo.credit"))}: ${esc(ph.credit)}</span></figcaption></figure><div class="ex-model small">${Art.hardware(e.art)}</div>`
      : `<div class="ex-diorama">${Art.backdrop(e.backdrop)}</div><div class="ex-model">${Art.hardware(e.art)}</div>`;
    $("#exVisual").style.setProperty("--wc", e.wing.color);
    $("#exCatalog").textContent = e.treasure ? t("ex.treasure", { place: e.place }) : t("ex.catalog", { code: e.code, wing: t("wing." + e.wing.id) });
    $("#exTitle").textContent = e.name;
    const status = { silent: t("status.silent"), parked: t("status.parked"), "still talking": t("status.talking") }[e.status] || "";
    $("#exMeta").innerHTML = `${e.year} · ${esc(e.kind)} · ${esc(e.place)} · <span class="status ${e.status.replace(" ", "-")}">${status}</span>`;
    $("#askBtn").hidden = false;
    renderTab();
    $("#exhibitDialog").showModal();
  }
  function renderTab() {
    $("#exBody").querySelectorAll("audio").forEach((x) => x.pause());
    $("#exTabs").innerHTML = tabs.map((x) => `<button role="tab" data-tab="${x.id}" aria-selected="${x.id === tab}">${esc(t("tab." + x.id))}</button>`).join("");
    const body = $("#exBody");
    const v = R().visits[ex.id] || {};
    if (tab === "story") {
      body.innerHTML = `<blockquote class="voice" lang="en" dir="ltr">${linkify(ex.story[page])}</blockquote>
        <p class="voice-by">${esc(ex.treasure ? t("ex.moonStory") : t("ex.speaking", { name: ex.name }))} · ${esc(t("ex.part", { n: page + 1, m: ex.story.length }))}</p>${englishNote()}`;
      if (page === ex.story.length - 1 && !v.story) storyHeard(ex);
    } else if (tab === "facts") {
      const f = FACTS[ex.id];
      const rows = ["builtBy", "launched", "lasted", "size", "mass", "power", "speed", "special"].filter((k) => f[k]);
      // NASA's official catalog (NSSDCA): where it rests, last contact, catalog ID
      const nd = (window.NASA_DATA || {})[ex.id] || {};
      // "2018-10-31 (missed contacts...)" -> a date in the player's language, plus any note
      const day = (iso) => {
        const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})(.*)$/);
        if (!m) return iso;
        try { return new Intl.DateTimeFormat(I18N.lang, { year: "numeric", month: "long", day: "numeric" }).format(new Date(m[1] + "T12:00:00Z")) + m[2]; } catch (e) { return iso; }
      };
      const catalog = [
        nd.restingPlace && `<dt>${esc(t("fact.resting"))}</dt><dd lang="en" dir="ltr">${linkify(nd.restingPlace)}</dd>`,
        nd.lastContact && `<dt>${esc(t("fact.lastContact"))}</dt><dd>${esc(day(nd.lastContact))}</dd>`,
        nd.nssdcId && `<dt>${esc(t("fact.nssdc"))}</dt><dd><a href="${esc(nd.nssdcUrl || "https://nssdc.gsfc.nasa.gov/")}" target="_blank" rel="noopener">NSSDCA ${esc(nd.nssdcId)}</a></dd>`,
      ].filter(Boolean).join("");
      body.innerHTML = `<h3>${esc(t("fact.title"))}</h3><dl class="fact-file" lang="en" dir="ltr">${rows.map((k) => `<dt>${esc(t("fact." + k))}</dt><dd>${linkify(f[k])}</dd>`).join("")}${catalog}</dl>${sourcesLine(ex)}${englishNote()}`;
    } else if (tab === "orbit") {
      // then and now: the mission photo next to a picture taken from orbit years later
      const o = ORBIT[ex.id], ph = window.PHOTOS && PHOTOS[ex.id];
      const yr = String(o.taken || "").slice(0, 4);
      body.innerHTML = `<h3>${esc(t("orbit.title"))}</h3>
        ${ph ? `<div class="compare" style="--pos:50%;aspect-ratio:${o.w}/${o.h}">
          <img class="cmp-now" src="${esc(o.src)}" alt="${esc(o.caption)}">
          <img class="cmp-then" src="${esc(ph.src)}" alt="${esc(ph.caption)}">
          <span class="cmp-label then">${esc(t("orbit.then"))}</span><span class="cmp-label now">${esc(t("orbit.now", { year: yr }))}</span>
          <span class="cmp-line" aria-hidden="true"></span>
        </div>
        <input class="cmp-range" type="range" min="0" max="100" value="50" aria-label="${esc(t("orbit.drag"))}">
        <p class="cmp-hint">${esc(t("orbit.drag"))}</p>`
          : `<img class="orbit-solo" src="${esc(o.src)}" alt="${esc(o.caption)}">`}
        <p class="big" lang="en" dir="ltr">${linkify(o.caption)}</p>
        <p class="src-line">${esc(t("orbit.camera", { camera: o.camera || "" }))}${o.taken ? " · " + esc(o.taken) : ""} · ${esc(t("photo.credit"))}: ${esc(o.credit)}${o.source ? ` · <a href="${esc(o.source)}" target="_blank" rel="noopener">${esc(t("fact.sources"))}</a>` : ""}</p>${englishNote()}`;
      const range = $(".cmp-range", body), cmp = $(".compare", body);
      if (range) range.addEventListener("input", () => cmp.style.setProperty("--pos", range.value + "%"));
    } else if (tab === "listen") {
      // a real NASA recording (or NASA data turned into sound)
      const a = SOUNDS[ex.id];
      body.innerHTML = `<h3>${esc(t("listen.title"))}</h3>
        <p class="listen-name" lang="en" dir="ltr"><b>${esc(a.title)}</b>${a.seconds ? ` · ${Math.round(a.seconds)} s` : ""}</p>
        <audio class="listen-audio" controls preload="none" src="${esc(a.src)}"></audio>
        <p class="big" lang="en" dir="ltr">${linkify(a.caption)}</p>
        <p class="src-line">${esc(t("listen.credit"))}: ${esc(a.credit)}${a.source ? ` · <a href="${esc(a.source)}" target="_blank" rel="noopener">${esc(t("fact.sources"))}</a>` : ""}</p>${englishNote()}`;
    } else if (tab === "left") {
      body.innerHTML = `<h3>${esc(t("ex.leftTitle"))}</h3><ul class="left" lang="en" dir="ltr">${ex.leftBehind.map((l) => `<li>${linkify(l)}</li>`).join("")}</ul>${sourcesLine(ex)}${englishNote()}`;
    } else if (tab === "learned") {
      body.innerHTML = `<h3>${esc(t("ex.learnedTitle"))}</h3><p class="big" lang="en" dir="ltr">${linkify(ex.discovery)}</p>${englishNote()}`;
    } else if (tab === "next") {
      body.innerHTML = `<h3>${esc(t("ex.nextTitle"))}</h3><p class="big" lang="en" dir="ltr">${linkify(ex.next)}</p>${englishNote()}`;
    } else renderQuiz();
    const lastTab = tabs[tabs.length - 1].id === tab;
    $("#exNext").textContent = tab === "story" && page < ex.story.length - 1 ? t("ex.keep") : lastTab ? t("ex.back") : t("ex.next");
  }
  // where the facts come from: NASA's catalog first, then NASA mission pages
  function sourcesLine(e) {
    const nd = (window.NASA_DATA || {})[e.id] || {};
    const urls = [nd.nssdcUrl, nd.missionUrl].concat(e.sources || []).filter((u, i, a) => u && a.indexOf(u) === i).slice(0, 4);
    if (!urls.length) return "";
    // "NSSDCA", or the site name plus the page's last part when a site appears more than once
    const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (x) { return u; } };
    const label = (u) => {
      const h = host(u);
      if (h.startsWith("nssdc")) return "NSSDCA";
      if (urls.filter((x) => host(x) === h).length < 2) return h;
      try { const seg = new URL(u).pathname.split("/").filter(Boolean).pop() || ""; return `${h}: ${decodeURIComponent(seg).replace(/[-_]/g, " ").replace(/\.\w+$/, "").slice(0, 28)}`; } catch (x) { return h; }
    };
    return `<p class="src-line"><b>${esc(t("fact.sources"))}:</b> ${urls.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(label(u))}</a>`).join(" · ")}<br><small>${esc(t("fact.fromNssdc"))}</small></p>`;
  }
  // machine stories are English for now: say so when another language is picked
  const englishNote = () => (I18N.lang === "en" ? "" : `<p class="en-note">${esc(t("ex.englishOnly"))}</p>`);
  function storyHeard(e) {
    visit(e.id).story = true;
    S.met[e.id] = true;
    award(1, "story");
    const sp = spots.find((s) => s.ex && s.ex.id === e.id);
    if (sp && sp.labelBoard) sp.labelBoard.redraw();
    const r = room(R().cur);
    if (r.type === "exhibit" && r.piece && r.exhibit === e.id && !R().collected.includes(r.id)) {
      R().collected.push(r.id);
      save();
      if (pieceMesh) pieceMesh.visible = false;
      if (pieceHalo) pieceHalo.visible = false;
      updateHUD();
      const n = R().collected.length, k = G().pieces.length;
      toast(t("toast.piece", { n, k }));
      if (n === k) {
        const px = P.x, pz = P.z, ph = P.heading;
        buildRoom(R().cur);
        P.x = px; P.z = pz; P.heading = ph;
      }
      pendingLine = n === k
        ? `${t("echo.allPieces")} ${t(R().sawMC ? "echo.sawMC" : "echo.notMC")}`
        : t("echo.gotPiece", { name: esc(e.name), n, k });
      updateHint();
    }
    save();
  }
  let pendingLine = null;
  function renderQuiz() {
    const v = R().visits[ex.id] || {};
    const q = ex.quiz;
    $("#exBody").innerHTML = `<h3 lang="en" dir="ltr">${esc(q.q)}</h3>
      <div class="opts" lang="en" dir="ltr">${q.options.map((o, i) => `<button data-opt="${i}">${esc(o)}</button>`).join("")}</div>
      <p class="fb" id="fb" aria-live="polite">${v.quiz != null ? esc(t("quiz.again")) : ""}</p>${englishNote()}`;
    $("#exBody").querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => answer(+b.dataset.opt, b)));
  }
  function answer(i, btn) {
    tries++;
    if (i !== ex.quiz.answer) {
      btn.classList.add("no"); btn.disabled = true;
      $("#fb").textContent = t("quiz.no");
      return;
    }
    btn.classList.add("yes");
    $("#exBody").querySelectorAll("[data-opt]").forEach((b) => (b.disabled = true));
    $("#fb").innerHTML = linkify(ex.quiz.explain);
    const v = visit(ex.id);
    if (v.quiz == null) { v.quiz = tries === 1 ? 2 : 1; award(v.quiz, "quiz"); }
  }
  $("#exTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab; page = 0;
    renderTab();
  });
  $("#exNext").addEventListener("click", () => {
    if (tab === "story" && page < ex.story.length - 1) { page++; return renderTab(); }
    const i = tabs.findIndex((t) => t.id === tab);
    if (i < tabs.length - 1) { tab = tabs[i + 1].id; page = 0; renderTab(); }
    else $("#exhibitDialog").close();
  });
  $("#exhibitDialog").addEventListener("close", () => {
    $("#exBody").querySelectorAll("audio").forEach((x) => x.pause());
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (pendingLine) { say(pendingLine, 8000); pendingLine = null; }
  });
  $("#readAloud").addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return toast(t("toast.noRead"));
    speechSynthesis.cancel();
    const read = $("#exBody").cloneNode(true);
    read.querySelectorAll(".en-note").forEach((n) => n.remove());
    const u = new SpeechSynthesisUtterance(read.innerText);
    u.lang = "en-US"; // the stories themselves are English for now
    u.rate = 0.95;
    speechSynthesis.speak(u);
  });

  /* ---------------- chat: ask one machine, or ask the robot about the whole museum ---------------- */
  let chatHistory = [], chatEx = null, chatSession = 0;
  function openChat(e, docked) {
    chatEx = e || null;
    chatSession++;
    const dlg = $("#chatDialog");
    if (dlg.open) dlg.close();
    dlg.classList.toggle("docked", !!docked);
    chatHistory = [];
    $("#chatLog").innerHTML = "";
    $("#chatMode").textContent = window.CONFIG.askEndpoint ? t("chat.ai") : t("chat.offline");
    let prompts;
    if (chatEx) {
      $("#chatTitle").textContent = t("chat.title", { name: chatEx.name });
      addMsg("bot", t("chat.hi", { name: chatEx.name }));
      prompts = [t("chat.sugBuilt"), t("chat.sugWhen"), t("chat.sugLong"), t("chat.now")];
    } else {
      $("#chatTitle").textContent = t("chat.fab", { robot: S.robotName });
      addMsg("bot", t("chat.hiMuseum", { robot: S.robotName }));
      prompts = [t("chat.sugGoal"), t("chat.sugMoon"), t("chat.sugMars"), t("chat.sugDeep")];
    }
    $("#chatSuggest").innerHTML = prompts.map((p) => `<button type="button">${esc(p)}</button>`).join("");
    $("#chatFab").classList.remove("pulse");
    if (docked) dlg.show(); else dlg.showModal();
    $("#chatInput").focus();
  }
  $("#askBtn").addEventListener("click", () => openChat(ex));
  $("#chatFab").addEventListener("click", () => {
    // the corner button opens a small chat that stays open while you explore;
    // click it again to close. In a machine's room it starts with that machine.
    const dlg = $("#chatDialog");
    if (dlg.open && dlg.classList.contains("docked")) return dlg.close();
    const r = S.run && room(R().cur);
    openChat(r && r.type === "exhibit" ? exById(r.exhibit) : null, true);
  });
  $("#chatSuggest").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    $("#chatInput").value = e.target.textContent;
    $("#chatForm").requestSubmit();
  });
  // answers about the whole museum (offline), in the player's language where we can
  const plain = (h) => h.replace(/<[^>]+>/g, "");
  function wingAnswer(id) {
    const w = wings.find((x) => x.id === id);
    return `${plain(t("rules." + id))} ${t("rules.machines", { list: w.exhibits.map((e) => e.name).join(", ") })}`;
  }
  function museumAnswer(q) {
    const ql = q.toLowerCase();
    const hit = everything.find((e) => ql.includes(e.name.toLowerCase()) || ql.includes(e.id.replace(/-/g, " ")));
    if (hit) return { ex: hit };
    if (q === t("chat.sugGoal") || /\b(how (do|can|to) (i |you |we )?(play|win)|goal of the game|rules?|signal pieces?|mission control)\b/.test(ql)) {
      return { text: `${plain(isLearn() ? t("rules.goalLearn") : t("rules.goalGame", { k: G().pieces.length }))} ${plain(t("rules.r2"))}` };
    }
    const kb = ExhibitGuide.kbAnswer(q, null);
    if (kb && !(q === t("chat.sugMoon") || q === t("chat.sugMars") || q === t("chat.sugDeep"))) return { text: kb };
    if (q === t("chat.sugMoon") || /moon|lun|apollo/.test(ql)) return { text: wingAnswer("moon") };
    if (q === t("chat.sugMars") || /mars|marte|rover/.test(ql)) return { text: wingAnswer("mars") };
    if (q === t("chat.sugDeep") || /deep|voyager|pioneer|pluto|jupiter|space/.test(ql)) return { text: wingAnswer("deep") };
    return { text: t("chat.dontKnow") };
  }
  const MUSEUM_GUIDE = () => ({
    name: "Reach for the Stars Museum guide", kind: "museum guide", place: "the museum", year: "", status: "still talking",
    story: wings.map((w) => `${w.name}: ${w.intro}`), leftBehind: allEx.map((e) => `${e.name} (${e.place})`), discovery: "",
  });
  $("#chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("#chatInput").value.trim();
    if (!q) return;
    $("#chatInput").value = "";
    addMsg("me", q);
    const wait = addMsg("bot wait", t("chat.thinking"));
    const session = chatSession;
    let res;
    // suggestion buttons are in the player's language; the offline notes are English
    const canon = { [t("chat.sugBuilt")]: "Who built it?", [t("chat.sugWhen")]: "When did it launch?", [t("chat.sugLong")]: "How long did it last?", [t("chat.now")]: "What is it doing now?" }[q];
    // 1. the AI guide (NASA websites only), when its server is running
    if (window.CONFIG.askEndpoint) res = await ExhibitGuide.ask(chatEx || MUSEUM_GUIDE(), canon || q, chatHistory);
    // 2. otherwise, or if it's not reachable: space-word definitions, then the offline notes
    if (!res || res.mode !== "ai") {
      const gloss = glossaryAnswer(q);
      if (gloss) res = { text: gloss, mode: "offline" };
      else if (chatEx) res = res || (await ExhibitGuide.ask(chatEx, canon || q, chatHistory)); // reuse the offline answer step 1 already got
      else {
        const m = museumAnswer(q);
        res = m.ex ? await ExhibitGuide.ask(m.ex, q, chatHistory) : { text: m.text, mode: "offline" };
        if (m.ex) res.text = `${m.ex.name}: ${res.text}`;
      }
    }
    wait.remove();
    if (session !== chatSession) return; // the chat was closed or restarted while this answer was loading
    const msg = addMsg("bot", res.text);
    msg.innerHTML = linkify(res.text);
    if (res.sources && res.sources.length) {
      // the NASA pages the answer came from
      const src = document.createElement("div");
      src.className = "msg-sources";
      src.innerHTML = `<span>${esc(t("chat.sources"))}</span>` + res.sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join("");
      msg.appendChild(src);
      $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
    }
    $("#chatMode").textContent = res.mode === "ai" ? t("chat.ai") : t("chat.offline");
    chatHistory.push({ role: "user", content: q }, { role: "assistant", content: res.text });
    const key = chatEx ? chatEx.id : "museum";
    const v = visit(key);
    if (!v.asked) { v.asked = true; award(1, "question"); }
  });
  function addMsg(who, text) {
    const d = document.createElement("div");
    d.className = "msg " + who;
    d.textContent = text;
    $("#chatLog").appendChild(d);
    $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
    return d;
  }

  /* =========================================================
   * MISSION CONTROL: check the route, then send the signal
   * ========================================================= */
  function openFinale() {
    const g = G(), run = R();
    if (isLearn()) return openTourEnd();
    if (!allCollected()) return say(t("echo.needAll"));
    const t0 = performance.now();
    const v = Maze.verify(g, run.route);
    const ms = performance.now() - t0;
    const k = g.pieces.length;
    const delay = Math.min(60, 2400 / Math.max(1, v.steps.length));
    const chip = (s, i) => {
      const name = s.to == null ? "?" : roomName(s.to);
      return `<li class="${s.ok ? "" : "bad"}" style="animation-delay:${(i + 1) * delay}ms;--c:${s.sym != null ? SYM[s.sym].color : "#999"}"><span class="sy">${s.sym != null ? SYM[s.sym].ch : "?"}</span><span class="rn">${esc(name)}</span></li>`;
    };
    $("#finTitle").textContent = t("fin.title");
    $("#finaleBody").innerHTML = `
      <p class="fin-lead">${t("fin.lead", { robot: esc(S.robotName) })}</p>
      <ol class="route"><li class="start"><span class="sy">●</span><span class="rn">${esc(t("room.atrium"))}</span></li>${v.steps.map(chip).join("")}</ol>
      <ul class="checks">${v.checks.map((c, i) => `<li class="${c.ok ? "ok" : c.bonus ? "miss" : "bad"}" style="animation-delay:${v.steps.length * delay + 200 + i * 250}ms">${c.ok ? "✓" : c.bonus ? "–" : "✗"} ${esc(t(c.key, c.vars))}</li>`).join("")}</ul>
      <div class="fin-stats" style="animation-delay:${v.steps.length * delay + 1400}ms">
        <div><b>${run.route.length}</b><span>${t("fin.find")}</span></div>
        <div><b>${ms < 1 ? "&lt;1 ms" : ms.toFixed(1) + " ms"}</b><span>${t("fin.check", { robot: esc(S.robotName) })}</span></div>
        <div><b>${g.best}</b><span>${t("fin.best", { orders: g.orders, k })}</span></div>
      </div>
      <blockquote class="voice fin-quote" style="animation-delay:${v.steps.length * delay + 1900}ms">${t("fin.quote")}${k >= 5 ? " " + t("fin.quote20") : ""}</blockquote>`;
    $("#finaleFoot").innerHTML = `<span class="grow"></span><button class="btn primary" id="sendSignal">${esc(t("fin.send"))}</button>`;
    $("#finaleDialog").showModal();
    $("#sendSignal").disabled = !v.ok;
    $("#sendSignal").onclick = () => v.ok && sendSignal(v);
  }

  function sendSignal(v) {
    const g = G(), run = R(), k = g.pieces.length;
    const firstTime = !run.done;
    if (firstTime) {
      run.done = true;
      const gold = g.par && run.route.length <= g.par;
      S.best[run.level] = Math.min(S.best[run.level] || Infinity, run.route.length);
      save();
      award(5, "signal");
      if (gold) setTimeout(() => award(3, "gold"), 900);
    }
    $("#finTitle").textContent = t("fin.sent");
    const slices = [...Array(k)].map((_, i) => `<div class="pbd-slice" style="--i:${i};--k:${k};background-position:${k > 1 ? (i / (k - 1)) * 100 : 0}% 0"></div>`).join("");
    $("#finaleBody").innerHTML = `
      <div class="pbd" style="--k:${k}">${slices}<div class="pbd-dot"></div></div>
      <p class="fin-lead">${t("fin.pbd1", { k })}</p>
      <p>${t("fin.pbd2")}</p>
      <p>${t("fin.pbd3")}</p>
      <p class="story-level">${esc(t("fin.summary", { level: levelLabel(run.level), seed: run.seed, n: run.route.length }))}${g.par ? " · " + esc(run.route.length <= g.par ? t("fin.goldYes") : t("fin.goldWas", { n: g.par })) : ""}</p>`;
    finaleButtons(run.level);
  }
  function finaleButtons(current) {
    $("#finaleFoot").innerHTML = `<button class="btn ghost" id="keepExploring">${esc(t("fin.keep"))}</button><span class="grow"></span>
      <span class="fin-new">${esc(t("fin.new"))}</span>
      ${["learn", "easy", "medium", "hard"].map((l) => `<button class="btn ${l === current ? "primary" : ""}" data-newrun="${l}">${esc(levelLabel(l))}</button>`).join("")}`;
    $("#keepExploring").onclick = () => $("#finaleDialog").close();
    $("#finaleFoot").querySelectorAll("[data-newrun]").forEach((b) => (b.onclick = () => {
      $("#finaleDialog").close();
      S.mode = b.dataset.newrun === "learn" ? "learn" : "game";
      newRun(b.dataset.newrun);
      enterMuseum(true); // a fresh start: opens the story card, no "welcome back"
    }));
  }

  /* Learning mode ends here: no route check, just the picture and a recap */
  function openTourEnd() {
    const run = R(), g = G();
    const heard = Object.values(run.visits).filter((v) => v.story).length;
    if (!run.done) { run.done = true; save(); award(3, "tour"); }
    const k = 5;
    const slices = [...Array(k)].map((_, i) => `<div class="pbd-slice" style="--i:${i};--k:${k};background-position:${(i / (k - 1)) * 100}% 0"></div>`).join("");
    $("#finTitle").textContent = t("fin.learnTitle");
    $("#finaleBody").innerHTML = `
      <p class="fin-lead">${t("fin.learnLead", { n: run.visited.length, m: g.rooms.length, s: heard })}</p>
      <div class="pbd" style="--k:${k}">${slices}<div class="pbd-dot"></div></div>
      <p>${t("fin.pbd2")}</p>
      <p>${t("fin.pbd3")}</p>
      <p class="story-level">${esc(t("fin.learnGame"))}</p>`;
    finaleButtons("learn");
    if (!$("#finaleDialog").open) $("#finaleDialog").showModal();
  }

  /* =========================================================
   * ROBOT BAY
   * ========================================================= */
  const SLOTS = { color: "ws.paint", eyes: "ws.eyes", hat: "ws.hats", gear: "ws.gear" };
  $("#workshopBtn").addEventListener("click", openWorkshop);
  function openWorkshop() { renderWorkshop(); $("#workshopDialog").showModal(); }
  function renderWorkshop() {
    $("#wsTitle").textContent = t("ws.title", { name: S.robotName });
    $("#wsPreview").innerHTML = Robot.svg(S.look) + `<p class="ws-stars">${esc(t("ws.stars", { n: S.stars }))}</p>`;
    $("#wsShop").innerHTML = Object.keys(SLOTS).map((slot) => {
      const items = M.shop.filter((i) => i.slot === slot).map((it) => {
        const owned = S.owned.includes(it.id);
        const on = S.look[slot] === it.value;
        const sw = slot === "color" || slot === "eyes" ? `<i class="sw" style="background:${it.value}"></i>` : "";
        const tag = on ? t("ws.wearing") : owned ? t("ws.yours") : `${it.cost} ★`;
        return `<button class="part${on ? " on" : ""}${!owned && S.stars < it.cost ? " short" : ""}" data-item="${it.id}">${sw}<span>${esc(it.name)}</span><em>${tag}</em></button>`;
      }).join("");
      return `<h4>${esc(t(SLOTS[slot]))}</h4><div class="parts">${items}</div>`;
    }).join("");
  }
  $("#wsShop").addEventListener("click", (e) => {
    const b = e.target.closest("[data-item]");
    if (!b) return;
    const it = M.shop.find((i) => i.id === b.dataset.item);
    if (!S.owned.includes(it.id)) {
      if (S.stars < it.cost) return toast(`${it.name}: ${t("ws.need", { n: it.cost - S.stars })}`);
      S.stars -= it.cost;
      S.owned.push(it.id);
      toast(`${t("ws.unlocked")} ${it.name}`);
    }
    S.look[it.slot] = it.value;
    save();
    updateHUD();
    renderWorkshop();
    if (robot) {
      scene.remove(robot);
      disposeModel(robot);
      robot = Models.robot(S.look);
      robot.scale.setScalar(0.85);
      robot.position.set(Rb.x, 0, Rb.z);
      scene.add(robot);
    }
  });

  /* ---------- dialogs: close buttons + backdrop click ---------- */
  document.querySelectorAll("dialog [data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
  document.querySelectorAll("dialog:not(#finaleDialog):not(#storyDialog)").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  /* ---------- language ---------- */
  function setLang(code) {
    S.lang = code;
    save();
    I18N.set(code);
  }
  I18N.onChange((lang) => {
    document.querySelectorAll(".lang-select").forEach((sel) => (sel.value = lang));
    drawIntroText();
    if (!S.run || $("#museum").hidden) return;
    updateHUD();
    drawNote();
    $("#chatFabLabel").textContent = t("chat.fab", { robot: S.robotName });
    if ($("#rulesDialog").open) openRules();
    // signs in the room are drawn in 3D, so rebuild the room where you stand
    const px = P.x, pz = P.z, ph = P.heading;
    buildRoom(R().cur);
    P.x = px; P.z = pz; P.heading = ph;
    showBanner(R().cur);
    if ($("#exhibitDialog").open) {
      $("#exCatalog").textContent = ex.treasure ? t("ex.treasure", { place: ex.place }) : t("ex.catalog", { code: ex.code, wing: t("wing." + ex.wing.id) });
      renderTab();
    }
    if ($("#workshopDialog").open) renderWorkshop();
    if ($("#storyDialog").open) fillStory();
    if ($("#learnDialog").open) openLearn();
    if ($("#journalDialog").open) { $("#journalDialog").close(); $("#journalBtn").click(); }
    if ($("#riddleDialog").open && riddleDoor) openRiddle(riddleDoor);
    if ($("#chatDialog").open) $("#chatTitle").textContent = chatEx ? t("chat.title", { name: chatEx.name }) : t("chat.fab", { robot: S.robotName });
    if ($("#finaleDialog").open && isLearn()) openTourEnd();
  });

  /* ---------- boot ---------- */
  buildIntro();
  applyA11y();
  I18N.set(S.lang || "en");
  window.resetMuseum = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };
  // for testing: Museum.debug() prints today's hidden network
  window.Museum = {
    debug: () => S.run && S.run.graph,
    state: () => S,
    // walk to door number i in this room and open it (same as clicking it)
    door: (i) => { const o = doorObjs.find((x) => x.door.i === i); if (o) goToSpot(o.spot); return !!o; },
    spot: (kind) => { const sp = spots.find((x) => x.kind === kind); if (sp) goToSpot(sp); return !!sp; },
    story: () => openStory(),
    exhibit: (id) => openExhibit(exById(id)),
    rules: () => openRules(),
  };
})();
