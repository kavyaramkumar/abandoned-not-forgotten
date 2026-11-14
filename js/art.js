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
    "mars-north": () => `
      <rect width="300" height="200" fill="#d9b48e"/>
      <circle cx="240" cy="40" r="8" fill="#f6ecd8" opacity=".85"/>
      <path d="M0 118 Q90 106 170 116 T300 110 V200 H0z" fill="#c79a74"/>
      <path d="M0 140 L300 140 V200 H0z" fill="#b98c66"/>
      <path d="M10 150 l40 -6 l30 14 l-36 8z M90 148 l50 -4 l20 16 l-48 6z M170 152 l44 -6 l34 12 l-40 10z M30 176 l46 -4 l26 16 l-50 6z M130 178 l50 -6 l30 16 l-50 6z" fill="none" stroke="#9a6e4c" stroke-width="2"/>
      <ellipse cx="200" cy="170" rx="10" ry="3" fill="#f4f8fb"/>`,
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
    // Apollo Lunar Surface Experiments Package: central station, nuclear power unit, seismometer, laser mirror
    alsep: { vb: "0 0 250 150", svg: `
      <path d="M0 140 Q125 130 250 140 V150 H0z" fill="#b9b4a8"/>
      <path d="M44 128 C70 110 96 132 120 118 M150 122 C170 112 190 126 206 116" stroke="#2a2b2f" stroke-width="1.6" fill="none"/>
      <g><rect x="22" y="96" width="22" height="34" rx="3" fill="#4a4b50" stroke="#2a2b2f" stroke-width="1.5"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="${14 + 0}" y="${100 + i * 8}" width="38" height="3" fill="#6b6e75"/>`).join("")}</g>
      <rect x="100" y="98" width="52" height="30" fill="url(#silver)" stroke="#3b3a36" stroke-width="2"/>
      <rect x="92" y="78" width="68" height="6" fill="#e7e2d4" stroke="#3b3a36" stroke-width="1.5"/>
      <line x1="100" y1="84" x2="100" y2="98" ${S}/><line x1="152" y1="84" x2="152" y2="98" ${S}/>
      <line x1="126" y1="78" x2="126" y2="44" ${S}/>
      <path d="M112 44 Q126 30 140 44z" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.5"/>
      <path d="M54 128 q12 -24 24 0z" fill="url(#silver)" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="52" y="126" width="28" height="4" fill="#e7e2d4" stroke="#3b3a36" stroke-width="1"/>
      <g transform="translate(184 92) rotate(-20)"><rect x="0" y="0" width="44" height="30" fill="#2a2b2f" stroke="#3b3a36" stroke-width="1.5"/>
        ${[0, 1, 2, 3, 4].map((c) => [0, 1, 2].map((r) => `<circle cx="${6 + c * 8}" cy="${6 + r * 9}" r="3" fill="#8fd0ff"/>`).join("")).join("")}</g>
      <line x1="200" y1="118" x2="196" y2="138" ${S}/><line x1="220" y1="112" x2="224" y2="136" ${S}/>` },

    // Dawn: ion-engine spacecraft with long solar wings, now orbiting Ceres
    dawn: { vb: "0 0 280 120", svg: `
      <circle cx="140" cy="88" r="16" fill="#5ef2ff" opacity=".35"/><circle cx="140" cy="86" r="8" fill="#a8f7ff" opacity=".8"/>
      <rect x="2" y="44" width="104" height="26" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="174" y="44" width="104" height="26" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5"/>
      <path d="M28 44v26M54 44v26M80 44v26M200 44v26M226 44v26M252 44v26" stroke="#7fa0d8" stroke-width="1"/>
      <line x1="106" y1="57" x2="120" y2="57" ${S}/><line x1="160" y1="57" x2="174" y2="57" ${S}/>
      <rect x="120" y="36" width="40" height="44" fill="url(#gold)" stroke="#6b4e12" stroke-width="2"/>
      <rect x="132" y="80" width="16" height="6" fill="#4a4b50"/>
      <line x1="140" y1="36" x2="140" y2="26" ${S}/>
      <ellipse cx="140" cy="22" rx="20" ry="7" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.5"/>` },

    // NEAR Shoemaker: resting on asteroid Eros, with four solar panels and a dish antenna
    near: { vb: "0 0 230 160", svg: `
      <path d="M0 132 Q40 112 80 124 T160 118 T230 128 V160 H0z" fill="#9a8a72"/>
      <circle cx="40" cy="138" r="6" fill="#7e705a"/><circle cx="190" cy="140" r="9" fill="#7e705a"/><circle cx="120" cy="146" r="4" fill="#7e705a"/>
      <g transform="rotate(-14 115 86)">
        <rect x="20" y="70" width="58" height="30" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5"/>
        <rect x="152" y="70" width="58" height="30" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5"/>
        <rect x="86" y="96" width="58" height="22" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5" opacity=".9"/>
        <polygon points="92,66 138,66 150,80 138,96 92,96 80,80" fill="url(#gold)" stroke="#6b4e12" stroke-width="2"/>
        <line x1="78" y1="84" x2="80" y2="84" ${S}/><line x1="150" y1="84" x2="152" y2="84" ${S}/>
        <line x1="115" y1="66" x2="115" y2="52" ${S}/>
        <path d="M89 52 Q115 30 141 52z" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.5"/>
      </g>` },

    // Kepler: a planet-hunting telescope with a slanted sunshade and a solar-panel shield
    kepler: { vb: "0 0 170 230", svg: `
      <path d="M40 34 L118 14 L118 172 L40 172z" fill="url(#silver)" stroke="#3b3a36" stroke-width="2"/>
      <path d="M40 34 L118 14" stroke="#2a2b2f" stroke-width="3"/>
      <ellipse cx="79" cy="26" rx="40" ry="9" fill="#14183f" stroke="#3b3a36" stroke-width="1.5" transform="rotate(-14 79 26)"/>
      <path d="M58 60h40M58 90h40M58 120h40M58 150h40" stroke="#9c988a" stroke-width="1.2"/>
      <path d="M118 40 L150 52 L150 196 L118 184z" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5"/>
      <path d="M118 80 L150 92M118 120 L150 132M118 160 L150 172" stroke="#7fa0d8" stroke-width="1"/>
      <rect x="32" y="172" width="94" height="30" fill="url(#gold)" stroke="#6b4e12" stroke-width="2"/>
      <rect x="62" y="202" width="34" height="10" fill="#4a4b50"/>
      <line x1="40" y1="190" x2="20" y2="208" ${S}/><ellipse cx="16" cy="212" rx="12" ry="5" fill="#f2efe6" stroke="#3b3a36" stroke-width="1.5"/>` },

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

    ranger: { vb: "0 0 200 190", svg: `
      <polygon points="100,20 128,60 72,60" fill="#d6d2c4" stroke="#3b3a36" stroke-width="2"/>
      <rect x="78" y="60" width="44" height="54" fill="url(#silver)" stroke="#3b3a36" stroke-width="2"/>
      <rect x="86" y="70" width="10" height="34" rx="2" fill="#3b3a36"/><rect x="104" y="70" width="10" height="34" rx="2" fill="#3b3a36"/>
      <polygon points="66,114 134,114 146,134 54,134" fill="url(#gold)" stroke="#6b4e12" stroke-width="2"/>
      <rect x="6" y="122" width="58" height="22" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5" transform="rotate(-8 35 133)"/>
      <rect x="136" y="122" width="58" height="22" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5" transform="rotate(8 165 133)"/>
      <line x1="100" y1="134" x2="100" y2="170" stroke="#3b3a36" stroke-width="3"/>
      <ellipse cx="100" cy="176" rx="34" ry="9" fill="#f2efe6" stroke="#3b3a36" stroke-width="2"/>` },

    insight: { vb: "0 0 240 160", svg: `
      <polygon points="10,70 38,52 66,70 38,88" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5"/>
      <circle cx="38" cy="70" r="30" fill="url(#panel)" stroke="#3b3a36" stroke-width="2"/>
      <path d="M38 40v60M8 70h60M17 49l42 42M59 49l-42 42" stroke="#7fa0d8" stroke-width="1" opacity=".7"/>
      <circle cx="202" cy="70" r="30" fill="url(#panel)" stroke="#3b3a36" stroke-width="2"/>
      <path d="M202 40v60M172 70h60M181 49l42 42M223 49l-42 42" stroke="#7fa0d8" stroke-width="1" opacity=".7"/>
      <rect x="70" y="62" width="100" height="26" rx="4" fill="#f2efe6" stroke="#3b3a36" stroke-width="2"/>
      <rect x="80" y="54" width="80" height="10" fill="url(#gold)" stroke="#6b4e12" stroke-width="1"/>
      <line x1="90" y1="88" x2="78" y2="128" stroke="#3b3a36" stroke-width="2.5"/><line x1="150" y1="88" x2="162" y2="128" stroke="#3b3a36" stroke-width="2.5"/><line x1="120" y1="88" x2="120" y2="130" stroke="#3b3a36" stroke-width="2.5"/>
      ${pad(78, 130)}${pad(162, 130)}${pad(120, 132)}
      <path d="M150 62 L184 38 L206 58" fill="none" stroke="#3b3a36" stroke-width="3" stroke-linecap="round"/>
      <path d="M184 150 a22 18 0 0 1 44 0z" fill="#f2efe6" stroke="#3b3a36" stroke-width="2"/>
      <path d="M190 150 a16 12 0 0 1 32 0" fill="none" stroke="#c9c4b4" stroke-width="1.5"/>` },

    phoenix: { vb: "0 0 240 160", svg: `
      <path d="M8 74 L38 44 L68 74 L38 100z" fill="url(#panel)" stroke="#3b3a36" stroke-width="1.5"/>
      <circle cx="38" cy="72" r="28" fill="url(#panel)" stroke="#3b3a36" stroke-width="2"/>
      <path d="M38 44v56M10 72h56M18 52l40 40M58 52l-40 40" stroke="#7fa0d8" stroke-width="1" opacity=".7"/>
      <circle cx="202" cy="72" r="28" fill="url(#panel)" stroke="#3b3a36" stroke-width="2"/>
      <path d="M202 44v56M174 72h56M182 52l40 40M222 52l-40 40" stroke="#7fa0d8" stroke-width="1" opacity=".7"/>
      <rect x="72" y="66" width="96" height="24" rx="4" fill="url(#silver)" stroke="#3b3a36" stroke-width="2"/>
      <rect x="110" y="40" width="8" height="26" fill="#4a4b50"/><rect x="104" y="30" width="20" height="12" rx="2" fill="#e7e2d4" stroke="#3b3a36" stroke-width="1.5"/>
      <line x1="92" y1="90" x2="80" y2="128" stroke="#3b3a36" stroke-width="2.5"/><line x1="148" y1="90" x2="160" y2="128" stroke="#3b3a36" stroke-width="2.5"/><line x1="120" y1="90" x2="120" y2="130" stroke="#3b3a36" stroke-width="2.5"/>
      ${pad(80, 130)}${pad(160, 130)}${pad(120, 132)}
      <path d="M160 70 L196 104 L190 138" fill="none" stroke="#3b3a36" stroke-width="3" stroke-linecap="round"/>
      <path d="M182 136 l10 8 l8 -6" fill="#d6d2c4" stroke="#3b3a36" stroke-width="1.5"/>
      <rect x="196" y="140" width="30" height="8" rx="2" fill="#eef4f8" stroke="#9fb4c4" stroke-width="1"/>` },

    golf: { vb: "0 0 200 140", svg: `
      <line x1="40" y1="20" x2="120" y2="112" stroke="#8a8d93" stroke-width="5" stroke-linecap="round"/>
      <path d="M114 104 l26 8 l-4 12 l-28 -8z" fill="url(#silver)" stroke="#3b3a36" stroke-width="2"/>
      <circle cx="160" cy="118" r="11" fill="#fbfbf7" stroke="#3b3a36" stroke-width="2"/>
      <circle cx="184" cy="124" r="8" fill="#fbfbf7" stroke="#3b3a36" stroke-width="2"/>
      <path d="M155 114h2M161 112h2M158 120h2M164 118h2M181 122h2M186 125h2" stroke="#b9b6aa" stroke-width="1.5"/>` },

    photo: { vb: "0 0 170 150", svg: `
      <g transform="rotate(-8 85 80)">
        <rect x="25" y="20" width="120" height="110" fill="#fbf8f0" stroke="#3b3a36" stroke-width="2"/>
        <rect x="35" y="30" width="100" height="74" fill="#c9d6dc"/>
        <circle cx="62" cy="58" r="9" fill="#6b4a38"/><rect x="53" y="67" width="18" height="30" rx="6" fill="#3f7fd9"/>
        <circle cx="90" cy="60" r="8" fill="#8a5b3e"/><rect x="82" y="68" width="16" height="28" rx="6" fill="#e0533b"/>
        <circle cx="112" cy="70" r="6" fill="#6b4a38"/><rect x="106" y="76" width="12" height="20" rx="5" fill="#2f9a62"/>
        <circle cx="122" cy="74" r="5" fill="#8a5b3e"/><rect x="117" y="79" width="10" height="17" rx="4" fill="#e8b53a"/>
        <path d="M40 116h60M40 122h40" stroke="#b9b6aa" stroke-width="2"/>
      </g>` },

    disc: { vb: "0 0 160 140", svg: `
      <ellipse cx="80" cy="76" rx="58" ry="52" fill="url(#silver)" stroke="#3b3a36" stroke-width="2"/>
      <ellipse cx="80" cy="76" rx="46" ry="40" fill="none" stroke="#8a8d93" stroke-width="1.5"/>
      <path d="M54 62h52M50 70h60M50 78h60M52 86h56M58 94h44" stroke="#6b6d73" stroke-width="2" stroke-dasharray="3 2"/>
      <path d="M44 44 q20 -16 46 -12" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>` },
  };

  function hardware(key) {
    const h = HW[key];
    if (!h) return "";
    return `<svg class="hw hw-${key}" viewBox="${h.vb}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${h.svg}</svg>`;
  }

  /* ---------- Player character (60 x 128, feet at bottom, facing right) ----------
   * look = { skin, shirt, pants, hair: style, hairColor, extra: "none"|"glasses"|"cap" }
   * hair styles: short, buzz, curly, long, ponytail, braids, buns, scarf
   */
  const HAIR_STYLES = ["short", "buzz", "curly", "long", "ponytail", "braids", "buns", "scarf"];
  function kid(look) {
    const skin = look.skin || "#c98d63";
    const shirt = look.shirt || "#2f6fb5";
    const pants = look.pants || "#2b3346";
    const hc = look.hairColor || "#2b1d14";
    // older saves used char: "boy" | "girl"
    const style = look.hair || (look.char === "girl" ? "ponytail" : "short");
    const top = "M16 26 Q16 7 33 8 Q49 9 48 26 Q42 15 30 17 Q21 18 16 26z";
    let behind = "", front = "";
    switch (style) {
      case "buzz":
        front = `<path d="M18 21 Q19 10 33 10.5 Q46 11 46.5 20 Q40 14.5 30 15.5 Q23 16 18 21z" fill="${hc}" opacity=".9"/>`;
        break;
      case "curly":
        behind = `<circle cx="30" cy="20" r="18" fill="${hc}"/>` + [[14, 14], [20, 5], [31, 2], [42, 6], [47, 15], [13, 27], [16, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${hc}"/>`).join("");
        front = `<path d="M22 14 Q32 6 45 15 Q38 13 30 16z" fill="${hc}"/>`;
        break;
      case "long":
        behind = `<path d="M15 24 Q11 50 19 60 L27 58 L24 30z" fill="${hc}"/>`;
        front = `<path d="${top}" fill="${hc}"/>`;
        break;
      case "ponytail":
        behind = `<path d="M15 26 Q12 46 20 52 L22 30z" fill="${hc}"/><circle cx="14" cy="30" r="8" fill="${hc}"/><rect x="14" y="20" width="5" height="5" rx="2" fill="${shirt}"/>`;
        front = `<path d="${top}" fill="${hc}"/>`;
        break;
      case "braids":
        behind = [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${17 - i * 0.6}" cy="${32 + i * 5.5}" r="${3.6 - i * 0.15}" fill="${hc}"/>`).join("") + `<circle cx="13.5" cy="64" r="2.2" fill="${shirt}"/>`;
        front = `<path d="${top}" fill="${hc}"/><path d="M20 14 l3 6 M27 11 l2 6 M35 10 l1 6" stroke="#0003" stroke-width="1.2"/>`;
        break;
      case "buns":
        behind = `<circle cx="22" cy="9" r="6.5" fill="${hc}"/><circle cx="40" cy="8" r="6.5" fill="${hc}"/>`;
        front = `<path d="${top}" fill="${hc}"/>`;
        break;
      case "scarf":
        behind = `<path d="M13 28 Q12 6 32 6 Q51 6 50 28 Q50 44 44 50 L18 54 Q13 46 13 28z" fill="${hc}"/>`;
        front = `<path d="M17 25 Q18 9 33 9 Q47 9 48 22 Q44 13 32 13 Q22 14 19 26z" fill="${hc}"/><path d="M24 38 Q32 44 44 38 L44 46 Q32 50 22 46z" fill="${hc}"/>`;
        break;
      default:
        front = `<path d="M17 24 Q18 8 33 9 Q48 10 47 24 Q40 16 30 18 Q22 19 17 24z" fill="${hc}"/>`;
    }
    let extra = "";
    if (look.extra === "glasses") extra = `<circle cx="38.5" cy="27" r="4.6" fill="#ffffff55" stroke="#1f1a17" stroke-width="1.6"/><path d="M34 26 L24 24" stroke="#1f1a17" stroke-width="1.4"/>`;
    if (look.extra === "cap" && style !== "scarf") extra = `<path d="M17 20 Q18 6 33 7 Q47 8 47 19z" fill="${shirt}" stroke="#0003" stroke-width="1"/><path d="M44 18 L57 20 Q56 23 44 22z" fill="${shirt}" stroke="#0003" stroke-width="1"/>`;
    return `
<svg class="kid" viewBox="0 0 60 128" aria-hidden="true">
  <ellipse cx="30" cy="125" rx="16" ry="3" fill="#000" opacity=".25"/>
  ${behind}
  <rect x="8" y="50" width="16" height="34" rx="5" fill="#d65a3a"/>
  <g class="leg leg-b"><rect x="25" y="84" width="9" height="34" rx="4" fill="${pants}" style="filter:brightness(.85)"/><rect x="23" y="114" width="15" height="8" rx="3" fill="#f2efe6"/></g>
  <g class="leg leg-f"><rect x="30" y="84" width="9" height="34" rx="4" fill="${pants}"/><rect x="28" y="114" width="15" height="8" rx="3" fill="#ffffff"/></g>
  <g class="arm arm-b"><rect x="38" y="52" width="8" height="28" rx="4" fill="${skin}" opacity=".85"/></g>
  <rect x="18" y="46" width="28" height="42" rx="9" fill="${shirt}"/>
  <path d="M26 47 L32 66 L38 47" stroke="#f2c14e" stroke-width="2" fill="none"/>
  <rect x="28" y="64" width="9" height="11" rx="1.5" fill="#f4ecdc" stroke="#f2c14e" stroke-width="1"/>
  <g class="arm arm-f"><rect x="22" y="52" width="8" height="28" rx="4" fill="${skin}"/></g>
  <rect x="26" y="38" width="10" height="10" fill="${skin}"/>
  <circle cx="32" cy="26" r="15" fill="${skin}"/>
  ${front}
  <circle cx="38" cy="27" r="2" fill="#1f1a17"/>
  <path d="M36 33 q3 2 6 0" stroke="#1f1a17" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  ${extra}
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

  /* ---------- Team mission patch (120 x 120) ----------
   * Our own emblem for team Reach for the Stars: a gold star inside an orbit,
   * over a sliver of Earth. (Not the NASA insignia, which needs NASA's permission.)
   */
  let patchN = 0;
  function patch(opts) {
    opts = opts || {};
    const id = "rfs" + ++patchN;
    const top = opts.top || "REACH FOR THE STARS";
    const bottom = opts.bottom || "MUSEUM \u2605 2026";
    const star = (cx, cy, r) => {
      let d = "";
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r;
        d += (i ? "L" : "M") + (cx + Math.cos(a) * rr).toFixed(1) + " " + (cy + Math.sin(a) * rr).toFixed(1);
      }
      return d + "z";
    };
    return `
<svg class="patch" viewBox="0 0 120 120" ${opts.size ? `width="${opts.size}" height="${opts.size}"` : ""} role="img" aria-label="Reach for the Stars mission patch">
  <defs>
    <radialGradient id="${id}g" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#2f3a8f"/><stop offset="1" stop-color="#0e1130"/></radialGradient>
    <path id="${id}t" d="M18 60 A42 42 0 0 1 102 60"/>
    <path id="${id}b" d="M14 60 A46 46 0 0 0 106 60"/>
    <clipPath id="${id}c"><circle cx="60" cy="60" r="40"/></clipPath>
  </defs>
  <circle cx="60" cy="60" r="58" fill="#14183f" stroke="#e8b53a" stroke-width="4"/>
  <circle cx="60" cy="60" r="40" fill="url(#${id}g)" stroke="#e8b53a" stroke-width="1.5"/>
  <g clip-path="url(#${id}c)">
    <circle cx="60" cy="128" r="46" fill="#3f7fd9"/>
    <path d="M30 92 q10 -8 22 -4 q8 3 16 -2 q10 -5 22 2" fill="none" stroke="#4f9a52" stroke-width="5" stroke-linecap="round"/>
    ${[[34, 36], [86, 40], [42, 70], [84, 72], [70, 30], [50, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#fff"/>`).join("")}
  </g>
  <ellipse cx="60" cy="56" rx="34" ry="12" fill="none" stroke="#5ef2ff" stroke-width="2.5" transform="rotate(-18 60 56)"/>
  <path d="${star(60, 55, 17)}" fill="#ffd34d" stroke="#fff3c4" stroke-width="1.2"/>
  <circle cx="90" cy="45" r="3" fill="#5ef2ff"/>
  <text font-family="IBM Plex Mono, monospace" font-weight="700" font-size="9.2" letter-spacing="1.2" fill="#ffffff"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">${top}</textPath></text>
  <text font-family="IBM Plex Mono, monospace" font-weight="700" font-size="8" letter-spacing="1.5" fill="#ffd34d"><textPath href="#${id}b" startOffset="50%" text-anchor="middle" dominant-baseline="hanging">${bottom}</textPath></text>
</svg>`;
  }

  /* ---------- NASA insignia (120 x 120), simplified ----------
   * Used only on the spacesuit and the rocket. NASA's insignia normally needs
   * NASA's permission to use: set SHOW_NASA to false to swap in the team patch.
   */
  const SHOW_NASA = true;
  function nasa() {
    if (!SHOW_NASA) return patch();
    return `
<svg class="nasa-logo" viewBox="0 0 120 120" role="img" aria-label="NASA">
  <circle cx="60" cy="60" r="57" fill="#0b3d91"/>
  ${[[30, 30], [44, 18], [84, 22], [96, 44], [24, 58], [38, 88], [88, 84], [70, 100], [52, 40], [100, 64]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.3 : 2}" fill="#fff"/>`).join("")}
  <ellipse cx="60" cy="62" rx="52" ry="17" fill="none" stroke="#fff" stroke-width="3" transform="rotate(-24 60 62)"/>
  <path d="M10 96 C40 74 72 56 112 30 L104 44 C76 62 48 80 22 102 Z" fill="#fc3d21"/>
  <text x="60" y="71" text-anchor="middle" font-family="Arial Black, Helvetica, Arial, sans-serif" font-weight="900" font-size="27" fill="#fff" letter-spacing="1">NASA</text>
</svg>`;
  }

  /* ---------- Field-trip rocket (140 x 300), for trips to the Moon and Mars ----------
   * The top window shows the player's own face; classmates fill the others.
   */
  function rocket(look) {
    look = look || {};
    const faces = [look.skin || "#c98d63", "#8a5434", "#f1c7a5"];
    const win = (cy, skin, hair) => `
      <circle cx="70" cy="${cy}" r="15" fill="#bfe0f2" stroke="#2a2b2f" stroke-width="3"/>
      <circle cx="70" cy="${cy + 4}" r="9" fill="${skin}"/>
      <path d="M61 ${cy + 2} Q62 ${cy - 7} 70 ${cy - 7} Q78 ${cy - 7} 79 ${cy + 2} Q74 ${cy - 3} 70 ${cy - 3} Q65 ${cy - 3} 61 ${cy + 2}z" fill="${hair}"/>
      <circle cx="67" cy="${cy + 4}" r="1.3" fill="#1f1a17"/><circle cx="73" cy="${cy + 4}" r="1.3" fill="#1f1a17"/>
      <path d="M67 ${cy + 8} q3 2 6 0" stroke="#1f1a17" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M60 ${cy - 8} q6 -4 12 -2" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>`;
    return `
<svg class="rocket" viewBox="0 0 140 300" aria-hidden="true">
  <g class="flame">
    <path d="M52 236 Q70 312 88 236z" fill="#ffb347"/>
    <path d="M60 236 Q70 286 80 236z" fill="#fff3b0"/>
  </g>
  <path d="M40 186 L14 236 L14 246 L42 230z" fill="#e0533b" stroke="#2a2b2f" stroke-width="3" stroke-linejoin="round"/>
  <path d="M100 186 L126 236 L126 246 L98 230z" fill="#e0533b" stroke="#2a2b2f" stroke-width="3" stroke-linejoin="round"/>
  <path d="M40 70 Q40 40 70 12 Q100 40 100 70 L100 228 Q70 238 40 228z" fill="#f4f1ea" stroke="#2a2b2f" stroke-width="3"/>
  <path d="M46 56 Q55 32 70 16 Q85 32 94 56z" fill="#e0533b" stroke="#2a2b2f" stroke-width="3" stroke-linejoin="round"/>
  <path d="M41 196 h58" stroke="#2a2b2f" stroke-width="3"/>
  <rect x="41" y="200" width="58" height="10" fill="#3f7fd9"/>
  ${win(76, faces[0], look.hairColor || "#2b1d14")}
  ${win(112, faces[1], "#1c1714")}
  ${win(148, faces[2], "#c98a3c")}
  <g transform="translate(55 167) scale(.25)">${nasa().replace(/^\s*<svg[^>]*>|<\/svg>\s*$/g, "")}</g>
  <text transform="translate(92 182) rotate(-90)" font-family="IBM Plex Mono, monospace" font-weight="700" font-size="9" fill="#2a2b2f" letter-spacing="1">FIELD TRIP</text>
  <path d="M60 228 L56 244 L84 244 L80 228z" fill="#6b7790" stroke="#2a2b2f" stroke-width="3" stroke-linejoin="round"/>
  <path d="M30 236 L22 258 M110 236 L118 258" stroke="#2a2b2f" stroke-width="4" stroke-linecap="round"/>
  <path d="M14 258 h16 M110 258 h16" stroke="#2a2b2f" stroke-width="4" stroke-linecap="round"/>
</svg>`;
  }

  return { hardware, backdrop, kid, bus, rocket, patch, nasa, HAIR_STYLES };
})();
