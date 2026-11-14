# Reach for the Stars · NASA Space Apps Challenge 2026

**Challenge:** [Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/)

**Team:** Reach for the Stars

**Difficulty:** Intermediate, Beginner/Youth
**Subjects:** Astrophysics; Planets & Moons; Space Exploration

## The challenge

Since the 1960s, NASA has left hardware across the solar system: on the Moon, on Mars, and in deep space. This includes rovers and instruments that finished their science missions, as well as probes that are still traveling away from Earth. The challenge is to tell the story of some or all of this equipment in a way that introduces school-age space enthusiasts to the hardware and to the science it made possible.

### Objectives

- Create an engaging, story-driven educational tool or narrative for school-age and casual space enthusiasts.
- Explain what the artifacts are, why they were sent into space, and what they discovered (or are still discovering).
- Any format is welcome: an interactive web experience, a game, a digital children's book, an animated video, a 3D timeline, or something else.

### Things to consider

- A strong narrative focus: show how missions operated instead of just listing facts.
- Connect the engineering of the hardware to the science it produced.
- **Accuracy is important.**
- Which age group is the story for?
- How accessible is the format?
- Focus on specific missions, or tell a broader NASA story?
- Whose perspective(s) does the story highlight?

## Our concept: The Reach for the Stars Museum

It's a field trip you play, and the museum has a secret: **its doors never lead to the same place twice.**

You pick your explorer (a boy or a girl, with skin and shirt colors) and a difficulty. As your class walks in, the lights flicker and every door in the building swaps places. The museum's **Homecoming Signal**, which it beams into space every year to remember the machines NASA left behind, has broken into pieces. Each piece is now hiding with one of those machines. Find the machines, hear their stories, and carry every piece to the sealed **Mission Control** room.

### A maze you never see

There is no map. You only ever see the room you're standing in, in 3D, and its doors. Each door has a colored symbol (▲ ● ■ ★ ◆ ✚) and a "?" sign until you've been through it. Behind a door could be:

- **A machine's room:** a real piece of NASA hardware in a glass case, under a painting of where it is now. The machine tells its own story. Some are holding a signal piece.
- **A hall** with a model (a rocket, an orrery, a radio dish) and a true space fact.
- **A riddle lock:** "Which machine am I?" Pick the right machine to open the door.
- **A one-way airlock** that seals behind you, so you have to find another way back.
- **A dead end**, or a **secret room** behind an odd-looking wall. Secret rooms hold small treasures astronauts left behind (Alan Shepard's golf balls, Charlie Duke's family photo, the Apollo 11 goodwill disc) or an **explorer's note**: a route written by another student earlier that day.
- **Mission Control**, sealed until you have every piece.

### Different every time

Each new adventure generates a fresh hidden network from a random seed (shown as the "layout" number):

- The connections between rooms change.
- The door symbols and door positions change.
- Which machines appear, and which ones hold the pieces, change. There are 14 machines plus 3 hidden treasures, and each game uses only some of them.
- Where Mission Control is, where the riddle locks and airlocks are, and whether a secret room holds a note or a treasure, all change.

The story always keeps the same shape: the arrival and the mystery, exploring and collecting pieces, then Mission Control and the ending. The Journal tracks every machine you've met across all your adventures, so replaying is how you find them all.

### Three difficulty levels change the navigation, not just the questions

| | Easy | Medium | Hard |
|---|---|---|---|
| Rooms | 8 | 13 | 18 |
| Doors per room | up to 3 | up to 3 (+1 secret) | up to 4 (+1 secret) |
| Signal pieces | 3 | 4 | 5 |
| Extra loops between rooms | 1 | 3 | 5 |
| One-way airlocks | 0 | 1 | 3 |
| Dead ends | none | none | yes |
| Secret rooms | 0 | 1 | 2 (always one note) |
| Robot's scanner | always points the way | 3 scans | none |
| Door signs after you visit | room name | room name | just a ✓ (remember it yourself) |
| Riddle locks | names + hint | names | pictures only |
| Gold route goal | none | about 2.4× the shortest | about 2× the shortest |

