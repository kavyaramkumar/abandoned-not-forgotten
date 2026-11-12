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

Kids take a field trip through a space museum. Each **wing** is a place NASA has explored (Moon, Mars, Deep Space, with more wings coming). Inside each wing they walk down a hallway of **exhibits**, one for each piece of hardware left behind. A **robot guide** goes with them.

Each exhibit card has four parts:

1. **Story:** the machine tells its own story in the first person.
2. **Still there:** what is physically left on the Moon, on Mars or in space today.
3. **Discovery:** the science it made possible.
4. **Challenge:** a quick question that earns stars ⭐.

Earning stars unlocks the next exhibit and the next wing (the story tree), and pays for upgrades to the robot in the **Robot Workshop**: paint, eye lights, hats and gear.

Each exhibit also has an **"Ask the exhibit" placard**, a chatbot that answers kids' questions about it.

### Status: skeleton draft

- Working: lobby map, wing unlocking, walkable hallway, exhibit cards, quiz and stars, robot workshop, saved progress, "Read to me" text-to-speech, and an offline Q&A placard.
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
| `js/data.js` | **All content**: wings, exhibits, stories, quizzes, shop items. Edit here! |
| `js/app.js` | Game logic: views, unlocking, quiz, stars, workshop |
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
