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

It's a field trip you play. A school bus pulls up to the museum, you pick your character, and then **you walk through the museum yourself**. Click the floor (or use the arrow keys) to walk, and your robot guide follows along. The museum is one continuous building: Lobby → Moon Wing → Mars Wing → Deep Space Wing → Field Trip Journal.

- **Wings are places NASA has gone.** Each wing opens with a **big question** on the wall (for example, "Was Mars ever a place where life could exist?"), and its exhibits answer it.
- **Exhibits are real hardware** that is still out there: a framed diorama of where it is now, plus a model in a display case. Walk up and click to read its placard.
- **Everything is open to explore.** Nothing is locked.
- **Stars** come from hearing a machine's story (+1), the quiz (+2), and asking the placard a question (+1). Kids spend them in the **Robot Bay** on paint, eye lights, hats and gear.
- **Field Trip Journal** at the end collects a stamp for every machine you met.

### The story we're telling (and whose perspective)

- **The machines speak for themselves.** Each exhibit's story is told in the first person by the hardware: why it was sent, what it did, and how its mission ended.
- **A kid on a field trip is the main character**, so the audience sees the museum through their own eyes.
- **The robot guide asks the questions kids would ask** and reads out each wing's big question.
- **One connected NASA story, not a list of facts.** The lobby timeline (1967 to 2021) shows how each mission led to the next, and every placard has a **"What came next"** section. For example: Surveyor proved the ground was safe → Apollo landed → Artemis plans to return.

### Each placard

1. **In its own words:** the machine's first-person story
2. **Still there today:** what is physically left on the Moon, on Mars or in space
3. **What we learned:** the science it made possible
4. **What came next:** how it led to later missions
5. **Quick quiz**
6. **Read to me** (text-to-speech) and **Ask the placard** (the AI chatbot)

### Status: skeleton draft

- Working: the intro scene, walking, the camera and minimap, 10 exhibits across 3 wings, the placards, stars, the Robot Bay, the journal, saved progress, and an offline Q&A placard.
- The machine drawings are simplified SVG illustrations. Real NASA images could replace them later. Most NASA imagery is public domain, but check each image's credit line.
- **All exhibit facts are drafts.** Check every one against the official challenge resources and fill in `sources` / `verified` in [`js/data.js`](js/data.js).
- The AI placard runs in offline mode (canned answers) until the server below is set up.

## Run it

No build step is needed. Either open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8123
```

Then open http://localhost:8123. To reset your progress, type `resetMuseum()` in the browser console.

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
| `js/data.js` | **All content**: wings, big questions, exhibits, stories, "what came next", quizzes, shop items. Edit here! |
| `js/app.js` | The walkable museum: world building, walking, camera, placards, stars, Robot Bay |
| `js/art.js` | Hand-drawn SVG: spacecraft, dioramas, the player, the bus |
| `js/robot.js` | Draws the customizable robot (SVG) |
| `js/ai.js` | "Ask the exhibit" placard (offline answers + optional AI) |
| `server/` | Optional Node backend for the AI placard |

## Ideas to add next

- A **"Where is it now?" map**: a clickable Moon and Mars map that shows each exhibit's real landing site.
- **Mission timeline hall:** walk through 1967 to today.
- **Postcards:** kids "send" a postcard from each exhibit and collect them all.
- **Audio narration:** a different voice for each machine.
- **Teacher mode:** a printable worksheet for each wing.
- **More wings:** Venus and Mercury, the giant planets (Galileo, Cassini, Juno).

## Team

_To be added._

## Resources

See the challenge's Resources tab on the Space Apps site.