Across 600 generated museums, the shortest possible route averages 6 doors on Easy, 8 on Medium, and 13 on Hard. Every generated museum is checked to make sure you can always reach every room and finish.

### How the maze represents P vs NP (for judges and teachers)

The maze *is* the computer science; there's no separate lesson. The goal, "start in the Atrium, pass through every room that holds a signal piece, and end in Mission Control", is a **"visit all these places" route problem**. It's in the same family as the traveling-salesperson and Hamiltonian-path problems, which are NP-complete on general networks.

- **Finding a route is the hard part.** Kids explore doors they can't see behind, hit dead ends and airlocks, and backtrack. Even the computer, which *can* see the whole network, finds the provably shortest route by trying every order of the pieces (k! orders: 6 on Easy, 24 on Medium, 120 on Hard). That number explodes as the museum grows. With 20 pieces it would be more than 2 quintillion orders. Clever algorithms do better than trying every order, but no known method stays fast as the museum grows.
- **Checking a route is the easy part.** At Mission Control, the robot "verifies the flight plan": it walks the list of doors you took once, confirms each door really connects, that every piece room is on it, and that it ends in Mission Control. That takes time proportional to the route's length (polynomial time). The game measures and shows it: usually less than a millisecond.
- **Explorer's notes are certificates.** A note is a proposed route ("▲ then ● leads to a piece"). Kids check it by simply following it, and each step gets ticked off. Checking someone's answer is quick, even when finding it yourself takes exploring.

**What we're careful not to claim.** Just finding a way to *one* room is easy for a computer (breadth-first search does it in polynomial time). That's why the goal requires *every* piece room. Our museums are small enough to solve by brute force; the point is how the work grows. And the "gold route" is a decision question ("is there a route of at most N doors?"). That is what's quick to check. Proving a route is the *shortest* is a different question.

In the game, the robot says it in one line at the end: *finding took exploring, checking took one quick look, and whether every quick-to-check puzzle is also quick to solve is the P vs NP question.*

### Whose perspective

- **The machines speak for themselves**, in the first person: why they were sent, what they did, how their mission ended.
- **A kid on a field trip is the main character**, and **the robot guide** asks the questions kids would ask.
- **The bigger NASA story:** every placard has a "What came next" tab (for example, Ranger → Surveyor → Apollo → Artemis), and the ending, Voyager 1's *Pale Blue Dot* photo, ties every machine back to the planet that sent it.

### Each placard

1. **In its own words:** the machine's first-person story
2. **Still there today:** what is physically left on the Moon, on Mars, or in space
3. **What we learned:** the science it made possible
4. **What came next:** how it led to later missions
5. **Quick quiz**
6. **Read to me** (text-to-speech) and **Ask the placard** (the AI chatbot)

Stars come from stories, quizzes, questions, riddles, secret rooms, checked notes, finishing, and gold routes. They carry over between adventures and buy robot upgrades in the **Robot Bay**.

### Status: skeleton draft

- Working: everything above. The 3D rooms, doors, transitions, riddle locks, airlocks, secret rooms, notes, scanner, Mission Control route check, the Pale Blue Dot ending, the journal, saved progress (you can continue an adventure), and an offline Q&A placard.
- **All exhibit facts are drafts.** Check every one against the official challenge resources and fill in `sources` / `verified` in [`js/data.js`](js/data.js).
- The machines in the cases are simplified SVG drawings shown as flat cutouts. NASA's free 3D models could replace them later. Most NASA material is public domain, but check each credit line.
- The AI placard runs in offline mode (canned answers) until the server below is set up.

## Run it

