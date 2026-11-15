/*
 * CREDITS: what made this museum, and who made the media in it
 * ------------------------------------------------------------
 * The Credits window (opened from the welcome screen and the Menu) is built
 * from the same files the game uses, so every photo, orbit picture, sound and
 * texture shown in the game is listed here:
 *   js/photos.js  -> window.PHOTOS   (exhibit photos)
 *   js/orbit.js   -> window.ORBIT    (seen-from-orbit pictures)
 *   js/sounds.js  -> window.SOUNDS   (NASA audio)
 * Software, fonts, services and textures are listed below. Keep this list in
 * step with index.html and assets/ when anything is added.
 */
window.Credits = (function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (u, label) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(label || "Source")}</a>` : "");

  const TEXTURES = [
    { file: "moon-lroc-color-2k.jpg", what: "Moon color map", credit: "NASA Scientific Visualization Studio, CGI Moon Kit (Lunar Reconnaissance Orbiter LROC data)", source: "https://svs.gsfc.nasa.gov/4720" },
    { file: "mars-viking-color.jpg", what: "Mars color map", credit: "NASA Science 3D Resources, Mars image texture (Viking images processed by USGS)", source: "https://science.nasa.gov/3d-resources/mars/" },
    { file: "earth-hyperreal-v1.png", what: "Earth map", credit: "Source not recorded yet. Not confirmed as NASA imagery.", source: "" },
  ];

  const FONTS = [
    ["Fraunces", "Undercase Type"],
    ["Atkinson Hyperlegible", "Braille Institute"],
    ["IBM Plex Mono", "IBM"],
    ["Lexend", "Lexend project"],
  ];

  function names() {
    const map = {};
    const M = window.MUSEUM || {};
    (M.wings || []).forEach((w) => (w.exhibits || []).forEach((e) => (map[e.id] = e.name)));
    (M.treasures || []).forEach((e) => (map[e.id] = e.name));
    return map;
  }

  // one row per image or sound file, listing every machine that uses it
  function rows(data, nameOf) {
    const byFile = {};
    Object.keys(data || {}).forEach((id) => {
      const d = data[id];
      const f = byFile[d.src] || (byFile[d.src] = { ids: [], d });
      f.ids.push(nameOf[id] || id);
    });
    return Object.keys(byFile).map((src) => {
      const f = byFile[src];
      return `<li><b>${esc(f.ids.join(", "))}</b> (${esc(src.split("/").pop())}): ${esc(f.d.credit)}. ${link(f.d.source)}</li>`;
    }).join("");
  }

  function build() {
    const nameOf = names();
    const photos = rows(window.PHOTOS, nameOf);
    const orbit = rows(window.ORBIT, nameOf);
    const sounds = rows(window.SOUNDS, nameOf);
    const textures = TEXTURES.map((x) => `<li><b>${esc(x.what)}</b> (${esc(x.file)}): ${esc(x.credit)} ${link(x.source)}</li>`).join("");
    const fonts = FONTS.map(([n, by]) => `${esc(n)} (${esc(by)})`).join(", ");
    return `
<section lang="en"><h3>SI credits</h3>
  <p>SI (synthetic intelligence) assisted with code, translation, data organization, and illustrations. The pictures drawn in this game, such as the machines, the museum and its characters, and the rocket, are SI-assisted illustrations.</p>
  <p>Read to Me uses synthetic voices supplied by the player's own device.</p>
  <p>NASA audio and photographs are original, credited NASA media. They are not SI-generated.</p>
</section>
<section lang="en"><h3>Languages and translation</h3>
  <p>The game's buttons and messages are in ${(window.I18N && I18N.LANGS ? I18N.LANGS.length : "many")} languages, written with SI assistance. The machine stories have complete hand-translated story cards in Spanish, French, Hindi, and Chinese only. In other languages the stories stay in English unless the browser has a built-in translator (Chrome and Edge include one that runs on the device), and those translations are made by the browser.</p>
</section>
<section lang="en"><h3>NASA photographs</h3>
  <details><summary>Show all photo credits</summary><ul>${photos}</ul></details>
</section>
<section lang="en"><h3>Seen from orbit pictures</h3>
  <details><summary>Show all orbit picture credits</summary><ul>${orbit}</ul></details>
</section>
<section lang="en"><h3>NASA sounds</h3>
  <details><summary>Show all sound credits</summary><ul>${sounds}</ul></details>
</section>
<section lang="en"><h3>Globe textures</h3>
  <ul>${textures}</ul>
</section>
<section lang="en"><h3>Software, fonts, and services</h3>
  <ul>
    <li><b>Three.js</b> (r149, MIT license, ${link("https://threejs.org/", "threejs.org")}): the 3D museum and cutscenes.</li>
    <li><b>Google Fonts</b> (${link("https://fonts.google.com/", "fonts.google.com")}): ${fonts}. All four are open fonts under the SIL Open Font License.</li>
    <li><b>Supabase</b> (${link("https://supabase.com/", "supabase.com")}): Field Trip Pass login and saved progress.</li>
    <li><b>Anthropic Claude</b> (${link("https://www.anthropic.com/", "anthropic.com")}): answers for Ask Echo, only when the optional chat server is turned on. Otherwise Ask Echo uses the museum's own notes.</li>
    <li><b>transformers.js</b> (Xenova, Apache-2.0) and the <b>all-MiniLM-L6-v2</b> model (sentence-transformers, Apache-2.0): the small on-device model that helps Ask Echo find the right museum note.</li>
    <li><b>Browser translation and speech</b>: the browser's built-in Translator and speech voices, supplied by the player's device.</li>
  </ul>
</section>`;
  }

  function open() {
    const body = document.querySelector("#creditsBody");
    const dlg = document.querySelector("#creditsDialog");
    if (!body || !dlg) return;
    body.innerHTML = build();
    dlg.showModal();
  }

  document.querySelectorAll(".credits-open").forEach((b) => b.addEventListener("click", open));
  return { open, build };
})();
