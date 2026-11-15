/*
 * ECHO'S ROOM FACTS
 * ------------------------------------------------------------
 * One short line Echo says (in a speech bubble) the first time the explorer
 * walks into a machine's room or a secret treasure room.
 *
 *   crew: true   -> "Astronaut story": what the astronauts on that mission lived through
 *   crew: false  -> "Design choice":   a specific engineering decision, for missions that
 *                                      sent no astronauts (the machines went alone)
 *
 * Keyed by the same id as the exhibit/treasure in js/data.js and js/data-extra.js.
 * Text is English only, like the machines' own stories in data.js.
 * Keep each line to about 170 characters so the bubble stays small.
 * Sources: NASA mission pages and the Apollo Lunar Surface Journal (check against
 * each exhibit's `sources` list in data.js before launch).
 */
window.ECHO_FACTS = {
  /* ---------- crewed: what the astronauts experienced ---------- */
  "apollo-11": { crew: true, text: "Alarms 1202 and 1201 flashed as Eagle came down. Neil Armstrong took over by hand and steered past a rocky crater to find a safe place to land." },
  "lrv": { crew: true, text: "On Apollo 17, Gene Cernan knocked a fender off the rover with a hammer. He and Harrison Schmitt fixed it with duct tape and maps, so dust stopped spraying them." },
  "alsep": { crew: true, text: "Apollo 12, the crew that set up ALSEP, was struck by lightning twice just after liftoff. Alan Bean flipped the backup-power switch that got things working again." },
  "golf-balls": { crew: true, text: "Alan Shepard was 47, still the oldest person to walk on the Moon. He and Edgar Mitchell pulled a cart uphill toward Cone Crater but turned back before the rim." },
  "family-photo": { crew: true, text: "Charlie Duke and John Young spent about 71 hours on the Moon. Their three moonwalks added up to more than 20 hours outside in spacesuits." },
  "goodwill-disc": { crew: true, text: "Armstrong and Aldrin also left a patch honoring the Apollo 1 crew, plus medals for two Soviet cosmonauts who died: Yuri Gagarin and Vladimir Komarov." },

  /* ---------- uncrewed: specific design choices ---------- */
  "ranger-7": { crew: false, text: "No tape recorder. The cameras sent pictures live to Earth, because Ranger 7 would be destroyed seconds after the last one." },
  "surveyor-3": { crew: false, text: "One TV camera looked up into a tilting mirror. Turning the mirror let Surveyor 3 see all around without moving the camera." },
  "viking-1": { crew: false, text: "A long arm with a scoop on the end. It reached out, dug up Martian soil, and dropped it into the lander's science experiments." },
  "viking-2": { crew: false, text: "Nuclear generators instead of solar panels. They made power from heat, so Martian dust and winter couldn't starve the lander." },
  "sojourner": { crew: false, text: "Six wheels on a rocker-bogie suspension. The wheels tilt to climb over rocks without flipping the little rover." },
  "opportunity": { crew: false, text: "A rock grinder on its robotic arm. It scraped off the dusty outside of a rock so instruments could study the fresh rock inside." },
  "spirit": { crew: false, text: "A camera mast about 1.5 meters tall, roughly a person's eye height, so Spirit could look around Mars the way you would." },
  "ingenuity": { crew: false, text: "Two rotors spin in opposite directions to lift the helicopter in Mars's thin air, and its brain was a chip like the ones in smartphones." },
  "phoenix": { crew: false, text: "Eight tiny ovens. The robotic arm dropped soil into them, and Phoenix baked it to see which gases and vapors came out." },
  "insight": { crew: false, text: "A dome-shaped shield covered the seismometer, so wind and temperature swings wouldn't drown out faint marsquakes." },
  "pioneer-10": { crew: false, text: "Four nuclear generators on long booms. Sunlight is far too weak at Jupiter for solar panels, so Pioneer 10 made its own power." },
  "pioneer-11": { crew: false, text: "Pioneer 11 spins about 5 times a minute. The spin keeps the spacecraft steady so its dish stays pointed at Earth." },
  "voyager-1": { crew: false, text: "A 3.7-meter dish always aimed at Earth, and three nuclear generators for power, because the Sun is far too dim out there." },
  "new-horizons": { crew: false, text: "No moving camera platform. The whole spacecraft turns its body to aim its instruments at Pluto." },
  "dawn": { crew: false, text: "Huge solar wings, about 20 meters from tip to tip. They gathered enough sunlight to power Dawn's ion engines." },
  "near-shoemaker": { crew: false, text: "A laser rangefinder. It timed laser pulses bouncing off Eros to measure the asteroid's shape bump by bump." },
  "kepler": { crew: false, text: "One giant camera with 42 detectors, about 95 megapixels in all, staring at a single patch of sky to catch planets crossing their stars." }
};
