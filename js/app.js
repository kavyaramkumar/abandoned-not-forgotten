/*
 * SILENT EXPLORERS MUSEUM: a walkable 3D museum
 * ------------------------------------------------------------
 * The museum is a real floor plan: a lobby in the middle, the Moon Wing to the
 * west, the Mars Wing to the north, the Deep Space Wing to the east, and the
 * Field Trip Journal room at the far end of Deep Space.
 *
 *   Walk:        click the floor, or WASD / arrow keys
 *   Camera:      drag to turn and tilt, scroll to zoom, Q / E to turn
 *   Bird's-eye:  M or the "Bird's-eye map" button, then click a room or a machine
 *   Look closer: walk up to an exhibit and click it, or press Enter
 *
 * Walls between the camera and you drop down (a "dollhouse" cutaway), so
 * you can always see your character. Nothing is locked: stars only buy robot
 * upgrades. World units are meters.
 */
(function () {
  const M = window.MUSEUM;
  const T = THREE;
  const $ = (s, el = document) => el.querySelector(s);
  const SAVE_KEY = "silent-explorers-v2";

  const SKINS = ["#f1c7a5", "#d9a074", "#a8693f", "#6b4228"];
  const SHIRTS = ["#2f6fb5", "#c4472d", "#2f8a5b", "#7a4bb0"];

  /* ---------------- State ---------------- */
  const fresh = () => ({
    player: "",
    robotName: "Echo",
    kid: { skin: SKINS[1], shirt: SHIRTS[0] },
    stars: 0,
    visits: {}, // exhibitId -> { story, quiz (stars), asked }
    owned: ["c-silver", "e-cyan", "h-none", "g-none"],
    look: { color: "#c9d3e6", eyes: "#5ef2ff", hat: "none", gear: "none" },
  });
  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(fresh(), JSON.parse(raw));
    } catch (e) {}
    return fresh();
  }
