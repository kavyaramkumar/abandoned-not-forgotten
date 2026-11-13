/*
 * MAZE: the hidden door network behind the museum
 * ------------------------------------------------------------
 * Kids never see this as a map. They only ever see one room and its doors.
 * Every new adventure generates a fresh network from a random seed.
 *
 *   Maze.generate(level, seed, content)  -> graph
 *   Maze.verify(graph, route)            -> step-by-step check of a route
 *   Maze.hint(graph, room, state)        -> which door leads toward the goal
 *   Maze.shortest(graph)                 -> best possible route length (brute force)
 *
 * THE PUZZLE (and why it's a good stand-in for NP)
 * The goal is a route that starts in the Atrium, passes through every room that
 * holds a signal piece, and ends in Mission Control. That is a "visit all these
 * places" route problem, the same family as the traveling-salesperson and
 * Hamiltonian-path problems, which are NP-complete on general networks.
 * (Just reaching ONE room is easy for a computer: breadth-first search does it
 * in polynomial time. Requiring every piece is what makes it hard in general.)
 *
 *   Finding a good route: you explore doors you can't see behind. To find the
 *   provably shortest route, the computer here tries every order of the pieces
 *   (k! orders), which explodes as k grows.
 *   Checking a route: walk the list of doors once and confirm each step. That
 *   takes time proportional to the route's length (polynomial), no matter how
 *   big the museum gets.
 */
