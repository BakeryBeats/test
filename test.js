/**
 * Node.js Test Suite for BakeryBeats
 * Run with: node test.js
 */

// Mock DOM environment - must be defined BEFORE loading app.js
class MockElement {
  constructor(id) {
    this.id = id;
    this.classList = {
      _classes: new Set(),
      add: (cls) => this.classList._classes.add(cls),
      remove: (cls) => this.classList._classes.delete(cls),
      toggle: (cls) => {
        if (this.classList._classes.has(cls)) {
          this.classList._classes.delete(cls);
        } else {
          this.classList._classes.add(cls);
        }
      },
      contains: (cls) => this.classList._classes.has(cls)
    };
    this.dataset = {};
    this.textContent = '';
    this.value = '';
    this.children = [];
  }

  appendChild(child) {
    this.children.push(child);
  }

  querySelectorAll(selector) {
    return [];
  }

  querySelector(selector) {
    return new MockElement(selector);
  }

  addEventListener() {}
}

// Mock document
const mockElements = {};

global.document = {
  getElementById: (id) => {
    if (!mockElements[id]) {
      mockElements[id] = new MockElement(id);
      if (id === 'bpmSlider') mockElements[id].value = '120';
      if (id === 'volumeSlider') mockElements[id].value = '70';
      if (id === 'bpmValue') mockElements[id].textContent = '120';
      if (id === 'volumeValue') mockElements[id].textContent = '70';
      if (id === 'beatGrid') mockElements[id].innerHTML = '';
    }
    return mockElements[id];
  },
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => new MockElement('mock')
};

global.window = {
  AudioContext: class MockAudioContext {
    constructor() {
      this.state = 'running';
      this.currentTime = 0;
      this.sampleRate = 44100;
      this.destination = {};
    }
    createGain() {
      return {
        gain: {
          value: 1,
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          linearRampToValueAtTime: () => {}
        },
        connect: () => {}
      };
    }
    createOscillator() {
      return {
        frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        type: 'sine',
        connect: () => {},
        start: () => {},
        stop: () => {}
      };
    }
    createBiquadFilter() {
      return {
        type: 'lowpass',
        frequency: { value: 0 },
        connect: () => {}
      };
    }
    createBuffer(channels, length, sampleRate) {
      return {
        numberOfChannels: channels,
        length: length,
        sampleRate: sampleRate,
        getChannelData: () => new Float32Array(length)
      };
    }
    createBufferSource() {
      return {
        buffer: null,
        connect: () => {},
        start: () => {},
        stop: () => {}
      };
    }
    resume() {}
  }
};

// Load the DrumMachine class
const fs = require('fs');
const vm = require('vm');

const appCode = fs.readFileSync('app.js', 'utf8');
// Expose DrumMachine to window so we can access it
const modifiedCode = appCode.replace(
  "document.addEventListener('DOMContentLoaded', () => {",
  "window.DrumMachine = DrumMachine;\n\ndocument.addEventListener('DOMContentLoaded', () => {"
);

const script = new vm.Script(modifiedCode);
const context = vm.createContext({
  document: global.document,
  window: global.window,
  AudioContext: global.window.AudioContext,
  GainNode: class GainNode {},
  console: console,
  Math: Math,
  setInterval: () => 1,
  clearInterval: () => {}
});

script.runInContext(context);

const DrumMachine = context.window.DrumMachine;

