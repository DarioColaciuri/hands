const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

// ----------------------
// AUDIO
// ----------------------
const limiter = new Tone.Limiter(-1).toDestination();

const toneEq = new Tone.EQ3({
  low: 0,
  mid: 0,
  high: 0
}).connect(limiter);

const presetButtons = Array.from(document.querySelectorAll(".sound-btn"));

const piano = new Tone.Sampler({
  urls: {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3"
  },
  release: 1.3,
  baseUrl: "https://tonejs.github.io/audio/salamander/"
}).set({ volume: -2 }).connect(toneEq);

const pianoPadLayer = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: {
    attack: 0.45,
    decay: 0.25,
    sustain: 0.7,
    release: 2.4
  }
}).set({ volume: -20 }).connect(toneEq);

const rhodes = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2,
  modulationIndex: 4,
  oscillator: { type: "sine" },
  envelope: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.3,
    release: 1.2
  },
  modulation: { type: "triangle" },
  modulationEnvelope: {
    attack: 0.01,
    decay: 0.12,
    sustain: 0.1,
    release: 0.8
  }
}).set({ volume: -8 }).connect(toneEq);

const softSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle4" },
  envelope: {
    attack: 0.02,
    decay: 0.18,
    sustain: 0.55,
    release: 0.9
  }
}).set({ volume: -8 }).connect(toneEq);

const ambientPad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine2" },
  envelope: {
    attack: 0.9,
    decay: 0.4,
    sustain: 0.85,
    release: 3.2
  }
}).set({ volume: -18 }).connect(toneEq);

const presets = [
  {
    name: "1. Piano Pad",
    attack: (chord) => {
      piano.triggerAttack(chord);
      pianoPadLayer.triggerAttack(chord);
    },
    release: (chord) => {
      piano.triggerRelease(chord);
      pianoPadLayer.triggerRelease(chord);
    }
  },
  {
    name: "2. Piano",
    attack: (chord) => piano.triggerAttack(chord),
    release: (chord) => piano.triggerRelease(chord)
  },
  {
    name: "3. Rhodes",
    attack: (chord) => rhodes.triggerAttack(chord),
    release: (chord) => rhodes.triggerRelease(chord)
  },
  {
    name: "4. Soft Synth",
    attack: (chord) => softSynth.triggerAttack(chord),
    release: (chord) => softSynth.triggerRelease(chord)
  },
  {
    name: "5. Ambient Pad",
    attack: (chord) => ambientPad.triggerAttack(chord),
    release: (chord) => ambientPad.triggerRelease(chord)
  }
];

let currentPresetIndex = 0;

function updatePresetButtons() {
  presetButtons.forEach((button, index) => {
    button.classList.toggle("active", index === currentPresetIndex);
  });
}

function setPreset(index) {
  if (index < 0 || index >= presets.length || index === currentPresetIndex) return;

  if (activeChord) {
    presets[currentPresetIndex].release(activeChord);
  }

  currentPresetIndex = index;
  updatePresetButtons();

  if (activeChord) {
    presets[currentPresetIndex].attack(activeChord);
  }
}

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.presetIndex);
    setPreset(index);
  });
});
updatePresetButtons();

const releaseChord = (chord) => {
  presets[currentPresetIndex].release(chord);
};

const attackChord = (chord) => {
  presets[currentPresetIndex].attack(chord);
};

document.body.addEventListener("click", async () => {
  await Tone.start();
  await Tone.loaded();
}, { once: true });

// ----------------------
const STABLE_TIME = 120;
const NOTE_LOCK_TIME = 120;
const CONTROL_TOP_Y = 0.2;
const CONTROL_BOTTOM_Y = 0.8;

let detectedNote = null;
let detectedType = null;

let stableNote = null;
let stableType = null;

let lastChangeTime = 0;
let lastPlayed = null;

let lastNoteChangeTime = 0;

let activeChord = null;