No build step is needed, and nothing has to be downloaded at runtime except the Google Fonts. Either open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8123
```

Then open http://localhost:8123. To reset your progress, type `resetMuseum()` in the browser console. To peek at today's hidden network while testing, type `Museum.debug()`.

### Optional: live AI placard

```bash
cd server && npm install
export ANTHROPIC_API_KEY=...   # never commit keys
npm start
```

Then set `askEndpoint: "http://localhost:8787/ask"` in [`js/ai.js`](js/ai.js).

## Project layout

| File | What it is |
|---|---|
| `index.html` | Page structure: HUD, views, dialogs |
| `css/styles.css` | All styling (theme tokens at the top) |
| `js/data.js` | **All content**: machines, stories, riddles, "what came next", quizzes, hidden treasures, hall facts, the adventure story, shop items. Edit here! |
| `js/maze.js` | The hidden door network: random generation per difficulty, the scanner hint, the brute-force shortest route, and the route checker |
| `js/app.js` | The game: builds each 3D room and its doors, walking, door transitions, riddle locks, secret rooms, notes, Mission Control finale, placards, stars, Robot Bay |
| `js/models.js` | 3D building blocks: the kid (boy or girl), the robot (with every hat and gear), wall signs, floor textures |
| `js/art.js` | Hand-drawn SVG: spacecraft, dioramas, the intro kid, the bus |
| `js/robot.js` | Draws the robot as SVG for the Robot Bay preview |
| `js/vendor/three.min.js` | three.js r149 (MIT), included so the museum works offline |
| `js/ai.js` | "Ask the exhibit" placard (offline answers + optional AI) |
| `server/` | Optional Node backend for the AI placard |

## Ideas to add next

- **Postcards:** kids "send" a postcard from each exhibit and collect them all.
- **Audio narration:** a different voice for each machine.
- **Real 3D spacecraft:** swap the flat cutouts for NASA's free 3D models.
- **First-person mode:** see the museum through the kid's eyes.
- **Teacher mode:** a printable worksheet for each wing.
- **More machines:** Venus and Mercury, the giant planets (Galileo, Cassini, Juno).
- **Share a layout:** type in a friend's layout number to explore the same museum, then compare routes.

## Team

_To be added._

## Resources

See the challenge's Resources tab on the Space Apps site.

## Choices on the welcome screen

- **Where the museum is:** Earth (the class arrives by school bus), the Moon (glass dome, black sky with Earth in it, low gravity so the explorer bounces) or Mars (dusty butterscotch sky, red ground, a little bounce). For the Moon and Mars, the class lands in a field-trip rocket, and the explorer wears a spacesuit and glass helmet inside, trimmed in their shirt color.
- **Your explorer:** 8 hairstyles, shown as pictures with no names, 8 hair colors, 8 skin tones, 8 shirt colors, 6 pants colors, and glasses or a cap. No "boy" or "girl" labels.
- **Learning mode:** no puzzle. A fixed tour through every room with NEXT and BACK doors (Atrium, Moon machines, Mars machines, deep space machines, the secret treasures, then Mission Control). Built by `Maze.tour()` in `js/maze.js`.
- **Game mode:** the door maze, with Easy, Medium, and Hard.
- **Language:** 20 languages, English by default. Game text lives in `js/i18n/<code>.js`; `en.js` is the master list and anything missing falls back to English. The machines' own stories (in `js/data.js`) are still English only, and the placard says so when another language is picked. The translations were machine-written and should be checked by native speakers before launch.

Languages: English, Chinese (Simplified), Hindi, Spanish, Arabic, French, Bengali, Portuguese, Russian, Urdu, Indonesian, German, Japanese, Swahili, Marathi, Telugu, Turkish, Tamil, Vietnamese, Korean.

## Inside the museum

- **Look:** glossy high-tech floor panels with glowing seams and paneled walls with light strips, colored by wing (Moon blue, Mars orange, deep space purple). Stars twinkle near the ceiling of every room.
- **Lobby:** a rotating model of the solar system (all 8 planets, Saturn's rings, the Moon circling Earth). Click it to learn about the three wings.
- **Real NASA photos:** every machine's frame shows a public-domain NASA photo of that mission (`assets/photos/`, listed with credits in `assets/photos/CREDITS.md` and `js/photos.js`). The info card shows the photo with its caption and credit.
- **How to play:** a page (top bar, and automatically the first time in each mode) with the mission, what the museum is about, the Moon, Mars, and Deep Space wings with their machines, and the rules.
- **Chat:** an "Ask Echo" button in the bottom-right corner, a chat kiosk next to every machine and one in the lobby, and a "Chat with this machine" button on every info card. Offline it answers from `js/data.js`. With the AI server running, answers come from Claude searching **only NASA websites** (nasa.gov and its subdomains), and each answer lists the NASA pages it used.
- **Moon and Mars trips** start with a short movie (`js/cutscene.js`): the class boards a rocket on Earth, launches, flies through space, and lands, then walks to the museum in spacesuits.

## AI chat server (answers from NASA websites only)

`server/ask_server.py` is a small Python server. It sends a student's question to Claude (`claude-opus-5-5`) with a web search tool that can only search nasa.gov and its subdomains, and returns the answer plus links to the NASA pages it used. The API key stays on the server and never reaches the website.

```bash
cd server
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env    # paste your Anthropic API key into .env (it's git-ignored)
.venv/bin/python ask_server.py
```

When the museum is opened from `localhost`, `js/ai.js` uses `http://localhost:8787/ask` automatically. On the live GitHub Pages site the chat stays in offline mode until the server is hosted somewhere public and `CONFIG.askEndpoint` points at it (set `ALLOWED_ORIGIN` in `.env` to the site's address). The older Node version, `server/ask-server.mjs`, still works if you have Node.

