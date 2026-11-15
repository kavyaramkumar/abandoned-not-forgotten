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
  "apollo-11": { crew: true, text: "“One small step for a man, one giant leap for mankind.” The Apollo 11 was one of NASA’s most famous missions! It was sent to land on the Moon with the crew and return to Earth. It launched from Cape Kennedy in 1969, carrying Commander Neil Armstrong, Command Module Pilot Michael Collins, and Lunar Module Pilot Edwin “Buzz” Aldrin into space. Did you know the Apollo 11 landed in the Sea of Tranquility, a dark lunar mare on the Moon? The crew landed on the moon and televised the accomplishment of the national goal!" },
  "lrv": { crew: true, text: "What a sturdy and reliable exploration vehicle! The Lunar Roving Vehicle (LRV) was made to traverse the lunar surface and withstand the Moon’s low-gravity vacuum. Three LRVs were driven on the Moon, one on Apollo 15, one on Apollo 16, and one on Apollo 17. The LRV had a mass of 210 kg, approximately 463 lbs! The vehicle could be deployed by unfolding its wheels and having its frame be lowered onto the surface. Without it, the scientific discoveries of Apollo 15, 16, and 17 wouldn’t have been possible!" },
  "alsep": { crew: true, text: "This provided so much new information about the Moon and its environment! The ALSEP flight system contained a series of equipment used for experiments on the Moon. On each Apollo lunar mission, NASA flew a subset of the accepted ALSEP experiments, where the equipment were stowed in the Scientific Equipment Bay." },
  "golf-balls": { crew: true, text: "Alan Shepard was 47, still the oldest person to walk on the Moon. He and Edgar Mitchell pulled a cart uphill toward Cone Crater but turned back before the rim." },
  "goodwill-disc": { crew: true, text: "Armstrong and Aldrin also left a patch honoring the Apollo 1 crew, plus medals for two Soviet cosmonauts who died: Yuri Gagarin and Vladimir Komarov." },

  /* ---------- uncrewed: specific design choices ---------- */
  "ranger-7": { crew: false, text: "No tape recorder. The cameras sent pictures live to Earth, because Ranger 7 would be destroyed seconds after the last one." },
  "surveyor-3": { crew: false, text: "The Surveyor 3 launched in 1967 with the objective to make a soft landing on the moon. It began its mission from parking orbit around Earth, and then descended to the lunar surface, where highly reflective rocks confused the lander’s descent radar resulting in the Surveyor 3 bouncing off of the lunar surface twice! Luckily, the third time it softly landed onto the Moon, where it successfully transmitted 6,326 TV pictures and completed experiments on lunar material. Did you know the Apollo 12 astronauts landed close to the Surveyor 3 lander and recovered its parts?" },
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
