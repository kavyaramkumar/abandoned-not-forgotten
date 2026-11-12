/*
 * SILENT EXPLORERS MUSEUM: main app
 * Views: intro ticket → lobby (story tree of wings) → wing hallway → exhibit card.
 * Progress is saved in this browser (localStorage) only.
 */
(function () {
  const M = window.MUSEUM;
  const $ = (s, el = document) => el.querySelector(s);
  const SAVE_KEY = "silent-explorers-v1";

  /* ---------- State ---------- */
  const defaultState = () => ({
    player: "",
    robotName: "Echo",
    stars: 0,
    completed: {}, // exhibitId -> stars earned
    owned: ["c-silver", "e-cyan", "h-none", "g-none"],
    look: { color: "#c9d3e6", eyes: "#5ef2ff", hat: "none", gear: "none" },
  });
  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {}
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }

  const realWings = M.wings.filter((w) => !w.comingSoon);
  const allExhibits = realWings.flatMap((w) => w.exhibits.map((e) => ({ ...e, wing: w })));
  const doneIn = (wing) => wing.exhibits.filter((e) => S.completed[e.id] != null).length;
  const wingById = (id) => M.wings.find((w) => w.id === id);
  function wingUnlocked(w) {
    if (w.comingSoon) return false;
    if (!w.unlock) return true;
    return doneIn(wingById(w.unlock.wing)) >= w.unlock.count;
  }
  function exhibitUnlocked(wing, i) {
    return i === 0 || S.completed[wing.exhibits[i - 1].id] != null;
  }

  /* ---------- Starfield ---------- */
  (function starfield() {
    const c = $("#stars");
    const ctx = c.getContext("2d");
    let stars = [];
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resize() {
      c.width = innerWidth * devicePixelRatio;
      c.height = innerHeight * devicePixelRatio;
      stars = Array.from({ length: Math.round((innerWidth * innerHeight) / 5000) }, () => ({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        r: Math.random() * 1.4 * devicePixelRatio + 0.2,
        s: Math.random() * 0.25 + 0.03,
        t: Math.random() * Math.PI * 2,
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const st of stars) {
        st.t += 0.02;
        if (!reduce) st.x -= st.s;
        if (st.x < 0) st.x = c.width;
        ctx.globalAlpha = 0.5 + Math.sin(st.t) * 0.35;
        ctx.fillStyle = "#dfe8ff";
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    addEventListener("resize", resize);
    resize();
    frame();
  })();

  /* ---------- HUD + companion ---------- */
  function renderHUD(pop) {
    $("#museumName").textContent = M.name;
    $("#museumTagline").textContent = M.tagline;
    $("#starCount").textContent = S.stars;
    const done = Object.keys(S.completed).length;
    $("#cardCount").textContent = `${done}/${allExhibits.length}`;
    if (pop) {
      const el = $("#starCount").parentElement;
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    }
    $("#companionRobot").innerHTML = Robot.svg(S.look);
  }

  let bubbleTimer;
  function say(html, ms = 6000) {
    const b = $("#bubble");
    b.innerHTML = `<b>${esc(S.robotName)}:</b> ${html}`;
    b.classList.add("show");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => b.classList.remove("show"), ms);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Router ---------- */
  let currentWing = null;
  function show(view) {
    document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== "view-" + view));
    scrollTo({ top: 0 });
  }

  /* ---------- Intro ---------- */
  function renderIntro() {
    $("#introRobot").innerHTML = Robot.svg(S.look);
    $("#robotName").value = S.robotName;
    show("intro");
  }
  $("#introForm").addEventListener("submit", (e) => {
    e.preventDefault();
    S.player = $("#playerName").value.trim() || "Explorer";
    S.robotName = $("#robotName").value.trim() || "Echo";
    save();
    renderHUD();
    goLobby();
    say(`Hi ${esc(S.player)}! I'm your museum guide. Let's start in the <b>Moon Wing</b>. Every exhibit card you finish earns stars ⭐ to upgrade me!`, 9000);
  });

  /* ---------- Lobby ---------- */
  function goLobby() {
    currentWing = null;
    const tree = $("#wingTree");
    tree.innerHTML = "";
    M.wings.forEach((w) => {
      const unlocked = wingUnlocked(w);
      const card = document.createElement("button");
      card.className = "wing-card" + (w.comingSoon ? " soon locked" : unlocked ? "" : " locked");
      card.style.setProperty("--wing", w.color);
      card.dataset.wing = w.id;
      const total = w.exhibits.length;
      const done = w.comingSoon ? 0 : doneIn(w);
      let meta;
      if (w.comingSoon) meta = "Exhibit under construction";
      else if (!unlocked) {
        const need = w.unlock.count - doneIn(wingById(w.unlock.wing));
        meta = `🔒 Finish ${need} more ${wingById(w.unlock.wing).name} card${need > 1 ? "s" : ""}`;
      } else meta = `${done}/${total} cards complete`;
      card.innerHTML = `
        ${!unlocked ? '<span class="lock" aria-hidden="true">' + (w.comingSoon ? "🚧" : "🔒") + "</span>" : ""}
        <div class="planet" aria-hidden="true"></div>
        <h3>${esc(w.name)}</h3>
        <p>${esc(w.subtitle)}</p>
        <span class="meta">${meta}</span>
        <div class="progress"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>`;
      card.setAttribute("aria-disabled", String(!unlocked));
      card.addEventListener("click", () => {
        if (w.comingSoon) return say("This wing is still being built. More exhibits are on the way! 🚧");
        if (!unlocked) return say(`That wing is locked. ${meta.replace("🔒 ", "")} to open it!`);
        goWing(w);
      });
      tree.appendChild(card);
    });
    drawTreeLines();

    const shelf = $("#badgeShelf");
    shelf.innerHTML = realWings
      .filter((w) => doneIn(w) === w.exhibits.length)
      .map((w) => `<span class="badge">${w.badge.icon} ${esc(w.badge.name)} badge</span>`)
      .join("");
    show("lobby");
  }

  // Story-tree connectors between wings that unlock each other
  function drawTreeLines() {
    const tree = $("#wingTree");
    const old = tree.querySelector(".tree-lines");
    if (old) old.remove();
    const box = tree.getBoundingClientRect();
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "tree-lines");
    M.wings.forEach((w) => {
      if (!w.unlock) return;
      const a = tree.querySelector(`[data-wing="${w.unlock.wing}"]`).getBoundingClientRect();
      const b = tree.querySelector(`[data-wing="${w.id}"]`).getBoundingClientRect();
      const line = document.createElementNS(svgNS, "path");
      const x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top;
      const x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top;
      line.setAttribute("d", `M${x1} ${y1} C ${x1 + 20} ${y1}, ${x2 - 20} ${y2}, ${x2} ${y2}`);
      line.setAttribute("stroke", wingUnlocked(w) ? w.color : "rgba(150,170,220,.3)");
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-dasharray", wingUnlocked(w) ? "0" : "6 6");
      line.setAttribute("fill", "none");
      svg.appendChild(line);
    });
    tree.prepend(svg);
  }
  addEventListener("resize", () => { if (!$("#view-lobby").hidden) drawTreeLines(); });

  /* ---------- Wing hallway ---------- */
  let hallIndex = 0;
  function goWing(w) {
    currentWing = w;
    document.documentElement.style.setProperty("--accent", w.color);
    $("#wingEyebrow").textContent = `Wing ${realWings.indexOf(w) + 1} · ${w.exhibits.length} exhibits`;
    $("#wingTitle").textContent = w.name;
    $("#wingIntro").textContent = w.intro;
    $("#hall").style.setProperty("--wing", w.color);
    // start at the first exhibit that isn't finished yet
    const firstOpen = w.exhibits.findIndex((e) => S.completed[e.id] == null);
    hallIndex = firstOpen === -1 ? 0 : firstOpen;
    renderHall(false);
    show("wing");
    say(`Welcome to the <b>${esc(w.name)}</b>! Walk up to an exhibit and click it to hear its story.`);
  }

  function renderHall(animateWalk = true) {
    const w = currentWing;
    const track = $("#hallTrack");
    track.innerHTML = "";
    w.exhibits.forEach((ex, i) => {
      const open = exhibitUnlocked(w, i);
      const done = S.completed[ex.id] != null;
      const b = document.createElement("button");
      b.className = "exhibit" + (i === hallIndex ? " current" : "") + (done ? " done" : "") + (open ? "" : " locked");
      b.style.setProperty("--wing", w.color);
      b.innerHTML = `
        <div class="holo" aria-hidden="true">${open ? ex.icon : "🔒"}</div>
        <div class="pedestal" aria-hidden="true"></div>
        <div class="label">${open ? esc(ex.name) : "Locked exhibit"}
          <small>${open ? ex.year + " · " + esc(ex.kind) : "Finish the one before it"}${done ? " · ✅" : ""}</small>
        </div>`;
      b.setAttribute("aria-label", open ? `${ex.name}, ${ex.year}${done ? ", completed" : ""}` : "Locked exhibit");
      b.addEventListener("click", () => {
        if (i !== hallIndex) return walkTo(i);
        if (!open) return say("This one's locked. Finish the exhibit before it to unlock it! 🔐");
        openExhibit(ex);
      });
      track.appendChild(b);
    });
    // center current exhibit
    requestAnimationFrame(() => {
      const items = track.children;
      const cur = items[hallIndex];
      const offset = cur.offsetLeft + cur.offsetWidth / 2 - $("#hall").clientWidth / 2;
      track.style.transform = `translateX(${-offset}px)`;
    });
    $("#hallRobot").innerHTML = Robot.svg(S.look, { walking: animateWalk });
    if (animateWalk) setTimeout(() => ($("#hallRobot").innerHTML = Robot.svg(S.look)), 800);
    $("#hallPos").textContent = `Exhibit ${hallIndex + 1} of ${w.exhibits.length}`;
    $("#walkLeft").disabled = hallIndex === 0;
    $("#walkRight").disabled = hallIndex === w.exhibits.length - 1;
  }

  function walkTo(i) {
    if (!currentWing) return;
    hallIndex = Math.max(0, Math.min(currentWing.exhibits.length - 1, i));
    renderHall(true);
  }
  $("#walkLeft").addEventListener("click", () => walkTo(hallIndex - 1));
  $("#walkRight").addEventListener("click", () => walkTo(hallIndex + 1));
  addEventListener("keydown", (e) => {
    if ($("#view-wing").hidden || document.querySelector("dialog[open]")) return;
    if (e.key === "ArrowLeft") walkTo(hallIndex - 1);
    if (e.key === "ArrowRight") walkTo(hallIndex + 1);
  });
  $("#backToLobby").addEventListener("click", goLobby);
  $("#homeBtn").addEventListener("click", () => (S.player ? goLobby() : renderIntro()));

  /* ---------- Exhibit card ---------- */
  const STEP_NAMES = ["Story", "Still there", "Discovery", "Challenge"];
  let ex = null, pages = [], pageIdx = 0, quizTries = 0;

  function openExhibit(exhibit) {
    ex = exhibit;
    pages = [
      ...ex.story.map((t, i) => ({ step: 0, kind: "story", i })),
      { step: 1, kind: "left" },
      { step: 2, kind: "discovery" },
      { step: 3, kind: "quiz" },
    ];
    pageIdx = 0;
    quizTries = 0;
    $("#exIcon").textContent = ex.icon;
    $("#exMeta").textContent = `${ex.year} · ${ex.kind} · ${ex.place}`;
    $("#exTitle").textContent = ex.name;
    const st = $("#exStatus");
    st.textContent = ex.status;
    st.className = "chip " + (ex.status === "still talking" ? "talking" : ex.status);
    renderPage();
    $("#exhibitDialog").showModal();
  }

  function renderPage() {
    const p = pages[pageIdx];
    const body = $("#exBody");
    $("#exSteps").innerHTML = STEP_NAMES.map((n, i) => {
      const firstPage = pages.findIndex((pg) => pg.step === i);
      const cur = p.step === i ? ' aria-current="step"' : "";
      return `<button data-go="${firstPage}" class="${firstPage <= pageIdx ? "seen" : ""}"${cur}>${i + 1}. ${n}</button>`;
    }).join("");

    if (p.kind === "story") {
      body.innerHTML = `
        <div class="story-page">
          <p class="speaker">${esc(ex.name)} says…</p>
          <p>${esc(ex.story[p.i])}</p>
          <div class="dots">${ex.story.map((_, i) => `<i class="${i === p.i ? "on" : ""}"></i>`).join("")}</div>
        </div>`;
    } else if (p.kind === "left") {
      body.innerHTML = `
        <h3>What's still out there today</h3>
        <ul class="left-list">${ex.leftBehind.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
    } else if (p.kind === "discovery") {
      body.innerHTML = `<h3>The science it made possible</h3><p class="discovery">💡 ${esc(ex.discovery)}</p>`;
    } else {
      renderQuiz();
    }

    $("#exPrev").disabled = pageIdx === 0;
    const last = pageIdx === pages.length - 1;
    $("#exNext").hidden = last;
  }

  function renderQuiz() {
    const done = S.completed[ex.id] != null;
    const q = ex.quiz;
    $("#exBody").innerHTML = `
      <p class="eyebrow">Mission challenge${done ? " · already completed ✅" : ""}</p>
      <p class="quiz-q">${esc(q.q)}</p>
      <div class="quiz-opts">${q.options.map((o, i) => `<button data-opt="${i}">${esc(o)}</button>`).join("")}</div>
      <p class="quiz-feedback" id="quizFb" aria-live="polite"></p>`;
    $("#exBody").querySelectorAll("[data-opt]").forEach((b) =>
      b.addEventListener("click", () => answer(+b.dataset.opt, b))
    );
  }

  function answer(i, btn) {
    const q = ex.quiz;
    quizTries++;
    if (i !== q.answer) {
      btn.classList.add("wrong");
      btn.disabled = true;
      $("#quizFb").textContent = "Not quite. Try another answer! Tip: look back at the story.";
      return;
    }
    btn.classList.add("right");
    $("#exBody").querySelectorAll("[data-opt]").forEach((b) => (b.disabled = true));
    const already = S.completed[ex.id] != null;
    const earned = already ? 0 : quizTries === 1 ? 3 : 1;
    const wing = currentWing;
    const wasUnlocked = M.wings.map(wingUnlocked);
    if (!already) {
      S.completed[ex.id] = earned;
      S.stars += earned;
      save();
      renderHUD(true);
    }
    const reward = document.createElement("div");
    reward.className = "reward";
    reward.innerHTML = already
      ? `<p>${esc(q.explain)}</p><p class="muted">You already earned stars for this card.</p>`
      : `<div class="big">${"⭐".repeat(earned)}</div><p><b>+${earned} star${earned > 1 ? "s" : ""}!</b> ${esc(q.explain)}</p>`;
    $("#exBody").appendChild(reward);

    if (!already) {
      const newly = M.wings.filter((w, k) => !wasUnlocked[k] && wingUnlocked(w));
      if (newly.length) say(`🎉 You unlocked the <b>${esc(newly[0].name)}</b>! Check the museum map.`, 9000);
      else if (doneIn(wing) === wing.exhibits.length) say(`${wing.badge.icon} You finished the whole ${esc(wing.name)} and earned the <b>${esc(wing.badge.name)}</b> badge!`, 9000);
      else say(`Nice work! You have ${S.stars} stars. Visit the <b>Robot Workshop</b> to upgrade me, or walk to the next exhibit.`);
    }
  }

  $("#exSteps").addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    pageIdx = +b.dataset.go;
    renderPage();
  });
  $("#exNext").addEventListener("click", () => { if (pageIdx < pages.length - 1) { pageIdx++; renderPage(); } });
  $("#exPrev").addEventListener("click", () => { if (pageIdx > 0) { pageIdx--; renderPage(); } });
  $("#exhibitDialog").addEventListener("close", () => {
    speechSynthesis && speechSynthesis.cancel();
    if (currentWing) {
      // auto-advance the hallway robot after finishing a card
      const i = currentWing.exhibits.indexOf(ex);
      renderHall(false);
      if (S.completed[ex.id] != null && i < currentWing.exhibits.length - 1 && hallIndex === i)
        setTimeout(() => walkTo(i + 1), 400);
    }
  });

  // Read to me (browser text-to-speech)
  $("#readAloud").addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return say("Sorry, this browser can't read aloud.");
    speechSynthesis.cancel();
    const text = $("#exBody").innerText.replace(/[⭐💡📍✅]/g, "");
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    speechSynthesis.speak(u);
  });

  /* ---------- Ask the exhibit (AI placard) ---------- */
  let chatHistory = [];
  $("#askBtn").addEventListener("click", () => {
    chatHistory = [];
    $("#chatExhibit").textContent = ex.name;
    $("#chatMode").textContent = window.CONFIG.askEndpoint ? "AI guide" : "offline guide";
    $("#chatLog").innerHTML = "";
    addMsg("bot", `Hi! I'm the placard for ${ex.name}. Ask me anything about it!`);
    const sugg = (ex.faq || []).slice(0, 3).map((f) => f.keys[0]);
    const prompts = ["What is it doing now?", ...sugg.map((k) => `Tell me about the ${k}`)];
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
    const typing = addMsg("bot typing", "Thinking…");
    const res = await ExhibitGuide.ask(ex, q, chatHistory);
    typing.remove();
    addMsg("bot", res.text);
    $("#chatMode").textContent = res.mode === "ai" ? "AI guide" : "offline guide";
    chatHistory.push({ role: "user", content: q }, { role: "assistant", content: res.text });
  });
  function addMsg(who, text) {
    const d = document.createElement("div");
    d.className = "msg " + who;
    d.textContent = text;
    $("#chatLog").appendChild(d);
    $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
    return d;
  }

  /* ---------- Robot workshop ---------- */
  const SLOT_NAMES = { color: "Paint", eyes: "Eye lights", hat: "Hats", gear: "Gear" };
  $("#workshopBtn").addEventListener("click", () => {
    renderWorkshop();
    $("#workshopDialog").showModal();
  });
  function renderWorkshop() {
    $("#wsRobotName").textContent = S.robotName;
    $("#wsPreview").innerHTML = Robot.svg(S.look) + `<p class="mono" style="text-align:center">⭐ ${S.stars} star${S.stars === 1 ? "" : "s"}</p>`;
    const shop = $("#wsShop");
    shop.innerHTML = Object.keys(SLOT_NAMES).map((slot) => {
      const items = M.shop.filter((i) => i.slot === slot).map((it) => {
        const owned = S.owned.includes(it.id);
        const equipped = S.look[slot] === it.value;
        const afford = S.stars >= it.cost;
        const sw = slot === "color" || slot === "eyes" ? `<span class="sw" style="background:${it.value}"></span>` : "";
        const tag = equipped ? "ON" : owned ? "owned" : `⭐${it.cost}`;
        return `<button class="ws-item${equipped ? " equipped" : ""}${!owned && !afford ? " cant" : ""}" data-item="${it.id}">${sw}<span>${esc(it.name)}</span><span class="cost">${tag}</span></button>`;
      }).join("");
      return `<h4>${SLOT_NAMES[slot]}</h4><div class="ws-items">${items}</div>`;
    }).join("");
  }
  $("#wsShop").addEventListener("click", (e) => {
    const b = e.target.closest("[data-item]");
    if (!b) return;
    const it = M.shop.find((i) => i.id === b.dataset.item);
    if (!S.owned.includes(it.id)) {
      if (S.stars < it.cost) {
        say(`You need ${it.cost - S.stars} more star${it.cost - S.stars > 1 ? "s" : ""} for the ${esc(it.name)}. Finish more exhibit cards!`);
        return;
      }
      S.stars -= it.cost;
      S.owned.push(it.id);
      say(`Ooh, ${esc(it.name)}! Thank you! 🤩`);
    }
    S.look[it.slot] = it.value;
    save();
    renderHUD();
    renderWorkshop();
    if (currentWing) $("#hallRobot").innerHTML = Robot.svg(S.look);
  });

  /* ---------- Dialog close buttons ---------- */
  document.querySelectorAll("dialog [data-close]").forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close())
  );
  document.querySelectorAll("dialog").forEach((d) =>
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); })
  );

  /* ---------- Boot ---------- */
  renderHUD();
  if (S.player) {
    goLobby();
    say(`Welcome back, ${esc(S.player)}! You have ${S.stars} stars.`);
  } else renderIntro();

  // Handy for demos: reset progress from the browser console with resetMuseum()
  window.resetMuseum = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };
})();
