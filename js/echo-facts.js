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

/*

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
  "ranger-7": { crew: false, text: "Sometimes, the biggest breakthroughs come after lots of attempts! Meet Ranger 7! Before this little spacecraft came along, NASA had tried to photograph the Moon up close 13 times, and every mission had failed. But on July 31, 1964, Ranger 7 finally did it! It successfully sent back more than 4,300 pictures of the Moon before crashing into its surface. For the very first time, scientists could see the Moon in incredible detail! Ranger 7 helped bring us one step closer to landing humans on the Moon!"},
  "surveyor-3": { crew: false, text: "One TV camera looked up into a tilting mirror. Turning the mirror let Surveyor 3 see all around without moving the camera." },
  "viking-1": { crew: false, text: "A long arm with a scoop on the end. It reached out, dug up Martian soil, and dropped it into the lander's science experiments." },
  "viking-2": { crew: false, text: "Nuclear generators instead of solar panels. They made power from heat, so Martian dust and winter couldn't starve the lander." },
  "sojourner": { crew: false, text: "Six wheels on a rocker-" },
  // done
  "opportunity": { crew: false, text: "Imagine driving your car into a giant sandbox... and getting stuck! That's exactly what happened to Opportunity on Mars! In 2005, its wheels sank into a soft patch of sand nicknamed Purgatory Dune. No matter how much its wheels spun, it couldn't get out! So, back on Earth, engineers got creative. They built a special sandbox that mimicked the Martian soil and tested different ways to help Opportunity escape. After weeks of careful planning, they figured out how to guide the rover out of the sand trap! But that wasn't its only challenge. In 2018, a massive dust storm covered the sky, blocking the sunlight that powered its solar panels. The storm lasted so long that Opportunity couldn't get enough energy to communicate or keep exploring. For more than 14 years, this little robot faced challenges that nobody could have completely predicted. And every time, an incredible team on Earth worked to help it keep going!"},
  // done
  "spirit": { crew: false, text: "Did you know that exploring Mars takes more than just a really good robot? It takes a really clever team back on Earth! Meet Spirit! While exploring Mars, Spirit ran into a few unexpected problems. At one point, its memory system malfunctioned, and it stopped communicating with Earth! Engineers had to figure out how to repair its memory and send it new software before Spirit could get back to work. And they didn't stop there! In 2007, engineers sent Spirit and its twin, Opportunity, new software that allowed them to make some decisions on their own, like choosing which pictures to send back to Earth! That's right! These little robots were getting smarter while exploring another planet. It takes a pretty amazing team to keep a robot exploring millions of miles away from home!" },
  "ingenuity": { crew: false, text: "Two rotors spin in opposite directions to lift the helicopter in Mars's thin air, and its brain was a chip like the ones in smartphones." },
  "phoenix": { crew: false, text: "Eight tiny ovens. The robotic arm dropped soil into them, and Phoenix baked it to see which gases and vapors came out." },
  "insight": { crew: false, text: "A dome-shaped shield covered the seismometer, so wind and temperature swings wouldn't drown out faint marsquakes." },
  // done
  "pioneer-10": { crew: false, text: "Imagine flying through space where no spacecraft has ever gone before! Meet Pioneer 10! Launched in 1972, it was the first spacecraft to travel beyond Mars. But its biggest challenge was still ahead: the asteroid belt! Scientists weren't sure if a spacecraft could safely cross this enormous region filled with rocky objects. And Pioneer 10 had a couple of close calls! It passed within about 5.5 million miles of one asteroid, and later flew past another called Nike, which was about 15 miles wide! But Pioneer 10 made it through! It became the first spacecraft to cross the asteroid belt and the first to visit Jupiter."},
  // done
  "pioneer-11": { crew: false, text: "Think getting close to Jupiter was impressive? Well, Pioneer 11 had an even bigger adventure waiting! After visiting Jupiter, Pioneer 11 continued its journey toward Saturn. On September 1, 1979, it flew just 13,000 miles above the planet's cloud tops! It was the first spacecraft ever to get that close to Saturn. And it didn't just take a quick look! It discovered a new ring around the planet, called the F ring, and spotted two previously unknown moons! Imagine being the first visitor to a planet that humans had only ever seen from far away! And it did something no spacecraft had ever done before: it brought us up close to the beautiful ringed planet!"},
  "voyager-1": { crew: false, text: "A 3.7-meter dish always aimed at Earth, and three nuclear generators for power, because the Sun is far too dim out there." },
  "new-horizons": { crew: false, text: "No moving camera platform. The whole spacecraft turns its body to aim its instruments at Pluto." },
  "dawn": { crew: false, text: "Huge solar wings, about 20 meters from tip to tip. They gathered enough sunlight to power Dawn's ion engines." },
  "near-shoemaker": { crew: false, text: "A laser rangefinder. It timed laser pulses bouncing off Eros to measure the asteroid's shape bump by bump." },
  "kepler": { crew: false, text: "One giant camera with 42 detectors, about 95 megapixels in all, staring at a single patch of sky to catch planets crossing their stars." }
};
