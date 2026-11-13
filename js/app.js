/*
 * SILENT EXPLORERS MUSEUM: a door-maze adventure
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

  const SKINS = ["#f1c7a5", "#d9a074", "#a8693f", "#6b4228"];
  const SHIRTS = ["#2f6fb5", "#c4472d", "#2f8a5b", "#7a4bb0"];

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
    kid: { skin: SKINS[1], shirt: SHIRTS[0], char: "boy" },
    level: "medium",
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
      if (raw) return Object.assign(fresh(), JSON.parse(raw));
    } catch (e) {}
    return fresh();
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

  const R = () => S.run;
  const G = () => S.run.graph;
  const LV = () => Maze.LEVELS[S.run.level];
  const room = (id) => G().rooms[id];
  const allCollected = () => G().pieces.every((p) => R().collected.includes(p));
  function roomName(id) {
    const r = room(id);
    if (r.type === "atrium") return "Atrium";
    if (r.type === "mc") return "Mission Control";
    if (r.type === "exhibit") return exById(r.exhibit).name;
    if (r.type === "hall") return M.halls[r.hall].name;
    return "Secret room";
  }

  /* =========================================================
   * INTRO
   * ========================================================= */
  function buildIntro() {
    $("#busWrap").innerHTML = Art.bus();
    document.querySelectorAll(".swatches").forEach((box) => {
      const key = box.dataset.look;
      const list = key === "skin" ? SKINS : SHIRTS;
      box.innerHTML = list.map((c) => `<button type="button" class="swatch" style="--c:${c}" data-val="${c}" aria-label="${key} color" aria-pressed="${S.kid[key] === c}"></button>`).join("");
      box.addEventListener("click", (e) => {
        const b = e.target.closest(".swatch");
        if (!b) return;
        S.kid[key] = b.dataset.val;
        box.querySelectorAll(".swatch").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        drawCharPick();
      });
    });
    $("#charPick").addEventListener("click", (e) => {
      const b = e.target.closest("[data-char]");
      if (!b) return;
      S.kid.char = b.dataset.char;
      drawCharPick();
    });
    $("#levelPick").addEventListener("click", (e) => {
      const b = e.target.closest("[data-level]");
      if (!b) return;
      S.level = b.dataset.level;
      $("#levelPick").querySelectorAll("[data-level]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    });
    $("#levelPick").querySelectorAll("[data-level]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.level === S.level)));
    drawCharPick();
    $("#playerName").value = S.player;
    $("#robotName").value = S.robotName;
    if (S.run && !S.run.done) {
      $("#continueBtn").hidden = false;
      $("#continueBtn").textContent = `Continue my ${Maze.LEVELS[S.run.level].label} adventure`;
    }
  }
  function drawCharPick() {
    $("#charPick").querySelectorAll("[data-char]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.char === S.kid.char));
      $(".cp-art", b).innerHTML = Art.kid({ ...S.kid, char: b.dataset.char });
    });
  }
  function readIntro() {
    S.player = $("#playerName").value.trim() || "Explorer";
    S.robotName = $("#robotName").value.trim() || "Echo";
  }
  $("#introForm").addEventListener("submit", (e) => {
    e.preventDefault();
    readIntro();
    newRun(S.level);
    enterMuseum(true);
  });
  $("#continueBtn").addEventListener("click", () => { readIntro(); save(); enterMuseum(false); });
  $("#skipIntro").addEventListener("click", () => $("#intro").classList.add("skipped"));

  function newRun(level) {
    const seed = 1000 + Math.floor(Math.random() * 9000);
    const graph = Maze.generate(level, seed, {
      exhibits: allEx.map((e) => e.id),
      treasures: treasures.map((t) => t.id),
      halls: M.halls.length,
    });
    const L = Maze.LEVELS[level];
    S.level = level;
    S.run = {
      seed, level, graph, cur: 0, collected: [], route: [], known: {}, revealed: {}, solved: {},
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

  let renderer, scene, camera, sun, kid, robot, roomGroup, userZoomed = false;
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
    scene.background = nightSky();
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
    const ground = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshBasicMaterial({ color: "#14120f" }));
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
  function nightSky() {
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, "#0a0f24"); g.addColorStop(1, "#2a3360");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 420; i++) {
      x.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.7})`;
      x.beginPath(); x.arc(rnd() * 1024, rnd() * 1024, rnd() < 0.08 ? 1.8 : 0.9, 0, Math.PI * 2); x.fill();
    }
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }

  /* ---------------- materials ---------------- */
  const texCache = {};
  function floorMat(kind) {
    if (!texCache[kind]) {
      texCache[kind] =
        kind === "tile" ? Models.tileTex("#e9e1cf", "#d3c6aa") :
        kind === "tile-dark" ? Models.tileTex("#2c3552", "#232a44") :
        kind === "wood-dark" ? Models.woodTex("#6b4a32") : Models.woodTex("#8a5d3c");
    }
    const t = texCache[kind].clone();
    t.needsUpdate = true;
    const sc = kind.startsWith("tile") ? 2 : 4;
    t.repeat.set((X1 - X0) / sc, (Z1 - Z0) / sc);
    return new T.MeshStandardMaterial({ map: t, roughness: kind.startsWith("tile") ? 0.35 : 0.7 });
  }
  function wallMats(color) {
    const face = new T.MeshStandardMaterial({ color, roughness: 0.9 });
    const top = new T.MeshStandardMaterial({ color: "#2b2520", roughness: 0.9 });
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
    if (r.type === "atrium") return { wall: "#e7ddc9", floor: "tile", kind: "Start" };
    if (r.type === "mc") return { wall: "#1c2846", floor: "tile-dark", kind: "The final room" };
    if (r.type === "hidden") return { wall: "#24212e", floor: "wood-dark", kind: "Secret room" };
    if (r.type === "hall") return { wall: M.halls[r.hall].wall, floor: "wood", kind: "Hall" };
    const ex = exById(r.exhibit);
    return { wall: ex.wing.wall, floor: "wood-dark", kind: `${ex.wing.name.replace(" Wing", "")} machine` };
  }

  function clearRoom() {
    if (roomGroup) {
      scene.remove(roomGroup);
      roomGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => { if (m.map && !Object.values(texCache).includes(m.map)) m.map.dispose(); m.dispose(); });
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
    const r = room(id);
    const th = theme(r);
    const floor = add(new T.Mesh(new T.PlaneGeometry(X1 - X0, Z1 - Z0), floorMat(th.floor)));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.floor = true;
    pickables.push(floor);

    // which doors are visible right now (secret ones only once found)
    const visibleDoors = r.doors.filter((d) => !d.hidden || R().revealed[`${id}:${d.i}`]);
    buildWalls(th.wall, visibleDoors);
    visibleDoors.forEach((d) => buildDoor(id, d));
    r.doors.filter((d) => d.hidden && !R().revealed[`${id}:${d.i}`]).forEach((d) => buildSecretPanel(id, d));

    if (r.type === "atrium") buildAtrium();
    else if (r.type === "exhibit") buildExhibit(r);
    else if (r.type === "hall") buildHall(r);
    else if (r.type === "hidden") buildHidden(r);
    else if (r.type === "mc") buildMissionControl();
    updateHint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => boards.forEach((b) => b.redraw()));
  }

  function buildWalls(color, doors) {
    const mats = wallMats(color);
    const base = new T.MeshStandardMaterial({ color: "#2b2520", roughness: 0.8 });
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
        const bb = new T.Mesh(new T.BoxGeometry(alongX ? len : 0.06, 0.2, alongX ? 0.06 : len), base);
        const bi = inner + sgn * 0.03;
        bb.position.set(alongX ? c : bi, 0.1, alongX ? bi : c);
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
    const label = { sealed: "SEALED", locked: "RIDDLE LOCK", oneway: "ONE WAY", "open-mc": "OPEN!" }[state];
    if (label) {
      x.fillStyle = state === "sealed" || state === "locked" ? "#f2c230" : "#f6f0e3";
      x.font = `700 ${W * 0.11}px "IBM Plex Mono", monospace`;
      x.fillText(label, W / 2, H * 0.74);
      if (state === "sealed") {
        x.font = `700 ${W * 0.085}px "IBM Plex Mono", monospace`;
        x.fillText(`${R().collected.length} OF ${G().pieces.length} PIECES`, W / 2, H * 0.84);
      }
      if (state === "oneway") {
        x.font = `700 ${W * 0.16}px "IBM Plex Mono", monospace`;
        x.fillText("→", W / 2, H * 0.86);
      }
    }
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
    // lintel + sign above the door: "?" until you've been through it
    const lintel = new T.Mesh(new T.BoxGeometry(DOOR_W + 0.3, WALL_H - 3.1, WALL_T), wallMats(theme(room(roomId)).wall));
    const [lx, lz] = wallPoint(s, slot.along, -WALL_T / 2);
    lintel.position.set(lx, 3.1 + (WALL_H - 3.1) / 2, lz);
    lintel.rotation.y = rot;
    s.decor.add(lintel);
    const known = R().known[`${roomId}:${d.i}`];
    const signText = d.sealed ? "MISSION CONTROL" : !known ? "?" : LV().signs === "names" ? roomName(d.to) : "✓ BEEN THERE";
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
    addBoard(N, {
      w: 5.6, h: 2.6, accent: "#b8892f", kicker: "Welcome to the Silent Explorers Museum", title: "The Homecoming Signal is broken!", titleSize: 6.6,
      body: [`Find all ${k} signal pieces. Each one is with a machine NASA left behind. Then bring them to Mission Control.`],
      bodySize: 3.6, footer: `TODAY'S LAYOUT: #${R().seed}`,
    }, 0, 2.3);
    // Earth globe
    const ped = add(new T.Mesh(new T.CylinderGeometry(0.8, 1.0, 0.85, 32), new T.MeshStandardMaterial({ color: "#2b2520", roughness: 0.6 })));
    ped.position.set(0, 0.42, -1);
    const globe = add(new T.Mesh(new T.SphereGeometry(0.9, 40, 28), new T.MeshStandardMaterial({ map: Models.globeTex(), roughness: 0.55 })));
    globe.position.set(0, 1.8, -1);
    globe.rotation.z = 0.41;
    Models.shadowAll(ped); Models.shadowAll(globe);
    spin.push({ o: globe, s: 0.15 });
    obstacles.push({ x: 0, z: -1, r: 1.3 });
    // Robot Bay pad
    const bx = -4.2, bz = 3.2;
    const pad = add(new T.Mesh(new T.CylinderGeometry(1.2, 1.3, 0.12, 40), new T.MeshStandardMaterial({ color: "#1f2330", roughness: 0.4, metalness: 0.4 })));
    pad.position.set(bx, 0.06, bz);
    const ring = add(new T.Mesh(new T.TorusGeometry(1.0, 0.05, 8, 48), new T.MeshBasicMaterial({ color: "#5ef2ff", transparent: true })));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(bx, 0.14, bz);
    spin.push({ o: ring, pulse: true });
    addSpot({ kind: "bay", pos: [bx, bz], face: 0, meshes: [pad] });
    // Signal console: one light per piece
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
    const bd = Models.svgTexture(Art.backdrop(ex.backdrop), 420);
    const frame = new T.Group();
    const fr = new T.Mesh(new T.BoxGeometry(3.54, 2.44, 0.08), new T.MeshStandardMaterial({ color: "#b8892f", metalness: 0.5, roughness: 0.35 }));
    const pic = new T.Mesh(new T.PlaneGeometry(3.3, 2.2), new T.MeshBasicMaterial({ map: bd, toneMapped: false }));
    pic.position.z = 0.045;
    frame.add(fr, pic);
    onWall(N, frame, 0, 2.75, 0.05);
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
    const spot = addSpot({ kind: "exhibit", ex, pos: [0, Z0 + WALL_T + 3.6], face: Math.PI, meshes: g.userData.pick.concat([label.mesh]) });
    spot.labelBoard = label;
    obstacles.push({ x: 0, z: Z0 + WALL_T + 1.45, r: 1.15 });
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
      x.fillText("VISITED", 0, 2);
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
      x.fillText("MISSION CONTROL · HOMECOMING SIGNAL", 6 * u, 6 * u);
      x.fillStyle = "#f6f0e3"; x.font = `800 ${8 * u}px Fraunces, Georgia, serif`;
      x.fillText(have === k ? "All pieces aboard. Ready!" : `${have} of ${k} pieces`, 6 * u, 14 * u);
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
    if (!document.querySelector("dialog[open]")) step(dt);
    updateCamera(dt);
    updateWalls(dt);
    spin.forEach((s) => {
      if (s.pulse) s.o.material.opacity = 0.6 + Math.sin(clock * 3) * 0.4;
      else if (s.flicker) s.o.material.opacity = 0.55 + Math.sin(clock * 5) * 0.25 + Math.sin(clock * 13) * 0.15;
      else if (s.pulseScale) s.o.scale.setScalar(1 + Math.sin(clock * 4) * 0.08);
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
    Models.animateKid(kid, clock, P.speed);
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
      return say(`This is <b>Mission Control</b>! It's sealed until we bring all ${G().pieces.length} signal pieces. We still need <b>${left}</b>. Let's remember where this door is!`, 7000);
    }
    if (d.lock && !R().solved[d.lock.id]) return openRiddle(d);
    const obj = doorObjs.find((o) => o.door === d);
    const [ix, iz] = wallPoint(obj.side, obj.slot.along, -0.6);
    transit = { t: 0, obj, from: [P.x, P.z], to: [ix, iz], switched: false };
    $("#fadeSym").textContent = SYM[d.sym].ch;
    $("#fadeSym").style.color = SYM[d.sym].color;
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
    const t = canvasTex(128, 128, (x) => {
      x.fillStyle = "#2b3350"; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#f2c230"; x.lineWidth = 8; x.stroke();
      x.fillStyle = "#f2c230"; x.font = "700 20px 'IBM Plex Mono', monospace"; x.textAlign = "center"; x.fillText("AIRLOCK", 64, 70);
    });
    const m = add(new T.Mesh(new T.CircleGeometry(0.8, 32), new T.MeshBasicMaterial({ map: t })));
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
      return say(`The note checks out! We followed it one door at a time, and it really led to a machine with a signal piece. Checking a route is quick: you just follow it. Now let's hear this machine's story!`, 9000);
    }
    if (oneWay) line = `Whoa! That was a <b>one-way airlock</b>. It sealed shut behind us, so we'll have to find another way around. `;
    if (first) {
      if (r.type === "exhibit" && r.piece) line += `Look! This machine is holding a <b>signal piece</b>. Let's hear its story to get it.`;
      else if (r.type === "exhibit") line += `No signal piece here, but this machine has a story. Want to hear it?`;
      else if (r.type === "hall") line += `${esc(M.halls[r.hall].fact)}`;
      else if (r.type === "hidden") line += r.find === "note" ? `A secret room! There's an old note on that stand.` : `A secret room! Something small and special is in that case.`;
      else if (r.type === "atrium") line += `Back in the Atrium, where we started.`;
    } else if (r.type === "exhibit" && r.piece && !R().collected.includes(id)) line += `This machine still has its signal piece. Let's hear its story!`;
    if (!line && LV().scanner === "always") {
      const h = Maze.hint(G(), id, { collected: R().collected });
      if (h && !h.here) line = `My scanner likes the <b style="color:${SYM[room(id).doors[h.door].sym].color}">${SYM[room(id).doors[h.door].sym].ch}</b> door.`;
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
      award(2, "note checked");
      noteChecked = true;
    }
    drawNote();
  }
  function drawNote() {
    const n = R() && R().note;
    const p = $("#notePanel");
    if (!n) { p.hidden = true; return; }
    p.hidden = false;
    p.innerHTML = `<p class="np-kick">Explorer's note${n.done ? " · checked ✓" : ""}</p>
      <p class="np-from">From the secret room:</p>
      <ol class="np-steps">${n.steps.map((s, i) => `<li class="${i < n.prog ? "ok" : ""}" style="--c:${SYM[s.sym].color}"><span>${SYM[s.sym].ch}</span></li>`).join("")}</ol>
      <p class="np-end">${n.done ? "It led to a signal room!" : "…leads to a signal piece?"}</p>`;
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
      txt = st === "sealed" ? `Mission Control (sealed)` : st === "locked" ? `Solve the ${sym.ch} door's riddle lock` : `Open the ${sym.ch} door`;
      txt = `<span style="color:${sym.color};filter:brightness(1.4)">${sym.ch}</span> ${esc(txt.replace(sym.ch + " ", ""))}`;
    } else {
      txt = esc({
        secret: "Search the odd-looking wall", bay: "Open Robot Bay", console: "Check the signal console", fact: "Read the sign",
        note: "Read the old note", launch: "Send the Homecoming Signal",
      }[s.kind] || `Look closer: ${s.ex.name}`);
    }
    pr.innerHTML = `${txt}<kbd>Enter</kbd>`;
    pr.hidden = false;
  }
  function activate(s) {
    if (!s || transit) return;
    if (s.kind === "door") useDoor(s.door);
    else if (s.kind === "secret") revealSecret(s.door);
    else if (s.kind === "bay") openWorkshop();
    else if (s.kind === "console") say(`Signal pieces: <b>${R().collected.length} of ${G().pieces.length}</b>. ${allCollected() ? "We have them all! Now find Mission Control." : "Each one is with a machine somewhere behind these doors."}`);
    else if (s.kind === "fact") say(esc(s.hall.fact), 8000);
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
    award(1, "secret passage found");
    say(`A <b>secret door</b>! I wonder what's behind it...`);
  }

  function readNote() {
    const r = room(R().cur);
    if (!R().note) {
      R().note = { steps: r.note.steps, prog: 0, done: false, from: r.id };
      save();
    }
    drawNote();
    say(`An old note from a student who explored this morning: <b>"From this secret room, ${r.note.steps.map((s) => `<span style="color:${SYM[s.sym].color}">${SYM[s.sym].ch}</span>`).join(" then ")} leads to a signal piece."</b> Let's follow it and check if it's right!`, 9000);
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
    if (document.querySelector("dialog[open]") || $("#museum").hidden || e.target.tagName === "INPUT") return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (MOVE_KEYS.includes(k)) { held.add(k); e.preventDefault(); hideIdleHint(); }
    if (k === "q") want.yaw -= Math.PI / 4;
    if (k === "e") want.yaw += Math.PI / 4;
    if ((k === "Enter" || k === " ") && nearSpot) { e.preventDefault(); activate(nearSpot); }
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
    b.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => b.classList.remove("show"), ms);
  }

  function drawActors() {
    if (kid) scene.remove(kid);
    if (robot) scene.remove(robot);
    kid = Models.kid(S.kid);
    kid.scale.setScalar(1.15);
    robot = Models.robot(S.look);
    robot.scale.setScalar(0.85);
    scene.add(kid, robot);
  }

  /* ---------------- scanner (Medium) ---------------- */
  $("#scanBtn").addEventListener("click", () => {
    const run = R();
    if (run.scans === 0) return say(`My scanner's batteries are empty. We'll have to explore the old-fashioned way!`);
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
    if (h && h.here) say(`The signal piece is right here! Hear this machine's story.`);
    else if (h) say(`Scanning... <b style="color:${SYM[r.doors[h.door].sym].color}">${SYM[r.doors[h.door].sym].ch}</b> is the way to go! (${run.scans} scan${run.scans === 1 ? "" : "s"} left)`);
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
      drawActors();
      resize();
      buildRoom(R().cur);
      P.x = 0; P.z = 3.6; P.heading = Math.PI; Rb.x = 0.9; Rb.z = 4.4; crumbs.length = 0;
      if (R().cur !== 0) { P.z = 1.8; Rb.z = 2.6; }
      cam.tx = P.x * 0.55; cam.tz = P.z * 0.55 + 0.6;
      $("#hudName").textContent = S.player;
      updateHUD();
      drawNote();
      showBanner(R().cur);
      if (isNew) setTimeout(openStory, 500);
      else say(`Welcome back! We have <b>${R().collected.length} of ${G().pieces.length}</b> signal pieces.`);
    }, isNew ? 600 : 0);
  }

  function openStory() {
    const k = G().pieces.length;
    const L = LV();
    $("#storyBody").innerHTML = M.adventure.intro.map((p) => `<p>${esc(p.replace("ROBOT", S.robotName).replace("PIECES", k))}</p>`).join("") +
      `<p class="story-level"><b>${L.label}</b> · ${k} signal pieces · layout #${R().seed}${G().par ? ` · gold route: ${G().par} doors or fewer` : ""}</p>`;
    $("#storyDialog").showModal();
  }
  $("#storyDialog").addEventListener("close", () => {
    if (R().route.length === 0 && R().cur === 0) {
      const L = LV();
      const tip = L.scanner === "always" ? ` My scanner will point to a good door, look for the blue arrow.` : L.scanner > 0 ? ` I can <b>scan</b> ${L.scanner} times to point the way.` : ` My scanner is broken today, so let's explore and remember the doors!`;
      say(`Every door has a symbol. We won't know what's behind one until we open it.${tip}`, 9000);
    }
  });

  /* =========================================================
   * HUD + JOURNAL
   * ========================================================= */
  function updateHUD(pop) {
    $("#starCount").textContent = S.stars;
    if (!R()) return;
    const g = G();
    $("#pieces").innerHTML = g.pieces.map((p) => `<i class="${R().collected.includes(p) ? "got" : ""}"></i>`).join("") + `<span class="sr-only">${R().collected.length} of ${g.pieces.length} signal pieces</span>`;
    $("#doorsCount").innerHTML = `Doors <b>${R().route.length}</b>${g.par ? `<small> / gold ${g.par}</small>` : ""}`;
    $("#hudLevel").textContent = LV().label;
    $("#hudSeed").textContent = `#${R().seed}`;
    const sc = R().scans;
    $("#scanBtn").hidden = sc === -1 || LV().scanner === 0;
    $("#scanBtn").textContent = `Scan (${sc})`;
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
    toast(`+${n} star${n > 1 ? "s" : ""} · ${why}`);
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
    $("#jTitle").textContent = `Machines you've met: ${met} of ${everything.length}`;
    $("#journalGrid").innerHTML = everything.map((e) => `
      <div class="j-cell${S.met[e.id] ? " got" : ""}" style="--wc:${e.wing.color}">
        <span class="j-art">${Art.hardware(e.art)}</span>
        <span class="j-name">${S.met[e.id] ? esc(e.name) : "???"}</span>
        <span class="j-stamp">${S.met[e.id] ? (e.treasure ? "Treasure" : "Met") : e.treasure ? "Secret" : "Not yet"}</span>
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
    $("#riddleFb").textContent = L.riddleHint ? `Hint: this machine lives in the ${ans.wing.name.replace(" Wing", "")} part of space.` : L.riddleNames ? "" : "No names on Hard mode. Look closely at the machines!";
    $("#riddleDialog").showModal();
  }
  $("#riddleOpts").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ans]");
    if (!b) return;
    if (b.dataset.ans !== "1") {
      b.disabled = true; b.classList.add("no");
      $("#riddleFb").textContent = "Not that one. Try again!";
      return;
    }
    b.classList.add("yes");
    const d = riddleDoor;
    const ans = exById(d.lock.exhibit);
    $("#riddleFb").textContent = `Yes! It's ${ans.name}. The lock clicks open...`;
    R().solved[d.lock.id] = true;
    save();
    award(1, "riddle solved");
    setTimeout(() => {
      $("#riddleDialog").close();
      const px = P.x, pz = P.z, ph = P.heading;
      buildRoom(R().cur);
      P.x = px; P.z = pz; P.heading = ph;
      useDoor(room(R().cur).doors[d.i]);
    }, 1100);
  });

  /* =========================================================
   * EXHIBIT PLACARD
   * ========================================================= */
  const TABS = [
    { id: "story", label: "In its own words", has: (e) => e.story },
    { id: "left", label: "Still there today", has: (e) => e.leftBehind },
    { id: "learned", label: "What we learned", has: (e) => e.discovery },
    { id: "next", label: "What came next", has: (e) => e.next },
    { id: "quiz", label: "Quick quiz", has: (e) => e.quiz },
  ];
  let ex = null, tab = "story", page = 0, tries = 0, tabs = TABS;
  const visit = (id) => (R().visits[id] = R().visits[id] || {});

  function openExhibit(e) {
    ex = e;
    tabs = TABS.filter((t) => t.has(e));
    tab = "story"; page = 0; tries = 0;
    $("#exVisual").innerHTML = `<div class="ex-diorama">${Art.backdrop(e.backdrop)}</div><div class="ex-model">${Art.hardware(e.art)}</div>`;
    $("#exVisual").style.setProperty("--wc", e.wing.color);
    $("#exCatalog").textContent = e.treasure ? `Hidden treasure · ${e.place}` : `Exhibit ${e.code} · ${e.wing.name}`;
    $("#exTitle").textContent = e.name;
    const status = { silent: "Silent now", parked: "Still there", "still talking": "Still talking to Earth" }[e.status] || "";
    $("#exMeta").innerHTML = `${e.year} · ${esc(e.kind)} · ${esc(e.place)} · <span class="status ${e.status.replace(" ", "-")}">${status}</span>`;
    $("#askBtn").hidden = !e.faq;
    renderTab();
    $("#exhibitDialog").showModal();
  }
  function renderTab() {
    $("#exTabs").innerHTML = tabs.map((t) => `<button role="tab" data-tab="${t.id}" aria-selected="${t.id === tab}">${t.label}</button>`).join("");
    const body = $("#exBody");
    const v = R().visits[ex.id] || {};
    if (tab === "story") {
      body.innerHTML = `<blockquote class="voice">${esc(ex.story[page])}</blockquote>
        <p class="voice-by">${ex.treasure ? "A story from the Moon" : `${esc(ex.name)}, speaking for itself`} · part ${page + 1} of ${ex.story.length}</p>`;
      if (page === ex.story.length - 1 && !v.story) storyHeard(ex);
    } else if (tab === "left") {
      body.innerHTML = `<h3>Still out there right now</h3><ul class="left">${ex.leftBehind.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
    } else if (tab === "learned") {
      body.innerHTML = `<h3>The science it made possible</h3><p class="big">${esc(ex.discovery)}</p>`;
    } else if (tab === "next") {
      body.innerHTML = `<h3>How the story continued</h3><p class="big">${esc(ex.next)}</p>`;
    } else renderQuiz();
    const lastTab = tabs[tabs.length - 1].id === tab;
    $("#exNext").textContent = tab === "story" && page < ex.story.length - 1 ? "Keep listening" : lastTab ? "Back to the room" : "Next";
  }
  function storyHeard(e) {
    visit(e.id).story = true;
    S.met[e.id] = true;
    award(1, "story heard");
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
      toast(`Signal piece ${n} of ${k}!`);
      pendingLine = n === k
        ? `That's every signal piece! Now we need to reach <b>Mission Control</b>.${R().sawMC ? " Remember that sealed door we found?" : " We haven't found its door yet..."}`
        : `${esc(e.name)} gave us a signal piece! That's <b>${n} of ${k}</b>.`;
      updateHint();
    }
    save();
  }
  let pendingLine = null;
  function renderQuiz() {
    const v = R().visits[ex.id] || {};
    const q = ex.quiz;
    $("#exBody").innerHTML = `<h3>${esc(q.q)}</h3>
      <div class="opts">${q.options.map((o, i) => `<button data-opt="${i}">${esc(o)}</button>`).join("")}</div>
      <p class="fb" id="fb" aria-live="polite">${v.quiz != null ? "You already earned stars for this one. Try it again anyway!" : ""}</p>`;
    $("#exBody").querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => answer(+b.dataset.opt, b)));
  }
  function answer(i, btn) {
    tries++;
    if (i !== ex.quiz.answer) {
      btn.classList.add("no"); btn.disabled = true;
      $("#fb").textContent = "Not quite. Want a hint? Check “In its own words”.";
      return;
    }
    btn.classList.add("yes");
    $("#exBody").querySelectorAll("[data-opt]").forEach((b) => (b.disabled = true));
    $("#fb").textContent = ex.quiz.explain;
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
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (pendingLine) { say(pendingLine, 8000); pendingLine = null; }
  });
  $("#readAloud").addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return toast("This browser can't read aloud.");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance($("#exBody").innerText);
    u.rate = 0.95;
    speechSynthesis.speak(u);
  });

  /* ---------------- ask the placard ---------------- */
  let chatHistory = [];
  $("#askBtn").addEventListener("click", () => {
    chatHistory = [];
    $("#chatExhibit").textContent = ex.name;
    $("#chatMode").textContent = window.CONFIG.askEndpoint ? "AI guide" : "offline guide";
    $("#chatLog").innerHTML = "";
    addMsg("bot", `Hi! I'm the placard for ${ex.name}. What do you want to know?`);
    const prompts = ["What is it doing now?", ...(ex.faq || []).slice(0, 3).map((f) => `Tell me about the ${f.keys[0]}`)];
    $("#chatSuggest").innerHTML = prompts.map((p) => `<button type="button">${esc(p)}</button>`).join("");
    $("#chatDialog").showModal();
    $("#chatInput").focus();
  });
  $("#chatSuggest").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    $("#chatInput").value = e.target.textContent;
    $("#chatForm").requestSubmit();
  });
  $("#chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("#chatInput").value.trim();
    if (!q) return;
    $("#chatInput").value = "";
    addMsg("me", q);
    const wait = addMsg("bot wait", "Thinking…");
    const res = await ExhibitGuide.ask(ex, q, chatHistory);
    wait.remove();
    addMsg("bot", res.text);
    $("#chatMode").textContent = res.mode === "ai" ? "AI guide" : "offline guide";
    chatHistory.push({ role: "user", content: q }, { role: "assistant", content: res.text });
    const v = visit(ex.id);
    if (!v.asked) { v.asked = true; award(1, "curious question"); }
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
    if (!allCollected()) return say(`We need all the signal pieces first.`);
    const t0 = performance.now();
    const v = Maze.verify(g, run.route);
    const ms = performance.now() - t0;
    const k = g.pieces.length;
    const delay = Math.min(60, 2400 / Math.max(1, v.steps.length));
    const chip = (s, i) => {
      const name = s.to == null ? "?" : roomName(s.to);
      return `<li class="${s.ok ? "" : "bad"}" style="animation-delay:${(i + 1) * delay}ms;--c:${s.sym != null ? SYM[s.sym].color : "#999"}"><span class="sy">${s.sym != null ? SYM[s.sym].ch : "?"}</span><span class="rn">${esc(name)}</span></li>`;
    };
    $("#finTitle").textContent = "Flight plan check";
    $("#finaleBody").innerHTML = `
      <p class="fin-lead">Before the Homecoming Signal can launch, ${esc(S.robotName)} checks the route you found, one door at a time.</p>
      <ol class="route"><li class="start"><span class="sy">●</span><span class="rn">Atrium</span></li>${v.steps.map(chip).join("")}</ol>
      <ul class="checks">${v.checks.map((c, i) => `<li class="${c.ok ? "ok" : c.bonus ? "miss" : "bad"}" style="animation-delay:${v.steps.length * delay + 200 + i * 250}ms">${c.ok ? "✓" : c.bonus ? "–" : "✗"} ${esc(c.label)}</li>`).join("")}</ul>
      <div class="fin-stats" style="animation-delay:${v.steps.length * delay + 1400}ms">
        <div><b>${run.route.length}</b><span>doors you opened to <em>find</em> this route</span></div>
        <div><b>${ms < 1 ? "&lt;1 ms" : ms.toFixed(1) + " ms"}</b><span>for ${esc(S.robotName)} to <em>check</em> it</span></div>
        <div><b>${g.best}</b><span>doors in today's shortest route. To be sure, the computer tried all ${g.orders} orders of the ${k} pieces</span></div>
      </div>
      <blockquote class="voice fin-quote" style="animation-delay:${v.steps.length * delay + 1900}ms">Finding the route took exploring: lots of doors, some dead ends. Checking it took one quick look at each door. Puzzles like this are one of the biggest mysteries in computer science. It's called <b>P vs NP</b>: nobody knows if every puzzle that's quick to check is also quick to solve.${k >= 5 ? " With 20 pieces, there would be more than 2 quintillion orders to try!" : ""}</blockquote>`;
    $("#finaleFoot").innerHTML = `<span class="grow"></span><button class="btn primary" id="sendSignal">Send the Homecoming Signal</button>`;
    $("#finaleDialog").showModal();
    $("#sendSignal").onclick = () => sendSignal(v);
  }

  function sendSignal(v) {
    const g = G(), run = R(), k = g.pieces.length;
    const firstTime = !run.done;
    if (firstTime) {
      run.done = true;
      const gold = g.par && run.route.length <= g.par;
      S.best[run.level] = Math.min(S.best[run.level] || Infinity, run.route.length);
      save();
      award(5, "signal sent");
      if (gold) setTimeout(() => award(3, "gold route"), 900);
    }
    $("#finTitle").textContent = "Signal sent!";
    const slices = [...Array(k)].map((_, i) => `<div class="pbd-slice" style="--i:${i};--k:${k};background-position:${k > 1 ? (i / (k - 1)) * 100 : 0}% 0"></div>`).join("");
    $("#finaleBody").innerHTML = `
      <div class="pbd" style="--k:${k}">${slices}<div class="pbd-dot"></div></div>
      <p class="fin-lead">The ${k} pieces snap together into a picture: the <b>Pale Blue Dot</b>.</p>
      <p>On February 14, 1990, Voyager 1 turned its camera back toward home and took this picture from about 6 billion kilometers away. That tiny speck in the sunbeam is Earth.</p>
      <p>Every machine in this museum came from that dot. Their missions are over, but they're not forgotten: the Homecoming Signal is how we say <b>we remember you</b>.</p>
      <p class="story-level">${LV().label} · layout #${run.seed} · ${run.route.length} doors${g.par ? (run.route.length <= g.par ? " · gold route!" : ` · gold was ${g.par}`) : ""}</p>`;
    $("#finaleFoot").innerHTML = `<button class="btn ghost" id="keepExploring">Keep exploring</button><span class="grow"></span>
      <span class="fin-new">New museum:</span>
      ${["easy", "medium", "hard"].map((l) => `<button class="btn ${l === run.level ? "primary" : ""}" data-newrun="${l}">${Maze.LEVELS[l].label}</button>`).join("")}`;
    $("#keepExploring").onclick = () => $("#finaleDialog").close();
    $("#finaleFoot").querySelectorAll("[data-newrun]").forEach((b) => (b.onclick = () => {
      $("#finaleDialog").close();
      newRun(b.dataset.newrun);
      enterMuseum(false);
      setTimeout(openStory, 300);
    }));
  }

  /* =========================================================
   * ROBOT BAY
   * ========================================================= */
  const SLOTS = { color: "Paint", eyes: "Eye lights", hat: "Hats", gear: "Gear" };
  $("#workshopBtn").addEventListener("click", openWorkshop);
  function openWorkshop() { renderWorkshop(); $("#workshopDialog").showModal(); }
  function renderWorkshop() {
    $("#wsRobotName").textContent = S.robotName;
    $("#wsPreview").innerHTML = Robot.svg(S.look) + `<p class="ws-stars">${S.stars} star${S.stars === 1 ? "" : "s"} to spend</p>`;
    $("#wsShop").innerHTML = Object.keys(SLOTS).map((slot) => {
      const items = M.shop.filter((i) => i.slot === slot).map((it) => {
        const owned = S.owned.includes(it.id);
        const on = S.look[slot] === it.value;
        const sw = slot === "color" || slot === "eyes" ? `<i class="sw" style="background:${it.value}"></i>` : "";
        const tag = on ? "Wearing" : owned ? "Yours" : `${it.cost} ★`;
        return `<button class="part${on ? " on" : ""}${!owned && S.stars < it.cost ? " short" : ""}" data-item="${it.id}">${sw}<span>${esc(it.name)}</span><em>${tag}</em></button>`;
      }).join("");
      return `<h4>${SLOTS[slot]}</h4><div class="parts">${items}</div>`;
    }).join("");
  }
  $("#wsShop").addEventListener("click", (e) => {
    const b = e.target.closest("[data-item]");
    if (!b) return;
    const it = M.shop.find((i) => i.id === b.dataset.item);
    if (!S.owned.includes(it.id)) {
      if (S.stars < it.cost) { const need = it.cost - S.stars; return toast(`${need} more star${need > 1 ? "s" : ""} needed for ${it.name}`); }
      S.stars -= it.cost;
      S.owned.push(it.id);
      toast(`Unlocked: ${it.name}`);
    }
    S.look[it.slot] = it.value;
    save();
    updateHUD();
    renderWorkshop();
    if (robot) {
      scene.remove(robot);
      robot = Models.robot(S.look);
      robot.scale.setScalar(0.85);
      robot.position.set(Rb.x, 0, Rb.z);
      scene.add(robot);
    }
  });

  /* ---------- dialogs: close buttons + backdrop click ---------- */
  document.querySelectorAll("dialog [data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
  document.querySelectorAll("dialog:not(#finaleDialog):not(#storyDialog)").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  /* ---------- boot ---------- */
  buildIntro();
  window.resetMuseum = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };
  // for testing: Museum.debug() prints today's hidden network
  window.Museum = {
    debug: () => S.run && S.run.graph,
    state: () => S,
    // walk to door number i in this room and open it (same as clicking it)
    door: (i) => { const o = doorObjs.find((x) => x.door.i === i); if (o) goToSpot(o.spot); return !!o; },
    spot: (kind) => { const sp = spots.find((x) => x.kind === kind); if (sp) goToSpot(sp); return !!sp; },
  };
})();
