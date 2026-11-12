/*
 * SILENT EXPLORERS MUSEUM: walkable side-scrolling museum
 * ------------------------------------------------------------
 * The museum is one long hallway built from "rooms": lobby, one room per wing,
 * then the exit hall. The player walks left/right (click the floor, or use the
 * arrow keys); the camera follows. Walking up to an exhibit and clicking it
 * (or pressing Enter) opens its placard. Nothing is locked: stars only buy
 * robot upgrades.
 *
 * World units: the stage is 600 units tall and scaled to fit the screen.
 */
(function () {
  const M = window.MUSEUM;
  const $ = (s, el = document) => el.querySelector(s);
  const SAVE_KEY = "silent-explorers-v2";

  const H = 600;          // world height
  const FLOOR_Y = 470;    // where wall meets floor
  const PLAYER_Y = 572;   // player's feet
  const SLOT = 560;       // width of one exhibit bay

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
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wings = M.wings.filter((w) => !w.comingSoon);
  const soon = M.wings.filter((w) => w.comingSoon);
  const allEx = wings.flatMap((w) => w.exhibits.map((e, i) => ({ ...e, wing: w, code: `${w.code}-${String(i + 1).padStart(2, "0")}` })));
  const stamped = (id) => !!(S.visits[id] && S.visits[id].story);

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
  $("#skipIntro").addEventListener("click", () => {
    $("#intro").classList.add("skipped");
  });

  /* =========================================================
   * WORLD BUILDING
   * ========================================================= */
  const rooms = []; // { id, name, x, w, wing? }
  const spots = []; // interactables: { x, kind, ex?, el }
  let WORLD_W = 0;

  function wallText(cls, html, x, y, w) {
    return `<div class="${cls}" style="left:${x}px;top:${y}px;width:${w}px">${html}</div>`;
  }

  function buildWorld() {
    let x = 0;
    let html = "";

    /* --- Lobby --- */
    const lobbyW = 1760;
    rooms.push({ id: "lobby", name: "Lobby", x, w: lobbyW });
    html += `<section class="room lobby" style="left:${x}px;width:${lobbyW}px">
      ${roomShell()}
      <div class="entrance-doors" style="left:40px"></div>
      ${wallText("wall-title", `<p class="kicker">Welcome to</p><h2>The Silent Explorers Museum</h2>
        <p>Every machine in this museum finished the job it was sent to do. But its story didn't end there. Some still sit right where they landed. Some are still flying, farther from home than anything else people have built.</p>
        <p><b>Walk through the wings to meet them.</b></p>`, 300, 92, 520)}
      <div class="timeline" style="left:880px;top:120px;width:560px">
        <p class="kicker">How the story fits together</p>
        <ol>${allEx.slice().sort((a, b) => a.year - b.year).map((e) =>
          `<li><button data-goto="${e.id}" style="--wc:${e.wing.color}"><span class="yr">${e.year}</span><span class="nm">${esc(e.name)}</span></button></li>`).join("")}</ol>
        <p class="tl-note">Each one made the next one possible. Click a name to walk there.</p>
      </div>
      <div class="robot-bay" style="left:1500px" data-spot="bay">
        <div class="bay-sign">ROBOT BAY</div>
        <div class="bay-booth"></div>
        <p>Upgrade your guide</p>
      </div>
    </section>`;
    spots.push({ x: 1600, kind: "bay" });
    x += lobbyW;

    /* --- Wings --- */
    wings.forEach((w) => {
      const wW = 560 + w.exhibits.length * SLOT + 80;
      rooms.push({ id: w.id, name: w.name, x, w: wW, wing: w });
      let inner = `
        <div class="arch" style="--wc:${w.color}"><span>${esc(w.name)}</span></div>
        ${wallText("wing-question", `<p class="kicker" style="color:${w.color}">The big question</p><h2>${esc(w.question)}</h2><p>${esc(w.intro)}</p>`, 250, 110, 290)}`;
      w.exhibits.forEach((e, i) => {
        const ex = allEx.find((a) => a.id === e.id);
        const ex0 = 580 + i * SLOT;
        inner += `
        <div class="bay" style="left:${ex0}px" data-ex="${e.id}">
          <div class="spot-light"></div>
          <div class="diorama">${Art.backdrop(e.backdrop)}</div>
          <span class="stamp" data-stamp="${e.id}"${stamped(e.id) ? "" : " hidden"}>Visited</span>
          <div class="plinth">
            <div class="model">${Art.hardware(e.art)}</div>
            <div class="label-card">
              <span class="code">${ex.code} · ${e.year}</span>
              <strong>${esc(e.name)}</strong>
            </div>
          </div>
        </div>`;
        spots.push({ x: x + ex0 + 200, kind: "exhibit", ex });
      });
      html += `<section class="room wing" style="left:${x}px;width:${wW}px;--wall:${w.wall};--wc:${w.color}">${roomShell()}${inner}</section>`;
      x += wW;
    });

    /* --- Exit hall: journal + coming soon --- */
    const exitW = 1500;
    rooms.push({ id: "exit", name: "Journal", x, w: exitW });
    html += `<section class="room exit" style="left:${x}px;width:${exitW}px">
      ${roomShell()}
      <div class="arch" style="--wc:#b8892f"><span>Field Trip Journal</span></div>
      <div class="journal" style="left:260px">
        <p class="kicker">Your field trip journal</p>
        <h2>Machines you met</h2>
        <div class="journal-grid" id="journalGrid"></div>
        <div class="journal-badges" id="journalBadges"></div>
      </div>
      <div class="construction" style="left:960px">
        <div class="tape"></div>
        <p class="kicker">Under construction</p>
        <h2>${soon.map((w) => esc(w.name)).join(" &amp; ")}</h2>
        <p>More explorers are on their way to this museum.</p>
        <div class="tape"></div>
      </div>
    </section>`;
    x += exitW;

    WORLD_W = x;
    $("#rooms").innerHTML = html;
    $("#world").style.width = WORLD_W + "px";

    // attach elements to spots
    spots.forEach((s) => {
      if (s.kind === "exhibit") s.el = document.querySelector(`.bay[data-ex="${s.ex.id}"]`);
      if (s.kind === "bay") s.el = document.querySelector(".robot-bay");
    });

    buildMinimap();
    renderJournal();
  }

  function roomShell() {
    return `<div class="ceiling"></div><div class="wall"></div><div class="baseboard"></div><div class="floor"></div>`;
  }

  function buildMinimap() {
    $("#minimap").innerHTML =
      rooms.map((r) => `<button style="flex:${r.w}; --wc:${r.wing ? r.wing.color : "#b8892f"}" data-room="${r.id}"><span>${esc(r.wing ? r.wing.name.replace(" Wing", "") : r.name)}</span></button>`).join("") +
      `<i class="mm-dot" id="mmDot"></i>`;
    $("#minimap").addEventListener("click", (e) => {
      const b = e.target.closest("[data-room]");
      if (!b) return;
      const r = rooms.find((r) => r.id === b.dataset.room);
      walkTo(r.x + (r.wing ? 420 : 300));
    });
  }

  /* =========================================================
   * MOVEMENT + CAMERA
   * ========================================================= */
  const P = { x: 180, target: 180, face: 1, moving: false, onArrive: null };
  const R = { x: 100 };
  let cam = 0, scale = 1, viewW = 1000, offY = 0;

  function layout() {
    const st = $("#stage");
    // fit the height, but always show at least ~720 units of hallway (portrait phones)
    scale = Math.min(st.clientHeight / H, st.clientWidth / 720);
    viewW = st.clientWidth / scale;
    offY = Math.max(0, (st.clientHeight - H * scale) * 0.6);
  }
  addEventListener("resize", layout);

  function walkTo(x, onArrive) {
    P.target = Math.max(60, Math.min(WORLD_W - 60, x));
    P.onArrive = onArrive || null;
    hideIdleHint();
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const d = P.target - P.x;
    const far = Math.abs(d) > 900;
    const speed = far ? 1100 : 320;
    if (Math.abs(d) > 2) {
      P.face = d > 0 ? 1 : -1;
      P.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
      P.moving = true;
    } else if (P.moving) {
      P.moving = false;
      const cb = P.onArrive;
      P.onArrive = null;
      if (cb) cb();
    }
    // robot trails behind the player
    const rTarget = P.x - P.face * 95;
    R.x += (rTarget - R.x) * Math.min(1, dt * 3.5);

    // camera
    const want = Math.max(0, Math.min(WORLD_W - viewW, P.x - viewW * 0.45));
    cam += (want - cam) * Math.min(1, dt * 5);

    render();
    requestAnimationFrame(tick);
  }

  const playerEl = () => $("#player");
  function render() {
    $("#world").style.transform = `translateY(${offY}px) scale(${scale}) translateX(${-cam}px)`;
    const pl = playerEl();
    pl.style.transform = `translate(${P.x - 33}px, ${PLAYER_Y - 140}px) scaleX(${P.face})`;
    pl.classList.toggle("walking", P.moving);
    pl.classList.toggle("running", P.moving && Math.abs(P.target - P.x) > 900);
    const ra = $("#robotActor");
    const rWalking = Math.abs(P.x - P.face * 95 - R.x) > 6;
    ra.style.transform = `translate(${R.x - 36}px, ${PLAYER_Y - 112}px)`;
    ra.classList.toggle("moving", rWalking);
    $("#say").style.left = R.x + "px";

    // minimap dot + current room
    const dot = $("#mmDot");
    if (dot) dot.style.left = (P.x / WORLD_W) * 100 + "%";
    const room = rooms.find((r) => P.x >= r.x && P.x < r.x + r.w);
    if (room && room !== currentRoom) enterRoom(room);

    // nearest interactable
    let near = null, best = 170;
    for (const s of spots) {
      const dd = Math.abs(s.x - P.x);
      if (dd < best) { best = dd; near = s; }
    }
    if (near !== nearSpot) setNear(near);
  }

  /* ---------- Room entry: the robot asks the wing's big question ---------- */
  let currentRoom = null;
  const greeted = new Set();
  function enterRoom(room) {
    currentRoom = room;
    document.querySelectorAll("#minimap [data-room]").forEach((b) => b.classList.toggle("here", b.dataset.room === room.id));
    if (greeted.has(room.id)) return;
    greeted.add(room.id);
    if (room.wing) say(`The ${esc(room.wing.name)}! Big question: <b>${esc(room.wing.question)}</b> Let's find out.`, 7000);
    if (room.id === "exit") say(`You've reached the end of the museum! Here's your journal of every machine you met.`, 6000);
  }

  /* ---------- "Look closer" prompt ---------- */
  let nearSpot = null;
  function setNear(s) {
    if (nearSpot && nearSpot.el) nearSpot.el.classList.remove("near");
    nearSpot = s;
    const pr = $("#prompt");
    if (!s) { pr.hidden = true; return; }
    if (s.el) s.el.classList.add("near");
    pr.hidden = false;
    pr.textContent = s.kind === "bay" ? "Open Robot Bay" : `Look closer: ${s.ex.name}`;
    pr.style.left = s.x + "px";
  }
  function activate(s) {
    if (!s) return;
    if (s.kind === "bay") openWorkshop();
    else openExhibit(s.ex);
  }
  $("#prompt").addEventListener("click", (e) => { e.stopPropagation(); activate(nearSpot); });

  /* ---------- Click / tap to walk ---------- */
  $("#stage").addEventListener("click", (e) => {
    const goto = e.target.closest("[data-goto]");
    if (goto) {
      const s = spots.find((s) => s.ex && s.ex.id === goto.dataset.goto);
      return walkTo(s.x, () => say(`Here's <b>${esc(s.ex.name)}</b>. Click it to look closer!`));
    }
    const bay = e.target.closest("[data-ex]");
    if (bay) {
      const s = spots.find((s) => s.ex && s.ex.id === bay.dataset.ex);
      return walkTo(s.x, () => activate(s));
    }
    if (e.target.closest("[data-spot='bay']")) {
      const s = spots.find((s) => s.kind === "bay");
      return walkTo(s.x, () => activate(s));
    }
    const rect = $("#stage").getBoundingClientRect();
    walkTo((e.clientX - rect.left) / scale + cam);
  });

  // keyboard: hold arrows to walk
  const held = new Set();
  addEventListener("keydown", (e) => {
    if (document.querySelector("dialog[open]") || $("#museum").hidden) return;
    if (e.target.tagName === "INPUT") return;
    if (["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) {
      held.add(e.key);
      e.preventDefault();
      steer();
    }
    if (e.key === "Enter" || e.key === " ") {
      if (nearSpot) { e.preventDefault(); activate(nearSpot); }
    }
  });
  addEventListener("keyup", (e) => { held.delete(e.key); steer(); });
  function steer() {
    const left = held.has("ArrowLeft") || held.has("a");
    const right = held.has("ArrowRight") || held.has("d");
    if (left && !right) walkTo(-1e6);
    else if (right && !left) walkTo(1e6);
    else walkTo(P.x);
  }

  let idleHintTimer;
  function hideIdleHint() {
    $("#hint").classList.add("faded");
    clearTimeout(idleHintTimer);
    idleHintTimer = setTimeout(() => $("#hint").classList.remove("faded"), 15000);
  }

  /* ---------- Robot speech ---------- */
  let sayTimer;
  function say(html, ms = 5500) {
    const b = $("#say");
    b.innerHTML = `<span class="who">${esc(S.robotName)}</span>${html}`;
    b.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => b.classList.remove("show"), ms);
  }

  function drawActors() {
    $("#player").innerHTML = Art.kid(S.kid);
    $("#robotActor").innerHTML = Robot.svg(S.look);
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
      if (!started) {
        started = true;
        buildWorld();
        drawActors();
        layout();
        requestAnimationFrame((t) => { last = t; tick(t); });
      }
      $("#hudName").textContent = S.player;
      updateHUD();
      if (withEntrance) {
        P.x = 70; R.x = 0; P.target = 70;
        walkTo(420, () =>
          say(`Hi ${esc(S.player)}! I'm ${esc(S.robotName)}, your guide. These machines have amazing stories, and they tell them in their own words. Ready? The <b>Moon Wing</b> is to the right!`, 9000)
        );
      }
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
    if (!g) return;
    g.innerHTML = allEx.map((e) => `
      <button class="j-cell${stamped(e.id) ? " got" : ""}" data-goto="${e.id}" style="--wc:${e.wing.color}">
        <span class="j-art">${Art.hardware(e.art)}</span>
        <span class="j-name">${esc(e.name)}</span>
        <span class="j-stamp">${stamped(e.id) ? "Visited" : "Not yet"}</span>
      </button>`).join("");
    $("#journalBadges").innerHTML = wings
      .filter((w) => w.exhibits.every((e) => stamped(e.id)))
      .map((w) => `<span class="badge" style="--wc:${w.color}">${esc(w.badge.name)} badge</span>`).join("");
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
    const st = document.querySelector(`[data-stamp="${id}"]`);
    if (st) st.hidden = false;
    renderJournal();
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
      const idx = allEx.indexOf(allEx.find((e) => e.id === ex.id));
      const nxt = allEx[idx + 1];
      say(nxt ? `Nice! Next up: <b>${esc(nxt.name)}</b>. Keep walking →` : `You met every machine! Walk to the end to see your journal.`);
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
    drawActors();
  });

  /* ---------- dialogs: close buttons + backdrop click ---------- */
  document.querySelectorAll("dialog [data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  /* ---------- boot ---------- */
  buildIntro();
  window.resetMuseum = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };
})();