function mapWristToCutoff(y) {
  const normalized = (y - CONTROL_TOP_Y) / (CONTROL_BOTTOM_Y - CONTROL_TOP_Y);
  const clamped = Math.max(0, Math.min(1, normalized));
  return Math.round((0.5 - clamped) * 200);
}

// ----------------------
function getFingers(landmarks, hand) {
  return {
    thumb: hand === "Right"
      ? landmarks[4].x < landmarks[3].x
      : landmarks[4].x > landmarks[3].x,
    index: landmarks[8].y < landmarks[6].y,
    middle: landmarks[12].y < landmarks[10].y,
    ring: landmarks[16].y < landmarks[14].y,
    pinky: landmarks[20].y < landmarks[18].y
  };
}

function getNote(f) {
  if (!f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) return "C";
  if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) return "D";
  if (f.thumb && f.index && !f.middle && !f.ring && !f.pinky) return "E";
  if (f.thumb && f.index && f.middle && !f.ring && !f.pinky) return "F";
  if (f.thumb && f.index && f.middle && f.ring && !f.pinky) return "G";
  if (f.thumb && f.index && f.middle && f.ring && f.pinky) return "A";
  if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky) return "B";
  return null;
}

function applySharp(note, isSharp) {
  const allowedSharps = ["C", "D", "F", "G", "A"];
  if (isSharp && allowedSharps.includes(note)) {
    return note + "#";
  }
  return note;
}

function formatNoteDisplay(note) {
  const map = {
    "C#": "C#/Db",
    "D#": "D#/Eb",
    "F#": "F#/Gb",
    "G#": "G#/Ab",
    "A#": "A#/Bb"
  };
  return map[note] || note;
}

// Mano de acordes (derecha): pulgar + índice/medio/anular/meñique (extendido = arriba).
// Pulgar: mismo criterio que getFingers (mano derecha).
// Mayor: los 4 dedos abajo. Solo pulgar arriba + resto abajo = Aumentado.
// Menor: los 4 dedos arriba (pulgar da igual).
// Dim: solo índice (pulgar abajo) | m7: solo meñique | 7: índice+medio | m7(b5): índice+meñique
// Pulgar arriba: Maj7 = pulgar + meñique (resto abajo)
// dim7: pulgar + índice + medio + anular arriba, meñique abajo (cómodo, tres dedos + pulgar)
function getChordType(f) {
  const th = f.thumb;
  const idx = f.index;
  const mid = f.middle;
  const ring = f.ring;
  const pnk = f.pinky;

  if (th && !idx && !mid && !ring && !pnk) return "Augmented";
  if (th && !idx && !mid && !ring && pnk) return "Maj7";
  if (th && idx && mid && ring && !pnk) return "dim7";

  if (!idx && !mid && !ring && !pnk) return "Major";
  if (idx && mid && ring && pnk) return "Minor";

  if (!th && idx && !mid && !ring && !pnk) return "Diminished";
  if (!th && !idx && !mid && !ring && pnk) return "m7";
  if (!th && idx && mid && !ring && !pnk) return "7";
  if (!th && idx && !mid && !ring && pnk) return "m7(b5)";

  return null;
}

const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const CHORD_SEMITONES = {
  Major: [0, 4, 7],
  Minor: [0, 3, 7],
  Diminished: [0, 3, 6],
  Augmented: [0, 4, 8],
  Maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  "m7(b5)": [0, 3, 6, 10]
};

function midiToNoteString(midi) {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return CHROMATIC[pc] + octave;
}

function buildChord(root, type) {
  const i = CHROMATIC.indexOf(root);
  if (i === -1) return [];

  const intervals = CHORD_SEMITONES[type];
  if (!intervals) return [];

  const rootMidi = 60 + i;
  return intervals.map((semi) => midiToNoteString(rootMidi + semi));
}

// ----------------------
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 0,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

