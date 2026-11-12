/*
 * ROBOT GUIDE
 * Draws the kid's robot companion as SVG from the equipped look.
 * look = { color, eyes, hat, gear }  (values come from MUSEUM.shop)
 */

window.Robot = (function () {
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp((n >> 16) + amt);
    const g = clamp(((n >> 8) & 255) + amt);
    const b = clamp((n & 255) + amt);
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  function gearBack(gear) {
    if (gear === "solar")
      return `
      <g class="r-solar">
        <rect x="2" y="66" width="26" height="34" rx="3" fill="#1d3b8f" stroke="#7fb0ff" stroke-width="1.5"/>
        <path d="M2 77h26M2 88h26M15 66v34" stroke="#7fb0ff" stroke-width="1" opacity=".7"/>
        <rect x="92" y="66" width="26" height="34" rx="3" fill="#1d3b8f" stroke="#7fb0ff" stroke-width="1.5"/>
        <path d="M92 77h26M92 88h26M105 66v34" stroke="#7fb0ff" stroke-width="1" opacity=".7"/>
      </g>`;
    if (gear === "jetpack")
      return `
      <g class="r-jet">
        <rect x="26" y="64" width="14" height="36" rx="6" fill="#8a94a8"/>
        <rect x="80" y="64" width="14" height="36" rx="6" fill="#8a94a8"/>
        <path class="r-flame" d="M28 100 q5 16 10 0z M82 100 q5 16 10 0z" fill="#ffb347"/>
      </g>`;
    return "";
  }

  function gearFront(gear) {
    if (gear === "record")
      return `
      <g>
        <circle cx="60" cy="86" r="10" fill="#e8b931" stroke="#fff3c4" stroke-width="1.5"/>
        <circle cx="60" cy="86" r="5" fill="none" stroke="#a37b0c" stroke-width="1"/>
        <circle cx="60" cy="86" r="1.6" fill="#a37b0c"/>
      </g>`;
    if (gear === "flag")
      return `
      <g>
        <line x1="99" y1="50" x2="99" y2="112" stroke="#ddd" stroke-width="2"/>
        <rect x="100" y="50" width="18" height="12" fill="#5aa9ff"/>
        <path d="M105 56l1.5-3 1.5 3-3-2h3z" fill="#fff"/>
      </g>`;
    return "";
  }

  function hat(h) {
    switch (h) {
      case "helmet":
        return `<ellipse cx="60" cy="38" rx="36" ry="32" fill="rgba(180,220,255,.18)" stroke="#d6ecff" stroke-width="2"/>
                <path d="M34 22 q12-10 26-10" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>`;
      case "prop":
        return `<path d="M38 18 q22-16 44 0z" fill="#e85d4a"/>
                <rect x="58" y="4" width="4" height="8" fill="#555"/>
                <g class="r-prop"><rect x="38" y="2" width="44" height="4" rx="2" fill="#333"/></g>`;
      case "party":
        return `<path d="M48 18 L60 -8 L72 18z" fill="#ff6bd0"/>
                <path d="M52 10 l16 0 M55 2 l10 0" stroke="#fff36b" stroke-width="2"/>
                <circle cx="60" cy="-8" r="4" fill="#fff36b"/>`;
      case "crown":
        return `<path d="M40 18 l4-18 l9 10 l7-14 l7 14 l9-10 l4 18z" fill="#ffd34d" stroke="#fff3c4" stroke-width="1.5"/>
                <circle cx="60" cy="10" r="2.5" fill="#ff6b6b"/>`;
      default:
        return "";
    }
  }

  function svg(look, opts) {
    opts = opts || {};
    const body = look.color || "#c9d3e6";
    const dark = shade(body, -45);
    const eyes = look.eyes || "#5ef2ff";
    const cls = opts.walking ? "robot walking" : "robot";
    return `
<svg class="${cls}" viewBox="-4 -14 128 154" role="img" aria-label="${opts.label || "Your robot guide"}">
  ${gearBack(look.gear)}
  <!-- antenna -->
  <line x1="60" y1="18" x2="60" y2="6" stroke="${dark}" stroke-width="3"/>
  <circle class="r-antenna" cx="60" cy="5" r="4" fill="${eyes}"/>
  <!-- head -->
  <rect x="30" y="18" width="60" height="42" rx="14" fill="${body}" stroke="${dark}" stroke-width="2"/>
  <rect x="38" y="27" width="44" height="22" rx="10" fill="#0b1226"/>
  <g class="r-eyes">
    <circle cx="51" cy="38" r="5" fill="${eyes}"/>
    <circle cx="69" cy="38" r="5" fill="${eyes}"/>
  </g>
  <!-- neck + body -->
  <rect x="52" y="60" width="16" height="6" fill="${dark}"/>
  <rect x="34" y="66" width="52" height="40" rx="10" fill="${body}" stroke="${dark}" stroke-width="2"/>
  <rect x="44" y="74" width="32" height="6" rx="3" fill="${dark}" opacity=".5"/>
  <!-- arms -->
  <rect class="r-arm-l" x="22" y="70" width="12" height="28" rx="6" fill="${dark}"/>
  <rect class="r-arm-r" x="86" y="70" width="12" height="28" rx="6" fill="${dark}"/>
  <!-- wheels -->
  <rect x="34" y="108" width="52" height="16" rx="8" fill="#2a3247"/>
  <circle class="r-wheel" cx="46" cy="116" r="6" fill="#6b7790" stroke="#2a3247" stroke-width="2" stroke-dasharray="4 2"/>
  <circle class="r-wheel" cx="74" cy="116" r="6" fill="#6b7790" stroke="#2a3247" stroke-width="2" stroke-dasharray="4 2"/>
  ${gearFront(look.gear)}
  ${hat(look.hat)}
</svg>`;
  }

  return { svg };
})();
