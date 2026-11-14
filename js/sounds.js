/*
 * sounds.js: real NASA audio for the "Listen" button on machine cards.
 *
 * Keys are machine ids from js/data.js. Each clip is a short excerpt of a
 * NASA-hosted public recording or sonification, trimmed and converted to AAC
 * (.m4a) so it stays small. Full credits and source pages are listed in the
 * "Sounds" section of assets/photos/CREDITS.md.
 *
 * Fields:
 *   src      path to the audio file
 *   title    short title for the player
 *   caption  1-2 kid-friendly sentences: what you hear and how it was made
 *   credit   NASA credit line
 *   source   NASA page where the original sound is published
 *   seconds  length of the clip in seconds
 */
window.SOUNDS = {
  "insight": {
    src: "assets/sounds/insight.m4a",
    title: "The biggest marsquake ever recorded",
    caption: "On May 4, 2022, InSight's seismometer felt a magnitude 5 quake shake Mars. The shaking was far too low for human ears, so scientists sped up the vibrations to turn them into sound you can hear.",
    credit: "NASA/JPL-Caltech/CNES",
    source: "https://science.nasa.gov/resource/seismogram-and-sonification-of-insights-big-martian-quake/",
    seconds: 27.7
  },
  "voyager-1": {
    src: "assets/sounds/voyager-1.m4a",
    title: "Sounds of interstellar space",
    caption: "Voyager 1's plasma wave instrument felt the thin gas between the stars ring after bursts from the Sun hit it in 2012 and 2013. Those waves were turned into these rising tones, and a higher pitch means denser gas, which told scientists Voyager had left our Sun's bubble.",
    credit: "NASA/JPL-Caltech/University of Iowa",
    source: "https://science.nasa.gov/photojournal/voyager-captures-sounds-of-interstellar-space/",
    seconds: 26.1
  },
  "ingenuity": {
    src: "assets/sounds/ingenuity.m4a",
    title: "Ingenuity flying on Mars",
    caption: "The Perseverance rover's microphone recorded Ingenuity's fourth flight from 80 meters (262 feet) away on April 30, 2021. Listen for a low hum under the Martian wind: that is the helicopter's spinning blades, made louder by scientists so you can hear it.",
    credit: "NASA/JPL-Caltech/LANL/CNES/CNRS/ISAE-Supaero",
    source: "https://www.nasa.gov/sounds-from-beyond/",
    seconds: 57.0
  },
  "apollo-11": {
    src: "assets/sounds/apollo-11.m4a",
    title: "\"One small step\"",
    caption: "This is Neil Armstrong speaking as he stepped onto the Moon on July 20, 1969. His voice traveled by radio from the Moon to Earth, where it was recorded and heard live by millions of people.",
    credit: "NASA",
    source: "https://www.nasa.gov/historical-sounds/",
    seconds: 13.0
  },
  "kepler": {
    src: "assets/sounds/kepler.m4a",
    title: "A star turned into sound",
    caption: "Kepler measured how the brightness of star KIC 7671081B wobbled up and down over time. Those brightness changes were turned into sound waves, so you are hearing the rhythm of a real star's light.",
    credit: "NASA",
    source: "https://www.nasa.gov/historical-sounds/",
    seconds: 20.5
  }
};