hands.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let rightNote = null;
  let leftType = null;
  let isSharp = false;
  let cutoffControl = null;

  if (results.multiHandLandmarks) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const hand = results.multiHandedness[i].label;

      const fingers = getFingers(landmarks, hand);
      const color = hand === "Right" ? "blue" : "green";

      // puntos (no los toco)
      for (const p of landmarks) {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }

      const wrist = landmarks[0];

      if (hand === "Left") {
        rightNote = getNote(fingers);
        if (wrist.y < 0.5) isSharp = true;
      }

      if (hand === "Right") {
        leftType = getChordType(fingers);
        cutoffControl = wrist.y;
      }
    }
  }

  // 🎛️ CONTROL BIPOLAR: centro 0 sin efecto
  // +100 recorta graves, -100 recorta agudos.
  let cutoffValue = 0;

  if (cutoffControl !== null) {
    cutoffValue = mapWristToCutoff(cutoffControl);
  }

  const maxCutDb = 30;
  const maxMidCutDb = 12;
  let lowGainDb = 0;
  let midGainDb = 0;
  let highGainDb = 0;

  if (cutoffValue > 0) {
    lowGainDb = -maxCutDb * (cutoffValue / 100);
  } else if (cutoffValue < 0) {
    const amount = Math.abs(cutoffValue) / 100;
    highGainDb = -maxCutDb * amount;
    midGainDb = -maxMidCutDb * amount;
  }

  toneEq.low.rampTo(lowGainDb, 0.1);
  toneEq.high.rampTo(highGainDb, 0.1);
  toneEq.mid.rampTo(midGainDb, 0.1);

  if (rightNote) {
    rightNote = applySharp(rightNote, isSharp);
  }

  const now = Date.now();

  if (rightNote !== detectedNote) {
    lastNoteChangeTime = now;
  }

  if (rightNote !== detectedNote || leftType !== detectedType) {
    detectedNote = rightNote;
    detectedType = leftType;
    lastChangeTime = now;
  }

  if (now - lastChangeTime > STABLE_TIME) {
    stableNote = detectedNote;
    stableType = detectedType;
  }

  if (now - lastNoteChangeTime < NOTE_LOCK_TIME) {
    stableType = null;
  }

  if (!rightNote || !leftType) {
    if (activeChord) {
      releaseChord(activeChord);
      activeChord = null;
    }
    lastPlayed = null;
  }

  if (stableNote && stableType) {
    const id = stableNote + stableType;

    if (id !== lastPlayed) {
      const chord = buildChord(stableNote, stableType);

      if (activeChord) {
        releaseChord(activeChord);
      }

      attackChord(chord);
      activeChord = chord;

      lastPlayed = id;
    }
  }

  // texto
  if (stableNote && stableType) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `${formatNoteDisplay(stableNote)} ${stableType}`,
      canvas.width / 2,
      40
    );
  }

  // barra cutoff (-100 a 100, centro = 0)
  const barWidth = 200;
  const barHeight = 20;
  const x = canvas.width / 2 - barWidth / 2;
  const y = canvas.height - 40;
  const centerX = x + barWidth / 2;
  const fillWidth = Math.abs(cutoffValue) / 100 * (barWidth / 2);

  ctx.strokeStyle = "white";
  ctx.strokeRect(x, y, barWidth, barHeight);

  ctx.fillStyle = "white";
  if (cutoffValue >= 0) {
    ctx.fillRect(centerX, y, fillWidth, barHeight);
  } else {
    ctx.fillRect(centerX - fillWidth, y, fillWidth, barHeight);
  }

  // linea central de referencia (0)
  ctx.beginPath();
  ctx.moveTo(centerX, y);
  ctx.lineTo(centerX, y + barHeight);
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Sound: ${presets[currentPresetIndex].name}`, canvas.width / 2, y - 28);

  ctx.fillText(
    `Cutoff: ${cutoffValue}`,
    canvas.width / 2,
    y - 5
  );

  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
});

// cámara
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

camera.start();