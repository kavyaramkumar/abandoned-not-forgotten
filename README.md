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

## Our concept: The Silent Explorers Museum

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

Across 600 generated museums, the shortest possible route averages 6 doors on Easy, 8 on Medium and 13 on Hard. Every generated museum is checked to make sure you can always reach every room and finish.

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
2. **Still there today:** what is physically left on the Moon, on Mars or in space
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
