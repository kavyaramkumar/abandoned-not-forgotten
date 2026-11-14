/*
 * EXTRA EXHIBITS: machines from the NASA Space Apps 2026 challenge resources
 * ------------------------------------------------------------
 * Content written from NASA sources on 2026-11-14: the NSSDCA Master Catalog
 * (https://nssdc.gsfc.nasa.gov/) first, then science.nasa.gov, nasa.gov, and
 * jpl.nasa.gov mission pages. Each exhibit lists the pages it was checked against.
 *
 * Adds six exhibits to window.MUSEUM (Moon, Mars, and Deep Space wings) and their
 * quick facts to window.FACTS. Load this AFTER js/data.js and js/facts.js
 * (facts.js assigns window.FACTS = {...}, which would wipe anything added earlier).
 */
(function () {
  const M = window.MUSEUM;
  if (!M || !M.wings) return;
  const wing = (id) => M.wings.find((w) => w.id === id);

  const EXTRA = {
    moon: [
      {
        id: "alsep",
        riddle: "Astronauts set me up on the Moon, a plutonium-powered generator kept me running, and I listened for moonquakes until 1977.",
        art: "alsep",
        backdrop: "moon-earth",
        next: "ALSEP showed that science stations can keep working on the Moon long after astronauts leave. NASA is planning new seismometers and science packages for future Moon missions.",
        name: "ALSEP (Apollo Lunar Surface Experiments Package)",
        kind: "Science station",
        place: "Five Apollo landing sites on the Moon",
        year: 1969,
        status: "silent",
        story: [
          "Hello from the Ocean of Storms! I'm ALSEP, short for Apollo Lunar Surface Experiments Package. Astronaut Alan Bean unpacked me on November 19, 1969, during Apollo 12. My central station was switched on that same day, and the astronauts pointed my little antenna at Earth.",
          "I'm a whole team of instruments spread out on the ground. My seismometer felt the Moon shake, my magnetometer measured its magnetic field, and other sensors studied the solar wind, the thin lunar air, and dust. My power came from a nuclear generator full of plutonium-238. No sunlight needed, so I kept working through the long, freezing lunar nights!",
          "Apollo 14, 15, 16, and 17 left ALSEP stations too, so there were five of us radioing science home. When Apollo 12's empty lunar module was crashed into the Moon on purpose, my seismometer recorded the first moonquake ever made by people. On September 30, 1977, NASA turned all of us off. We're still standing right where the astronauts left us.",
        ],
        leftBehind: [
          "Five ALSEP central stations at the Apollo 12, 14, 15, 16, and 17 landing sites",
          "Their seismometers, magnetometers, and other instruments, still connected by cables",
          "The SNAP-27 nuclear generators that powered them",
        ],
        discovery:
          "For up to almost eight years, ALSEP stations measured moonquakes, the Moon's magnetic field, the solar wind, and the Moon's thin atmosphere, giving scientists a look inside the Moon.",
        quiz: {
          q: "Why could ALSEP keep working through the long, dark lunar night?",
          options: [
            "It slept until morning",
            "A nuclear generator powered it, so it didn't need sunlight",
            "Astronauts changed its batteries",
          ],
          answer: 1,
          explain: "Right! Its plutonium-238 generator made electricity day and night.",
        },
        faq: [
          {
            keys: ["moonquake", "seismometer", "shake", "quake"],
            a: "ALSEP seismometers felt the Moon shake. After Apollo 12, the empty top half of the lunar module was crashed into the Moon on purpose, about 60 km away, and the seismometer recorded the first moonquake made by people.",
          },
          {
            keys: ["power", "nuclear", "plutonium", "battery", "rtg"],
            a: "Each ALSEP ran on a SNAP-27 radioisotope thermoelectric generator. Heat from about 4 kg of plutonium-238 was turned into about 70 watts of electricity.",
          },
          {
            keys: ["off", "turned off", "1977", "stop", "end"],
            a: "NASA switched off all five ALSEP stations on September 30, 1977. The hardware is still sitting on the Moon.",
          },
          {
            keys: ["where", "which", "missions", "apollo"],
            a: "ALSEP stations were set up by Apollo 12, 14, 15, 16, and 17. Apollo 11 carried a simpler set of experiments.",
          },
        ],
        sources: [
          "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C",
          "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096C",
          "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html",
          "https://www.nasa.gov/history/50-years-ago-first-apollo-lunar-surface-experiment-package-accepted/",
          "https://images.nasa.gov/details/as12-47-6919",
        ],
        verified: true,
      },
    ],

    mars: [
      {
        id: "viking-2",
        riddle: "I was Viking 1's twin, and I landed on the cold plains of Utopia Planitia, where I saw frost on the ground.",
        art: "viking",
        backdrop: "mars",
        next: "The two Viking landers set the stage for every Mars lander since, including Phoenix, which found the water ice hidden near the north pole.",
        name: "Viking 2 Lander",
        kind: "Science lander",
        place: "Utopia Planitia, Mars",
        year: 1976,
        status: "silent",
        story: [
          "Hi, I'm Viking 2, the twin of Viking 1! I launched on September 9, 1975, and landed on Mars on September 3, 1976. Planners moved my landing spot after photos showed the first choice was too rough, so I settled on a plain called Utopia Planitia.",
          "I landed about 6,460 kilometers from my twin, on the other side of the planet. I sit tilted about 8 degrees, so my pictures make the horizon look crooked! Like my twin, I scooped up soil and tested it for signs of life. My results matched Viking 1's, and scientists still argue about what they mean.",
          "In 1977, during the Martian winter, my cameras spotted thin white frost on the ground around me. Two nuclear generators kept me running for 1,281 Mars days, until my batteries failed in April 1980. Today I'm called the Gerald Soffen Memorial Station, after the Viking project scientist.",
        ],
        leftBehind: [
          "The Viking 2 lander, silent since 1980",
          "Its scoop marks in the soil of Utopia Planitia",
        ],
        discovery:
          "Pictures and weather reports from a second, more northern spot on Mars, including winter frost on the Martian ground.",
        quiz: {
          q: "What did Viking 2 see on the ground in the Martian winter?",
          options: ["Thin white frost", "Puddles of water", "Green plants"],
          answer: 0,
          explain: "Yes! Its cameras caught frost around the lander in 1977.",
        },
        faq: [
          {
            keys: ["twin", "viking 1", "far", "distance"],
            a: "Viking 2 landed about 6,460 kilometers (4,000 miles) from its twin, Viking 1, which was at Chryse Planitia.",
          },
          {
            keys: ["frost", "ice", "winter", "snow"],
            a: "In 1977 Viking 2 photographed thin white frost near dark rocks around the lander. Scientists thought it was mostly water ice mixed with carbon dioxide.",
          },
          {
            keys: ["soffen", "name", "memorial"],
            a: "In 2001 the lander was renamed the Gerald Soffen Memorial Station, after the Viking project scientist.",
          },
          {
            keys: ["long", "last", "end", "stop", "battery"],
            a: "Viking 2 worked for 1,281 Mars days. It was turned off in April 1980, when its batteries failed.",
          },
        ],
        sources: [
          "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-083C",
          "https://science.nasa.gov/mission/viking-2/",
          "https://science.nasa.gov/photojournal/frost-at-the-viking-lander-2-site",
          "https://science.nasa.gov/photojournal/first-color-image-of-the-viking-lander-2-site/",
        ],
        verified: true,
      },
    ],

    deep: [
      {
        id: "pioneer-11",
        riddle: "I was the first spacecraft to fly past Saturn, and I found a brand new ring there.",
        art: "pioneer",
        backdrop: "jupiter",
        next: "Pioneer 11 scouted the path to Saturn. Voyager 1 and Voyager 2 followed it there, and later the Cassini spacecraft orbited Saturn for 13 years.",
        name: "Pioneer 11",
        kind: "Deep space probe",
        place: "Heading out of the solar system toward Sagittarius",
        year: 1973,
        status: "silent",
        story: [
          "I'm Pioneer 11, the twin of Pioneer 10! I launched on April 6, 1973. On December 3, 1974, I zoomed past Jupiter, just 43,000 kilometers above its cloud tops.",
          "Then Jupiter's gravity flung me toward Saturn. On September 1, 1979, I became the first spacecraft ever to fly past Saturn. I found a thin new ring outside the main rings, now called the F ring, and a small moon nobody had seen before.",
          "My nuclear generators slowly faded, and in 1995 my team heard from me for the last time. Like my twin, I carry a metal plaque with a drawing of a man and a woman and a map of where we came from. I'm heading toward the center of our galaxy.",
        ],
        leftBehind: [
          "Pioneer 11, coasting silently out of the solar system",
          "Its plaque, a message for anyone who finds it",
        ],
        discovery:
          "The first close-up look at Saturn and its rings, including the discovery of the F ring, plus a second close pass of Jupiter.",
        quiz: {
          q: "What was Pioneer 11 the first spacecraft to do?",
          options: ["Land on Saturn", "Fly past Saturn", "Orbit Jupiter"],
          answer: 1,
          explain: "Right! It flew past Saturn in 1979, the first spacecraft to get there.",
        },
        faq: [
          {
            keys: ["ring", "f ring", "moon", "saturn"],
            a: "At Saturn, Pioneer 11 found a narrow ring outside the A ring, now called the F ring, and a moon about 200 km across.",
          },
          {
            keys: ["plaque", "message", "drawing"],
            a: "Pioneer 10 and 11 each carry a metal plaque, dreamed up by Carl Sagan, showing a man and a woman and where the spacecraft came from.",
          },
          {
            keys: ["last", "contact", "signal", "1995"],
            a: "Regular contact ended on September 30, 1995, when its power got too low to run its science instruments. Engineers caught a few minutes of data on November 24, 1995, and then it went silent.",
          },
          {
            keys: ["where", "going", "heading", "star"],
            a: "Pioneer 11 is heading toward the center of the galaxy, in the direction of the constellation Sagittarius. In about four million years it will pass near a star in the constellation Aquila.",
          },
        ],
        sources: [
          "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1973-019A",
          "https://science.nasa.gov/mission/pioneer-11/",
        ],
        verified: true,
      },
      {
        id: "dawn",
        riddle: "I used gentle ion engines to orbit two worlds in the asteroid belt, and I'm still circling the dwarf planet Ceres.",
        art: "dawn",
        backdrop: "deep",
        next: "Dawn showed what ion engines can do. NASA's Psyche spacecraft is now using similar electric thrusters to reach a metal-rich asteroid.",
        name: "Dawn",
        kind: "Asteroid belt orbiter",
        place: "Orbiting the dwarf planet Ceres",
        year: 2007,
        status: "silent",
        story: [
          "Hi, I'm Dawn! I launched on September 27, 2007, with huge solar wings and three ion engines. My engines push out xenon gas so gently it barely feels like a breath, but if you push for years, you go really fast!",
          "In 2011 I became the first spacecraft to orbit something in the asteroid belt between Mars and Jupiter: the giant asteroid Vesta. In 2012 I left Vesta and flew to Ceres, a dwarf planet. In 2015 I became the first spacecraft to visit a dwarf planet, and the first to orbit two different worlds beyond Earth.",
          "On October 31, 2018, I missed my call with Earth. I had run out of hydrazine, the fuel that kept me pointed the right way. I'm still circling Ceres, silent, and my orbit should last at least 20 years, probably more than 50.",
        ],
        leftBehind: [
          "The Dawn spacecraft, silently orbiting Ceres",
        ],
        discovery:
          "Vesta and Ceres turned out to be very different worlds, and Dawn's data showed that dwarf planets like Ceres may once have had oceans, and maybe still do.",
        quiz: {
          q: "What made Dawn a record breaker?",
          options: [
            "It landed on Ceres",
            "It was the first spacecraft to orbit two different worlds beyond Earth",
            "It flew past Saturn",
          ],
          answer: 1,
          explain: "Yes! It orbited Vesta, then Ceres.",
        },
        faq: [
          {
            keys: ["ion", "engine", "xenon", "thruster"],
            a: "Dawn had three ion engines that used electricity from its solar panels to push out xenon gas. The push was tiny, but it could keep going for a very long time.",
          },
          {
            keys: ["fuel", "hydrazine", "end", "stop", "died"],
            a: "Dawn ran out of hydrazine, the fuel for the small thrusters that kept it pointed at Earth and the Sun. It missed its scheduled calls on October 31 and November 1, 2018.",
          },
          {
            keys: ["crash", "fall", "orbit", "long", "where"],
            a: "Dawn is still orbiting Ceres. Engineers expect its orbit to last at least 20 years, and they are more than 99 percent sure it will last at least 50 years.",
          },
          {
            keys: ["far", "distance", "travel"],
            a: "Dawn traveled about 6.9 billion kilometers (4.3 billion miles) during its mission.",
          },
        ],
        sources: [
          "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2007-043A",
          "https://science.nasa.gov/mission/dawn/",
          "https://www.jpl.nasa.gov/news/nasas-dawn-mission-to-asteroid-belt-comes-to-end",
        ],
        verified: true,
      },
      {
        id: "near-shoemaker",
        riddle: "I was the first spacecraft to orbit an asteroid, and then I landed on it, even though I wasn't built to land.",
        art: "near",
        backdrop: "deep",
        next: "NEAR Shoemaker opened the door to asteroid missions like OSIRIS-REx, which brought a sample of asteroid Bennu back to Earth.",
        name: "NEAR Shoemaker",
        kind: "Asteroid orbiter",
        place: "The saddle region of asteroid 433 Eros",
        year: 1996,
        status: "silent",
        story: [
          "Hi, I'm NEAR Shoemaker! I launched on February 17, 1996. On the way, I flew past an asteroid named Mathilde. Then, on Valentine's Day, February 14, 2000, I became the first spacecraft to orbit an asteroid: 433 Eros, a rocky world about 34 kilometers long.",
          "NASA renamed me to honor Gene Shoemaker, a famous geologist who studied craters. I circled Eros for about a year and took around 160,000 pictures.",
          "Then my team tried something wild. I was never built to land, but on February 12, 2001, I touched down gently, at about 6 kilometers per hour. I survived and kept sending science from the surface for about two weeks, until the cold got me. I'm still sitting there on Eros.",
        ],
        leftBehind: [
          "NEAR Shoemaker, resting on Eros just south of a saddle-shaped valley called Himeros",
        ],
        discovery:
          "The first close-up, year-long study of an asteroid, mapping Eros from orbit and measuring what it is made of from right on its surface.",
        quiz: {
          q: "What was surprising about NEAR Shoemaker's landing?",
          options: [
            "It was never built to land, but it survived and kept working",
            "It bounced off and flew back to Earth",
            "It dug a deep hole",
          ],
          answer: 0,
          explain: "Exactly! It touched down gently and sent science for about two weeks.",
        },
        faq: [
          {
            keys: ["shoemaker", "name", "named"],
            a: "On March 14, 2000, NASA renamed the spacecraft NEAR Shoemaker to honor Eugene Shoemaker, a geologist who helped us understand craters and impacts.",
          },
          {
            keys: ["eros", "big", "size", "asteroid"],
            a: "Eros is a peanut-shaped asteroid about 34 kilometers (21 miles) long.",
          },
          {
            keys: ["last", "contact", "cold", "end"],
            a: "NEAR Shoemaker's last contact was on February 28, 2001. It was too cold, about minus 173 degrees Celsius. NASA tried to call it again in December 2002, but heard nothing.",
          },
          {
            keys: ["pictures", "photos", "images"],
            a: "NEAR returned about 160,000 images, including 69 close-ups taken as it slowly came down to land.",
          },
        ],
        sources: [
          "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-008A",
          "https://science.nasa.gov/mission/near-shoemaker/",
        ],
        verified: true,
      },
      {
        id: "kepler",
        riddle: "I stared at stars to catch planets passing in front of them, and I found more than 2,600 of them.",
        art: "kepler",
        backdrop: "deep",
        next: "Kepler passed the planet hunt to TESS, a NASA telescope launched in 2018 that searches the brightest, nearest stars.",
        name: "Kepler Space Telescope",
        kind: "Space telescope",
        place: "Drifting in an Earth-trailing orbit around the Sun",
        year: 2009,
        status: "silent",
        story: [
          "Hi, I'm Kepler, a planet hunter! I launched in March 2009 and followed Earth around the Sun, trailing a little behind it. I stared at about 150,000 stars at once, watching for tiny dips in their light. A dip means a planet just passed in front of its star.",
          "In 2013 the second of my four reaction wheels broke, and I needed three to point steadily. My engineers had a clever idea: they used the gentle push of sunlight to help balance me, like a kayak in a current. My new mission, called K2, looked at a new patch of sky about every three months.",
          "In October 2018 I ran out of fuel, after more than nine years of work. On November 15, 2018, my team sent my final 'goodnight' commands and turned off my radio. I found more than 2,600 planets, and now I'm drifting quietly around the Sun, far from Earth.",
        ],
        leftBehind: [
          "The Kepler Space Telescope, switched off and drifting in its own orbit around the Sun",
        ],
        discovery:
          "Kepler showed that planets are everywhere: our galaxy has more planets than stars, and 20 to 50 percent of the stars in the night sky may have small, possibly rocky planets.",
        quiz: {
          q: "How did Kepler find planets?",
          options: [
            "By landing on them",
            "By watching for tiny dips in a star's light when a planet passed in front",
            "By listening for radio signals",
          ],
          answer: 1,
          explain: "Right! A tiny dip in starlight can mean a planet is passing by.",
        },
        faq: [
          {
            keys: ["how many", "planets", "found"],
            a: "Kepler discovered more than 2,600 planets outside our solar system.",
          },
          {
            keys: ["k2", "wheel", "broke", "sunlight", "kayak"],
            a: "Kepler needed three reaction wheels to point steadily. When a second wheel failed in 2013, engineers used the pressure of sunlight to help balance it. The new mission was called K2.",
          },
          {
            keys: ["goodnight", "final", "turned off", "last"],
            a: "Kepler ran out of fuel in October 2018. On November 15, 2018, the team sent final commands that turned off its transmitters. That was the same date Johannes Kepler, the astronomer it was named after, died in 1630.",
          },
          {
            keys: ["where", "orbit", "now", "far"],
            a: "Kepler is drifting in a safe orbit around the Sun, trailing behind Earth. When it was switched off, it was about 151 million kilometers (94 million miles) from Earth.",
          },
        ],
        sources: [
          "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2009-011A",
          "https://science.nasa.gov/mission/kepler/",
          "https://www.nasa.gov/news-release/nasa-retires-kepler-space-telescope-passes-planet-hunting-torch/",
          "https://science.nasa.gov/universe/exoplanets/goodnight-kepler-final-commands-for-space-telescope/",
        ],
        verified: true,
      },
    ],
  };

  Object.keys(EXTRA).forEach((wid) => {
    const w = wing(wid);
    if (!w) return;
    EXTRA[wid].forEach((ex) => {
      if (!w.exhibits.some((e) => e.id === ex.id)) w.exhibits.push(ex);
    });
  });

  window.FACTS = window.FACTS || {};
  Object.assign(window.FACTS, {
    alsep: {
      builtBy: "The Bendix Corporation of Ann Arbor, Michigan, built the ALSEP stations for NASA. Apollo astronauts set them up by hand on the Moon.",
      launched: "The first full ALSEP launched with Apollo 12 on November 14, 1969, and was switched on on the Moon on November 19, 1969. Apollo 14, 15, 16, and 17 carried more.",
      lasted: "The stations worked for up to almost eight years. NASA turned all five off on September 30, 1977.",
      mass: "Apollo 12's central station weighed about 25 kilograms, and its nuclear generator about 17 kilograms.",
      power: "A SNAP-27 nuclear generator with about 4 kilograms of plutonium-238 made about 70 watts of electricity.",
      special: "Its seismometer recorded the first moonquake made by people, when Apollo 12's empty lunar module was crashed into the Moon on purpose.",
    },
    "viking-2": {
      builtBy: "NASA's Langley Research Center managed the Viking project, working with NASA's Jet Propulsion Laboratory (JPL).",
      launched: "Viking 2 launched on September 9, 1975, and its lander touched down on Mars on September 3, 1976.",
      lasted: "The lander worked for 1,281 Mars days, until April 1980, when its batteries failed.",
      mass: "The lander weighed about 572 kilograms, not counting fuel.",
      power: "Two small nuclear generators (RTGs) powered it, with batteries for extra power when needed.",
      special: "It landed about 6,460 kilometers from its twin, Viking 1, and photographed frost on the Martian ground.",
    },
    "pioneer-11": {
      builtBy: "TRW built Pioneer 11, and NASA's Ames Research Center ran the mission.",
      launched: "Pioneer 11 launched on April 6, 1973. It flew past Jupiter on December 3, 1974, and Saturn on September 1, 1979.",
      lasted: "It sent science for more than 22 years. Regular contact ended on September 30, 1995, and its last data came on November 24, 1995.",
      mass: "It weighed about 259 kilograms.",
      power: "Two nuclear power generators (RTGs) powered it, because sunlight is too weak far from the Sun.",
      special: "It was the first spacecraft to fly past Saturn, where it found the F ring.",
    },
    dawn: {
      builtBy: "Orbital Sciences Corporation built Dawn, and NASA's Jet Propulsion Laboratory (JPL) managed the mission.",
      launched: "Dawn launched on September 27, 2007. It orbited Vesta from July 2011 to September 2012 and arrived at Ceres on March 6, 2015.",
      lasted: "It worked for 11 years, until it ran out of hydrazine fuel and went silent on October 31, 2018.",
      mass: "It weighed about 1,218 kilograms at launch, including its fuel.",
      power: "Two large solar arrays made up to about 10 kilowatts near Earth to run its ion engines.",
      speed: "Its ion engines sped it up very slowly but steadily. Over its whole mission it traveled about 6.9 billion kilometers.",
      special: "It was the first spacecraft to orbit two different worlds beyond Earth, and the first to visit a dwarf planet.",
    },
    "near-shoemaker": {
      builtBy: "The Johns Hopkins University Applied Physics Laboratory built and ran NEAR Shoemaker for NASA.",
      launched: "NEAR launched on February 17, 1996. It began orbiting Eros on February 14, 2000, and landed on it on February 12, 2001.",
      lasted: "It worked for five years. Its last contact was on February 28, 2001, from the surface of Eros.",
      mass: "It weighed about 487 kilograms.",
      power: "Four gallium arsenide solar panels, each 1.8 by 1.2 meters, powered it.",
      special: "It was the first spacecraft to orbit an asteroid and the first to land on one.",
    },
    kepler: {
      builtBy: "Ball Aerospace built Kepler, and NASA's Ames Research Center led the mission.",
      launched: "Kepler launched on a Delta II rocket from Cape Canaveral in March 2009.",
      lasted: "It collected data for more than nine years. NASA retired it on October 30, 2018, and sent its final commands on November 15, 2018.",
      mass: "It weighed about 1,052 kilograms.",
      power: "Solar panels powered it.",
      special: "It found more than 2,600 planets around other stars and watched more than 500,000 stars in all.",
    },
  });
})();