## Settings and accessibility

The gear button (welcome screen and top bar) opens a settings panel. Everything is saved on the device and works in all 20 languages.

- **Text size:** Normal, Large, Extra large (menus, dialogs, and the robot's speech bubble scale up; messages stay on screen longer).
- **High contrast:** black and white panels, thicker outlines, bright yellow focus rings.
- **Reduce motion:** no bouncing, no twinkling or pulsing, no CSS animation, and a shorter, calmer rocket movie. Turns on by itself if the device asks for reduced motion.
- **Easy-read font:** Lexend, with extra space between letters, words, and lines.
- **Read the robot's words aloud:** uses the device's own voices, in the chosen language when one is installed.
- **Keyboard play:** arrow keys or WASD to walk, N / P to walk to the next or previous door or machine, Enter to open or look closer, Q / E to turn the camera, Esc to close a window. Every button shows a clear focus ring.
- Door symbols are different shapes as well as colors, so color-blind players can tell them apart.

## Logos and branding

- The **NASA insignia** appears only where it belongs on real hardware: the spacesuit and the rocket (in the welcome scene and the launch movie). NASA's insignia normally needs NASA's permission to use; to swap it for our team patch everywhere, set `SHOW_NASA = false` in `js/art.js`.
- The **team patch** (Reach for the Stars) is the browser-tab icon.
- The welcome screen credits NASA for the photos and mission facts.

## Quick facts for the offline chat

`js/facts.js` gives every machine short answers to the questions students ask most: who built it, when it launched and landed, how long it worked, how big and heavy it is, what powered it, and how fast it went. The offline guide (`js/ai.js`) recognizes those questions, and the chat offers "Who built it?", "When did it launch?", and "How long did it work?" as buttons. These facts are drafts written from NASA mission history and should be checked against NASA's official data.

## Learning more

- **Fact file:** every machine's card has a Fact file tab (who built it, launch and landing, how long it worked, size, weight, power, speed, and its famous first), so everything the chat can answer is also on the card. Facts live in `js/facts.js`.
- **Space words:** words like Kuiper Belt, retroreflector, perchlorate, and RTG are underlined on the cards and in chat answers. Click one for a short definition, or ask the robot for more. Definitions live in `js/learn.js` (`GLOSSARY`).
- **Learn more page** (top bar): Space words A to Z, plus three sections that connect the missions to bigger topics: **Inventions and patents** (intellectual property: patents, copyright, trademarks, trade secrets, NASA spinoffs, and why NASA photos are public domain), **Space law** (the Outer Space Treaty, who owns things left on the Moon, protecting the Apollo sites), and **Space and health** (what space does to the body, the Twins Study, and medical spinoffs). Content lives in `js/learn.js` (`LEARN`) and is a draft to check against official sources.

## NASA data (official challenge resources)

- **Verified against NASA's NSSDCA** (https://nssdc.gsfc.nasa.gov/), the challenge's official catalog, plus NASA mission pages. Every exhibit has `sources` (NSSDCA first) and `verified: true`. About 30 claims were corrected in the check.
- **`js/nasa-data.js`:** each machine's NSSDCA catalog ID, launch, arrival, last contact, mass, resting place (with coordinates where NASA gives them), and status. The Fact file tab shows where it rests now, its last contact (as a date in the player's language), and a link to its NSSDCA page, with a Sources line on each card.
- **20 machines:** the challenge's resource list added ALSEP (Moon), Viking 2 (Mars), and Pioneer 11, Dawn, NEAR Shoemaker, and Kepler (deep space). They live in `js/data-extra.js`, with NASA photos in `assets/photos/`.
- **Learn more** sections (patents, space law, health) were checked against NASA Spinoff, NASA Technology Transfer, USPTO, the FCC, congress.gov, and UNOOSA, with sources listed on each section.

