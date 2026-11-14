/*
 * MUSEUM CONTENT
 * ------------------------------------------------------------
 * Every wing, exhibit, story page, quiz, and offline-guide answer lives here,
 * so the team can edit content without touching app code.
 *
 * DRAFT CONTENT: facts were written from well-known NASA mission history but
 * must be checked against the official challenge resources (arriving Friday)
 * before submission. Each exhibit has `sources: []` to fill in, and
 * `verified: false` until someone on the team has checked it.
 *
 * Exhibit shape:
 *   id, name, kind, place, year, status ("silent" | "parked" | "still talking"),
 *   riddle: a one-line "Which machine am I?" clue used by riddle-locked doors,
 *   art (hardware drawing key in js/art.js), backdrop (diorama scene key),
 *   next: how this machine led to the missions that came after (the bigger NASA story)
 *   story: [ "page 1", "page 2", ... ]   (told by the machine, first person)
 *   leftBehind: [ "thing still there", ... ]
 *   discovery: "the big thing we learned"
 *   quiz: { q, options: [..], answer: index, explain }
 *   faq: [ { keys: ["words", "to", "match"], a: "answer" } ]   (offline guide)
 */

window.MUSEUM = {
  name: "The Reach for the Stars Museum",
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
        "Footprints, rovers, and a mirror that still bounces lasers. Everything in this wing is still sitting on the Moon right now.",
      exhibits: [
        {
          id: "ranger-7",
          riddle: "In 1964 I took thousands of close-up pictures of the Moon, right up until I crashed into it on purpose.",
          art: "ranger",
          backdrop: "moon-earth",
          next: "Ranger 8 and Ranger 9 followed in 1965. Then the Surveyor landers touched down gently, and Apollo astronauts came after them.",
          name: "Ranger 7",
          kind: "Impact probe",
          place: "Sea of Clouds, Moon",
          year: 1964,
          status: "silent",
          story: ["Before anyone could land on the Moon, people needed to know what the ground looks like up close. That was my job. I launched on July 28, 1964.", "I had no legs and no brakes. I was built to fly straight at the Moon and take pictures the whole way down. In my last 17 minutes, my six TV cameras sent back more than 4,000 pictures.", "My final pictures showed details only about half a meter across, far smaller than any telescope on Earth could see. Then I crashed into the Moon on purpose, just as planned. The area was renamed Mare Cognitum: the Sea That Has Become Known."],
          leftBehind: ["What's left of Ranger 7, scattered around its crash site", "A new name on the map: Mare Cognitum, the Sea That Has Become Known"],
          discovery: "Ranger 7's pictures showed that the Moon is covered in craters of every size, even tiny ones. Knowing what the ground looked like up close helped NASA plan how and where to land.",
          quiz: {"q": "How did Ranger 7 end its mission?", "options": ["It landed softly on legs", "It crashed into the Moon on purpose while taking pictures", "It flew back home to Earth"], "answer": 1, "explain": "Right! It was built to crash, sending pictures all the way down."},
          faq: [{"keys": ["pictures", "photos", "camera", "cameras"], "a": "Ranger 7 had six TV cameras. It sent more than 4,000 pictures in its last 17 minutes before impact."}, {"keys": ["name", "cognitum", "sea", "clouds"], "a": "Ranger 7 crashed in a part of the Sea of Clouds that was later named Mare Cognitum, which means 'the Sea That Has Become Known'."}],
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1964-041A",
            "https://science.nasa.gov/mission/ranger-7/",
            "https://www.nasa.gov/history/60-years-ago-ranger-7-photographs-the-moon/",
          ],
          verified: true,
        },
        {
          id: "surveyor-3",
          riddle: "I landed on the Moon in 1967. Two years later, Apollo 12 astronauts walked over and took pieces of me home.",
          art: "surveyor",
          backdrop: "moon-earth",
          next: "Surveyor 3 and its robot sisters showed the Moon's ground was safe to land on, so astronauts could follow. About two years later, they did!",
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
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A",
            "https://science.nasa.gov/mission/surveyor-3/",
            "https://science.nasa.gov/mission/lunar-rangers-and-surveyors/",
            "https://ntrs.nasa.gov/citations/20100036597",
          ],
          verified: true,
        },
        {
          id: "apollo-11",
          riddle: "Two astronauts rode me down to the Moon in 1969, and I stayed behind as their launch pad.",
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
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
            "https://www.nasa.gov/mission/apollo-11/",
            "https://www.nasa.gov/missions/apollo/apollo-11/the-apollo-experiment-that-keeps-on-giving/",
            "https://www.nasa.gov/wp-content/uploads/static/history/alsj/ApolloFlags-Condition.html",
            "https://www.nasa.gov/wp-content/uploads/static/history/Apollo204/spacecraft.html",
          ],
          verified: true,
        },
        {
          id: "lrv",
          riddle: "Astronauts drove me across the Moon on Apollo 15, 16, and 17.",
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
            "There are three of us parked on the Moon: from Apollo 15, 16, and 17. On those trips, astronauts found the 'Genesis Rock', about 4 billion years old, and orange soil made of tiny glass beads from ancient volcanoes.",
          ],
          leftBehind: [
            "Three Lunar Roving Vehicles (Apollo 15, 16, and 17)",
            "Tire tracks across the lunar surface",
          ],
          discovery:
            "Driving farther meant finding very old rocks, which helped scientists figure out how the Moon formed.",
          quiz: {
            q: "How many Moon buggies are parked on the Moon?",
            options: ["One", "Three", "Ten"],
            answer: 1,
            explain: "Correct! Apollo 15, 16, and 17 each left one behind.",
          },
          faq: [
            {
              keys: ["fast", "speed"],
              a: "The Moon buggy could drive up to about 16 km/h (10 mph), roughly as fast as riding a bike.",
            },
            {
              keys: ["genesis", "rock", "old"],
              a: "The Genesis Rock was found on Apollo 15. It's about 4 billion years old and is a piece of the Moon's ancient crust.",
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
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C",
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-031C",
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096C",
            "https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html",
            "https://www.nasa.gov/image-article/apollo-15-catches-earth-horizon/",
            "https://science.nasa.gov/solar-system/moon/genesis-rock/",
            "https://www.nasa.gov/history/50-years-ago-apollo-17-astronauts-return-to-houston/",
          ],
          verified: true,
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
          riddle: "In 1976 I became the first NASA lander to touch down safely on Mars and send back pictures.",
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
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-075C",
            "https://science.nasa.gov/mission/viking-1/",
            "https://science.nasa.gov/mission/viking/",
            "https://www.nasa.gov/image-article/technician-checks-soil-sampler-viking-lander/",
          ],
          verified: true,
        },
        {
          id: "sojourner",
          riddle: "I was the first wheeled rover on Mars, and I was about the size of a microwave oven.",
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
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A",
            "https://science.nasa.gov/mission/mars-pathfinder/",
            "https://www.jpl.nasa.gov/missions/mars-pathfinder-sojourner-rover/",
            "https://spaceplace.nasa.gov/mars-sojourner/en/",
            "https://mars.nasa.gov/internal_resources/816/",
            "https://science.nasa.gov/resource/sojourner-barnacle-bill-yogi/",
          ],
          verified: true,
        },
        {
          id: "opportunity",
          riddle: "I was supposed to work for 90 Martian days, but I kept roving for almost 15 years.",
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
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A",
            "https://science.nasa.gov/mission/mer-opportunity/",
            "https://science.nasa.gov/resource/meridiani-planum-2/",
          ],
          verified: true,
        },
        {
          id: "ingenuity",
          riddle: "I made the first powered, controlled flight on another planet.",
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
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052A",
            "https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/",
            "https://www.jpl.nasa.gov/news/press_kits/ingenuity/landing/quick_facts/",
            "https://science.nasa.gov/photojournal/swatch-of-wright-brothers-flyer-1-attached-to-mars-helicopter/",
            "https://www.jpl.nasa.gov/news/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/",
          ],
          verified: true,
        },
        {
          id: "spirit",
          riddle: "My twin was Opportunity. I got stuck in soft sand, but my broken wheel dug up a big clue about water.",
          art: "opportunity",
          backdrop: "mars",
          next: "Spirit and Opportunity proved that rovers could last for years. NASA's next rovers, Curiosity and Perseverance, are much bigger and carry whole science labs.",
          name: "Spirit",
          kind: "Rover",
          place: "Gusev Crater, Mars",
          year: 2004,
          status: "silent",
          story: ["I'm Spirit, Opportunity's twin. I bounced down onto Mars inside giant airbags on January 4, 2004. Three weeks later, my twin landed on the other side of the planet.", "My mission was planned to last 90 Martian days. I kept going for more than six years, even after one of my front wheels stopped turning in 2006. I just drove backwards and dragged it along.", "That dragging wheel scraped up bright white soil that turned out to be almost pure silica. On Earth, soil like that forms around hot springs and steam vents. In 2009 I got stuck in soft sand, and my last message came in March 2010."],
          leftBehind: ["Spirit, stuck for good at a spot called Troy", "Its landing platform, at a site named Columbia Memorial Station", "Its parachute and back shell"],
          discovery: "The silica Spirit dug up, along with rocks it studied later, showed that Gusev Crater once had hot water. Places with hot water and rock are the kind of places where tiny life could have lived.",
          quiz: {"q": "What did Spirit's broken, dragging wheel do?", "options": ["It stopped Spirit from ever moving again", "It scraped up soil that showed Mars once had hot water", "It fell off and rolled away"], "answer": 1, "explain": "Yes! Its bad wheel became a digging tool and uncovered the silica."},
          faq: [{"keys": ["twin", "opportunity"], "a": "Spirit and Opportunity were twin rovers with the same design. They landed three weeks apart on opposite sides of Mars in January 2004."}, {"keys": ["stuck", "sand", "troy"], "a": "In 2009 Spirit's wheels sank into soft sand at a place called Troy. The team tried for months to free it, then used it as a parked science station until it went silent in 2010."}],
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-027A",
            "https://science.nasa.gov/mission/mer-spirit/",
            "https://www.jpl.nasa.gov/news/nasa-to-begin-attempts-to-free-sand-trapped-mars-rover/",
          ],
          verified: true,
        },
        {
          id: "phoenix",
          riddle: "I landed near the north pole of Mars and dug up ice hiding just under the dirt.",
          art: "phoenix",
          backdrop: "mars-north",
          next: "Phoenix showed where ice hides on Mars. Future human explorers might one day use ice like that for drinking water and to make rocket fuel.",
          name: "Phoenix Mars Lander",
          kind: "Polar lander",
          place: "Near the north pole of Mars",
          year: 2008,
          status: "silent",
          story: ["I landed near the north pole of Mars on May 25, 2008. The ground there is cracked into polygon shapes, like a giant honeycomb, because of the ice underneath.", "I dug little trenches with my robotic arm and found bright white chunks. A few days later, some of the chunks had vanished into the thin air. That proved they were water ice!", "I also watched snow falling from Martian clouds, though it disappeared before it reached the ground. Then winter came. In the cold and dark my solar panels couldn't make enough power, and my last signal came in November 2008."],
          leftBehind: ["The Phoenix lander, with a solar panel probably broken by the weight of winter ice", "The trenches it dug, with names like Dodo-Goldilocks"],
          discovery: "Phoenix proved that water ice hides just under the dirt of Mars' arctic plains. It also found a salt called perchlorate in the soil, which could be a useful resource for future human explorers.",
          quiz: {"q": "How did Phoenix know the white chunks were water ice?", "options": ["They melted into a puddle", "They slowly vanished into the air over a few days", "They tasted salty"], "answer": 1, "explain": "Exactly! In Mars' thin air, the ice turned straight into vapor and disappeared."},
          faq: [{"keys": ["ice", "water", "white"], "a": "Phoenix scraped away dirt and found white chunks just under the surface. Some vanished within a few days, which is what water ice does in Mars' thin, dry air."}, {"keys": ["snow", "cloud", "weather"], "a": "Phoenix's laser instrument spotted snow falling from clouds above it. The snow turned to vapor before it reached the ground."}],
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2007-034A",
            "https://science.nasa.gov/mission/phoenix/",
            "https://www.jpl.nasa.gov/news/nasa-mars-lander-sees-falling-snow-soil-data-suggest-liquid-past/",
            "https://www.jpl.nasa.gov/news/phoenix-mars-lander-is-silent-new-image-shows-damage/",
            "https://science.nasa.gov/photojournal/polygon-on-mars/",
            "https://www.jpl.nasa.gov/news/press_kits/phoenix-launch-presskit.pdf",
          ],
          verified: true,
        },
        {
          id: "insight",
          riddle: "I sat still on Mars and listened for marsquakes with a super-sensitive seismometer.",
          art: "insight",
          backdrop: "mars",
          next: "Scientists are still studying InSight's quake recordings to learn how rocky planets like Earth and Mars formed.",
          name: "InSight Lander",
          kind: "Science lander",
          place: "Elysium Planitia, Mars",
          year: 2018,
          status: "silent",
          story: ["Most Mars explorers study rocks. I wanted to listen to the inside of the planet. I landed on November 26, 2018, on a flat, smooth plain picked to keep me safe.", "My robotic arm set a super-sensitive seismometer on the ground. It felt more than 1,300 marsquakes, and even the shaking from space rocks crashing into Mars.", "My heat probe, nicknamed 'the mole', was supposed to dig 5 meters down, but the soil was too clumpy and it got stuck near the surface. Over four years, dust piled up on my solar panels until I ran out of power. My last message reached Earth in December 2022."],
          leftBehind: ["The InSight lander and its two round solar panels", "Its seismometer, still under its dome-shaped shield", "The heat probe, poking just under the dirt"],
          discovery: "By timing how marsquake waves traveled through the planet, scientists measured Mars' insides: its crust, its mantle, and a big core of liquid metal.",
          quiz: {"q": "What was InSight listening for?", "options": ["Martian music", "Marsquakes", "Radio messages from aliens"], "answer": 1, "explain": "Right! Its seismometer felt more than 1,300 marsquakes."},
          faq: [{"keys": ["mole", "heat", "dig", "probe"], "a": "The heat probe was supposed to hammer itself 5 meters into the ground to measure heat flowing out of Mars. The soil was too clumpy, so it could only get just below the surface."}, {"keys": ["quake", "marsquake", "seismometer", "shake"], "a": "InSight's seismometer was so sensitive it could feel tiny vibrations. It recorded more than 1,300 marsquakes."}],
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A",
            "https://science.nasa.gov/mission/insight/",
            "https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/",
            "https://www.nasa.gov/missions/insight/nasa-insight-study-provides-clearest-look-ever-at-martian-core/",
            "https://www.jpl.nasa.gov/news/press_kits/insight/landing/mission/spacecraft/",
          ],
          verified: true,
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
          riddle: "I was the first spacecraft to fly past Jupiter, and I carry a plaque with a drawing of people.",
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
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-012A",
            "https://science.nasa.gov/mission/pioneer-10/",
            "https://www.nasa.gov/history/50-years-ago-pioneer-10-launches-to-explore-jupiter/",
          ],
          verified: true,
        },
        {
          id: "voyager-1",
          riddle: "I'm the farthest machine people have ever built, and I carry a Golden Record of sounds from Earth.",
          art: "voyager",
          backdrop: "deep",
          next: 'Its twin, Voyager 2, reached interstellar space in 2018. The two Voyagers are the only spacecraft still sending messages from interstellar space.',
          name: "Voyager 1",
          kind: "Deep space probe",
          place: "Interstellar space",
          year: 1977,
          status: "still talking",
          story: [
            "I'm Voyager 1, launched in 1977. I flew past Jupiter and Saturn and sent home amazing pictures of their storms, rings, and moons.",
            "In 1990 I turned around and took a photo of Earth from about 6 billion km away. Earth looked like a tiny blue dot in a sunbeam. People call it the 'Pale Blue Dot'.",
            "In 2012 I became the first human-made object to reach interstellar space, the space between the stars. I'm still talking to Earth, though my messages take about a whole day to arrive! I carry a Golden Record with sounds and music from Earth.",
          ],
          leftBehind: [
            "Voyager 1, the farthest human-made object",
            "The Golden Record: greetings, music, and sounds of Earth",
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
              a: "The Golden Record has greetings in many languages, music from around the world, and sounds like whale songs and laughter, a message about life on Earth.",
            },
            {
              keys: ["far", "distance", "where"],
              a: "Voyager 1 is about 26 billion km (16 billion miles) away, farther than any other spacecraft. In November 2026 it reached one light-day from Earth.",
            },
            {
              keys: ["power", "still", "working", "alive"],
              a: "Voyager 1 is still sending data, but its power slowly drops each year, so engineers turn off instruments one at a time to keep it going.",
            },
          ],
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1977-084A",
            "https://science.nasa.gov/mission/voyager/voyager-1/",
            "https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/",
            "https://www.jpl.nasa.gov/news/nasas-voyager-2-probe-enters-interstellar-space/",
          ],
          verified: true,
        },
        {
          id: "new-horizons",
          riddle: "I took the first close-up pictures of Pluto, including its giant heart-shaped plain.",
          art: "newhorizons",
          backdrop: "pluto",
          next: 'New Horizons is still flying through the Kuiper Belt, sending back science about the far edge of our solar system.',
          name: "New Horizons",
          kind: "Flyby probe",
          place: "The Kuiper Belt",
          year: 2006,
          status: "still talking",
          story: [
            "I'm New Horizons, about the size of a grand piano. I launched in 2006 on a long trip to Pluto, so long that the people who built me grew nine years older before I arrived!",
            "On July 14, 2015, I zoomed past Pluto and took the first close-up pictures. Surprise: Pluto has a giant heart-shaped plain of ice!",
            "On New Year's Day 2019, I flew past Arrokoth, the most distant object any spacecraft had ever explored up close. I'm still flying through the Kuiper Belt today.",
          ],
          leftBehind: ["New Horizons, still exploring the Kuiper Belt"],
          discovery:
            "Pluto is an active world with giant glaciers of ice, not just a frozen rock.",
          quiz: {
            q: "What shape did New Horizons spot on Pluto?",
            options: ["A star", "A heart", "A smiley face"],
            answer: 1,
            explain: "Yes! Pluto's 'heart' is a huge plain of frozen ice.",
          },
          faq: [
            {
              keys: ["heart", "ice"],
              a: "Pluto's heart is a huge plain of frozen nitrogen ice. Its biggest part is a glacier called Sputnik Planitia, named after Sputnik 1, Earth's first satellite.",
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
          sources: [
            "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2006-001A",
            "https://science.nasa.gov/mission/new-horizons/",
            "https://science.nasa.gov/solar-system/kuiper-belt/arrokoth-2014-mu69/facts/",
            "https://www.nasa.gov/news-release/nasa-sets-sights-on-first-pluto-mission/",
          ],
          verified: true,
        },
      ],
    },

    // Placeholder wings for future machines (not used in the maze yet).
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
   * HIDDEN TREASURES: small things astronauts left behind. They only appear in
   * secret rooms, so each playthrough may reveal different ones.
   */
  treasures: [
    {
      "id": "golf-balls",
      "treasure": true,
      "art": "golf",
      "backdrop": "moon-earth",
      "name": "Apollo 14 golf balls",
      "kind": "Hidden treasure",
      "place": "Fra Mauro, Moon",
      "year": 1971,
      "status": "parked",
      "story": [
        "On February 6, 1971, astronaut Alan Shepard had a surprise. He had snuck the head of a golf club onto Apollo 14 and clipped it onto a tool handle meant for scooping up moon dust.",
        "In his stiff spacesuit he could only swing with one hand. He joked that the second ball flew 'miles and miles'. NASA's historians say it really went about 40 yards. Both balls are still up there!"
      ],
      "leftBehind": [
        "Two golf balls near the Apollo 14 landing site"
      ],
      "sources": [
        "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-008C",
        "https://www.nasa.gov/history/50-years-ago-apollo-14-lands-at-fra-mauro/",
        "https://www.nasa.gov/mission/apollo-14/"
      ],
      "verified": true
    },
    {
      "id": "family-photo",
      "treasure": true,
      "art": "photo",
      "backdrop": "moon-earth",
      "name": "Charlie Duke's family photo",
      "kind": "Hidden treasure",
      "place": "Descartes Highlands, Moon",
      "year": 1972,
      "status": "parked",
      "story": [
        "In April 1972, Apollo 16 astronaut Charlie Duke carried a photo of his family all the way to the Moon.",
        "He left it lying on the ground. Its message says this is the family of Astronaut Duke from Planet Earth, and that it landed on the Moon in April 1972. Nobody knows how it looks after so many years of strong sunlight."
      ],
      "leftBehind": [
        "A family photo, lying in the dust at the Apollo 16 site"
      ],
      "sources": [
        "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-031C",
        "https://www.nasa.gov/former-astronaut-charles-m-duke-jr/",
        "https://www.nasa.gov/history/50-years-ago-apollo-16-on-the-moon-at-descartes/"
      ],
      "verified": true
    },
    {
      "id": "goodwill-disc",
      "treasure": true,
      "art": "disc",
      "backdrop": "moon-earth",
      "name": "Apollo 11 goodwill disc",
      "kind": "Hidden treasure",
      "place": "Sea of Tranquility, Moon",
      "year": 1969,
      "status": "parked",
      "story": [
        "Apollo 11 left a small silicon disc, about the size of a half-dollar coin, at Tranquility Base. Its shiny surface holds messages from the leaders of 73 countries.",
        "To make them fit, each message was shrunk until it was smaller than the head of a pin. You'd need a microscope to read them!"
      ],
      "leftBehind": [
        "A silicon disc with goodwill messages from 73 countries"
      ],
      "sources": [
        "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
        "https://www.nasa.gov/history/55-years-ago-one-month-until-the-moon-landing/",
        "https://spinoff.nasa.gov/Spinoff2012/it_6.html"
      ],
      "verified": true
    }
  ],

  /* HALLS: connecting rooms. Each has a true space fact the robot reads aloud. */
  halls: [
    {
      "name": "Hall of Launches",
      "deco": "rocket",
      "wall": "#34405a",
      "fact": "The Saturn V rocket that carried Apollo astronauts stood about 110 meters tall. That's taller than the Statue of Liberty!"
    },
    {
      "name": "Gallery of Orbits",
      "deco": "planets",
      "wall": "#2b2d4a",
      "fact": "Sunlight takes about 8 minutes to reach Earth. A radio message to Voyager 1 takes about a whole day."
    },
    {
      "name": "Hall of Footprints",
      "deco": "moon",
      "wall": "#3b3f48",
      "fact": "Twelve astronauts walked on the Moon, all between 1969 and 1972. With no wind up there, their bootprints could last for millions of years."
    },
    {
      "name": "Red Dust Corridor",
      "deco": "mars",
      "wall": "#5a3428",
      "fact": "A day on Mars, called a sol, lasts about 24 hours and 40 minutes. Mars is about half as wide as Earth."
    },
    {
      "name": "Signal Room",
      "deco": "dish",
      "wall": "#24384a",
      "fact": "NASA talks to faraway spacecraft through giant radio dishes in California, Spain, and Australia. Together they're called the Deep Space Network."
    },
    {
      "name": "Starlight Lounge",
      "deco": "planets",
      "wall": "#2f2a48",
      "fact": "The Moon is about 384,000 km away. Driving there at highway speed would take around half a year."
    },
    {
      "name": "Hall of Rovers",
      "deco": "mars",
      "wall": "#4a3a30",
      "fact": "Every NASA Mars rover so far was named by a student who won an essay contest."
    },
    {
      "name": "Clean Room",
      "deco": "rocket",
      "wall": "#3a4a52",
      "fact": "Spacecraft are built in super-clean rooms. Engineers wear 'bunny suits' so they don't carry Earth germs to other worlds."
    }
  ],

  /* THE ADVENTURE STORY */
  adventure: {
    pieceName: "signal piece",
    intro: [
      "Field trip day! Your class has just stepped into the Reach for the Stars Museum when... BZZZT. The lights flicker, the floor rumbles, and every door in the building swaps places.",
      "\"It happened again,\" beeps ROBOT. \"The museum rearranged itself! And the Homecoming Signal broke into PIECES pieces.\"",
      "Every year the museum beams the Homecoming Signal into space, to remember the machines NASA left behind on the Moon, on Mars, and beyond. Now each piece is hiding with one of those machines.",
      "Find the machines, hear their stories, and carry every piece to Mission Control. But careful: you never know what's behind a door until you open it.",
    ],
  },

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
