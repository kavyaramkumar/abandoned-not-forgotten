/*
 * STORY LAYER
 * ------------------------------------------------------------
 * The museum is told as one journey in chapters, narrated by the explorer's
 * robot guide. Each machine is told in short "beats" instead of a placard.
 *
 * Written for ages 8 to 17: short sentences, one idea per card, about
 * 40 words or fewer. Every fact here comes from the exhibit's own `sources`
 * list in js/data.js. Keep `verified: false` until a teammate has checked a
 * machine's beats against those sources.
 *
 * CHAPTERS
 *   key: { n, title, lines: [..], outro }   (outro = said when leaving it)
 *   "dream" opens the learning tour, "future" closes both endings.
 *   Wing ids (moon, mars, deep) open the first time you enter that wing.
 *   {robot} is replaced with the player's robot name.
 *
 * MACHINE BEATS
 *   id: { hook, beats: [{ k, text }], verified }
 *   k is one of: why, mission, challenge, found, legacy
 *   Machines without beats keep their original first-person story pages.
 */
window.STORY = {
  chapters: {
    dream: {
      n: 0,
      title: "The Dream",
      lines: [
        "For thousands of years, people looked up at the night sky and wondered what was out there.",
        "Then we started building machines to go and find out.",
        "Every machine in this museum is still out there right now: on the Moon, on Mars, or far beyond. Let's go meet them!",
      ],
    },
    moon: {
      n: 1,
      title: "Reaching the Moon",
      lines: [
        "In the early 1960s, nobody knew if a spaceship could even land on the Moon. Would the ground hold it up? Would it sink into dust?",
        "The machines in this wing found out, one careful step at a time. Then people followed.",
      ],
      outro: "We made it to the Moon and back. Now for a planet much, much farther away.",
    },
    mars: {
      n: 2,
      title: "The Red Planet",
      lines: [
        "Mars is cold, dusty, and so far away that a message takes several minutes to get there.",
        "No person has been there yet, so we sent robots. They all chased one big question: was Mars ever wet?",
      ],
      outro: "Mars taught us that exploring doesn't always go to plan. Sometimes a broken wheel leads to a big discovery.",
    },
    deep: {
      n: 3,
      title: "Beyond the Planets",
      lines: [
        "Some machines never landed anywhere. They kept flying, past giant planets and out toward the stars.",
        "A few of them are still sending faint signals home.",
      ],
      outro: "These travelers showed us how big our solar system really is.",
    },
    future: {
      n: 4,
      title: "The Next Frontier",
      lines: [
        "Every machine you met was one step on a very long journey.",
        "NASA's Artemis astronauts are getting ready to go back to the Moon, and one day people may walk on Mars.",
        "Maybe you'll help get them there.",
      ],
    },
  },

  machines: {
    "apollo-11": {
      hook: "I carried the first two people to walk on another world. Then I stayed behind.",
      beats: [
        { k: "why", text: "In 1961, President Kennedy challenged NASA to land people on the Moon and bring them home safely before the 1960s ended. No one had ever built a spaceship that could land on another world." },
        { k: "mission", text: "I'm the bottom half of the lunar module Eagle. On July 20, 1969, I carried Neil Armstrong and Buzz Aldrin down to the Moon. Michael Collins circled above in Columbia, waiting for them." },
        { k: "challenge", text: "On the way down, alarms flashed on Eagle's computer. Then Neil saw that the landing spot was full of boulders. He flew past them, looking for a safe place, while the fuel ran low." },
        { k: "found", text: "We landed safely. The astronauts walked on the Moon and set up a mirror panel. Scientists still bounce lasers off it, and they've learned the Moon drifts away from Earth about 3.8 cm every year." },
        { k: "legacy", text: "When it was time to leave, the top half of Eagle blasted off and used me as a launch pad. I'm still there, with a plaque that says the explorers came in peace for all mankind." },
      ],
      verified: false,
    },
    lrv: {
      hook: "I was the first car ever driven on another world.",
      beats: [
        { k: "why", text: "On the first Moon landings, astronauts could only explore as far as they could walk in a bulky spacesuit. Scientists wanted rocks from places much farther away." },
        { k: "mission", text: "I rode to the Moon folded up against the side of the lunar module. Astronauts unfolded me like a pop-up book and drove me on battery power, with no roads to follow." },
        { k: "challenge", text: "Driving on the Moon is tricky: craters, rocks, and dust everywhere. On Apollo 17, part of my fender broke off. The astronauts fixed it with folded maps, clamps, and tape!" },
        { k: "found", text: "Because they could drive farther, astronauts found amazing rocks. Apollo 15 found the Genesis Rock, about 4 billion years old. Apollo 17 found orange soil made of tiny glass beads from ancient volcanoes." },
        { k: "legacy", text: "Three of us are still parked on the Moon, from Apollo 15, 16, and 17. NASA is now designing new Moon rovers for the Artemis astronauts." },
      ],
      verified: false,
    },
    spirit: {
      hook: "My broken wheel turned into one of my best science tools.",
      beats: [
        { k: "why", text: "Scientists wanted to know if Mars was ever wet. On Earth, where there's water, there's life. So NASA built two robot geologists: me and my twin, Opportunity." },
        { k: "mission", text: "I bounced down onto Mars inside giant airbags on January 4, 2004, in Gusev Crater. My mission was planned to last 90 Martian days." },
        { k: "challenge", text: "In 2006, one of my front wheels stopped turning. Instead of giving up, my team drove me backwards, dragging the broken wheel behind me." },
        { k: "found", text: "That dragging wheel scraped up bright white soil that was almost pure silica. On Earth, soil like that forms around hot springs. Gusev Crater once had hot water!" },
        { k: "legacy", text: "In 2009 I got stuck in soft sand, and my last message came in March 2010, after more than six years. I proved rovers could last far longer than planned." },
      ],
      verified: false,
    },
    opportunity: {
      hook: "I was built to last 90 days. I kept going for almost 15 years.",
      beats: [
        { k: "why", text: "Spacecraft orbiting Mars spotted a mineral called hematite in a place called Meridiani Planum. On Earth, it often forms in water. NASA sent me to find out why it was there." },
        { k: "mission", text: "I'm Opportunity, 'Oppy' to my friends. I landed in January 2004, on the opposite side of Mars from my twin, Spirit, and rolled to a stop inside a small crater." },
        { k: "challenge", text: "Mars kept testing me. Dust piled up on my solar panels. In 2005 I got stuck in a sand ripple for weeks. Each time, my team on Earth found a way to keep me going." },
        { k: "found", text: "I found tiny round pebbles that scientists called 'blueberries'. They formed in water. That was strong proof that long ago, Mars had water on its surface." },
        { k: "legacy", text: "I drove more than a marathon. In 2018 a giant dust storm blocked the Sun, my solar panels went dark, and I went quiet. Curiosity and Perseverance followed in my tracks." },
      ],
      verified: false,
    },
    "ranger-7": {
      hook: "I was built to crash into the Moon, and to take pictures the whole way down.",
      beats: [
        { k: "why", text: "Before anyone could land on the Moon, NASA needed to know what the ground looked like up close. No telescope on Earth could see the small rocks and holes." },
        { k: "mission", text: "I launched on July 28, 1964. I had no legs and no brakes. My job was to fly straight at the Moon with my six TV cameras switched on." },
        { k: "challenge", text: "The six Ranger missions before me all failed. I was the first Ranger to send back pictures, and I only had my last 17 minutes to do it." },
        { k: "found", text: "I sent back more than 4,000 pictures. The last ones showed details about half a meter across. The Moon was covered in craters of every size, even tiny ones." },
        { k: "legacy", text: "I crashed on purpose, just as planned. The area was renamed Mare Cognitum, the Sea That Has Become Known. My pictures helped NASA plan where astronauts could land." },
      ],
      verified: false,
    },
    "surveyor-3": {
      hook: "Nobody knew if the Moon would swallow a spaceship. I went to find out.",
      beats: [
        { k: "why", text: "In the 1960s, some people worried the Moon's ground was a deep pool of dust that could swallow a spaceship. NASA had to know before sending astronauts." },
        { k: "mission", text: "I landed in 1967 in the Ocean of Storms. (It has no water. Early astronomers thought the dark patches were seas!) I carried a little robot scoop to dig and poke the soil." },
        { k: "challenge", text: "My landing was bumpy. My engines didn't shut off in time, so I bounced across the ground before I finally settled." },
        { k: "found", text: "Good news: the ground was firm enough to land on! My trenches and pictures helped make the Apollo landings possible." },
        { k: "legacy", text: "Two and a half years later, I got visitors. The Apollo 12 astronauts landed close by, walked over, and took my camera home so scientists could study it." },
      ],
      verified: false,
    },
    "alsep": {
      hook: "I'm a whole science lab that astronauts left behind to listen to the Moon.",
      beats: [
        { k: "why", text: "Astronauts could only stay on the Moon for a few days. Scientists wanted to keep measuring the Moon for years after the astronauts went home." },
        { k: "mission", text: "Astronaut Alan Bean set me up on November 19, 1969, during Apollo 12. My instruments felt moonquakes, measured the Moon's magnetic field, and studied the solar wind and thin lunar air." },
        { k: "challenge", text: "A night on the Moon lasts about two weeks and gets freezing cold, far too dark for solar panels. So I ran on a nuclear generator that made power from heat." },
        { k: "found", text: "When Apollo 12's empty lunar module was crashed into the Moon on purpose, my seismometer recorded the first moonquake ever made by people. Quake waves let scientists look inside the Moon." },
        { k: "legacy", text: "Five Apollo crews left stations like me. NASA switched us all off on September 30, 1977. We're still standing where the astronauts left us, and new Moon seismometers are being planned." },
      ],
      verified: false,
    },
    "viking-1": {
      hook: "I sent home the first pictures ever taken from the surface of Mars.",
      beats: [
        { k: "why", text: "People had wondered about life on Mars for a long time. To learn more, NASA needed a spacecraft that could land safely and test the Martian soil." },
        { k: "mission", text: "I landed on Mars in 1976, seven years to the day after Apollo 11 landed on the Moon. Inside me was a mini science lab." },
        { k: "challenge", text: "My soil tests gave puzzling results. Some looked a little like signs of life, and others didn't. Scientists argued about them for years." },
        { k: "found", text: "My pictures showed rusty red rocks under a sky that wasn't blue. I also sent weather reports from Mars until 1982." },
        { k: "legacy", text: "My search for life raised questions that Mars missions are still working on, like the Perseverance rover, which is collecting rock samples today." },
      ],
      verified: false,
    },
    "viking-2": {
      hook: "I spotted winter frost on the ground of Mars.",
      beats: [
        { k: "why", text: "One lander can only see one spot. NASA sent me, Viking 1's twin, to study a second place much farther north." },
        { k: "mission", text: "I landed on September 3, 1976, on a plain called Utopia Planitia, about 6,460 kilometers from my twin. Like Viking 1, I scooped up soil and tested it for signs of life." },
        { k: "challenge", text: "My first landing spot looked too rough in photos, so planners moved it. Even then I landed tilted about 8 degrees, so my pictures make the horizon look crooked!" },
        { k: "found", text: "In 1977, during the Martian winter, my cameras spotted thin white frost on the ground around me. My soil results matched Viking 1's." },
        { k: "legacy", text: "I worked for 1,281 Mars days, until my batteries failed in April 1980. The two Vikings set the stage for every Mars lander since." },
      ],
      verified: false,
    },
    "sojourner": {
      hook: "I'm about the size of a microwave oven, and I was the first rover to drive on Mars.",
      beats: [
        { k: "why", text: "Nobody had ever driven a robot on another planet. NASA wanted to test whether a small rover could explore Mars." },
        { k: "mission", text: "I landed on July 4, 1997, inside the Mars Pathfinder lander, which bounced down wrapped in giant airbags. Then I rolled down a ramp onto Mars." },
        { k: "challenge", text: "Messages take minutes to reach Mars, so nobody could steer me with a joystick. I drove very slowly and carefully, and I could only talk to Earth through my lander." },
        { k: "found", text: "I sniffed rocks with a special instrument to learn what they were made of. Scientists gave them fun names like Barnacle Bill and Yogi." },
        { k: "legacy", text: "I was planned to work for a week but kept going for almost three months. I proved rovers could work on Mars, and Spirit and Opportunity followed in 2004." },
      ],
      verified: false,
    },
    "ingenuity": {
      hook: "I made the first powered flight on another planet.",
      beats: [
        { k: "why", text: "Rovers can only see what's around them. A flying scout could look ahead from the sky. NASA built me to test whether flying on Mars was even possible." },
        { k: "mission", text: "I weigh about as much as a bag of flour. I rode to Mars tucked under the Perseverance rover and landed in Jezero Crater in 2021." },
        { k: "challenge", text: "Mars air is super thin, about 1% as thick as Earth's. To lift off, my blades had to spin around 2,400 times a minute." },
        { k: "found", text: "On April 19, 2021, I flew! I was planned for 5 flights, but I made 72. I even carried a tiny piece of fabric from the Wright brothers' first airplane." },
        { k: "legacy", text: "In 2024 my blades were damaged, so I'm parked for good. Engineers are now studying bigger Mars helicopters that could carry science tools." },
      ],
      verified: false,
    },
    "phoenix": {
      hook: "I found ice hiding under the dirt near the north pole of Mars.",
      beats: [
        { k: "why", text: "Spacecraft orbiting Mars had sensed signs of ice near the north pole. NASA sent me to dig and find out for sure." },
        { k: "mission", text: "I landed on May 25, 2008. The ground there is cracked into shapes like a giant honeycomb, because of the ice underneath. I dug little trenches with my robotic arm." },
        { k: "challenge", text: "I found bright white chunks, but were they ice or salt? A few days later, some had vanished into the thin air. Salt doesn't do that. They were water ice!" },
        { k: "found", text: "I watched snow falling from Martian clouds, though it disappeared before it reached the ground. I also found a salt called perchlorate in the soil." },
        { k: "legacy", text: "Winter came, my solar panels couldn't make enough power, and my last signal came in November 2008. Future explorers might use ice like mine for drinking water and rocket fuel." },
      ],
      verified: false,
    },
    "insight": {
      hook: "Most Mars explorers study rocks. I listened to the inside of the planet.",
      beats: [
        { k: "why", text: "Scientists wanted to know what Mars is like deep inside: how thick its crust is and how big its core is. That helps explain how rocky planets like Earth formed." },
        { k: "mission", text: "I landed on November 26, 2018, on a flat, smooth plain picked to keep me safe. My robotic arm set a super-sensitive seismometer on the ground." },
        { k: "challenge", text: "My heat probe, nicknamed 'the mole', was supposed to dig 5 meters down. But the soil was too clumpy, and it got stuck near the surface." },
        { k: "found", text: "My seismometer felt more than 1,300 marsquakes. By timing the quake waves, scientists measured Mars' crust, its mantle, and a big core of liquid metal." },
        { k: "legacy", text: "Dust slowly covered my solar panels, and my last message reached Earth in December 2022. Scientists are still studying my quake recordings today." },
      ],
      verified: false,
    },
    "pioneer-10": {
      hook: "I was the first spacecraft to fly through the asteroid belt and visit Jupiter.",
      beats: [
        { k: "why", text: "No spacecraft had ever traveled out past Mars. NASA needed to know if a ship could reach the giant outer planets in one piece." },
        { k: "mission", text: "I launched in 1972. In 1973 I became the first spacecraft to fly past Jupiter, and I sent back close-up pictures of the giant planet." },
        { k: "challenge", text: "Scientists worried I'd be smashed by space rocks in the asteroid belt. Then Jupiter blasted me with powerful radiation. I made it through both!" },
        { k: "found", text: "I showed that spacecraft could safely cross the asteroid belt and survive Jupiter's radiation. That opened the road to the outer planets." },
        { k: "legacy", text: "My last faint signal came in 2003. I carry a metal plaque with a drawing of people and a map showing where Earth is, just in case anyone ever finds me." },
      ],
      verified: false,
    },
    "pioneer-11": {
      hook: "I was the first spacecraft to visit Saturn.",
      beats: [
        { k: "why", text: "After my twin, Pioneer 10, reached Jupiter, NASA wanted to go even farther: to Saturn and its famous rings." },
        { k: "mission", text: "I launched on April 6, 1973. In 1974 I zoomed past Jupiter, just 43,000 kilometers above its clouds. Jupiter's gravity then flung me toward Saturn." },
        { k: "challenge", text: "Flying that close to Jupiter meant passing through its fierce radiation. Then it took almost five more years to reach Saturn." },
        { k: "found", text: "On September 1, 1979, I flew past Saturn. I found a thin new ring, now called the F ring, and a small moon nobody had seen before." },
        { k: "legacy", text: "My team heard from me for the last time in 1995. Voyager 1 and 2 followed my path to Saturn, and Cassini later orbited it for 13 years." },
      ],
      verified: false,
    },
    "voyager-1": {
      hook: "I'm the farthest human-made object, and I'm still talking to Earth.",
      beats: [
        { k: "why", text: "NASA wanted a close look at the giant planets Jupiter and Saturn, with their storms, rings, and many moons." },
        { k: "mission", text: "I launched in 1977. I flew past Jupiter and Saturn and sent home amazing pictures of their storms, rings, and moons." },
        { k: "challenge", text: "The farther I go, the weaker my signal gets. Today my messages take about a whole day to reach Earth, and giant antennas have to listen very carefully." },
        { k: "found", text: "In 1990 I photographed Earth from about 6 billion km away: the Pale Blue Dot. In 2012 I became the first human-made object to reach interstellar space." },
        { k: "legacy", text: "I carry a Golden Record with sounds and music from Earth. My twin, Voyager 2, reached interstellar space in 2018. We're the only two still sending messages from there." },
      ],
      verified: false,
    },
    "new-horizons": {
      hook: "I flew for nine years to show everyone what Pluto really looks like.",
      beats: [
        { k: "why", text: "Before 2015, even the best telescope pictures of Pluto were fuzzy blobs. Nobody knew what its surface looked like." },
        { k: "mission", text: "I'm about the size of a grand piano. I launched in 2006 on a long trip to Pluto. The people who built me grew nine years older before I arrived!" },
        { k: "challenge", text: "I couldn't slow down or stop at Pluto. I zoomed past very fast, so I had just one chance to take every picture." },
        { k: "found", text: "On July 14, 2015, I flew past Pluto. Surprise: it has a giant heart-shaped plain of ice and glaciers. Pluto is an active world, not just a frozen rock." },
        { k: "legacy", text: "On New Year's Day 2019 I flew past Arrokoth, the most distant object any spacecraft had explored up close. I'm still flying through the Kuiper Belt today." },
      ],
      verified: false,
    },
    "dawn": {
      hook: "I was the first spacecraft to orbit two different worlds beyond Earth.",
      beats: [
        { k: "why", text: "Vesta and Ceres are two of the biggest objects in the asteroid belt. Scientists thought they were leftovers from when the planets formed, and wanted a close look." },
        { k: "mission", text: "I launched on September 27, 2007. My three ion engines push out xenon gas so gently it barely feels like a breath, but if you push for years, you go really fast!" },
        { k: "challenge", text: "Two of the wheels that kept me pointed broke during my mission. My team had to steer me with tiny thruster puffs instead, using my fuel very carefully." },
        { k: "found", text: "I orbited the giant asteroid Vesta in 2011, then the dwarf planet Ceres in 2015. Ceres may once have had an ocean, and may still have salty water inside." },
        { k: "legacy", text: "On October 31, 2018, I ran out of the fuel that kept me pointed at Earth. I'm still circling Ceres. NASA's Psyche spacecraft now uses engines like mine." },
      ],
      verified: false,
    },
    "near-shoemaker": {
      hook: "I was never built to land, but I landed on an asteroid anyway.",
      beats: [
        { k: "why", text: "Asteroids are leftovers from when the planets formed. Scientists wanted to study one up close for a whole year, not just zoom past it." },
        { k: "mission", text: "I launched on February 17, 1996. On Valentine's Day 2000, I became the first spacecraft to orbit an asteroid: 433 Eros, about 34 kilometers long." },
        { k: "challenge", text: "My first try to get into orbit around Eros, in 1998, failed when an engine burn stopped early. My team needed more than a year to line up another try." },
        { k: "found", text: "I circled Eros for about a year and took around 160,000 pictures. Then, on February 12, 2001, my team gently landed me on its surface." },
        { k: "legacy", text: "I kept sending science from Eros for about two weeks. I'm named for Gene Shoemaker, who studied craters. Later, OSIRIS-REx brought a piece of an asteroid back to Earth." },
      ],
      verified: false,
    },
    "kepler": {
      hook: "I found more than 2,600 planets around other stars.",
      beats: [
        { k: "why", text: "Are there planets like Earth around other stars? For a long time, nobody even knew how common planets were." },
        { k: "mission", text: "I launched in March 2009 and stared at about 150,000 stars at once. When a star's light dipped a tiny bit, it meant a planet had just passed in front of it." },
        { k: "challenge", text: "In 2013 the second of my four reaction wheels broke, and I needed three to point steadily. My engineers used the gentle push of sunlight to help balance me." },
        { k: "found", text: "Planets are everywhere! Our galaxy has more planets than stars, and many stars may have small, possibly rocky planets." },
        { k: "legacy", text: "I ran out of fuel in 2018, after more than nine years. My team sent my final 'goodnight' commands. Now TESS, launched in 2018, carries on the planet hunt." },
      ],
      verified: false,
    },
  },
};
