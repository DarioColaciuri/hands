const CONFIG = {
  TIMING: {
    STABLE_TIME: 120,
    NOTE_LOCK_TIME: 120
  },

  CONTROL: {
    CONTROL_TOP_Y: 0.2,
    CONTROL_BOTTOM_Y: 0.8
  },

  AUDIO: {
    MAX_CUT_DB: 30,
    MAX_MID_CUT_DB: 12
  },

  VISUAL: {
    CANVAS_WIDTH: 640,
    CANVAS_HEIGHT: 480,
    LANDMARK_RADIUS: 5,
    STROKE_UP: "#5fd488",
    STROKE_DOWN: "#5c5c5c",
    PALM_FILL: "#242424",
    PALM_STROKE: "#666"
  },

  CHROMATIC: ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],

  CHORD_SEMITONES: {
    Major: [0, 4, 7],
    Minor: [0, 3, 7],
    Diminished: [0, 3, 6],
    Augmented: [0, 4, 8],
    Maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    "7": [0, 4, 7, 10],
    dim7: [0, 3, 6, 9],
    "m7(b5)": [0, 3, 6, 10]
  },

  NOTE_MAP: {
    "C#": "C#/Db",
    "D#": "D#/Eb",
    "F#": "F#/Gb",
    "G#": "G#/Ab",
    "A#": "A#/Bb"
  },

  SHARP_ALLOWED_NOTES: ["C", "D", "F", "G", "A"]
};

const MEDIAPIPE_CONFIG = {
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
};

const HAND_OPTIONS = {
  maxNumHands: 2,
  modelComplexity: 0,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
};

const FINGER_INDICES = {
  wrist: 0,
  thumbCMC: 1,
  thumbIP: 2,
  thumbTip: 4,
  indexMCP: 5,
  indexPIP: 6,
  indexTip: 8,
  middleMCP: 9,
  middlePIP: 10,
  middleTip: 12,
  ringMCP: 13,
  ringPIP: 14,
  ringTip: 16,
  pinkyMCP: 17,
  pinkyPIP: 18,
  pinkyTip: 20
};

const HAND_CONNECTIONS = [
  [FINGER_INDICES.wrist, FINGER_INDICES.thumbCMC],
  [FINGER_INDICES.thumbCMC, FINGER_INDICES.thumbIP],
  [FINGER_INDICES.thumbIP, FINGER_INDICES.thumbTip],
  [FINGER_INDICES.wrist, FINGER_INDICES.indexMCP],
  [FINGER_INDICES.indexMCP, FINGER_INDICES.indexPIP],
  [FINGER_INDICES.indexPIP, FINGER_INDICES.indexTip],
  [FINGER_INDICES.wrist, FINGER_INDICES.middleMCP],
  [FINGER_INDICES.middleMCP, FINGER_INDICES.middlePIP],
  [FINGER_INDICES.middlePIP, FINGER_INDICES.middleTip],
  [FINGER_INDICES.wrist, FINGER_INDICES.ringMCP],
  [FINGER_INDICES.ringMCP, FINGER_INDICES.ringPIP],
  [FINGER_INDICES.ringPIP, FINGER_INDICES.ringTip],
  [FINGER_INDICES.wrist, FINGER_INDICES.pinkyMCP],
  [FINGER_INDICES.pinkyMCP, FINGER_INDICES.pinkyPIP],
  [FINGER_INDICES.pinkyPIP, FINGER_INDICES.pinkyTip]
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CONFIG, MEDIAPIPE_CONFIG, HAND_OPTIONS, FINGER_INDICES, HAND_CONNECTIONS };
}