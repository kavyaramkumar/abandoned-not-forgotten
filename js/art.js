/*
 * ART: hand-drawn SVG for the museum.
 *   Art.hardware(key)   simplified drawings of the real spacecraft
 *   Art.backdrop(key)   diorama scenes behind each exhibit
 *   Art.kid(look)       the player character
 *   Art.bus()           field-trip school bus (intro)
 * Shared gradients (#gold, #silver, #panel) live in index.html.
 * Drawings are simplified for kids but keep each machine's recognizable shape.
 */
window.Art = (function () {
  /* ---------- seeded random so star fields don't change between renders ---------- */
  function rng(seed) {
    let s = seed;
    return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  }
  function stars(n, w, h, seed, maxY) {
    const r = rng(seed);
    let out = "";
    for (let i = 0; i < n; i++) {
      const x = (r() * w).toFixed(1), y = (r() * (maxY || h)).toFixed(1);
      out += `<circle cx="${x}" cy="${y}" r="${(r() * 0.9 + 0.3).toFixed(2)}" fill="#fff" opacity="${(r() * 0.6 + 0.3).toFixed(2)}"/>`;
    }
    return out;
  }

  /* ---------- Diorama backdrops (300 x 200) ---------- */
  const BACKDROPS = {
    "moon-earth": () => `
      <rect width="300" height="200" fill="#07080d"/>
      ${stars(60, 300, 200, 7, 120)}
      <circle cx="232" cy="46" r="17" fill="#2f6fb5"/>
      <path d="M220 40c6-6 14-4 16 2s-6 8-10 12-8 0-6-4z M238 52c4-2 8 0 7 4s-6 4-7 0z" fill="#5f9a55"/>
      <path d="M215 46a17 17 0 0 0 34 0a17 12 0 0 1-34 0z" fill="#000" opacity=".35"/>
      <path d="M0 140 Q60 120 120 134 T240 126 T300 132 V200 H0z" fill="#8b8d93"/>
      <path d="M0 160 Q80 146 160 158 T300 152 V200 H0z" fill="#a4a6ab"/>
      <ellipse cx="70" cy="172" rx="22" ry="5" fill="#7c7e84"/>
      <ellipse cx="210" cy="184" rx="30" ry="6" fill="#8a8c92"/>
      <ellipse cx="160" cy="166" rx="9" ry="2.5" fill="#7c7e84"/>`,
    mars: () => `
      <defs><linearGradient id="marsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98a5e"/><stop offset="1" stop-color="#e2b48a"/></linearGradient></defs>
      <rect width="300" height="200" fill="url(#marsSky)"/>
      <circle cx="60" cy="40" r="9" fill="#f3e6cf" opacity=".8"/>
      <path d="M0 120 L50 98 L90 112 L150 90 L210 108 L260 96 L300 106 V200 H0z" fill="#9c4a2c"/>
      <path d="M0 150 Q90 132 170 148 T300 140 V200 H0z" fill="#b5593a"/>
      <ellipse cx="60" cy="176" rx="14" ry="6" fill="#7d3a22"/>
      <ellipse cx="230" cy="168" rx="9" ry="4" fill="#7d3a22"/>
      <ellipse cx="150" cy="188" rx="18" ry="6" fill="#8a4127"/>`,
    jupiter: () => `
      <rect width="300" height="200" fill="#06070c"/>
      ${stars(70, 300, 200, 11)}
      <circle cx="190" cy="105" r="70" fill="#d7b48a"/>
      <path d="M120 85h140M121 98h138M122 118h136M126 132h128" stroke="#a9744c" stroke-width="7" opacity=".7"/>
      <ellipse cx="215" cy="125" rx="13" ry="7" fill="#b5523a"/>
      <path d="M120 105a70 70 0 0 0 140 0a70 50 0 0 1-140 0z" fill="#000" opacity=".25"/>`,
    pluto: () => `
      <rect width="300" height="200" fill="#05060a"/>
      ${stars(80, 300, 200, 23)}
      <circle cx="150" cy="105" r="62" fill="#c9b8a4"/>
      <circle cx="150" cy="105" r="62" fill="#8a6e58" opacity=".35"/>
      <path d="M150 140c-26-14-34-30-26-42 6-9 19-7 26 3 7-10 20-12 26-3 8 12 0 28-26 42z" fill="#f1e8db"/>
      <path d="M95 90c15 6 20 20 10 34" stroke="#6e5240" stroke-width="10" fill="none" opacity=".5"/>`,
    deep: () => `
      <rect width="300" height="200" fill="#030409"/>
      ${stars(130, 300, 200, 31)}
      <path d="M0 40 L300 150" stroke="#fff3c9" stroke-width="16" opacity=".07"/>
      <circle cx="170" cy="103" r="2.4" fill="#7fb6ff"/>
      <circle cx="170" cy="103" r="6" fill="none" stroke="#7fb6ff" stroke-width=".6" opacity=".6"/>`,
  };

  function backdrop(key) {
    return `<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${(BACKDROPS[key] || BACKDROPS.deep)()}</svg>`;
  }

  /* ---------- Hardware drawings ---------- */
  const pad = (x, y, w) => `<ellipse cx="${x}" cy="${y}" rx="${w || 11}" ry="3.5" fill="#d9d4c7" stroke="#6b6658" stroke-width="1.2"/>`;
  const S = 'stroke="#3b3a36" stroke-width="2" stroke-linecap="round"';

  const HW = {
    surveyor: { vb: "0 0 200 170", svg: `
      <line x1="100" y1="104" x2="30" y2="152" ${S}/><line x1="100" y1="104" x2="170" y2="152" ${S}/><line x1="100" y1="104" x2="104" y2="160" ${S}/>
      ${pad(30, 154)}${pad(170, 154)}${pad(104, 162)}
      <polygon points="62,112 138,112 100,82" fill="url(#silver)" stroke="#3b3a36" stroke-width="2"/>
      <rect x="54" y="98" width="20" height="14" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="126" y="98" width="20" height="14" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.5"/>
      <line x1="100" y1="96" x2="100" y2="26" ${S}/>
      <rect x="76" y="14" width="48" height="20" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5" transform="rotate(-12 100 24)"/>
      <rect x="108" y="40" width="22" height="16" fill="#e7e2d4" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="80" y="84" width="10" height="16" rx="3" fill="#4a4b50"/>
      <path d="M128 112 L158 128 l8 -2 l-2 8z" fill="none" ${S}/>` },

    eagle: { vb: "0 0 220 170", svg: `
      <line x1="56" y1="112" x2="18" y2="154" ${S}/><line x1="164" y1="112" x2="202" y2="154" ${S}/>
      <line x1="80" y1="118" x2="58" y2="160" ${S}/><line x1="140" y1="118" x2="162" y2="160" ${S}/>
      ${pad(18, 156, 13)}${pad(202, 156, 13)}${pad(58, 162, 13)}${pad(162, 162, 13)}
      <path d="M96 120 L124 120 L130 140 L90 140z" fill="#4a4b50"/>
      <polygon points="52,70 168,70 184,94 168,120 52,120 36,94" fill="url(#gold)" stroke="#6b4e12" stroke-width="2"/>
      <path d="M60 80l18 6 14-4 20 8 18-6 22 6M48 100l22-3 18 6 22-5 20 6 24-4" stroke="#7a5a14" stroke-width="1" fill="none" opacity=".6"/>
      <rect x="50" y="66" width="120" height="6" fill="#2a2b2f"/>
      <g transform="translate(70 122) rotate(28)"><rect x="0" y="0" width="9" height="40" fill="none" stroke="#3b3a36" stroke-width="1.6"/>
        <path d="M0 8h9M0 16h9M0 24h9M0 32h9" stroke="#3b3a36" stroke-width="1.2"/></g>
      <rect x="92" y="100" width="20" height="13" fill="#d6d2c4" stroke="#3b3a36" stroke-width="1"/>` },

    lrv: { vb: "0 0 240 160", svg: `
      <line x1="178" y1="96" x2="186" y2="34" ${S}/>
      <path d="M160 34 Q186 10 214 30 Q186 40 160 34z" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.5"/>
      <path d="M168 31l18-14 20 12" stroke="#9c988a" stroke-width="1" fill="none"/>
      <rect x="28" y="96" width="184" height="12" rx="3" fill="url(#silver)" stroke="#3b3a36" stroke-width="1.5"/>
      <path d="M86 96v-26h26v26M118 96v-26h26v26" fill="#6a7a8c" stroke="#3b3a36" stroke-width="1.5"/>
      <line x1="78" y1="96" x2="74" y2="66" ${S}/><line x1="66" y1="66" x2="82" y2="66" ${S}/>
      <rect x="36" y="84" width="16" height="12" fill="#e7e2d4" stroke="#3b3a36" stroke-width="1.2"/>
      <path d="M30 112 a26 26 0 0 1 52 0M160 112 a26 26 0 0 1 52 0" fill="#c9c4b4" stroke="#3b3a36" stroke-width="1.5"/>
      <g class="wheel"><circle cx="56" cy="124" r="22" fill="#55575c" stroke="#2a2b2f" stroke-width="3"/><circle cx="56" cy="124" r="15" fill="none" stroke="#9b9da2" stroke-width="2" stroke-dasharray="3 3"/></g>
      <g class="wheel"><circle cx="186" cy="124" r="22" fill="#55575c" stroke="#2a2b2f" stroke-width="3"/><circle cx="186" cy="124" r="15" fill="none" stroke="#9b9da2" stroke-width="2" stroke-dasharray="3 3"/></g>` },

    viking: { vb: "0 0 210 175", svg: `
      <line x1="62" y1="118" x2="26" y2="156" ${S}/><line x1="148" y1="118" x2="184" y2="156" ${S}/><line x1="105" y1="124" x2="105" y2="162" ${S}/>
      ${pad(26, 158)}${pad(184, 158)}${pad(105, 164)}
      <polygon points="55,92 155,92 170,110 155,126 55,126 40,110" fill="url(#silver)" stroke="#3b3a36" stroke-width="2"/>
      <rect x="58" y="78" width="22" height="14" fill="#8a8d93" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="128" y="78" width="22" height="14" fill="#8a8d93" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="84" y="62" width="8" height="30" fill="#4a4b50"/><rect x="114" y="66" width="8" height="26" fill="#4a4b50"/>
      <line x1="104" y1="92" x2="112" y2="44" ${S}/>
      <ellipse cx="118" cy="36" rx="26" ry="9" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.5" transform="rotate(-18 118 36)"/>
      <path d="M150 116 L190 134 l6 -6" fill="none" ${S}/>` },

    sojourner: { vb: "0 0 170 120", svg: `
      <line x1="118" y1="52" x2="124" y2="20" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="34" y="46" width="98" height="10" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="46" y="56" width="74" height="24" fill="url(#gold)" stroke="#6b4e12" stroke-width="1.5"/>
      <path d="M44 96 L66 78 L86 96 M86 96 L104 80 L124 96" fill="none" stroke="#3b3a36" stroke-width="2"/>
      <circle cx="44" cy="100" r="11" fill="#5a5c61" stroke="#2a2b2f" stroke-width="2"/>
      <circle cx="86" cy="100" r="11" fill="#5a5c61" stroke="#2a2b2f" stroke-width="2"/>
      <circle cx="124" cy="100" r="11" fill="#5a5c61" stroke="#2a2b2f" stroke-width="2"/>` },

    opportunity: { vb: "0 0 230 185", svg: `
      <line x1="156" y1="96" x2="156" y2="40" stroke="#3b3a36" stroke-width="4"/>
      <rect x="140" y="26" width="34" height="16" rx="3" fill="#e7e2d4" stroke="#3b3a36" stroke-width="1.5"/>
      <circle cx="150" cy="34" r="3.5" fill="#2a2b2f"/><circle cx="164" cy="34" r="3.5" fill="#2a2b2f"/>
      <polygon points="18,96 212,96 196,108 34,108" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="66" y="108" width="98" height="30" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.5"/>
      <ellipse cx="92" cy="92" rx="12" ry="4" fill="#d6d2c4" stroke="#3b3a36"/>
      <path d="M52 162 L82 138 L112 162 M112 162 L142 140 L176 162" fill="none" stroke="#3b3a36" stroke-width="2.5"/>
      <circle cx="52" cy="164" r="14" fill="#5a5c61" stroke="#2a2b2f" stroke-width="2.5"/>
      <circle cx="112" cy="164" r="14" fill="#5a5c61" stroke="#2a2b2f" stroke-width="2.5"/>
      <circle cx="176" cy="164" r="14" fill="#5a5c61" stroke="#2a2b2f" stroke-width="2.5"/>` },

    ingenuity: { vb: "0 0 170 200", svg: `
      <line x1="72" y1="148" x2="38" y2="190" stroke="#3b3a36" stroke-width="1.8"/><line x1="98" y1="148" x2="132" y2="190" stroke="#3b3a36" stroke-width="1.8"/>
      <line x1="78" y1="150" x2="66" y2="194" stroke="#3b3a36" stroke-width="1.8"/><line x1="92" y1="150" x2="104" y2="194" stroke="#3b3a36" stroke-width="1.8"/>
      <rect x="64" y="118" width="42" height="32" rx="3" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.8"/>
      <rect x="70" y="124" width="14" height="10" fill="url(#gold)"/>
      <line x1="85" y1="118" x2="85" y2="32" stroke="#3b3a36" stroke-width="3"/>
      <g class="rotor"><ellipse cx="85" cy="88" rx="78" ry="4" fill="#cfcabb" stroke="#3b3a36" stroke-width="1.2"/></g>
      <g class="rotor rev"><ellipse cx="85" cy="70" rx="78" ry="4" fill="#cfcabb" stroke="#3b3a36" stroke-width="1.2"/></g>
      <rect x="64" y="22" width="42" height="10" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.2"/>` },

    pioneer: { vb: "0 0 220 190", svg: `
      <line x1="110" y1="120" x2="30" y2="170" stroke="#3b3a36" stroke-width="2.5"/>
      <line x1="110" y1="120" x2="190" y2="170" stroke="#3b3a36" stroke-width="2.5"/>
      <rect x="14" y="162" width="30" height="14" rx="4" fill="#4a4b50" transform="rotate(-30 29 169)"/>
      <rect x="176" y="162" width="30" height="14" rx="4" fill="#4a4b50" transform="rotate(30 191 169)"/>
      <line x1="110" y1="120" x2="210" y2="96" stroke="#3b3a36" stroke-width="1.2"/>
      <rect x="92" y="112" width="36" height="22" fill="url(#gold)" stroke="#6b4e12" stroke-width="1.5"/>
      <rect x="102" y="134" width="16" height="10" fill="#c9a640" stroke="#6b4e12"/>
      <circle cx="110" cy="66" r="58" fill="#f2efe6" stroke="#3b3a36" stroke-width="2"/>
      <circle cx="110" cy="66" r="40" fill="none" stroke="#c9c4b4" stroke-width="2"/>
      <path d="M68 30 L110 66 M152 30 L110 66 M110 124 L110 66" stroke="#6b6658" stroke-width="1.2"/>
      <circle cx="110" cy="66" r="6" fill="#3b3a36"/>` },

    voyager: { vb: "0 0 240 200", svg: `
      <line x1="120" y1="132" x2="18" y2="20" stroke="#6b6658" stroke-width="1.2"/>
      <line x1="120" y1="140" x2="40" y2="186" stroke="#3b3a36" stroke-width="2.5"/>
      <rect x="34" y="176" width="14" height="10" fill="#4a4b50"/><rect x="50" y="167" width="14" height="10" fill="#4a4b50"/><rect x="66" y="158" width="14" height="10" fill="#4a4b50"/>
      <line x1="130" y1="138" x2="214" y2="150" stroke="#3b3a36" stroke-width="2.5"/>
      <rect x="196" y="138" width="22" height="20" fill="#e7e2d4" stroke="#3b3a36" stroke-width="1.5"/>
      <polygon points="96,122 144,122 152,138 144,152 96,152 88,138" fill="#8a8d93" stroke="#3b3a36" stroke-width="2"/>
      <circle cx="108" cy="137" r="10" fill="url(#gold)" stroke="#6b4e12" stroke-width="1.5"/>
      <circle cx="108" cy="137" r="3" fill="#6b4e12"/>
      <circle cx="120" cy="68" r="56" fill="#f2efe6" stroke="#3b3a36" stroke-width="2"/>
      <circle cx="120" cy="68" r="36" fill="none" stroke="#c9c4b4" stroke-width="2"/>
      <path d="M86 34 L120 60 M154 34 L120 60" stroke="#6b6658" stroke-width="1.2"/>
      <rect x="114" y="54" width="12" height="12" fill="#3b3a36"/>` },

    newhorizons: { vb: "0 0 210 185", svg: `
      <line x1="150" y1="122" x2="196" y2="108" stroke="#3b3a36" stroke-width="2"/>
      <rect x="176" y="98" width="26" height="18" rx="3" fill="#2a2b2f" transform="rotate(-16 189 107)"/>
      <path d="M180 96v24M188 94v24M196 92v24" stroke="#55575c" stroke-width="1.5"/>
      <polygon points="48,160 162,160 146,100 64,100" fill="url(#gold)" stroke="#6b4e12" stroke-width="2"/>
      <path d="M62 120l20 4 18-5 22 6 24-4M56 142l24-3 20 5 24-4 26 3" stroke="#7a5a14" stroke-width="1" fill="none" opacity=".6"/>
      <rect x="70" y="130" width="18" height="14" fill="#4a4b50"/>
      <line x1="105" y1="100" x2="105" y2="80" stroke="#3b3a36" stroke-width="3"/>
      <ellipse cx="105" cy="68" rx="52" ry="18" fill="#f2efe6" stroke="#3b3a36" stroke-width="2"/>
      <ellipse cx="105" cy="68" rx="32" ry="10" fill="none" stroke="#c9c4b4" stroke-width="1.5"/>
      <line x1="105" y1="68" x2="105" y2="44" stroke="#6b6658" stroke-width="1.2"/>` },
  };

  function hardware(key) {
    const h = HW[key];
    if (!h) return "";
    return `<svg class="hw hw-${key}" viewBox="${h.vb}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${h.svg}</svg>`;
  }

  /* ---------- Player character (60 x 128, feet at bottom) ---------- */
  function kid(look) {
    const skin = look.skin || "#c98d63";
    const shirt = look.shirt || "#2f6fb5";
    const hair = look.hair || "#2b1d14";
    return `
<svg class="kid" viewBox="0 0 60 128" aria-hidden="true">
  <ellipse cx="30" cy="125" rx="16" ry="3" fill="#000" opacity=".25"/>
  <rect x="8" y="50" width="16" height="34" rx="5" fill="#d65a3a"/>
  <g class="leg leg-b"><rect x="25" y="84" width="9" height="34" rx="4" fill="#2b3346"/><rect x="23" y="114" width="15" height="8" rx="3" fill="#f2efe6"/></g>
  <g class="leg leg-f"><rect x="30" y="84" width="9" height="34" rx="4" fill="#323b52"/><rect x="28" y="114" width="15" height="8" rx="3" fill="#ffffff"/></g>
  <g class="arm arm-b"><rect x="38" y="52" width="8" height="28" rx="4" fill="${skin}" opacity=".85"/></g>
  <rect x="18" y="46" width="28" height="42" rx="9" fill="${shirt}"/>
  <path d="M26 47 L32 66 L38 47" stroke="#f2c14e" stroke-width="2" fill="none"/>
  <rect x="28" y="64" width="9" height="11" rx="1.5" fill="#f4ecdc" stroke="#f2c14e" stroke-width="1"/>
  <g class="arm arm-f"><rect x="22" y="52" width="8" height="28" rx="4" fill="${skin}"/></g>
  <rect x="26" y="38" width="10" height="10" fill="${skin}"/>
  <circle cx="32" cy="26" r="15" fill="${skin}"/>
  <path d="M17 24 Q18 8 33 9 Q48 10 47 24 Q40 16 30 18 Q22 19 17 24z" fill="${hair}"/>
  <circle cx="38" cy="27" r="2" fill="#1f1a17"/>
  <path d="M36 33 q3 2 6 0" stroke="#1f1a17" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>`;
  }

  /* ---------- School bus (260 x 120) ---------- */
  function bus() {
    return `
<svg class="bus" viewBox="0 0 260 120" aria-hidden="true">
  <rect x="6" y="20" width="236" height="76" rx="12" fill="#f2b632" stroke="#2a2b2f" stroke-width="3"/>
  <rect x="200" y="44" width="52" height="52" rx="8" fill="#f2b632" stroke="#2a2b2f" stroke-width="3"/>
  <path d="M8 70h244" stroke="#2a2b2f" stroke-width="3"/>
  ${[22, 62, 102, 142].map((x) => `<rect x="${x}" y="30" width="32" height="26" rx="4" fill="#bfe0f2" stroke="#2a2b2f" stroke-width="2"/>`).join("")}
  <rect x="182" y="30" width="16" height="56" rx="3" fill="#bfe0f2" stroke="#2a2b2f" stroke-width="2"/>
  <rect x="214" y="50" width="30" height="18" rx="3" fill="#bfe0f2" stroke="#2a2b2f" stroke-width="2"/>
  <text x="100" y="86" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="700" font-size="12" fill="#2a2b2f">FIELD TRIP</text>
  <circle cx="246" cy="84" r="4" fill="#fff6d0"/>
  <g class="wheel"><circle cx="58" cy="98" r="16" fill="#2a2b2f"/><circle cx="58" cy="98" r="6" fill="#9b9da2"/></g>
  <g class="wheel"><circle cx="206" cy="98" r="16" fill="#2a2b2f"/><circle cx="206" cy="98" r="6" fill="#9b9da2"/></g>
</svg>`;
  }

  return { hardware, backdrop, kid, bus };
})();
