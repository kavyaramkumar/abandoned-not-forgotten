/*
 * MUSEUM CONTENT
 * ------------------------------------------------------------
 * Every wing, exhibit, story page, quiz and offline-guide answer lives here,
 * so the team can edit content without touching app code.
 *
 * DRAFT CONTENT: facts were written from well-known NASA mission history but
 * must be checked against the official challenge resources (arriving Friday)
 * before submission. Each exhibit has `sources: []` to fill in, and
 * `verified: false` until someone on the team has checked it.
 *
 * Exhibit shape:
 *   id, name, kind, place, year, status ("silent" | "parked" | "still talking"),
 *   art (hardware drawing key in js/art.js), backdrop (diorama scene key),
 *   next: how this machine led to the missions that came after (the bigger NASA story)
 *   story: [ "page 1", "page 2", ... ]   (told by the machine, first person)
 *   leftBehind: [ "thing still there", ... ]
 *   discovery: "the big thing we learned"
 *   quiz: { q, options: [..], answer: index, explain }
 *   faq: [ { keys: ["words", "to", "match"], a: "answer" } ]   (offline guide)
 */

window.MUSEUM = {
  name: "The Silent Explorers Museum",
  tagline: "Abandoned, but not forgotten",

  wings: [
    {
      id: "moon",
      name: "Moon Wing",
      subtitle: "Our closest neighbor, 384,000 km away",
      color: "#9fb7ff",
      code: "M",
      wall: "#2f3747",
      question: "Can we land on another world, and can people go there?",
      badge: { name: "Moonwalker", icon: "🌕" },
      intro:
        "Footprints, rovers and a mirror that still bounces lasers. Everything in this wing is still sitting on the Moon right now.",
      exhibits: [
        {
          id: "surveyor-3",
          art: "surveyor",
          backdrop: "moon-earth",
          next: "Surveyor 3 and its robot sisters showed the Moon's ground was safe to land on, so astronauts could follow. Two and a half years later, they did!",
          name: "Surveyor 3",
          kind: "Robot lander",
          place: "Ocean of Storms, Moon",
          year: 1967,
          status: "silent",
          story: [
            "Hi! I'm Surveyor 3. In 1967, nobody knew if the Moon's ground was solid or a deep pool of dust that would swallow a spaceship. My job was to find out before any astronaut tried.",
            "I landed in a place called the Ocean of Storms. (It has no water. Early astronomers thought the dark patches were seas!) I used my little robot scoop to dig trenches and poke the soil.",
            "Good news: the ground was firm enough to land on! Two and a half years later, I got visitors. The Apollo 12 astronauts landed close by, walked over, and took my camera home to study.",
          ],
          leftBehind: [
            "The Surveyor 3 lander (minus the parts the astronauts took home)",
            "The trenches dug by its scoop",
          ],
          discovery:
            "The Moon's surface could hold up a spacecraft, which helped make the Apollo landings possible.",
          quiz: {
            q: "What was Surveyor 3 checking before astronauts landed?",
            options: [
              "If the Moon had air to breathe",
              "If the ground was firm enough to land on",
              "If there were aliens on the Moon",
            ],
            answer: 1,
            explain:
              "Right! Its scoop showed the soil was solid enough for a lander.",
          },
          faq: [
            {
              keys: ["camera", "home", "astronaut", "apollo 12", "visit"],
              a: "The Apollo 12 astronauts landed near Surveyor 3 in 1969 and brought its camera back to Earth so scientists could see how 2.5 years on the Moon changed it.",
            },
            {
              keys: ["germ", "bacteria", "life"],
              a: "Scientists found Earth germs inside the camera after it came home. Many scientists now think the germs got in after it returned to Earth, not that they survived on the Moon.",
            },
            {
              keys: ["scoop", "dig", "soil"],
              a: "Surveyor 3 had a robot arm with a scoop. It dug little trenches to test how hard the Moon's soil was.",
            },
          ],
          sources: [],
          verified: false,
        },
        {
          id: "apollo-11",
          art: "eagle",
          backdrop: "moon-earth",
          next: "Five more Apollo crews landed after Eagle. The last, Apollo 17, left the Moon in December 1972. Now NASA's Artemis program plans to send astronauts back.",
          name: "Apollo 11 Eagle descent stage",
          kind: "Lander base (descent stage)",
          place: "Sea of Tranquility, Moon",
          year: 1969,
          status: "silent",
          story: [
            "I'm the bottom half of the lunar module Eagle. On July 20, 1969, I carried Neil Armstrong and Buzz Aldrin down to the Moon while Michael Collins circled above in Columbia.",
            "When it was time to go home, the top half of Eagle blasted off and used me as a launch pad. That's why I'm still here, with a plaque on my leg that says the explorers came in peace for all mankind.",
            "My crew left science behind too: a seismometer to feel moonquakes, and a mirror panel called a retroreflector. Scientists on Earth still bounce lasers off that mirror today!",
          ],
          leftBehind: [
            "The Eagle descent stage and its plaque",
            "A U.S. flag",
            "The laser retroreflector (still used today)",
            "A seismometer for moonquakes (no longer working)",
            "Bootprints!",
          ],
          discovery:
            "Laser beams bounced off the mirror show the Moon is slowly drifting away from Earth, about 3.8 cm (1.5 inches) every year.",
          quiz: {
            q: "Why is the Eagle descent stage still on the Moon?",
            options: [
              "It ran out of fuel and crashed",
              "It was used as a launch pad for the top half",
              "Astronauts forgot it",
            ],
            answer: 1,
            explain:
              "Yes! The top half (the ascent stage) launched off of it to go home.",
          },
          faq: [
            {
              keys: ["mirror", "laser", "retroreflector", "drift", "away"],
              a: "The retroreflector is a panel of special mirrors. Scientists fire lasers at it and time how long the light takes to come back. That's how we know the Moon moves about 3.8 cm farther from Earth each year.",
            },
            {
              keys: ["who", "astronaut", "armstrong", "aldrin", "collins"],
              a: "Neil Armstrong and Buzz Aldrin walked on the Moon. Michael Collins stayed in orbit in the command module Columbia.",
            },
            {
              keys: ["plaque", "say"],
              a: "The plaque says that men from the planet Earth first set foot on the Moon in July 1969, and that they came in peace for all mankind.",
            },
            {
              keys: ["flag", "standing"],
              a: "Astronaut Buzz Aldrin reported the Apollo 11 flag was knocked over by engine exhaust when the top half of Eagle launched.",
            },
          ],
          sources: [],
          verified: false,
        },
        {
          id: "lrv",
          art: "lrv",
          backdrop: "moon-earth",
          next: 'New Moon rovers are being designed for the Artemis astronauts who will return to the Moon.',
          name: "Lunar Roving Vehicle",
          kind: "Moon buggy (rover)",
          place: "Apollo 15, 16 & 17 landing sites",
          year: 1971,
          status: "parked",
          story: [
            "Vroom! I'm a Lunar Roving Vehicle, the Moon buggy. I rode to the Moon folded up against the side of the lunar module, and astronauts unfolded me like a pop-up book.",
            "I run on batteries and drive about as fast as a kid on a bike. With me, astronauts could explore miles away from their lander instead of just walking around it.",
            "There are three of us parked on the Moon: from Apollo 15, 16 and 17. On those trips, astronauts found the 'Genesis Rock', more than 4 billion years old, and orange soil made of tiny glass beads from ancient volcanoes.",
          ],
          leftBehind: [
            "Three Lunar Roving Vehicles (Apollo 15, 16 and 17)",
            "Tire tracks across the lunar surface",
          ],
          discovery:
            "Driving farther meant finding very old rocks, which helped scientists figure out how the Moon formed.",
          quiz: {
            q: "How many Moon buggies are parked on the Moon?",
            options: ["One", "Three", "Ten"],
            answer: 1,
            explain: "Correct! Apollo 15, 16 and 17 each left one behind.",
          },
          faq: [
            {
              keys: ["fast", "speed"],
              a: "The Moon buggy drove about 13 km/h (8 mph), roughly as fast as riding a bike.",
            },
            {
              keys: ["genesis", "rock", "old"],
              a: "The Genesis Rock was found on Apollo 15. It's more than 4 billion years old and is a piece of the Moon's ancient crust.",
            },
            {
              keys: ["orange", "soil", "glass", "volcano"],
              a: "On Apollo 17, astronauts found orange soil. It turned out to be tiny glass beads sprayed out by volcanoes billions of years ago.",
            },
            {
              keys: ["power", "battery", "fuel"],
              a: "The rover ran on batteries, with no gas needed.",
            },
          ],
          sources: [],
          verified: false,
        },
      ],
    },

    {
      id: "mars",
      name: "Mars Wing",
      subtitle: "The Red Planet, home of the robot explorers",
      color: "#ff8a5c",
      code: "R",
      wall: "#6a3326",
      question: "Was Mars ever a place where life could exist?",
      badge: { name: "Red Planet Ranger", icon: "🔴" },
      intro:
        "No human has ever been to Mars, but our robots have. Some are silent now, but every one of them changed what we know.",
      exhibits: [
        {
          id: "viking-1",
          art: "viking",
          backdrop: "mars",
          next: "Viking's search for life raised questions that Mars missions are still working on, like the Perseverance rover, which is collecting rock samples today.",
          name: "Viking 1 Lander",
          kind: "Science lander",
          place: "Chryse Planitia, Mars",
          year: 1976,
          status: "silent",
          story: [
            "Greetings from 1976! I'm Viking 1, the first NASA spacecraft to land safely on Mars and get to work. I landed seven years to the day after Apollo 11 touched down on the Moon.",
            "I sent home the first pictures taken from the surface of Mars. People were amazed: rusty red rocks, and a sky that wasn't blue.",
            "I had a mini science lab inside me to test the soil for signs of life. My results puzzled scientists for years! I kept working and sending weather reports until 1982.",
          ],
          leftBehind: ["The Viking 1 lander, silent since 1982"],
          discovery:
            "The first close-up look at Mars' surface and weather, plus experiments that shaped how we still search for life today.",
          quiz: {
            q: "What 'first' did Viking 1 achieve?",
            options: [
              "First picture from the surface of Mars",
              "First helicopter on Mars",
              "First astronaut on Mars",
            ],
            answer: 0,
            explain:
              "Yes! Viking 1 sent the first photos from Mars' surface.",
          },
          faq: [
            {
              keys: ["life", "alien", "found"],
              a: "Viking ran experiments on Martian soil to look for life. The results were confusing, and most scientists concluded they did not show life. The question of life on Mars is still being studied!",
            },
            {
              keys: ["long", "how long", "worked", "last"],
              a: "Viking 1 was planned for 90 days but kept working for more than six years, until 1982.",
            },
            {
              keys: ["sky", "color"],
              a: "Mars' sky looks butterscotch or pinkish in the daytime because of fine dust in the air.",
            },
          ],
          sources: [],
          verified: false,
        },
        {
          id: "sojourner",
          art: "sojourner",
          backdrop: "mars",
          next: 'Sojourner proved rovers could work on Mars. In 2004, two much bigger rovers followed: Spirit and Opportunity.',
          name: "Sojourner",
          kind: "Rover",
          place: "Ares Vallis, Mars",
          year: 1997,
          status: "silent",
          story: [
            "I'm Sojourner, the very first rover to drive on Mars! I'm only about the size of a microwave oven. I landed on July 4, 1997, riding inside the Mars Pathfinder lander, which bounced down wrapped in giant airbags.",
            "I drove super slowly and carefully, sniffing rocks with a special instrument to find out what they were made of. Scientists gave the rocks fun names like Barnacle Bill and Yogi.",
            "I was only supposed to work for a week, but I kept going for almost three months! I talked to Earth through my lander, so when the lander went quiet, so did I.",
          ],
          leftBehind: [
            "The Sojourner rover",
            "The Pathfinder lander, renamed the Carl Sagan Memorial Station",
          ],
          discovery:
            "Proved small rovers could explore Mars, paving the way for every bigger rover since.",
          quiz: {
            q: "How big is Sojourner?",
            options: [
              "About the size of a car",
              "About the size of a microwave oven",
              "About the size of a house",
            ],
            answer: 1,
            explain: "That's right! Small but mighty.",
          },
          faq: [
            {
              keys: ["airbag", "bounce", "land"],
              a: "Pathfinder landed by bouncing across Mars wrapped in big airbags, then rolled to a stop and opened up like a flower.",
            },
            {
              keys: ["name", "named"],
              a: "Sojourner was named after Sojourner Truth, who fought for freedom and equal rights in the 1800s.",
            },
            {
              keys: ["rock", "barnacle", "yogi"],
              a: "The science team nicknamed rocks so they could talk about them easily. Barnacle Bill and Yogi were two rocks Sojourner studied.",
            },
          ],
          sources: [],
          verified: false,
        },
        {
          id: "opportunity",
          art: "opportunity",
          backdrop: "mars",
          next: "Bigger rovers followed in Oppy's tracks: Curiosity landed in 2012 and Perseverance in 2021.",
          name: "Opportunity",
          kind: "Rover",
          place: "Meridiani Planum, Mars",
          year: 2004,
          status: "silent",
          story: [
            "Hi, I'm Opportunity, 'Oppy' to my friends. My twin, Spirit, landed on the other side of Mars a few weeks before me in 2004. We were each planned to work for 90 Martian days.",
            "I found tiny round pebbles that scientists called 'blueberries'. They formed in water! That was strong proof that long ago, Mars had water on its surface.",
            "I kept exploring for almost 15 years and drove more than a marathon. In 2018 a giant dust storm covered the sky, my solar panels couldn't get sunlight, and I went quiet.",
          ],
          leftBehind: ["Opportunity, silent since a 2018 dust storm"],
          discovery:
            "Clear evidence that liquid water once existed on Mars' surface.",
          quiz: {
            q: "What did Opportunity's 'blueberries' prove?",
            options: [
              "Mars once had water",
              "Mars grows fruit",
              "Mars is made of ice",
            ],
            answer: 0,
            explain:
              "Exactly! Those little balls formed in water long ago.",
          },
          faq: [
            {
              keys: ["battery", "dark", "last words", "last message"],
              a: "You might have heard Oppy's last words were 'My battery is low and it's getting dark.' That's actually a reporter's poetic way of describing its last data. The real message was numbers showing low power and a dark, dusty sky.",
            },
            {
              keys: ["far", "distance", "marathon", "drive"],
              a: "Opportunity drove about 45 km (28 miles), more than a full marathon, on another planet!",
            },
            {
              keys: ["spirit", "twin"],
              a: "Spirit was Opportunity's twin. It got stuck in soft sand in 2009 and went silent in 2010.",
            },
          ],
          sources: [],
          verified: false,
        },
        {
          id: "ingenuity",
          art: "ingenuity",
          backdrop: "mars",
          next: 'Ingenuity proved flying on Mars works. Engineers are now studying ideas for bigger Mars helicopters that could carry science tools.',
          name: "Ingenuity",
          kind: "Helicopter",
          place: "Jezero Crater, Mars",
          year: 2021,
          status: "parked",
          story: [
            "Bzzzz! I'm Ingenuity, a tiny helicopter that weighs about as much as a bag of flour. I rode to Mars tucked under the Perseverance rover.",
            "Flying on Mars is really hard because the air is super thin, about 1% as thick as Earth's. My blades had to spin around 2,400 times a minute to lift me up.",
            "On April 19, 2021, I made the first powered flight on another planet! I was planned for 5 flights, but I flew 72. In 2024 my blades were damaged, so now I'm parked for good.",
          ],
          leftBehind: ["Ingenuity, parked in Jezero Crater after its final flight"],
          discovery:
            "Proved that aircraft can fly on other planets, so future missions can explore from the sky.",
          quiz: {
            q: "How many flights did Ingenuity make?",
            options: ["5", "72", "1"],
            answer: 1,
            explain: "Yes! It was planned for 5 and made 72.",
          },
          faq: [
            {
              keys: ["wright", "fabric", "brothers"],
              a: "Ingenuity carried a tiny piece of fabric from the Wright brothers' 1903 airplane, the first airplane on Earth.",
            },
            {
              keys: ["air", "thin", "fly", "how"],
              a: "Mars' air is very thin, so Ingenuity had super-light blades that spun very fast, around 2,400 times a minute.",
            },
            {
              keys: ["perseverance", "rover"],
              a: "Ingenuity rode to Mars attached to the belly of the Perseverance rover, which is still exploring.",
            },
          ],
          sources: [],
          verified: false,
        },
      ],
    },

    {
      id: "deep",
      name: "Deep Space Wing",
      subtitle: "Probes still traveling far beyond the planets",
      color: "#c58bff",
      code: "D",
      wall: "#1b1d36",
      question: "How far can a machine built by people travel?",
      badge: { name: "Star Voyager", icon: "✨" },
      intro:
        "Some explorers never landed anywhere. They're still flying, farther from home than anything humans have ever built.",
      exhibits: [
        {
          id: "pioneer-10",
          art: "pioneer",
          backdrop: "jupiter",
          next: 'Pioneer 10 showed the way to the outer planets. Its twin Pioneer 11 followed, and then Voyager 1 and Voyager 2.',
          name: "Pioneer 10",
          kind: "Deep space probe",
          place: "Heading toward the star Aldebaran",
          year: 1972,
          status: "silent",
          story: [
            "I'm Pioneer 10, launched in 1972. I was the first spacecraft to fly through the asteroid belt. Scientists worried I'd be smashed by space rocks, but I made it!",
            "In 1973 I became the first spacecraft to fly past Jupiter, and I sent back close-up pictures of the giant planet.",
            "I sent my last faint signal in 2003. I carry a metal plaque with a drawing of people and a map showing where Earth is, just in case anyone ever finds me.",
          ],
          leftBehind: [
            "Pioneer 10, coasting silently out of the solar system",
            "The Pioneer plaque, a message for anyone who finds it",
          ],
          discovery:
            "Showed spacecraft could safely cross the asteroid belt and survive Jupiter's powerful radiation.",
          quiz: {
            q: "What was Pioneer 10 the first to do?",
            options: [
              "Land on Mars",
              "Fly through the asteroid belt and past Jupiter",
              "Take people to the Moon",
            ],
            answer: 1,
            explain: "Right! It led the way to the outer solar system.",
          },
          faq: [
            {
              keys: ["plaque", "message", "drawing"],
              a: "The Pioneer plaque shows a drawing of a man and a woman, and a map showing where our Sun is, in case anyone ever finds the spacecraft.",
            },
            {
              keys: ["where", "going", "aldebaran"],
              a: "Pioneer 10 is drifting toward the star Aldebaran. It would take about 2 million years to get anywhere near it.",
            },
          ],
          sources: [],
          verified: false,
        },
        {
          id: "voyager-1",
          art: "voyager",
          backdrop: "deep",
          next: 'Its twin, Voyager 2, reached interstellar space in 2018. The two Voyagers are the only spacecraft still sending messages from interstellar space.',
          name: "Voyager 1",
          kind: "Deep space probe",
          place: "Interstellar space",
          year: 1977,
          status: "still talking",
          story: [
            "I'm Voyager 1, launched in 1977. I flew past Jupiter and Saturn and sent home amazing pictures of their storms, rings and moons.",
            "In 1990 I turned around and took a photo of Earth from about 6 billion km away. Earth looked like a tiny blue dot in a sunbeam. People call it the 'Pale Blue Dot'.",
            "In 2012 I became the first human-made object to reach interstellar space, the space between the stars. I'm still talking to Earth, though my messages take almost a whole day to arrive! I carry a Golden Record with sounds and music from Earth.",
          ],
          leftBehind: [
            "Voyager 1, the farthest human-made object",
            "The Golden Record: greetings, music and sounds of Earth",
          ],
          discovery:
            "The first measurements from interstellar space, beyond the bubble of the Sun's solar wind.",
          quiz: {
            q: "What is the 'Pale Blue Dot'?",
            options: [
              "A new planet Voyager discovered",
              "A photo of Earth taken from very far away",
              "A blue star",
            ],
            answer: 1,
            explain: "Yes! It's Earth, as a tiny speck in a sunbeam.",
          },
          faq: [
            {
              keys: ["golden record", "record", "music"],
              a: "The Golden Record has greetings in many languages, music from around the world, and sounds like thunder, birds and a baby's cry, a message about life on Earth.",
            },
            {
              keys: ["far", "distance", "where"],
              a: "Voyager 1 is more than 24 billion km (15 billion miles) away, farther than any other spacecraft.",
            },
            {
              keys: ["power", "still", "working", "alive"],
              a: "Voyager 1 is still sending data, but its power slowly drops each year, so engineers turn off instruments one at a time to keep it going.",
            },
          ],
          sources: [],
          verified: false,
        },
        {
          id: "new-horizons",
          art: "newhorizons",
          backdrop: "pluto",
          next: 'New Horizons is still flying through the Kuiper Belt, sending back science about the far edge of our solar system.',
          name: "New Horizons",
          kind: "Flyby probe",
          place: "The Kuiper Belt",
          year: 2006,
          status: "still talking",
          story: [
            "I'm New Horizons, about the size of a piano. I launched in 2006 on a long trip to Pluto, so long that the people who built me grew nine years older before I arrived!",
            "On July 14, 2015, I zoomed past Pluto and took the first close-up pictures. Surprise: Pluto has a giant heart-shaped plain of ice!",
            "On New Year's Day 2019, I flew past Arrokoth, the most distant object any spacecraft had ever explored up close. I'm still flying through the Kuiper Belt today.",
          ],
          leftBehind: ["New Horizons, still exploring the Kuiper Belt"],
          discovery:
            "Pluto is an active world with ice mountains and glaciers, not just a frozen rock.",
          quiz: {
            q: "What shape did New Horizons spot on Pluto?",
            options: ["A star", "A heart", "A smiley face"],
            answer: 1,
            explain: "Yes! Pluto's 'heart' is a huge plain of frozen ice.",
          },
          faq: [
            {
              keys: ["heart", "ice"],
              a: "Pluto's heart is a huge region of frozen nitrogen ice, nicknamed after Clyde Tombaugh, the astronomer who discovered Pluto.",
            },
            {
              keys: ["arrokoth", "snowman"],
              a: "Arrokoth looks a bit like a flattened snowman: two lumps stuck together. It's a leftover building block from when the planets formed.",
            },
            {
              keys: ["long", "how long", "time"],
              a: "New Horizons took about 9.5 years to reach Pluto.",
            },
          ],
          sources: [],
          verified: false,
        },
      ],
    },

    // Placeholder wings: shown as sealed doors so judges see where the story grows.
    {
      id: "venus",
      name: "Venus & Mercury Wing",
      subtitle: "Coming soon",
      color: "#ffd166",
      comingSoon: true,
      exhibits: [],
    },
    {
      id: "giants",
      name: "Giant Planets Wing",
      subtitle: "Coming soon",
      color: "#6ee7d8",
      comingSoon: true,
      exhibits: [],
    },
  ],

  /*
   * ROBOT WORKSHOP ITEMS
   * slot: color | eyes | hat | gear     cost: stars
   */
  shop: [
    { id: "c-silver", slot: "color", name: "Lunar Silver", value: "#c9d3e6", cost: 0 },
    { id: "c-gold", slot: "color", name: "Spacecraft Gold Foil", value: "#e8b931", cost: 3 },
    { id: "c-red", slot: "color", name: "Mars Rust", value: "#d9603b", cost: 3 },
    { id: "c-blue", slot: "color", name: "Pale Blue Dot", value: "#5aa9ff", cost: 3 },
    { id: "c-purple", slot: "color", name: "Nebula Purple", value: "#a06bff", cost: 5 },

    { id: "e-cyan", slot: "eyes", name: "Scanner Cyan", value: "#5ef2ff", cost: 0 },
    { id: "e-green", slot: "eyes", name: "Signal Green", value: "#6dff8a", cost: 2 },
    { id: "e-pink", slot: "eyes", name: "Laser Pink", value: "#ff6bd0", cost: 2 },

    { id: "h-none", slot: "hat", name: "No hat", value: "none", cost: 0 },
    { id: "h-helmet", slot: "hat", name: "Astronaut Helmet", value: "helmet", cost: 4 },
    { id: "h-prop", slot: "hat", name: "Ingenuity Propeller Cap", value: "prop", cost: 5 },
    { id: "h-party", slot: "hat", name: "Launch Party Hat", value: "party", cost: 3 },
    { id: "h-crown", slot: "hat", name: "Star Crown", value: "crown", cost: 8 },

    { id: "g-none", slot: "gear", name: "No gear", value: "none", cost: 0 },
    { id: "g-solar", slot: "gear", name: "Rover Solar Panels", value: "solar", cost: 4 },
    { id: "g-jet", slot: "gear", name: "Jetpack", value: "jetpack", cost: 6 },
    { id: "g-record", slot: "gear", name: "Golden Record Badge", value: "record", cost: 5 },
    { id: "g-flag", slot: "gear", name: "Explorer Flag", value: "flag", cost: 3 },
  ],
};