## The chat's knowledge

- **Offline:** `js/ai.js` builds a searchable knowledge base from every story, fact file, NASA catalog entry, space word, Learn more section, and hall fact, and answers with the best-matching notes. It understands everyday wording ("what killed Opportunity?", "who owns the landers on the Moon?").
- **With the AI server:** each question is sent with the 8 best-matching museum notes, and the server can also search NASA websites for anything the museum doesn't cover.
- **Two ways to chat:** a small chat docked in the corner (the "Ask" button) that stays open while you explore, and the full chat from any machine's card.

## Seen from orbit and real NASA sounds

- **Seen from orbit:** 17 machines and treasures have a card tab with a then-and-now slider: the mission photo next to a NASA picture taken from orbit years later (Lunar Reconnaissance Orbiter for the Moon, Mars Reconnaissance Orbiter's HiRISE for Mars, NEAR's own camera for Eros), mostly labeled by NASA. Images in `assets/orbit/`, listed in `js/orbit.js`.
- **Listen:** real NASA audio for InSight (a marsquake made audible), Voyager 1 (sounds of interstellar space), Ingenuity (Perseverance's microphone recording of it flying), Apollo 11 ("one small step"), and Kepler (a star's light turned into sound). Files in `assets/sounds/`, listed in `js/sounds.js`.
- Credits for every photo, orbital image, and sound are in `assets/photos/CREDITS.md`.

## Reading and accessibility, round 2

- **Read to me** is in the header of every window that shows text (story card, How to play, Learn more, machine cards, riddles, Mission Control) and on every chat answer. Parts marked as English (the machine stories) are read with an English voice; everything else in the player's language when the device has that voice. Press again to stop.
- **Shorter text:** long pages show the key part first. Learn more sections and the "What is this museum?" part of How to play fold open on click, and the opening story shows its first lines with a Read more button.
- **Fact file** also shows each machine's official **status today** from NASA's NSSDCA catalog. Every machine and treasure has an NSSDCA ID, resting place, and status.

## How the chat thinks (three layers)

1. **Quick facts** (`js/facts.js`): instant answers to who built it, when, how long, size, power, and speed.
2. **AI search on the device:** a small open-source language model (all-MiniLM-L6-v2 via transformers.js, about 23 MB, downloaded once and cached) turns every note and each question into meaning vectors, so questions match by meaning, not just keywords ("can a country claim the Moon?" finds the Outer Space Treaty). It runs entirely in the browser: no key, no server, and questions never leave the device. If it can't load, keyword search (BM25-style) answers instead.
3. **Claude, NASA sources only** (`server/`): when the Python server is running (locally, or hosted for the live site), Claude answers in full sentences in the student's language, searching the museum's knowledge base and NASA websites. See `server/README.md`.