// Test framework
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  test(description, fn) {
    try {
      fn();
      this.passed++;
      this.results.push({ description, passed: true });
      console.log(`  ✓ ${description}`);
    } catch (error) {
      this.failed++;
      this.results.push({ description, passed: false, error: error.message });
      console.log(`  ✗ ${description}`);
      console.log(`    Error: ${error.message}`);
    }
  }

  describe(suite, fn) {
    console.log(`\n${suite}`);
    fn();
  }

  summary() {
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${this.passed} passed, ${this.failed} failed`);
    console.log('='.repeat(50));
    return this.failed === 0;
  }
}

// Run tests
const runner = new TestRunner();

runner.describe('DrumMachine Initialization', () => {
  runner.test('should create DrumMachine instance', () => {
    const dm = new DrumMachine();
    if (!(dm instanceof DrumMachine)) throw new Error('Not an instance of DrumMachine');
  });

  runner.test('should initialize with default BPM of 120', () => {
    const dm = new DrumMachine();
    if (dm.bpm !== 120) throw new Error(`Expected 120, got ${dm.bpm}`);
  });

  runner.test('should initialize with default volume of 0.7', () => {
    const dm = new DrumMachine();
    if (dm.volume !== 0.7) throw new Error(`Expected 0.7, got ${dm.volume}`);
  });

  runner.test('should initialize with 16 steps', () => {
    const dm = new DrumMachine();
    if (dm.numSteps !== 16) throw new Error(`Expected 16, got ${dm.numSteps}`);
  });

  runner.test('should have 6 tracks', () => {
    const dm = new DrumMachine();
    if (dm.tracks.length !== 6) throw new Error(`Expected 6, got ${dm.tracks.length}`);
  });

  runner.test('should initialize all patterns as empty arrays', () => {
    const dm = new DrumMachine();
    dm.tracks.forEach(track => {
      if (dm.patterns[track].length !== 16) throw new Error(`Pattern length mismatch for ${track}`);
      if (!dm.patterns[track].every(val => val === false)) throw new Error(`Pattern not all false for ${track}`);
    });
  });

  runner.test('should not be playing initially', () => {
    const dm = new DrumMachine();
    if (dm.isPlaying !== false) throw new Error(`Expected false, got ${dm.isPlaying}`);
  });

  runner.test('should start at step 0', () => {
    const dm = new DrumMachine();
    if (dm.currentStep !== 0) throw new Error(`Expected 0, got ${dm.currentStep}`);
  });
});

runner.describe('Sound Key Mapping', () => {
  runner.test('should map number keys 1-6 to drum sounds', () => {
    const dm = new DrumMachine();
    const expected = {
      '1': 'kick',
      '2': 'snare',
      '3': 'hihat',
      '4': 'openhat',
      '5': 'clap',
      '6': 'crash'
    };
    Object.keys(expected).forEach(key => {
      if (dm.soundKeys[key] !== expected[key]) {
        throw new Error(`Key ${key} should map to ${expected[key]}, got ${dm.soundKeys[key]}`);
      }
    });
  });
});

runner.describe('Pattern Management', () => {
  runner.test('should toggle step correctly', () => {
    const dm = new DrumMachine();
    dm.patterns['kick'][0] = false;
    dm.patterns['kick'][0] = !dm.patterns['kick'][0];
    if (!dm.patterns['kick'][0]) throw new Error('Step should be true after toggle');
  });

  runner.test('should clear all patterns', () => {
    const dm = new DrumMachine();
    dm.patterns['kick'][0] = true;
    dm.patterns['snare'][5] = true;
    dm.clearPattern();
    dm.tracks.forEach(track => {
      if (!dm.patterns[track].every(val => val === false)) {
        throw new Error(`Pattern ${track} should be all false after clear`);
      }
    });
  });
});

runner.describe('Audio Context', () => {
  runner.test('should create audio context on initialization', () => {
    const dm = new DrumMachine();
    if (!(dm.audioContext instanceof context.AudioContext)) {
      throw new Error('audioContext not created');
    }
  });

  runner.test('should create master gain node', () => {
    const dm = new DrumMachine();
    if (!dm.masterGain) throw new Error('masterGain not created');
  });
});

runner.describe('Playback Control', () => {
  runner.test('should toggle play state correctly', () => {
    const dm = new DrumMachine();
    if (dm.isPlaying !== false) throw new Error('Should start paused');
    dm.togglePlay();
    if (dm.isPlaying !== true) throw new Error('Should be playing after toggle');
    dm.togglePlay();
    if (dm.isPlaying !== false) throw new Error('Should be paused after second toggle');
  });

  runner.test('should reset current step on stop', () => {
    const dm = new DrumMachine();
    dm.currentStep = 5;
    dm.stop();
    if (dm.currentStep !== 0) throw new Error(`Expected 0 after stop, got ${dm.currentStep}`);
  });

  runner.test('should advance step correctly during scheduling', () => {
    const dm = new DrumMachine();
    dm.currentStep = 0;
    dm.scheduleStep();
    if (dm.currentStep !== 1) throw new Error(`Expected 1, got ${dm.currentStep}`);
  });

  runner.test('should wrap around at 16 steps', () => {
    const dm = new DrumMachine();
    dm.currentStep = 15;
    dm.scheduleStep();
    if (dm.currentStep !== 0) throw new Error(`Expected 0 after wrap, got ${dm.currentStep}`);
  });
});

runner.describe('Sound Synthesis', () => {
  runner.test('should have playSound method for all track types', () => {
    const dm = new DrumMachine();
    dm.tracks.forEach(track => {
      if (typeof dm.playSound !== 'function') throw new Error('playSound not a function');
      // Should not throw
      dm.playSound(track);
    });
  });

  runner.test('should have individual play methods for each sound', () => {
    const dm = new DrumMachine();
    if (typeof dm.playKick !== 'function') throw new Error('playKick not a function');
    if (typeof dm.playSnare !== 'function') throw new Error('playSnare not a function');
    if (typeof dm.playHiHat !== 'function') throw new Error('playHiHat not a function');
    if (typeof dm.playClap !== 'function') throw new Error('playClap not a function');
    if (typeof dm.playCrash !== 'function') throw new Error('playCrash not a function');
  });

  runner.test('should create noise buffer', () => {
    const dm = new DrumMachine();
    const buffer = dm.createNoiseBuffer();
    // Check it's an AudioBuffer-like object
    if (!buffer || typeof buffer.numberOfChannels !== 'number') throw new Error('Not a valid AudioBuffer');
    if (buffer.numberOfChannels !== 1) throw new Error('Should have 1 channel');
  });
});

runner.describe('BPM and Volume Control', () => {
  runner.test('should update BPM correctly', () => {
    const dm = new DrumMachine();
    dm.bpm = 140;
    if (dm.bpm !== 140) throw new Error(`Expected 140, got ${dm.bpm}`);
  });

  runner.test('should update volume correctly', () => {
    const dm = new DrumMachine();
    dm.volume = 0.5;
    if (dm.volume !== 0.5) throw new Error(`Expected 0.5, got ${dm.volume}`);
  });
});

runner.describe('Step Key Mapping', () => {
  runner.test('should map 16 letter keys to steps', () => {
    const dm = new DrumMachine();
    // The stepKeys array contains [key, index] pairs
    // It should have exactly 16 entries for steps 0-15
    if (dm.stepKeys.length !== 16) throw new Error(`Expected 16 keys, got ${dm.stepKeys.length}`);
    if (dm.stepKeys[0][0] !== 'q') throw new Error('First key should be q');
    if (dm.stepKeys[15][1] !== 15) throw new Error('Last step index should be 15');
  });
});

runner.describe('Track Configuration', () => {
  runner.test('should have correct track names', () => {
    const dm = new DrumMachine();
    const expectedTracks = ['kick', 'snare', 'hihat', 'openhat', 'clap', 'crash'];
    if (JSON.stringify(dm.tracks) !== JSON.stringify(expectedTracks)) {
      throw new Error('Track names do not match expected');
    }
  });
});

// Print summary and exit with appropriate code
const success = runner.summary();
process.exit(success ? 0 : 1);