function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(S));
      if (typeof saveCloudProgress === "function") saveCloudProgress(S);
    } catch (e) {}
  }

  window.applyCloudState = function (cloudData) {
    if (!cloudData) return;
    S.player = cloudData.player ?? "";
    S.robotName = cloudData.robot_name ?? "Echo";
    if (cloudData.kid) S.kid = cloudData.kid;
    S.stars = cloudData.stars ?? 0;
    S.visits = cloudData.visits ?? {};
    S.owned = cloudData.owned ?? ["c-silver", "e-cyan", "h-none", "g-none"];
    if (cloudData.look) S.look = cloudData.look;

    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}

    buildIntro();
    if ($("#hudName")) $("#hudName").textContent = S.player;
    updateHUD();
    drawActors();
    if (robot) robot.position.set(Rb.x, 0, Rb.z);
    renderJournal();
    refreshPins();
    spots.forEach((sp) => { if (sp.labelBoard) sp.labelBoard.redraw(); });
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wings = M.wings.filter((w) => !w.comingSoon);
  const soon = M.wings.filter((w) => w.comingSoon);
  const allEx = wings.flatMap((w) => w.exhibits.map((e, i) => ({ ...e, wing: w, code: `${w.code}-${String(i + 1).padStart(2, "0")}` })));
  const stamped = (id) => !!(S.visits[id] && S.visits[id].story);
  const wingById = (id) => wings.find((w) => w.id === id);

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
        $("#lookPreview").innerHTML = Art.kid(S.kid);
      });
    });
    $("#lookPreview").innerHTML = Art.kid(S.kid);
    $("#playerName").value = S.player;
    $("#robotName").value = S.robotName;
    if (S.player) $("#startBtn").textContent = "Continue the field trip";
  }

  $("#introForm").addEventListener("submit", (e) => {
    e.preventDefault();
    S.player = $("#playerName").value.trim() || "Explorer";
    S.robotName = $("#robotName").value.trim() || "Echo";
    save();
    enterMuseum(true);
  });
  $("#skipIntro").addEventListener("click", () => $("#intro").classList.add("skipped"));

  /* =========================================================
   * FLOOR PLAN
   * ========================================================= */
  const WALL_H = 4.2;   // full wall height
  const CUT_H = 0.45;   // a wall that's in the way drops to this
  const MAP_H = 0.9;    // every wall in bird's-eye view
  const WALL_T = 0.3;
  const R_PLAYER = 0.35;

  // Rooms are rectangles (x0..x1, z0..z1). North is -z.
  const ROOMS = [
    { id: "lobby", name: "Lobby", x0: -12, x1: 12, z0: -9, z1: 9, wall: "#e7ddc9", floor: "tile", anchor: [0, 4.6] },
    { id: "moon", wingId: "moon", x0: -40, x1: -12, z0: -6, z1: 6, axis: "x", dir: -1, entry: -12 },
    { id: "mars", wingId: "mars", x0: -7, x1: 7, z0: -40, z1: -9, axis: "z", dir: -1, entry: -9 },
    { id: "deep", wingId: "deep", x0: 12, x1: 40, z0: -6, z1: 6, axis: "x", dir: 1, entry: 12 },
    { id: "exit", name: "Journal", x0: 30, x1: 42, z0: 6, z1: 18, wall: "#ece2cc", floor: "wood", anchor: [36, 9.6] },
  ];
  // A door sits on the line x=at (axis "x") or z=at (axis "z"), centered at c along that line.
  const DOORS = [
    { a: "lobby", b: "moon", axis: "x", at: -12, c: 0, w: 3.4 },
    { a: "lobby", b: "mars", axis: "z", at: -9, c: 0, w: 3.4 },
    { a: "lobby", b: "deep", axis: "x", at: 12, c: 0, w: 3.4 },
    { a: "deep", b: "exit", axis: "z", at: 6, c: 36, w: 3.4 },
  ];
  ROOMS.forEach((r) => {
    r.wing = r.wingId ? wingById(r.wingId) : null;
    if (r.wing) {
      r.name = r.wing.name;
      r.wall = r.wing.wall;
      r.floor = "wood-dark";
      const mid = r.axis === "x" ? (r.z0 + r.z1) / 2 : (r.x0 + r.x1) / 2;
      r.anchor = r.axis === "x" ? [r.entry + r.dir * 3.5, mid + 1.5] : [mid, r.entry + r.dir * 3.5];
    }
    r.cx = (r.x0 + r.x1) / 2;
    r.cz = (r.z0 + r.z1) / 2;
  });
  const roomById = (id) => ROOMS.find((r) => r.id === id);

  /* =========================================================
   * THREE.JS SETUP
   * ========================================================= */
  let renderer, scene, camera, sun, kid, robot;
  const sides = [];        // wall sides that can drop down: { n, group, decor, h, meshes }
  const wallMeshes = [];   // for camera-blocking raycasts
  const pickables = [];    // meshes you can click: userData.spot or userData.floor
  const obstacles = [];    // circles: { x, z, r }
  const spots = [];        // interactables: { kind, pos:[x,z], face, top:V3, ex?, ring, label? }
  const boards = [];       // canvas boards to redraw once fonts load
  const ray = new T.Raycaster();
  const V = (x, y, z) => new T.Vector3(x, y, z);

  function initThree() {
    const canvas = $("#scene");
    renderer = new T.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    scene = new T.Scene();
    scene.background = nightSky();
    camera = new T.PerspectiveCamera(45, 1, 0.1, 400);

    scene.add(new T.HemisphereLight("#fff4e0", "#4a3a2c", 1.25));
    scene.add(new T.AmbientLight("#ffffff", 0.25));
    sun = new T.DirectionalLight("#fff1d6", 1.3);
    sun.castShadow = true;
    const small = Math.min(innerWidth, innerHeight) < 600;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
    sun.shadow.bias = -0.0008;
    scene.add(sun, sun.target);

    // dark ground under the whole museum
    const ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshBasicMaterial({ color: "#14120f" }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);

    resize();
    addEventListener("resize", resize);
  }

  // mix two hex colors in sRGB (what designers expect), returns hex
  function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
    return "#" + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0");
  }

  // the museum sits under a night sky full of stars
  function nightSky() {
    const c = document.createElement("canvas");
    c.width = 1024; c.height = 1024;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, "#0a0f24"); g.addColorStop(1, "#2a3360");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 420; i++) {
      x.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.7})`;
      const r = rnd() < 0.08 ? 1.8 : 0.9;
      x.beginPath(); x.arc(rnd() * 1024, rnd() * 1024, r, 0, Math.PI * 2); x.fill();
    }
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }

  function resize() {
    if (!renderer) return;
    const st = $("#stage");
    const w = st.clientWidth, h = st.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 58 : 45;
    camera.updateProjectionMatrix();
  }

  /* ---------------- materials ---------------- */
  const floorTex = {};
  function floorMat(kind, w, d) {
    const key = kind;
    if (!floorTex[key]) {
      floorTex[key] =
        kind === "tile" ? Models.tileTex("#e9e1cf", "#d3c6aa") :
        kind === "wood-dark" ? Models.woodTex("#6b4a32") : Models.woodTex("#8a5d3c");
    }
    const t = floorTex[key].clone();
    t.needsUpdate = true;
    const scale = kind === "tile" ? 2 : 4;
    t.repeat.set(w / scale, d / scale);
    return new T.MeshStandardMaterial({ map: t, roughness: kind === "tile" ? 0.35 : 0.7, metalness: 0.05 });
  }

  function wallMats(color) {
    const face = new T.MeshStandardMaterial({ color, roughness: 0.9 });
    const top = new T.MeshStandardMaterial({ color: "#2b2520", roughness: 0.9 });
    return [face, face, top, face, face, face];
  }

  /* =========================================================
   * BUILD THE WORLD
   * ========================================================= */
  function buildWorld() {
    ROOMS.forEach(buildRoom);
    DOORS.forEach(buildDoorFrame);
    buildLobby();
    ROOMS.filter((r) => r.wing).forEach(buildWing);
    buildJournalRoom();
    buildMapLabels();
    buildMinimap();
    renderJournal();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => boards.forEach((b) => b.redraw()));
  }

  function buildRoom(r) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const floor = new T.Mesh(new T.PlaneGeometry(w, d), floorMat(r.floor, w, d));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(r.cx, 0, r.cz);
    floor.receiveShadow = true;
    floor.userData.floor = r;
    scene.add(floor);
    pickables.push(floor);

    const mats = wallMats(r.wall);
    const base = new T.MeshStandardMaterial({ color: "#2b2520", roughness: 0.8 });
    // four sides; each has its inward normal and the span it covers
    const defs = [
      { side: "N", n: [0, 1], line: r.z0, from: r.x0, to: r.x1 },
      { side: "S", n: [0, -1], line: r.z1, from: r.x0, to: r.x1 },
      { side: "W", n: [1, 0], line: r.x0, from: r.z0 + WALL_T, to: r.z1 - WALL_T },
      { side: "E", n: [-1, 0], line: r.x1, from: r.z0 + WALL_T, to: r.z1 - WALL_T },
    ];
    r.sides = {};
    defs.forEach((dfn) => {
      const alongX = dfn.n[0] === 0;
      const gaps = DOORS.filter((dr) => (dr.a === r.id || dr.b === r.id) && dr.axis === (alongX ? "z" : "x") && dr.at === dfn.line)
        .map((dr) => [dr.c - dr.w / 2, dr.c + dr.w / 2]);
      const segs = [];
      let start = dfn.from;
      gaps.sort((a, b) => a[0] - b[0]).forEach(([g0, g1]) => { if (g0 > start) segs.push([start, g0]); start = Math.max(start, g1); });
      if (dfn.to > start) segs.push([start, dfn.to]);

      const group = new T.Group();
      const decor = new T.Group();
      scene.add(group, decor);
      const inner = dfn.line + (alongX ? dfn.n[1] : dfn.n[0]) * WALL_T; // coordinate of the inner face
      const mid = dfn.line + (alongX ? dfn.n[1] : dfn.n[0]) * WALL_T / 2;
      const meshes = [];
      segs.forEach(([a, b]) => {
        const len = b - a, c = (a + b) / 2;
        const box = new T.Mesh(new T.BoxGeometry(alongX ? len : WALL_T, WALL_H, alongX ? WALL_T : len), mats);
        box.position.set(alongX ? c : mid, WALL_H / 2, alongX ? mid : c);
        box.castShadow = box.receiveShadow = true;
        group.add(box);
        meshes.push(box);
        wallMeshes.push(box);
        const bb = new T.Mesh(new T.BoxGeometry(alongX ? len : 0.06, 0.2, alongX ? 0.06 : len), base);
        const bi = inner + (alongX ? dfn.n[1] : dfn.n[0]) * 0.03;
        bb.position.set(alongX ? c : bi, 0.1, alongX ? bi : c);
        group.add(bb);
      });
      const s = { room: r, side: dfn.side, n: V(dfn.n[0], 0, dfn.n[1]), group, decor, meshes, h: WALL_H, inner, alongX, from: dfn.from, to: dfn.to };
      meshes.forEach((m) => (m.userData.side = s));
      sides.push(s);
      r.sides[dfn.side] = s;
    });
  }

  // place something flat against the inner face of a wall side
  function onWall(s, mesh, along, y, out) {
    const o = (out || 0.03);
    if (s.alongX) mesh.position.set(along, y, s.inner + s.n.z * o);
    else mesh.position.set(s.inner + s.n.x * o, y, along);
    mesh.rotation.y = Math.atan2(s.n.x, s.n.z);
    s.decor.add(mesh);
    return mesh;
  }

  function framed(s, tex, along, y, w, h, frameColor) {
    const g = new T.Group();
    const frame = new T.Mesh(new T.BoxGeometry(w + 0.24, h + 0.24, 0.08), new T.MeshStandardMaterial({ color: frameColor || "#b8892f", metalness: 0.5, roughness: 0.35 }));
    g.add(frame);
    const pic = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
    pic.position.z = 0.045;
    g.add(pic);
    return onWall(s, g, along, y, 0.05);
  }

  function addBoard(s, opts, along, y, out) {
    const b = Models.board(opts);
    boards.push(b);
    onWall(s, b.mesh, along, y, out || 0.04);
    return b;
  }

  function buildDoorFrame(d) {
    // colored pillars on both sides of each doorway, plus a sign on the lobby side
    const ra = roomById(d.a), rb = roomById(d.b);
    const wing = rb.wing;
    const color = wing ? wing.color : "#b8892f";
    const mat = new T.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2 });
    [ra, rb].forEach((r) => {
      const s = d.axis === "x" ? (r.x0 === d.at ? r.sides.W : r.sides.E) : (r.z0 === d.at ? r.sides.N : r.sides.S);
      [-1, 1].forEach((k) => {
        const p = new T.Mesh(new T.BoxGeometry(0.35, WALL_H, 0.35), mat);
        const along = d.c + k * (d.w / 2 + 0.05);
        const inner = s.inner + (s.alongX ? s.n.z : s.n.x) * 0.12;
        p.position.set(s.alongX ? along : inner, WALL_H / 2, s.alongX ? inner : along);
        p.castShadow = true;
        s.group.add(p);
      });
      // lintel above the doorway
      const lintel = new T.Mesh(new T.BoxGeometry(s.alongX ? d.w + 0.4 : WALL_T, 0.9, s.alongX ? WALL_T : d.w + 0.4), wallMats(r.wall));
      const mid = s.inner - (s.alongX ? s.n.z : s.n.x) * WALL_T / 2;
      lintel.position.set(s.alongX ? d.c : mid, WALL_H - 0.45, s.alongX ? mid : d.c);
      s.decor.add(lintel);
      const label = r === ra ? (wing ? wing.name : rb.name) : ra.name;
      const sign = Models.board({ w: d.w + 0.2, h: 0.62, ppm: 260, bg: "#1f2330", draw: (x, W, H) => {
        x.fillStyle = color; x.fillRect(0, H - 10, W, 10);
        x.fillStyle = "#f6f0e3";
        x.font = `800 ${H * 0.46}px Fraunces, Georgia, serif`;
        x.textAlign = "center"; x.textBaseline = "middle";
        x.fillText(label, W / 2, H * 0.47);
      } });
      boards.push(sign);
      onWall(s, sign.mesh, d.c, WALL_H - 0.45, 0.04);
    });
  }

  /* ---------------- Lobby ---------------- */
  function buildLobby() {
    const r = roomById("lobby");
    const N = r.sides.N;
    addBoard(N, {
      w: 7, h: 3.1, accent: "#b8892f", kicker: "Welcome to", title: "The Silent Explorers Museum", titleSize: 6.2,
      body: [
        "Every machine in this museum finished the job it was sent to do. But its story didn't end there.",
        "Some still sit right where they landed. Some are still flying, farther from home than anything else people have built.",
      ], bodySize: 3.2,
      footer: "← MOON WING     MARS WING ↑     DEEP SPACE →",
    }, -7, 2.3);

    const sorted = allEx.slice().sort((a, b) => a.year - b.year);
    const tl = addBoard(N, {
      w: 7, h: 3.1, accent: "#c4472d", draw: (x, W, H, u) => {
        x.fillStyle = "#c4472d";
        x.font = `700 ${3.1 * u}px "IBM Plex Mono", monospace`;
        x.textBaseline = "top";
        x.fillText("HOW THE STORY FITS TOGETHER", 6 * u, 6 * u);
        x.fillStyle = "#1f2330";
        x.font = `800 ${6 * u}px Fraunces, Georgia, serif`;
        x.fillText("Mission timeline", 6 * u, 11 * u);
        const y0 = 21 * u, rowH = (H - y0 - 9 * u) / 5;
        sorted.forEach((e, i) => {
          const col = i < 5 ? 0 : 1, row = i % 5;
          const xx = 6 * u + col * 46 * u, yy = y0 + row * rowH;
          x.fillStyle = e.wing.color; x.fillRect(xx, yy, 1 * u, rowH * 0.8);
          x.fillStyle = "#4a4f5c"; x.font = `700 ${2.8 * u}px "IBM Plex Mono", monospace`;
          x.fillText(String(e.year), xx + 2.4 * u, yy + 0.6 * u);
          x.fillStyle = "#1f2330";
          let fs = 3.1 * u;
          x.font = `700 ${fs}px "Atkinson Hyperlegible", Arial, sans-serif`;
          while (x.measureText(e.name).width > 33 * u && fs > 2 * u) { fs -= 0.1 * u; x.font = `700 ${fs}px "Atkinson Hyperlegible", Arial, sans-serif`; }
          x.fillText(e.name, xx + 11 * u, yy + 0.4 * u + (3.1 * u - fs) / 2);
        });
        x.fillStyle = "#b8892f"; x.font = `700 ${2.7 * u}px "IBM Plex Mono", monospace`;
        x.textBaseline = "bottom";
        x.fillText("LOOK CLOSER TO PICK ONE AND WALK THERE", 6 * u, H - 4 * u);
      },
    }, 7, 2.3);
    addSpot({ kind: "timeline", pos: [7, -6.2], face: Math.PI, top: V(7, 4.1, -8.6), mesh: tl.mesh, label: "Mission timeline" });

    // Earth globe in the middle: where every mission started
    const ped = new T.Mesh(new T.CylinderGeometry(0.9, 1.1, 0.9, 32), new T.MeshStandardMaterial({ color: "#2b2520", roughness: 0.6 }));
    ped.position.set(0, 0.45, 0);
    const globe = new T.Mesh(new T.SphereGeometry(1.05, 40, 28), new T.MeshStandardMaterial({ map: Models.globeTex(), roughness: 0.55 }));
    globe.position.set(0, 2.05, 0);
    globe.rotation.z = 0.41;
    const moon = new T.Mesh(new T.SphereGeometry(0.26, 20, 14), new T.MeshStandardMaterial({ color: "#cfcac0", roughness: 0.9 }));
    const orbit = new T.Group();
    orbit.position.set(0, 2.05, 0);
    moon.position.set(1.9, 0.2, 0);
    orbit.add(moon);
    scene.add(Models.shadowAll(ped), Models.shadowAll(globe), Models.shadowAll(orbit));
    spin.push({ o: globe, s: 0.15 }, { o: orbit, s: 0.35 });
    obstacles.push({ x: 0, z: 0, r: 1.5 });
    const plaque = Models.board({ w: 1.6, h: 0.45, ppm: 300, bg: "#f6f0e3", accent: "#2c6fb0", draw: (x, W, H) => {
      x.fillStyle = "#2c6fb0"; x.fillRect(0, 0, W, 8);
      x.fillStyle = "#1f2330"; x.font = `800 ${H * 0.36}px Fraunces, Georgia, serif`; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("Earth: where every trip starts", W / 2, H * 0.55);
    } });
    boards.push(plaque);
    plaque.mesh.position.set(0, 0.55, 1.06);
    plaque.mesh.rotation.x = -0.25;
    scene.add(plaque.mesh);

    // Robot Bay: a glowing charging pad in the south-west corner
    const bx = -8.5, bz = 5.6;
    const pad = new T.Mesh(new T.CylinderGeometry(1.4, 1.5, 0.12, 40), new T.MeshStandardMaterial({ color: "#1f2330", roughness: 0.4, metalness: 0.4 }));
    pad.position.set(bx, 0.06, bz);
    const ring = new T.Mesh(new T.TorusGeometry(1.2, 0.05, 8, 48), new T.MeshBasicMaterial({ color: "#5ef2ff" }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(bx, 0.14, bz);
    const post = new T.Mesh(new T.BoxGeometry(0.12, 2.6, 0.12), new T.MeshStandardMaterial({ color: "#2b2520" }));
    post.position.set(bx - 1.5, 1.3, bz - 0.4);
    scene.add(Models.shadowAll(pad), ring, Models.shadowAll(post));
    const bsign = Models.board({ w: 2.2, h: 0.9, ppm: 240, bg: "#1f2330", draw: (x, W, H) => {
      x.fillStyle = "#5ef2ff"; x.fillRect(0, 0, W, 8);
      x.fillStyle = "#f6f0e3"; x.font = `800 ${H * 0.34}px Fraunces, Georgia, serif`; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("ROBOT BAY", W / 2, H * 0.42);
      x.fillStyle = "#e8b53a"; x.font = `700 ${H * 0.16}px "IBM Plex Mono", monospace`;
      x.fillText("SPEND STARS ON UPGRADES", W / 2, H * 0.75);
    } });
    boards.push(bsign);
    bsign.mesh.position.set(bx - 0.4, 2.45, bz - 0.4);
    scene.add(bsign.mesh);
    spin.push({ o: ring, pulse: true });
    pad.userData.spot = addSpot({ kind: "bay", pos: [bx, bz], face: 0, top: V(bx, 3.2, bz), mesh: pad, label: "Robot Bay" });

    // potted plants for a bit of life
    [[-10.6, -7.6], [10.6, -7.6], [10.6, 7.6]].forEach(([x, z]) => plant(x, z));

    // entrance doors (south wall)
    const S = r.sides.S;
    const doors = new T.Mesh(new T.BoxGeometry(3, 3.2, 0.1), new T.MeshStandardMaterial({ color: "#3a4a5c", roughness: 0.2, metalness: 0.4 }));
    onWall(S, doors, 0, 1.6, 0.06);
  }

  function plant(x, z) {
    const pot = new T.Mesh(new T.CylinderGeometry(0.35, 0.28, 0.6, 16), new T.MeshStandardMaterial({ color: "#c4472d", roughness: 0.8 }));
    pot.position.set(x, 0.3, z);
    const bush = new T.Group();
    [[0, 1.0, 0, 0.5], [0.25, 1.3, 0.1, 0.38], [-0.2, 1.35, -0.1, 0.36], [0, 1.6, 0, 0.3]].forEach(([dx, y, dz, r]) => {
      const b = new T.Mesh(new T.IcosahedronGeometry(r, 1), new T.MeshStandardMaterial({ color: "#3f7a4a", roughness: 0.9, flatShading: true }));
      b.position.set(x + dx, y, z + dz);
      bush.add(b);
    });
    scene.add(Models.shadowAll(pot), Models.shadowAll(bush));
    obstacles.push({ x, z, r: 0.5 });
  }

  /* ---------------- Wings ---------------- */
  function buildWing(r) {
    const w = r.wing;
    const len = Math.abs((r.axis === "x" ? r.x1 - r.x0 : r.z1 - r.z0));
    // a carpet runner down the middle in the wing's color
    const runnerColor = new T.Color(mixHex(w.color, "#1c1a22", 0.72));
    const runner = new T.Mesh(new T.PlaneGeometry(r.axis === "x" ? len - 1.2 : 2.6, r.axis === "x" ? 2.6 : len - 1.2), new T.MeshStandardMaterial({ color: runnerColor, roughness: 0.95 }));
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(r.axis === "x" ? r.cx : r.cx, 0.01, r.axis === "x" ? r.cz + 1.5 : r.cz);
    runner.receiveShadow = true;
    scene.add(runner);

    // the wing's big question on the far end wall
    const endSide = r.axis === "x" ? (r.dir < 0 ? r.sides.W : r.sides.E) : r.sides.N;
    addBoard(endSide, {
      w: 6.4, h: 3, bg: "#f6f0e3", accent: w.color, kicker: "The big question", kickerColor: "#8a6420",
      title: w.question, titleSize: 6.4, body: w.intro, bodySize: 3.3, footer: `${w.name.toUpperCase()} · ${w.exhibits.length} MACHINES`,
    }, endSide.alongX ? r.cx : r.cz, 2.3);

    w.exhibits.forEach((e, i) => {
      const ex = allEx.find((a) => a.id === e.id);
      const along = r.entry + r.dir * (6.5 + i * 7);
      // x-axis wings: every exhibit on the north wall (south side is the walkway)
      // z-axis wing (Mars): alternate west and east walls
      const side = r.axis === "x" ? r.sides.N : (i % 2 === 0 ? r.sides.W : r.sides.E);
      buildExhibit(ex, side, along);
    });
  }

  function buildExhibit(ex, s, along) {
    const n = s.n;
    const out = (d) => (s.alongX ? [along, s.inner + n.z * d] : [s.inner + n.x * d, along]);
    const rot = Math.atan2(n.x, n.z);

    // diorama painting on the wall: where it is now
    const bd = Models.svgTexture(Art.backdrop(ex.backdrop), 420);
    framed(s, bd, along, 2.75, 3.3, 2.2);

    // pedestal + glass case + the machine inside
    const g = new T.Group();
    const [px, pz] = out(1.45);
    g.position.set(px, 0, pz);
    g.rotation.y = rot;
    const ped = new T.Mesh(new T.BoxGeometry(1.7, 0.95, 1.2), new T.MeshStandardMaterial({ color: "#2b2520", roughness: 0.6 }));
    ped.position.y = 0.475;
    const trim = new T.Mesh(new T.BoxGeometry(1.76, 0.06, 1.26), new T.MeshStandardMaterial({ color: "#b8892f", metalness: 0.6, roughness: 0.3 }));
    trim.position.y = 0.95;
    g.add(ped, trim);
    const glass = new T.Mesh(new T.BoxGeometry(1.6, 1.35, 1.1), new T.MeshStandardMaterial({ color: "#dff2ff", transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.2, depthWrite: false }));
    glass.position.y = 0.98 + 0.675;
    const edges = new T.LineSegments(new T.EdgesGeometry(glass.geometry), new T.LineBasicMaterial({ color: "#f3e6c4", transparent: true, opacity: 0.7 }));
    edges.position.copy(glass.position);
    g.add(glass, edges);
    const hw = Models.svgTexture(Art.hardware(ex.art), 512);
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: hw, toneMapped: false, alphaTest: 0.05 }));
    const h = 1.2;
    sprite.center.set(0.5, 0);
    sprite.scale.set(h * hw.userData.aspect, h, 1);
    sprite.position.y = 1.0;
    g.add(sprite);
    // label card on the front of the pedestal
    const label = Models.board({ w: 1.3, h: 0.6, ppm: 380, draw: (x, W, H) => drawLabel(x, W, H, ex) });
    boards.push(label);
    label.mesh.position.set(0, 0.5, 0.605);
    g.add(label.mesh);
    // warm light pool on the floor
    g.add(lightPool(3.6));
    Models.shadowAll(ped);
    trim.castShadow = true;
    scene.add(g);
    [ped, glass, sprite, label.mesh].forEach((m) => pickables.push(m));
    obstacles.push({ x: px, z: pz, r: 1.15 });

    const [sx, sz] = out(3.5);
    const spot = addSpot({ kind: "exhibit", ex, pos: [sx, sz], face: rot + Math.PI, top: V(px, 2.75, pz), mesh: ped, label: ex.name });
    [ped, glass, sprite, label.mesh].forEach((m) => (m.userData.spot = spot));
    spot.labelBoard = label;
    spot.pedestal = [px, pz];
  }

  function drawLabel(x, W, H, ex) {
    x.fillStyle = "#f6f0e3"; x.fillRect(0, 0, W, H);
    x.fillStyle = ex.wing.color; x.fillRect(0, 0, 10, H);
    x.fillStyle = "#4a4f5c"; x.font = `700 ${H * 0.13}px "IBM Plex Mono", monospace`; x.textBaseline = "top";
    x.fillText(`${ex.code} · ${ex.year}`, 26, H * 0.12);
    x.fillStyle = "#1f2330"; x.font = `800 ${H * (ex.name.length > 16 ? 0.19 : 0.24)}px Fraunces, Georgia, serif`;
    x.fillText(ex.name, 26, H * 0.32);
    x.fillStyle = "#4a4f5c"; x.font = `400 ${H * 0.12}px "Atkinson Hyperlegible", Arial, sans-serif`;
    x.fillText(ex.place, 26, H * 0.66);
    if (stamped(ex.id)) {
      x.save();
      x.translate(W - 70, H * 0.5); x.rotate(-0.25);
      x.strokeStyle = "#c4472d"; x.lineWidth = 5; x.strokeRect(-56, -22, 112, 44);
      x.fillStyle = "#c4472d"; x.font = `700 26px "IBM Plex Mono", monospace`; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("VISITED", 0, 2);
      x.restore();
    }
  }

  function lightPool(size) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,230,170,.35)");
    gr.addColorStop(1, "rgba(255,230,170,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0.015, 1.4);
    return m;
  }

  /* ---------------- Journal room ---------------- */
  let journalBoard;
  function buildJournalRoom() {
    const r = roomById("exit");
    // podium with an open book
    const g = new T.Group();
    g.position.set(36, 0, 12.4);
    const ped = new T.Mesh(new T.BoxGeometry(1.4, 1.0, 1.0), new T.MeshStandardMaterial({ color: "#2b2520", roughness: 0.6 }));
    ped.position.y = 0.5;
    const top = new T.Mesh(new T.BoxGeometry(1.6, 0.08, 1.2), new T.MeshStandardMaterial({ color: "#b8892f", metalness: 0.5, roughness: 0.35 }));
    top.position.y = 1.04;
    top.rotation.x = -0.25;
    const pageMat = new T.MeshStandardMaterial({ color: "#fbf6ea", roughness: 0.9 });
    [-1, 1].forEach((k) => {
      const page = new T.Mesh(new T.BoxGeometry(0.6, 0.03, 0.8), pageMat);
      page.position.set(k * 0.31, 1.12, 0);
      page.rotation.set(-0.25, 0, k * -0.08);
      g.add(page);
    });
    g.add(ped, top);
    scene.add(Models.shadowAll(g));
    obstacles.push({ x: 36, z: 12.4, r: 1.0 });
    const spot = addSpot({ kind: "journal", pos: [36, 10.4], face: 0, top: V(36, 2.4, 12.4), mesh: ped, label: "Field Trip Journal" });
    [ped, top].forEach((m) => { m.userData.spot = spot; pickables.push(m); });

    // big board on the east wall: how many machines you've met
    journalBoard = addBoard(r.sides.E, { w: 5.6, h: 2.8, accent: "#b8892f", draw: drawJournalBoard }, 12, 2.3);

    // under construction doorway on the west wall
    const W = r.sides.W;
    const hole = new T.Mesh(new T.PlaneGeometry(3, 3.2), new T.MeshBasicMaterial({ color: "#0d0c0b" }));
    onWall(W, hole, 12.5, 1.6, 0.03);
    const tape = Models.board({ w: 3.4, h: 3.2, ppm: 160, bg: "rgba(0,0,0,0)", draw: (x, Wd, Hd) => {
      x.clearRect(0, 0, Wd, Hd);
      const stripe = (y, a) => {
        x.save(); x.translate(Wd / 2, y); x.rotate(a);
        x.fillStyle = "#f2c230"; x.fillRect(-Wd * 0.7, -22, Wd * 1.4, 44);
        x.fillStyle = "#1f1a12";
        for (let i = -Wd * 0.7; i < Wd * 0.7; i += 50) { x.beginPath(); x.moveTo(i, -22); x.lineTo(i + 22, -22); x.lineTo(i - 2, 22); x.lineTo(i - 24, 22); x.fill(); }
        x.restore();
      };
      stripe(Hd * 0.4, 0.5); stripe(Hd * 0.6, -0.5);
    } });
    tape.mesh.material.transparent = true;
    boards.push(tape);
    onWall(W, tape.mesh, 12.5, 1.6, 0.06);
    addBoard(W, {
      w: 3.6, h: 1.0, bg: "#1f2330", fg: "#f6f0e3", accent: "#f2c230", kicker: "Under construction", kickerColor: "#f2c230",
      title: soon.map((w) => w.name).join(" & "), titleSize: 7.5, pad: 0.05,
    }, 12.5, 3.65);
    addBoard(W, {
      w: 2.4, h: 1.5, accent: "#b8892f", kicker: "Thanks for visiting", title: "What will you explore next?", titleSize: 9, body: "More machines are on their way to this museum.", bodySize: 5,
    }, 8.2, 2.2);
  }

  function drawJournalBoard(x, W, H, u) {
    const n = allEx.filter((e) => stamped(e.id)).length;
    x.fillStyle = "#b8892f"; x.fillRect(0, 0, W, H * 0.035);
    x.fillStyle = "#8a6420"; x.font = `700 ${3.1 * u}px "IBM Plex Mono", monospace`; x.textBaseline = "top";
    x.fillText("YOUR FIELD TRIP JOURNAL", 6 * u, 6 * u);
    x.fillStyle = "#1f2330"; x.font = `800 ${7 * u}px Fraunces, Georgia, serif`;
    x.fillText(`${n} of ${allEx.length} machines met`, 6 * u, 11 * u);
    const cols = 5, cw = 17.6 * u, ch = 12 * u;
    allEx.forEach((e, i) => {
      const cx = 6 * u + (i % cols) * cw, cy = 24 * u + Math.floor(i / cols) * (ch + 2 * u);
      const got = stamped(e.id);
      x.fillStyle = got ? "#fff" : "#ece4d2"; x.fillRect(cx, cy, cw - 1.6 * u, ch);
      x.strokeStyle = got ? e.wing.color : "#d5ccb9"; x.lineWidth = u * 0.6; x.strokeRect(cx, cy, cw - 1.6 * u, ch);
      x.fillStyle = got ? "#1f2330" : "#8c8678"; x.font = `700 ${2.6 * u}px "Atkinson Hyperlegible", Arial, sans-serif`;
      x.fillText(e.name.length > 13 ? e.name.slice(0, 12) + "…" : e.name, cx + 1.2 * u, cy + 1.6 * u);
      x.fillStyle = got ? "#c4472d" : "#8c8678"; x.font = `700 ${2.3 * u}px "IBM Plex Mono", monospace`;
      x.fillText(got ? "VISITED" : "NOT YET", cx + 1.2 * u, cy + 6.6 * u);
    });
    x.fillStyle = "#b8892f"; x.font = `700 ${2.7 * u}px "IBM Plex Mono", monospace`; x.textBaseline = "bottom";
    x.fillText("OPEN THE BOOK ON THE PODIUM FOR DETAILS", 6 * u, H - 4 * u);
  }

  /* ---------------- interactables ---------------- */
  function addSpot(o) {
    const ring = new T.Mesh(new T.RingGeometry(0.5, 0.62, 40), new T.MeshBasicMaterial({ color: "#e8b53a", transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(o.pos[0], 0.03, o.pos[1]);
    scene.add(ring);
    o.ring = ring;
    spots.push(o);
    if (o.mesh) { o.mesh.userData.spot = o; if (!pickables.includes(o.mesh)) pickables.push(o.mesh); }
    return o;
  }

  const spin = []; // decorative things that rotate or pulse

  /* =========================================================
   * WALKING: collision + paths between rooms
   * ========================================================= */
  const INSET = WALL_T + R_PLAYER;
  function inRoom(r, x, z, pad) {
    const p = pad == null ? INSET : pad;
    return x > r.x0 + p && x < r.x1 - p && z > r.z0 + p && z < r.z1 - p;
  }
  function inDoor(d, x, z) {
    const along = d.axis === "x" ? z : x, across = d.axis === "x" ? x : z;
    return Math.abs(across - d.at) < INSET + 0.05 && Math.abs(along - d.c) < d.w / 2 - R_PLAYER;
  }
  function walkable(x, z) {
    if (!(ROOMS.some((r) => inRoom(r, x, z)) || DOORS.some((d) => inDoor(d, x, z)))) return false;
    return !obstacles.some((o) => (x - o.x) ** 2 + (z - o.z) ** 2 < (o.r + R_PLAYER * 0.6) ** 2);
  }
  function roomAt(x, z) {
    return ROOMS.find((r) => inRoom(r, x, z, 0)) || null;
  }
  function doorBetween(a, b) {
    return DOORS.find((d) => (d.a === a && d.b === b) || (d.a === b && d.b === a));
  }
  function roomRoute(a, b) {
    const prev = { [a]: null };
    const q = [a];
    while (q.length) {
      const cur = q.shift();
      if (cur === b) break;
      DOORS.forEach((d) => {
        const nxt = d.a === cur ? d.b : d.b === cur ? d.a : null;
        if (nxt && !(nxt in prev)) { prev[nxt] = cur; q.push(nxt); }
      });
    }
    const route = [];
    for (let c = b; c != null; c = prev[c]) route.unshift(c);
    return route[0] === a ? route : [a];
  }
  function doorPoint(d, roomId, off) {
    const r = roomById(roomId);
    const sign = d.axis === "x" ? (r.cx < d.at ? -1 : 1) : (r.cz < d.at ? -1 : 1);
    return d.axis === "x" ? [d.at + sign * off, d.c] : [d.c, d.at + sign * off];
  }

  function planPath(from, to) {
    const ra = roomAt(from[0], from[1]) || nearestRoom(from);
    const rb = roomAt(to[0], to[1]) || nearestRoom(to);
    const route = roomRoute(ra.id, rb.id);
    let pts = [];
    for (let i = 0; i < route.length - 1; i++) {
      const d = doorBetween(route[i], route[i + 1]);
      pts.push(doorPoint(d, route[i], 1.3), doorPoint(d, route[i + 1], 1.3));
    }
    pts.push(to);
    // steer around obstacles (globe, pedestals, plants)
    let prev = from;
    const out = [];
    for (const p of pts) {
      for (let guard = 0; guard < 4; guard++) {
        const hit = obstacles.find((o) => segHits(prev, p, o));
        if (!hit) break;
        const dx = p[0] - prev[0], dz = p[1] - prev[1];
        const L = Math.hypot(dx, dz) || 1;
        let nx = -dz / L, nz = dx / L;
        // pick the side the path already leans toward
        const t = Math.max(0, Math.min(1, ((hit.x - prev[0]) * dx + (hit.z - prev[1]) * dz) / (L * L)));
        const cx = prev[0] + dx * t, cz = prev[1] + dz * t;
        if ((cx - hit.x) * nx + (cz - hit.z) * nz < 0) { nx = -nx; nz = -nz; }
        const w = [hit.x + nx * (hit.r + 0.95), hit.z + nz * (hit.r + 0.95)];
        if (!walkable(w[0], w[1])) { w[0] = hit.x - nx * (hit.r + 0.95); w[1] = hit.z - nz * (hit.r + 0.95); }
        out.push(w);
        prev = w;
      }
      out.push(p);
      prev = p;
    }
    return out;
  }
  function segHits(a, b, o) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((o.x - a[0]) * dx + (o.z - a[1]) * dz) / L2));
    const px = a[0] + dx * t - o.x, pz = a[1] + dz * t - o.z;
    const dEnd = Math.hypot(b[0] - o.x, b[1] - o.z);
    return px * px + pz * pz < (o.r + 0.45) ** 2 && dEnd > o.r + 0.1;
  }
  function nearestRoom(p) {
    let best = ROOMS[0], bd = Infinity;
    ROOMS.forEach((r) => {
      const dx = Math.max(r.x0 - p[0], 0, p[0] - r.x1), dz = Math.max(r.z0 - p[1], 0, p[1] - r.z1);
      const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = r; }
    });
    return best;
  }
  // nudge a clicked point to somewhere you can stand
  function settle(p) {
    for (const o of obstacles) {
      const dx = p[0] - o.x, dz = p[1] - o.z, d = Math.hypot(dx, dz);
      if (d < o.r + 0.4) { const k = (o.r + 0.5) / (d || 1); p = [o.x + dx * k, o.z + dz * k]; }
    }
    const r = roomAt(p[0], p[1]) || nearestRoom(p);
    return [Math.max(r.x0 + INSET + 0.05, Math.min(r.x1 - INSET - 0.05, p[0])), Math.max(r.z0 + INSET + 0.05, Math.min(r.z1 - INSET - 0.05, p[1]))];
  }

  /* ---------------- player + robot state ---------------- */
  const P = { x: 0, z: 8, heading: Math.PI, speed: 0, path: [], onArrive: null, faceTo: null, stuck: 0 };
  const Rb = { x: 0.9, z: 8.6, heading: Math.PI, moving: false };
  const crumbs = [];

  function walkTo(pt, onArrive, faceTo) {
    const goal = settle(pt);
    P.path = planPath([P.x, P.z], goal);
    P.onArrive = onArrive || null;
    P.faceTo = faceTo == null ? null : faceTo;
    P.stuck = 0;
    hideIdleHint();
  }
  function goToSpot(s, open) {
    walkTo(s.pos, () => { if (open) activate(s); }, s.face);
  }
  function pathLeft() {
    let d = 0, prev = [P.x, P.z];
    P.path.forEach((p) => { d += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; });
    return d;
  }

  /* =========================================================
   * CAMERA
   * ========================================================= */
  const cam = { yaw: 0, pitch: 0.95, dist: 14, tx: 0, tz: 6, ty: 0.9 };   // current
  const want = { yaw: 0, pitch: 0.95, dist: 14 };                          // follow-mode settings
  let mode = "follow";
  const BOUNDS = { x0: -40, x1: 42, z0: -40, z1: 18 };

  function camGoal() {
    if (mode === "map") {
      const cx = (BOUNDS.x0 + BOUNDS.x1) / 2, cz = (BOUNDS.z0 + BOUNDS.z1) / 2;
      // on a tall phone screen, turn the map sideways so the long museum fits
      const tall = camera.aspect < 0.9;
      let hw = (BOUNDS.x1 - BOUNDS.x0) / 2 + 3, hd = (BOUNDS.z1 - BOUNDS.z0) / 2 + 4;
      if (tall) [hw, hd] = [hd, hw];
      const tan = Math.tan((camera.fov * Math.PI) / 360);
      const pitch = 1.22;
      const dist = Math.max(hd * Math.sin(pitch) / tan, hw / (tan * camera.aspect)) * 1.04 + 6;
      return { yaw: tall ? Math.PI / 2 : 0, pitch, dist, tx: cx + (tall ? 2 : 0), tz: cz + (tall ? 0 : 2), ty: 0 };
    }
    return { yaw: want.yaw, pitch: want.pitch, dist: want.dist, tx: P.x, tz: P.z, ty: 0.9 };
  }

  function updateCamera(dt) {
    const g = camGoal();
    const k = Math.min(1, dt * (mode === "map" || mapBlend < 0.99 ? 3.2 : 5));
    let dy = g.yaw - cam.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    cam.yaw += dy * k;
    cam.pitch += (g.pitch - cam.pitch) * k;
    cam.dist += (g.dist - cam.dist) * k;
    cam.tx += (g.tx - cam.tx) * k;
    cam.tz += (g.tz - cam.tz) * k;
    cam.ty += (g.ty - cam.ty) * k;
    mapBlend += ((mode === "map" ? 1 : 0) - mapBlend) * k;
    const cp = Math.cos(cam.pitch);
    camera.position.set(
      cam.tx + Math.sin(cam.yaw) * cp * cam.dist,
      cam.ty + Math.sin(cam.pitch) * cam.dist,
      cam.tz + Math.cos(cam.yaw) * cp * cam.dist
    );
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    // the shadow light follows you around
    sun.position.set(P.x + 7, 18, P.z + 9);
    sun.target.position.set(P.x, 0, P.z);
  }
  let mapBlend = 0;

  function setMode(m) {
    mode = m;
    $("#stage").classList.toggle("map-mode", m === "map");
    $("#mapBtn").setAttribute("aria-pressed", String(m === "map"));
    $("#mapBtn").textContent = m === "map" ? "Back to walking" : "Bird's-eye map";
    $("#mapBanner").hidden = m !== "map";
    if (m === "map") say(`Here's the whole museum from above! Click a room or a machine and we'll walk there.`, 5000);
  }
  $("#mapBtn").addEventListener("click", (e) => { e.stopPropagation(); setMode(mode === "map" ? "follow" : "map"); });
  $("#rotL").addEventListener("click", (e) => { e.stopPropagation(); turnCam(-1); });
  $("#rotR").addEventListener("click", (e) => { e.stopPropagation(); turnCam(1); });
  function turnCam(dir) {
    if (mode === "map") setMode("follow");
    want.yaw += dir * Math.PI / 4;
  }

  /* ---------------- dollhouse cutaway: drop walls that block your view ---------------- */
  const tmpDir = V(0, 0, 0);
  function updateWalls(dt) {
    const f = V(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
    // which walls sit between the camera and the player?
    sides.forEach((s) => (s.blocking = false));
    const head = V(P.x, 1.2, P.z);
    tmpDir.copy(head).sub(camera.position);
    const dist = tmpDir.length();
    ray.set(camera.position, tmpDir.normalize());
    ray.far = dist;
    ray.intersectObjects(wallMeshes, false).forEach((h) => (h.object.userData.side.blocking = true));
    ray.far = Infinity;
    // also any wall whose line crosses the ground path from the camera to you
    const cx = camera.position.x, cz = camera.position.z;
    sides.forEach((s) => {
      if (s.blocking) return;
      const a0 = s.alongX ? cz : cx, a1 = s.alongX ? P.z : P.x;
      if ((a0 - s.inner) * (a1 - s.inner) >= 0) return;
      const t = (s.inner - a0) / (a1 - a0);
      const along = s.alongX ? cx + t * (P.x - cx) : cz + t * (P.z - cz);
      if (along > s.from - 1.5 && along < s.to + 1.5) s.blocking = true;
    });
    sides.forEach((s) => {
      let target = WALL_H;
      if (mapBlend > 0.5) target = MAP_H;
      else if (s.n.dot(f) > 0.35 || s.blocking) target = CUT_H;
      s.h += (target - s.h) * Math.min(1, dt * 7);
      s.group.scale.y = s.h / WALL_H;
      s.decor.visible = s.h > WALL_H * 0.9;
    });
  }

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
      if (s.pulse) s.o.material.opacity = 0.6 + Math.sin(clock * 3) * 0.4, (s.o.material.transparent = true);
      else s.o.rotation.y += s.s * dt;
    });
    spots.forEach((s) => (s.ring.material.opacity += ((s === nearSpot ? 0.95 : 0) - s.ring.material.opacity) * Math.min(1, dt * 8)));
    renderer.render(scene, camera);
    placeOverlays();
    requestAnimationFrame(tick);
  }

  function step(dt) {
    // keyboard steering (relative to the camera)
    let kx = 0, kz = 0;
    if (held.has("ArrowUp") || held.has("w")) kz -= 1;
    if (held.has("ArrowDown") || held.has("s")) kz += 1;
    if (held.has("ArrowLeft") || held.has("a")) kx -= 1;
    if (held.has("ArrowRight") || held.has("d")) kx += 1;
    let vx = 0, vz = 0, speed = 0;
    if (kx || kz) {
      P.path = []; P.onArrive = null; P.faceTo = null;
      const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);   // forward
      const rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);    // right
      vx = fx * -kz + rx * kx; vz = fz * -kz + rz * kx;
      const L = Math.hypot(vx, vz); vx /= L; vz /= L;
      speed = 4.6;
    } else if (P.path.length) {
      const [tx, tz] = P.path[0];
      const dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz);
      if (d < 0.18) {
        P.path.shift();
        if (!P.path.length) arrive();
      } else {
        speed = pathLeft() > 22 ? 9.5 : 4.6;
        vx = dx / d; vz = dz / d;
        speed = Math.min(speed, d / dt);
      }
    }
    if (speed > 0) {
      const nx = P.x + vx * speed * dt, nz = P.z + vz * speed * dt;
      const ox = P.x, oz = P.z;
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
    kid.position.set(P.x, 0, P.z);
    kid.rotation.y = P.heading;
    Models.animateKid(kid, clock, P.speed);

    // robot follows your trail
    const lastC = crumbs[crumbs.length - 1];
    if (!lastC || Math.hypot(lastC[0] - P.x, lastC[1] - P.z) > 0.25) { crumbs.push([P.x, P.z]); if (crumbs.length > 60) crumbs.shift(); }
    let goal = null, acc = 0;
    for (let i = crumbs.length - 1; i > 0; i--) {
      acc += Math.hypot(crumbs[i][0] - crumbs[i - 1][0], crumbs[i][1] - crumbs[i - 1][1]);
      if (acc > 1.5) { goal = crumbs[i - 1]; break; }
    }
    if (!goal) goal = [P.x - Math.sin(P.heading) * 1.2 + Math.cos(P.heading) * 0.6, P.z - Math.cos(P.heading) * 1.2 - Math.sin(P.heading) * 0.6];
    const rdx = goal[0] - Rb.x, rdz = goal[1] - Rb.z, rd = Math.hypot(rdx, rdz);
    Rb.moving = rd > 0.08;
    if (Rb.moving) {
      const sp = Math.min(rd * 4, 11) * dt;
      Rb.x += (rdx / rd) * sp; Rb.z += (rdz / rd) * sp;
      Rb.heading = turnToward(Rb.heading, Math.atan2(rdx, rdz), dt * 8);
    } else {
      Rb.heading = turnToward(Rb.heading, Math.atan2(P.x - Rb.x, P.z - Rb.z), dt * 4);
    }
    robot.position.x = Rb.x; robot.position.z = Rb.z;
    robot.rotation.y = Rb.heading;
    Models.animateRobot(robot, clock, Rb.moving);

    // room + nearby exhibit
    const room = roomAt(P.x, P.z);
    if (room && room !== currentRoom) enterRoom(room);
    let near = null, best = 1.9;
    for (const s of spots) {
      const d = Math.hypot(s.pos[0] - P.x, s.pos[1] - P.z);
      if (d < best) { best = d; near = s; }
    }
    if (near !== nearSpot) setNear(near);
  }

  function arrive() {
    const cb = P.onArrive;
    P.onArrive = null;
    if (mode === "map") setTimeout(() => setMode("follow"), 250);
    if (cb) cb();
  }

  function turnToward(a, b, k) {
    let d = b - a;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    return a + d * Math.min(1, k);
  }

  /* ---------------- HTML overlays (speech, prompt, map labels) ---------------- */
  const proj = V(0, 0, 0);
  function toScreen(x, y, z) {
    proj.set(x, y, z).project(camera);
    const st = $("#stage");
    return { x: (proj.x * 0.5 + 0.5) * st.clientWidth, y: (-proj.y * 0.5 + 0.5) * st.clientHeight, behind: proj.z > 1 };
  }
  function placeOverlays() {
    // speech bubble floats above both characters, its tail pointing at the robot
    const say = $("#say"), W = $("#stage").clientWidth;
    const rh = toScreen(Rb.x, 1.15, Rb.z), kh = toScreen(P.x, 2.0, P.z);
    const bw = say.offsetWidth || 290;
    const left = Math.max(8, Math.min(W - bw - 8, rh.x - 44));
    say.style.left = left + "px";
    say.style.top = Math.max(say.offsetHeight + 8, Math.min(rh.y, kh.y) - 14) + "px";
    say.style.setProperty("--tail", Math.max(14, Math.min(bw - 30, rh.x - left - 8)) + "px");
    if (mapBlend > 0.02) {
      mapItems.forEach((m) => {
        if (m.you) { m.x = P.x; m.z = P.z; }
        const p = toScreen(m.x, m.y, m.z);
        m.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
      });
      $("#mapLabels").style.opacity = Math.max(0, (mapBlend - 0.5) * 2);
    } else $("#mapLabels").style.opacity = 0;
  }

  /* ---------------- bird's-eye labels ---------------- */
  const mapItems = [];
  function buildMapLabels() {
    const box = $("#mapLabels");
    let html = "";
    ROOMS.forEach((r) => {
      const n = r.wing ? `${r.wing.exhibits.length} machines` : r.id === "lobby" ? "Start here" : "End of the trip";
      html += `<button class="map-room" data-room="${r.id}" style="--wc:${r.wing ? r.wing.color : "#b8892f"}"><b>${esc(r.name)}</b><small>${n}</small></button>`;
    });
    spots.forEach((s, i) => {
      const cls = s.kind === "exhibit" ? "map-pin" : "map-pin map-pin-place";
      const color = s.ex ? s.ex.wing.color : "#e8b53a";
      html += `<button class="${cls}" data-spot="${i}" style="--wc:${color}" title="${esc(s.label)}"><span>${esc(s.label)}</span></button>`;
    });
    html += `<span class="map-you" aria-hidden="true">You</span>`;
    box.innerHTML = html;
    mapItems.push({ el: box.querySelector(".map-you"), you: true, x: 0, y: 0.5, z: 0 });
    box.querySelectorAll("[data-room]").forEach((el) => {
      const r = roomById(el.dataset.room);
      const [ax, az] = labelPoint(r);
      mapItems.push({ el, x: ax, y: 1.2, z: az });
    });
    box.querySelectorAll("[data-spot]").forEach((el) => {
      const s = spots[+el.dataset.spot];
      const [x, z] = s.pedestal || s.pos;
      mapItems.push({ el, x, y: 1.8, z });
      el.classList.toggle("got", !!(s.ex && stamped(s.ex.id)));
    });
    box.addEventListener("click", (e) => {
      e.stopPropagation();
      const rb = e.target.closest("[data-room]");
      if (rb) return goToRoom(roomById(rb.dataset.room));
      const sb = e.target.closest("[data-spot]");
      if (sb) goToSpot(spots[+sb.dataset.spot], false);
    });
  }
  function labelPoint(r) {
    if (r.id === "lobby") return [0, 5.8];
    if (r.id === "exit") return [36, 15.6];
    return r.axis === "x" ? [r.cx, r.cz + 3.4] : [r.cx, r.entry - 2.6];
  }
  function goToRoom(r) {
    walkTo(r.anchor);
  }
  function refreshPins() {
    $("#mapLabels").querySelectorAll("[data-spot]").forEach((el) => {
      const s = spots[+el.dataset.spot];
      el.classList.toggle("got", !!(s.ex && stamped(s.ex.id)));
    });
  }

  /* ---------------- HUD room chips ---------------- */
  function buildMinimap() {
    $("#minimap").innerHTML = ROOMS.map((r) =>
      `<button style="--wc:${r.wing ? r.wing.color : "#b8892f"}" data-room="${r.id}"><span>${esc(r.wing ? r.wing.name.replace(" Wing", "") : r.name)}</span></button>`).join("");
    $("#minimap").addEventListener("click", (e) => {
      const b = e.target.closest("[data-room]");
      if (b) goToRoom(roomById(b.dataset.room));
    });
  }

  /* ---------------- Room entry: the robot asks the wing's big question ---------------- */
  let currentRoom = null;
  const greeted = new Set();
  function enterRoom(room) {
    currentRoom = room;
    document.querySelectorAll("#minimap [data-room]").forEach((b) => b.classList.toggle("here", b.dataset.room === room.id));
    if (greeted.has(room.id) || !started) return;
    greeted.add(room.id);
    if (room.wing) say(`The ${esc(room.wing.name)}! Big question: <b>${esc(room.wing.question)}</b> Let's find out.`, 7000);
    if (room.id === "exit") say(`We made it to the end! The big board shows every machine you met. Open the book for your journal.`, 6500);
  }

  /* ---------------- "Look closer" prompt ---------------- */
  let nearSpot = null;
  function setNear(s) {
    nearSpot = s;
    const pr = $("#prompt");
    if (!s) { pr.hidden = true; return; }
    pr.hidden = false;
    const txt = s.kind === "bay" ? "Open Robot Bay" : s.kind === "journal" ? "Open your journal" : s.kind === "timeline" ? "Look closer: Mission timeline" : `Look closer: ${s.ex.name}`;
    pr.innerHTML = `${esc(txt)}<kbd>Enter</kbd>`;
  }
  function activate(s) {
    if (!s) return;
    if (s.kind === "bay") openWorkshop();
    else if (s.kind === "journal") openJournal();
    else if (s.kind === "timeline") openTimeline();
    else openExhibit(s.ex);
  }
  $("#prompt").addEventListener("click", (e) => { e.stopPropagation(); activate(nearSpot); });

  /* ---------------- pointer: click to walk, drag to turn ---------------- */
  let drag = null;
  const canvasEl = () => $("#scene");
  function bindPointer() {
    const c = canvasEl();
    c.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener("pointermove", (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 7) return;
      drag.moved = true;
      if (mode === "map") return;
      want.yaw -= dx * 0.008;
      want.pitch = Math.max(0.45, Math.min(1.35, want.pitch + dy * 0.005));
      drag.x = e.clientX; drag.y = e.clientY;
    });
    c.addEventListener("pointerup", (e) => {
      if (!drag) return;
      const wasDrag = drag.moved;
      drag = null;
      if (!wasDrag) clickAt(e.clientX, e.clientY);
    });
    c.addEventListener("pointercancel", () => (drag = null));
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (mode === "map") return;
      want.dist = Math.max(6, Math.min(24, want.dist * (1 + Math.sign(e.deltaY) * 0.1)));
    }, { passive: false });
  }

  function clickAt(cx, cy) {
    const rect = canvasEl().getBoundingClientRect();
    const m = new T.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(m, camera);
    const hits = ray.intersectObjects(pickables, false).filter((h) => h.object.visible && (!h.object.parent || h.object.parent.visible !== false));
    for (const h of hits) {
      const s = h.object.userData.spot;
      if (s) return goToSpot(s, mode !== "map");
      const r = h.object.userData.floor;
      if (r) {
        const pt = [h.point.x, h.point.z];
        return walkTo(pt);
      }
    }
  }

  /* ---------------- keyboard ---------------- */
  const MOVE_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"];
  addEventListener("keydown", (e) => {
    if (document.querySelector("dialog[open]") || $("#museum").hidden) return;
    if (e.target.tagName === "INPUT") return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (MOVE_KEYS.includes(k)) {
      held.add(k);
      e.preventDefault();
      if (mode === "map") setMode("follow");
      hideIdleHint();
    }
    if (k === "q") turnCam(-1);
    if (k === "e") turnCam(1);
    if (k === "m") setMode(mode === "map" ? "follow" : "map");
    if ((k === "Enter" || k === " ") && nearSpot) { e.preventDefault(); activate(nearSpot); }
  });
  addEventListener("keyup", (e) => held.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  addEventListener("blur", () => held.clear());

  let idleHintTimer;
  function hideIdleHint() {
    $("#hint").classList.add("faded");
    clearTimeout(idleHintTimer);
    idleHintTimer = setTimeout(() => $("#hint").classList.remove("faded"), 20000);
  }

  /* ---------------- Robot speech ---------------- */
  let sayTimer;
  function say(html, ms = 5500) {
    const b = $("#say");
    b.innerHTML = `<span class="who">${esc(S.robotName)}</span>${html}`;
    b.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => b.classList.remove("show"), ms);
  }

  function drawActors() {
    if (!scene) return;
    if (kid) scene.remove(kid);
    if (robot) scene.remove(robot);
    kid = Models.kid(S.kid);
    kid.scale.setScalar(1.15);
    robot = Models.robot(S.look);
    robot.scale.setScalar(0.85);
    scene.add(kid, robot);
  }

  /* =========================================================
   * ENTER THE MUSEUM
   * ========================================================= */
  let started = false;
  function enterMuseum(withEntrance) {
    $("#intro").classList.add("leaving");
    setTimeout(() => {
      $("#intro").hidden = true;
      $("#museum").hidden = false;
      if (!scene) {
        initThree();
        buildWorld();
        drawActors();
        bindPointer();
        P.x = 0; P.z = 7.9; Rb.x = 0.9; Rb.z = 8.4;
        cam.tx = 0; cam.tz = 7.9;
        requestAnimationFrame((t) => { last = t; tick(t); });
      } else drawActors();
      resize();
      $("#hudName").textContent = S.player;
      updateHUD();
      if (withEntrance) {
        walkTo([0, 4.4], () => {
          started = true;
          say(`Hi ${esc(S.player)}! I'm ${esc(S.robotName)}, your guide. The <b>Moon Wing</b> is to the left, <b>Mars</b> straight ahead, and <b>Deep Space</b> to the right. Press <b>Bird's-eye map</b> to see it all from above!`, 10000);
        }, Math.PI);
      } else started = true;
    }, withEntrance ? 600 : 0);
  }

  /* =========================================================
   * HUD + JOURNAL
   * ========================================================= */
  function updateHUD(pop) {
    $("#starCount").textContent = S.stars;
    const n = allEx.filter((e) => stamped(e.id)).length;
    $("#stampCount").textContent = `${n}/${allEx.length}`;
    if (pop) {
      const el = $("#starCount").parentElement;
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    }
  }

  function renderJournal() {
    const g = $("#journalGrid");
    g.innerHTML = allEx.map((e) => `
      <button class="j-cell${stamped(e.id) ? " got" : ""}" data-goto="${e.id}" style="--wc:${e.wing.color}">
        <span class="j-art">${Art.hardware(e.art)}</span>
        <span class="j-name">${esc(e.name)}</span>
        <span class="j-stamp">${stamped(e.id) ? "Visited" : "Not yet"}</span>
      </button>`).join("");
    $("#journalBadges").innerHTML = wings
      .filter((w) => w.exhibits.every((e) => stamped(e.id)))
      .map((w) => `<span class="badge" style="--wc:${w.color}">${esc(w.badge.name)} badge</span>`).join("");
    if (journalBoard) journalBoard.redraw();
  }
  function openJournal() { renderJournal(); $("#journalDialog").showModal(); }

  function openTimeline() {
    $("#timelineList").innerHTML = allEx.slice().sort((a, b) => a.year - b.year).map((e) =>
      `<li><button data-goto="${e.id}" style="--wc:${e.wing.color}"><span class="yr">${e.year}</span><span class="nm">${esc(e.name)}</span><span class="wg">${esc(e.wing.name)}</span></button></li>`).join("");
    $("#timelineDialog").showModal();
  }

  // any [data-goto] button inside a dialog walks you to that exhibit
  document.addEventListener("click", (e) => {
    const b = e.target.closest("dialog [data-goto]");
    if (!b) return;
    const s = spots.find((s) => s.ex && s.ex.id === b.dataset.goto);
    b.closest("dialog").close();
    goToSpot(s, false);
    P.onArrive = () => say(`Here's <b>${esc(s.ex.name)}</b>. Click it to look closer!`);
  });

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

  /* =========================================================
   * EXHIBIT PLACARD
   * ========================================================= */
  const TABS = [
    { id: "story", label: "In its own words" },
    { id: "left", label: "Still there today" },
    { id: "learned", label: "What we learned" },
    { id: "next", label: "What came next" },
    { id: "quiz", label: "Quick quiz" },
  ];
  let ex = null, tab = "story", page = 0, tries = 0;
  const visit = (id) => (S.visits[id] = S.visits[id] || {});

  function openExhibit(e) {
    ex = e;
    tab = "story"; page = 0; tries = 0;
    $("#exVisual").innerHTML = `<div class="ex-diorama">${Art.backdrop(e.backdrop)}</div><div class="ex-model">${Art.hardware(e.art)}</div>`;
    $("#exVisual").style.setProperty("--wc", e.wing.color);
    $("#exCatalog").textContent = `Exhibit ${e.code} · ${e.wing.name}`;
    $("#exTitle").textContent = e.name;
    const status = { silent: "Silent now", parked: "Parked for good", "still talking": "Still talking to Earth" }[e.status];
    $("#exMeta").innerHTML = `${e.year} · ${esc(e.kind)} · ${esc(e.place)} · <span class="status ${e.status.replace(" ", "-")}">${status}</span>`;
    renderTab();
    $("#exhibitDialog").showModal();
  }

  function renderTab() {
    $("#exTabs").innerHTML = TABS.map((t) =>
      `<button role="tab" data-tab="${t.id}" aria-selected="${t.id === tab}">${t.label}</button>`).join("");
    const body = $("#exBody");
    const v = S.visits[ex.id] || {};

    if (tab === "story") {
      body.innerHTML = `
        <blockquote class="voice">${esc(ex.story[page])}</blockquote>
        <p class="voice-by">${esc(ex.name)}, speaking for itself · part ${page + 1} of ${ex.story.length}</p>`;
      if (page === ex.story.length - 1 && !v.story) {
        visit(ex.id).story = true;
        award(1, "story heard");
        markStamp(ex.id);
      }
    } else if (tab === "left") {
      body.innerHTML = `<h3>Still out there right now</h3><ul class="left">${ex.leftBehind.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
    } else if (tab === "learned") {
      body.innerHTML = `<h3>The science it made possible</h3><p class="big">${esc(ex.discovery)}</p>`;
    } else if (tab === "next") {
      body.innerHTML = `<h3>How the story continued</h3><p class="big">${esc(ex.next)}</p>`;
    } else {
      renderQuiz();
    }
    const nextLabel = tab === "story" && page < ex.story.length - 1 ? "Keep listening" : tab === "quiz" ? "Back to the museum" : "Next";
    $("#exNext").textContent = nextLabel;
  }

  function renderQuiz() {
    const v = S.visits[ex.id] || {};
    const q = ex.quiz;
    $("#exBody").innerHTML = `
      <h3>${esc(q.q)}</h3>
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
    if (v.quiz == null) {
      v.quiz = tries === 1 ? 2 : 1;
      award(v.quiz, "quiz");
    }
  }

  function markStamp(id) {
    const s = spots.find((s) => s.ex && s.ex.id === id);
    if (s && s.labelBoard) s.labelBoard.redraw();
    renderJournal();
    refreshPins();
    const w = allEx.find((e) => e.id === id).wing;
    if (w.exhibits.every((e) => stamped(e.id))) {
      setTimeout(() => toast(`${w.badge.name} badge earned!`), 900);
    }
  }

  $("#exTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab; page = 0;
    renderTab();
  });
  $("#exNext").addEventListener("click", () => {
    if (tab === "story" && page < ex.story.length - 1) { page++; return renderTab(); }
    const i = TABS.findIndex((t) => t.id === tab);
    if (i < TABS.length - 1) { tab = TABS[i + 1].id; page = 0; renderTab(); }
    else $("#exhibitDialog").close();
  });
  $("#exhibitDialog").addEventListener("close", () => {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const v = S.visits[ex.id] || {};
    if (v.story && v.quiz != null) {
      const idx = allEx.findIndex((e) => e.id === ex.id);
      const nxt = allEx[idx + 1];
      say(nxt ? `Nice! Next up: <b>${esc(nxt.name)}</b>${nxt.wing !== ex.wing ? ` in the <b>${esc(nxt.wing.name)}</b>` : ""}.` : `You met every machine! The Journal room is past the end of the Deep Space Wing.`);
    }
  });

  $("#readAloud").addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return toast("This browser can't read aloud.");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance($("#exBody").innerText);
    u.rate = 0.95;
    speechSynthesis.speak(u);
  });

  /* =========================================================
   * ASK THE PLACARD
   * ========================================================= */
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
   * ROBOT BAY
   * ========================================================= */
  const SLOTS = { color: "Paint", eyes: "Eye lights", hat: "Hats", gear: "Gear" };
  $("#workshopBtn").addEventListener("click", openWorkshop);
  function openWorkshop() {
    renderWorkshop();
    $("#workshopDialog").showModal();
  }
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
      if (S.stars < it.cost) {
        const need = it.cost - S.stars;
        return toast(`${need} more star${need > 1 ? "s" : ""} needed for ${it.name}`);
      }
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
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

/* ---------- boot ---------- */
  buildIntro();

  window.resetMuseum = async () => {
    localStorage.removeItem(SAVE_KEY);
    if (typeof supabaseClient !== "undefined") {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const clean = fresh();
        await supabaseClient
          .from("player_progress")
          .update({
            player: clean.player,
            robot_name: clean.robotName,
            kid: clean.kid,
            stars: clean.stars,
            visits: clean.visits,
            owned: clean.owned,
            look: clean.look,
          })
          .eq("user_id", user.id);
      }
    }
    location.reload();
  };

  (async function initCloudSession() {
    if (typeof supabaseClient === "undefined") return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
      const cloudData = await loadCloudProgress(session.user.id);
      window.applyCloudState(cloudData);
    }
  })();
})();
