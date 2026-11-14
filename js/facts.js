/*
 * QUICK FACTS for the chat's offline guide
 * ------------------------------------------------------------
 * Short answers to the questions students ask most: who built it, when it
 * launched and landed, how long it worked, how big and heavy it is, what
 * powers it, and how fast it goes.
 *
 * DRAFT: written from well-known NASA mission history. Check every line
 * against NASA's official data before submission, then set verified: true.
 */
window.FACTS = {
  "ranger-7": {
    builtBy: "NASA's Jet Propulsion Laboratory (JPL) in California built and ran Ranger 7.",
    launched: "Ranger 7 launched on July 28, 1964, and crashed into the Moon on purpose on July 31, 1964.",
    lasted: "Its whole trip took about 68 hours. In its last 17 minutes it sent back more than 4,300 close-up photos.",
    mass: "It weighed about 366 kilograms, roughly as much as a grand piano.",
    power: "Solar panels and batteries powered it.",
  },
  "surveyor-3": {
    builtBy: "Hughes Aircraft Company built Surveyor 3, and NASA's Jet Propulsion Laboratory (JPL) managed the mission.",
    launched: "Surveyor 3 launched on April 17, 1967, and landed on the Moon on April 20, 1967.",
    lasted: "It worked for about two weeks on the Moon, until the long lunar night.",
    mass: "It weighed about 300 kilograms after landing.",
    power: "A solar panel and batteries powered it.",
    special: "It was the first Surveyor to carry a little scoop on a robot arm, so it could dig trenches in the Moon's soil.",
  },
  "apollo-11": {
    builtBy: "Grumman Aircraft Engineering built the lunar module, Eagle, for NASA.",
    launched: "Apollo 11 launched on July 16, 1969. Eagle landed on the Moon on July 20, 1969.",
    lasted: "Neil Armstrong and Buzz Aldrin spent about 21 and a half hours on the Moon. The descent stage stayed behind as a launch pad.",
    size: "The whole lunar module was about 7 meters tall, as tall as a two-story house.",
    mass: "Fully fueled, the lunar module weighed about 15,000 kilograms.",
    power: "Batteries powered Eagle.",
  },
  lrv: {
    builtBy: "Boeing built the Lunar Roving Vehicle for NASA, with the company Delco as a major partner.",
    launched: "Rovers rode to the Moon on Apollo 15 (1971), Apollo 16 (1972), and Apollo 17 (1972).",
    lasted: "Each rover was driven for about three days of moonwalks.",
    size: "It was about 3 meters long and folded up flat to fit on the side of the lunar module.",
    mass: "It weighed about 210 kilograms on Earth, but only about 35 kilograms worth of weight on the Moon.",
    power: "Two batteries powered it, with an electric motor in each wheel.",
    speed: "Its top speed was about 16 kilometers per hour (10 mph), about as fast as a bicycle.",
  },
  "viking-1": {
    builtBy: "Martin Marietta built the Viking 1 lander. NASA's Langley Research Center led the mission and JPL built the orbiter.",
    launched: "Viking 1 launched on August 20, 1975, and landed on Mars on July 20, 1976.",
    lasted: "It worked for more than six years, until November 1982.",
    mass: "The lander weighed about 600 kilograms.",
    power: "Two small nuclear power generators (RTGs) powered it, so it could work through the Martian winter.",
    special: "It was the first spacecraft to land safely on Mars and do a full mission there.",
  },
  sojourner: {
    builtBy: "NASA's Jet Propulsion Laboratory (JPL) built Sojourner.",
    launched: "Sojourner launched on December 4, 1996, and landed on Mars on July 4, 1997, with the Mars Pathfinder lander.",
    lasted: "It was planned to work for 7 days, and it kept going for about 83 days.",
    size: "It was about 65 centimeters long, about the size of a microwave oven.",
    mass: "It weighed about 10.6 kilograms.",
    power: "A small solar panel on its back powered it.",
    speed: "Its top speed was about 1 centimeter per second.",
  },
  opportunity: {
    builtBy: "NASA's Jet Propulsion Laboratory (JPL) built Opportunity.",
    launched: "Opportunity launched on July 7, 2003, and landed on Mars on January 25, 2004.",
    lasted: "It was planned to work for 90 Martian days, and it lasted almost 15 years, until a huge dust storm in 2018.",
    size: "It was about the size of a golf cart, with its cameras about 1.5 meters off the ground.",
    mass: "It weighed about 185 kilograms.",
    power: "Solar panels powered it. Wind sometimes blew the dust off them, which helped it last so long.",
    speed: "It drove about 45 kilometers in total, a marathon on Mars.",
  },
  ingenuity: {
    builtBy: "NASA's Jet Propulsion Laboratory (JPL) built Ingenuity, with help from the company AeroVironment.",
    launched: "Ingenuity launched with the Perseverance rover on July 30, 2020, and landed on Mars on February 18, 2021.",
    lasted: "It was planned for 5 test flights and flew 72 times, until a damaged rotor blade ended its flights in January 2024.",
    size: "Its rotor blades were about 1.2 meters from tip to tip.",
    mass: "It weighed about 1.8 kilograms, about as much as a bag of flour.",
    power: "A small solar panel charged its batteries.",
    special: "It made the first powered, controlled flight on another planet, on April 19, 2021.",
  },
  spirit: {
    builtBy: "NASA's Jet Propulsion Laboratory (JPL) built Spirit.",
    launched: "Spirit launched on June 10, 2003, and landed on Mars on January 4, 2004.",
    lasted: "It was planned to work for 90 Martian days and lasted more than six years, until 2010.",
    size: "It was about the size of a golf cart, with its cameras about 1.5 meters off the ground.",
    mass: "It weighed about 185 kilograms.",
    power: "Solar panels powered it.",
    speed: "It drove about 7.7 kilometers in total.",
  },
  phoenix: {
    builtBy: "Lockheed Martin built Phoenix. The University of Arizona led the science team, and NASA's Jet Propulsion Laboratory (JPL) managed the mission.",
    launched: "Phoenix launched on August 4, 2007, and landed near Mars's north pole on May 25, 2008.",
    lasted: "It worked for about five months, until the Martian winter cut its power in November 2008.",
    mass: "It weighed about 350 kilograms.",
    power: "Two round solar panels powered it.",
  },
  insight: {
    builtBy: "Lockheed Martin built InSight, and NASA's Jet Propulsion Laboratory (JPL) managed the mission. France built its seismometer and Germany built its heat probe.",
    launched: "InSight launched on May 5, 2018, and landed on Mars on November 26, 2018.",
    lasted: "It listened for marsquakes for four years, until dust covered its solar panels in December 2022.",
    mass: "It weighed about 360 kilograms.",
    power: "Two round solar panels powered it.",
  },
  "pioneer-10": {
    builtBy: "TRW built Pioneer 10, and NASA's Ames Research Center ran the mission.",
    launched: "Pioneer 10 launched on March 2, 1972, and flew past Jupiter on December 4, 1973.",
    lasted: "It kept talking to Earth for more than 30 years. Its last faint signal came in January 2003.",
    mass: "It weighed about 258 kilograms.",
    power: "Small nuclear power generators (RTGs) powered it, because sunlight is too weak that far away.",
  },
  "voyager-1": {
    builtBy: "NASA's Jet Propulsion Laboratory (JPL) built Voyager 1 and still runs it.",
    launched: "Voyager 1 launched on September 5, 1977. It flew past Jupiter in 1979 and Saturn in 1980.",
    lasted: "It has been flying for more than 49 years, and in 2012 it became the first spacecraft to reach interstellar space.",
    mass: "It weighed about 720 kilograms at launch.",
    power: "Nuclear power generators (RTGs) power it. Their power slowly fades, so engineers turn things off to save energy.",
    speed: "It travels about 17 kilometers every second.",
  },
  "new-horizons": {
    builtBy: "The Johns Hopkins Applied Physics Laboratory built New Horizons, and the Southwest Research Institute leads its science team.",
    launched: "New Horizons launched on January 19, 2006, and flew past Pluto on July 14, 2015.",
    lasted: "It is still flying and working. In 2019 it flew past Arrokoth, the most distant world ever explored up close.",
    size: "It is about the size of a grand piano.",
    mass: "It weighed about 465 kilograms at launch, including its fuel.",
    power: "A nuclear power generator (an RTG) powers it.",
    speed: "It left Earth faster than any spacecraft before it, about 16 kilometers every second.",
  },
  "golf-balls": {
    builtBy: "Astronaut Alan Shepard brought them, plus a six-iron club head that fit on a tool for scooping up Moon samples.",
    launched: "Apollo 14 launched on January 31, 1971, and Shepard hit the golf balls on February 6, 1971.",
  },
  "family-photo": {
    builtBy: "Astronaut Charlie Duke left the photo of his family.",
    launched: "Apollo 16 launched on April 16, 1972, and landed on the Moon on April 21, 1972.",
  },
  "goodwill-disc": {
    builtBy: "The disc was made by Sprague Electric, using the same method used to make computer chips, so the messages are tiny.",
    launched: "Apollo 11 astronauts left it on the Moon on July 21, 1969.",
  },
};