window.Maze = (function () {
  const SYMBOLS = [
    { ch: "▲", name: "triangle", color: "#e0533b" },
    { ch: "●", name: "circle", color: "#3f7fd9" },
    { ch: "■", name: "square", color: "#2f9a62" },
    { ch: "★", name: "star", color: "#e8b53a" },
    { ch: "◆", name: "diamond", color: "#9a5be0" },
    { ch: "✚", name: "cross", color: "#1fa3a3" },
  ];
  // Door positions inside a room. N0 is skipped in rooms that show an exhibit on the north wall.
  const SLOTS = ["N1", "N2", "W1", "W2", "E1", "E2", "N0"];

  /* How each difficulty changes the NAVIGATION, not just the questions */
  const LEVELS = {
    // Learning mode: no puzzle. A fixed tour with NEXT and BACK doors through every room.
    learn: {
      label: "Learning", learn: true, scanner: "always", signs: "names", riddleNames: true, riddleHint: true, parFactor: null,
    },
    easy: {
      label: "Easy", main: 7, pieces: 3, discoveries: 2, maxDoors: 3, extraLinks: 1, oneWay: 0, locks: 1, hidden: 0,
      deadEnds: false, scanner: "always", signs: "names", riddleNames: true, riddleHint: true, parFactor: null,
    },
    medium: {
      label: "Medium", main: 11, pieces: 4, discoveries: 3, maxDoors: 3, extraLinks: 3, oneWay: 1, locks: 2, hidden: 1,
      deadEnds: false, scanner: 3, signs: "names", riddleNames: true, riddleHint: false, parFactor: 2.4,
    },
    hard: {
      label: "Hard", main: 15, pieces: 5, discoveries: 5, maxDoors: 4, extraLinks: 5, oneWay: 3, locks: 3, hidden: 2,
      deadEnds: true, scanner: 0, signs: "chalk", riddleNames: false, riddleHint: false, parFactor: 2,
    },
  };

  /* seeded random numbers (mulberry32) so a layout can be rebuilt from its number */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, r) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

  /**
   * content = { exhibits: [ids], treasures: [ids], halls: [count] }
   */
  function generate(levelKey, seed, content) {
    const L = LEVELS[levelKey];
    const r = rng(seed);
    const n = L.main;
    const edges = []; // { a, b, oneWay, hidden, sealed, lock }
    const deg = new Array(n).fill(0);
    const linked = (a, b) => edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
    const link = (a, b, extra) => { edges.push(Object.assign({ a, b }, extra || {})); deg[a]++; deg[b]++; };

    // 1. A random tree of two-way doors. Attaching new rooms mostly to recent ones makes long, winding paths.
    const order = [0].concat(shuffle([...Array(n).keys()].slice(1), r));
    const atriumMax = Math.min(L.maxDoors, levelKey === "easy" ? 2 : 3);
    for (let i = 1; i < n; i++) {
      const placed = order.slice(0, i).filter((x) => deg[x] < (x === 0 ? atriumMax : L.maxDoors - 1));
      const pool = placed.length ? placed : order.slice(0, i).filter((x) => deg[x] < L.maxDoors);
      const k = Math.max(0, pool.length - 1 - Math.floor(r() * r() * pool.length));
      link(pool[k], order[i]);
    }
    // 2. Remove dead ends (Easy/Medium), then add extra links that create loops and choices.
    if (!L.deadEnds) {
      for (let x = 1; x < n; x++) {
        if (deg[x] !== 1) continue;
        const opts = shuffle([...Array(n).keys()], r).filter((y) => y !== x && y !== 0 && !linked(x, y) && deg[y] < L.maxDoors);
        if (opts.length) link(x, opts[0], { extra: true });
      }
    }
    let tries = 0, added = 0;
    while (added < L.extraLinks && tries++ < 300) {
      const a = Math.floor(r() * n), b = Math.floor(r() * n);
      if (a === b || linked(a, b) || deg[a] >= L.maxDoors || deg[b] >= L.maxDoors) continue;
      if ((a === 0 || b === 0) && deg[0] >= atriumMax) continue;
      link(a, b, { extra: true });
      added++;
    }
    // 3. One-way airlocks: only on extra links, so the two-way tree keeps every room reachable from every other.
    shuffle(edges.filter((e) => e.extra), r).slice(0, L.oneWay).forEach((e) => {
      e.oneWay = true;
      if (r() < 0.5) [e.a, e.b] = [e.b, e.a]; // door is in room a, leads to b
    });

    // 4. Room roles. Mission Control hangs off the room farthest from the Atrium.
    const dist = undirectedDist(n, edges, 0);
    const far = [...Array(n).keys()].slice(1).sort((x, y) => dist[y] - dist[x] || r() - 0.5);
    const mcParent = far.find((x) => deg[x] < L.maxDoors) ?? far[0];
    const MC = n;
    deg.push(0);
    link(mcParent, MC, { sealed: true });

    const others = shuffle([...Array(n).keys()].slice(1), r).sort((x, y) => (dist[x] >= 2 ? 0 : 1) - (dist[y] >= 2 ? 0 : 1));
    const pieceRooms = others.slice(0, L.pieces);
    const discRooms = others.slice(L.pieces, L.pieces + L.discoveries);
    const exhibits = shuffle(content.exhibits, r);
    const hallOrder = shuffle([...Array(content.halls).keys()], r);

    const rooms = [];
    for (let i = 0; i <= n; i++) rooms.push({ id: i, doors: [] });
    rooms[0].type = "atrium";
    rooms[MC].type = "mc";
    let ei = 0, hi = 0;
    for (let i = 1; i < n; i++) {
      if (pieceRooms.includes(i)) Object.assign(rooms[i], { type: "exhibit", piece: true, exhibit: exhibits[ei++] });
      else if (discRooms.includes(i)) Object.assign(rooms[i], { type: "exhibit", piece: false, exhibit: exhibits[ei++] });
      else Object.assign(rooms[i], { type: "hall", hall: hallOrder[hi++ % hallOrder.length] });
    }

    // 5. Hidden rooms behind secret panels: a treasure, or a note with a route from an earlier explorer.
    const treasures = shuffle(content.treasures, r);
    for (let h = 0; h < L.hidden; h++) {
      const parents = [...Array(n).keys()].slice(1).filter((x) => deg[x] < L.maxDoors + 1);
      const p = parents[Math.floor(r() * parents.length)];
      const id = rooms.length;
      const kind = levelKey === "hard" ? (h === 0 ? "note" : "treasure") : r() < 0.5 ? "note" : "treasure";
      rooms.push({ id, doors: [], type: "hidden", find: kind, treasure: kind === "treasure" ? treasures[h % treasures.length] : null });
      deg.push(0);
      link(p, id, { hidden: true });
    }

    // 6. Riddle locks on a few doors (never the Mission Control or secret doors, and not right next to the Atrium).
    const lockable = shuffle(edges.filter((e) => !e.sealed && !e.hidden && e.a !== 0 && e.b !== 0), r);
    const runExhibits = rooms.filter((x) => x.exhibit).map((x) => x.exhibit);
    lockable.slice(0, L.locks).forEach((e, i) => {
      e.lock = { id: i, exhibit: runExhibits[Math.floor(r() * runExhibits.length)] };
    });

    // 7. Turn links into doors, then give every door a symbol and a spot on the wall.
    edges.forEach((e) => {
      rooms[e.a].doors.push({ to: e.b, oneWay: !!e.oneWay, hidden: !!e.hidden, sealed: !!e.sealed, lock: e.lock || null });
      if (!e.oneWay) rooms[e.b].doors.push({ to: e.a, oneWay: false, hidden: false, sealed: false, lock: e.lock || null });
    });
    rooms.forEach((room) => {
      const syms = shuffle([...SYMBOLS.keys()], r);
      const slots = shuffle(room.type === "exhibit" || room.type === "hidden" || room.type === "atrium" || room.type === "mc" ? SLOTS.slice(0, 6) : SLOTS, r);
      room.doors.forEach((d, i) => { d.sym = syms[i]; d.slot = slots[i]; d.i = i; });
    });

    const graph = { level: levelKey, seed, rooms, start: 0, mc: MC, pieces: pieceRooms };
    const best = shortest(graph);
    graph.best = best.length;
    graph.orders = best.orders;
    graph.par = L.parFactor ? Math.ceil(best.length * L.parFactor) + 4 : null;

    // the explorer's note: a route from the hidden room to the nearest piece room
    rooms.filter((x) => x.find === "note").forEach((x) => {
      const t = bfs(graph, x.id, { allowSealed: false });
      const target = pieceRooms.slice().sort((a, b) => t.dist[a] - t.dist[b])[0];
      x.note = { from: x.id, target, steps: pathDoors(graph, t, x.id, target) };
    });
    return graph;
  }

  function undirectedDist(n, edges, from) {
    const dist = new Array(n).fill(Infinity);
    dist[from] = 0;
    const q = [from];
    while (q.length) {
      const c = q.shift();
      edges.forEach((e) => {
        const o = e.a === c ? e.b : e.b === c ? e.a : -1;
        if (o >= 0 && o < n && dist[o] === Infinity) { dist[o] = dist[c] + 1; q.push(o); }
      });
    }
    return dist;
  }

  /* breadth-first search over doors (polynomial time) */
  function bfs(g, from, opts) {
    opts = opts || {};
    const N = g.rooms.length;
    const dist = new Array(N).fill(Infinity), prev = new Array(N).fill(null);
    dist[from] = 0;
    const q = [from];
    while (q.length) {
      const c = q.shift();
      g.rooms[c].doors.forEach((d) => {
        if (d.sealed && !opts.allowSealed) return;
        if (d.hidden && opts.revealed && !opts.revealed[`${c}:${d.i}`]) return;
        if (dist[d.to] === Infinity) { dist[d.to] = dist[c] + 1; prev[d.to] = { room: c, door: d.i }; q.push(d.to); }
      });
    }
    return { dist, prev };
  }
  function pathDoors(g, t, from, to) {
    const out = [];
    for (let c = to; c !== from && t.prev[c]; c = t.prev[c].room) {
      const p = t.prev[c];
      out.unshift({ room: p.room, door: p.door, sym: g.rooms[p.room].doors[p.door].sym });
    }
    return out;
  }

  /**
   * The best possible route, found by brute force: try every order of the piece rooms.
   * This is the "finding" side, and its cost grows like k! (k = number of pieces).
   */
  function shortest(g) {
    const keys = [g.start].concat(g.pieces);
    const d = {};
    keys.concat([g.mc]).forEach((k) => (d[k] = bfs(g, k, { allowSealed: true }).dist));
    let best = Infinity, orders = 0;
    const permute = (rest, at, len) => {
      if (!rest.length) { orders++; best = Math.min(best, len + d[at][g.mc]); return; }
      rest.forEach((p, i) => permute(rest.slice(0, i).concat(rest.slice(i + 1)), p, len + d[at][p]));
    };
    permute(g.pieces, g.start, 0);
    return { length: best, orders };
  }

  /**
   * The "checking" side: walk a proposed route once.
   * route = [{ from, door }]   (door = index into that room's doors)
   */
  function verify(g, route) {
    const steps = [];
    let at = g.start, ok = true;
    const seen = new Set([at]);
    for (const s of route) {
      const door = g.rooms[s.from] && g.rooms[s.from].doors[s.door];
      const good = s.from === at && !!door;
      steps.push({ from: s.from, to: door ? door.to : null, sym: door ? door.sym : null, ok: good });
      if (!good) { ok = false; break; }
      at = door.to;
      seen.add(at);
    }
    const allPieces = g.pieces.every((p) => seen.has(p));
    const checks = [
      { key: "check.start", label: "Starts in the Atrium", ok: route.length === 0 || route[0].from === g.start },
      { key: "check.connect", vars: { n: steps.length }, label: `Every door on the route really connects (${steps.length} doors)`, ok },
      { key: "check.pieces", vars: { k: g.pieces.length }, label: `Passes through all ${g.pieces.length} signal-piece rooms`, ok: allPieces },
      { key: "check.end", label: "Ends in Mission Control", ok: at === g.mc },
    ];
    if (g.par) checks.push({ key: "check.gold", vars: { n: g.par }, label: `Gold route: ${g.par} doors or fewer`, ok: steps.length <= g.par, bonus: true });
    return { ok: checks.filter((c) => !c.bonus).every((c) => c.ok), steps, checks };
  }

  /* Scanner: first door on the shortest way to the nearest piece you still need (or Mission Control). */
  function hint(g, room, state) {
    const need = g.pieces.filter((p) => !state.collected.includes(p));
    if (need.includes(room)) return { here: true };
    const t = bfs(g, room, { allowSealed: need.length === 0 });
    const targets = need.length ? need : [g.mc];
    const target = targets.slice().sort((a, b) => t.dist[a] - t.dist[b])[0];
    if (t.dist[target] === Infinity) return null;
    const p = pathDoors(g, t, room, target);
    return p.length ? { door: p[0].door, target, steps: p.length } : null;
  }

  /**
   * Learning mode: one long, friendly tour. Atrium, then each wing (a hall, then
   * its machines), then the secret treasures, then Mission Control.
   * content = { wings: [{ hall, exhibits: [ids] }], treasures: [ids] }
   */
  function tour(content) {
    const rooms = [{ id: 0, type: "atrium", doors: [] }];
    const push = (r) => { r.id = rooms.length; r.doors = []; rooms.push(r); return r.id; };
    content.wings.forEach((w) => {
      push({ type: "hall", hall: w.hall });
      w.exhibits.forEach((e) => push({ type: "exhibit", exhibit: e, piece: false }));
    });
    content.treasures.forEach((t) => push({ type: "hidden", find: "treasure", treasure: t }));
    const mc = push({ type: "mc" });
    for (let i = 0; i < rooms.length - 1; i++) {
      const a = rooms[i], b = rooms[i + 1];
      a.doors.push({ to: b.id, next: true, sym: 3, slot: "E1" });
      b.doors.push({ to: a.id, back: true, sym: 1, slot: "W1" });
    }
    rooms.forEach((r) => r.doors.forEach((d, i) => (d.i = i)));
    return { level: "learn", seed: 0, rooms, start: 0, mc, pieces: [], best: rooms.length - 1, orders: 1, par: null, tour: true };
  }

  return { LEVELS, SYMBOLS, generate, verify, hint, shortest, factorial, bfs, tour };
})();
