/**
 * BakeryBeats - Interactive Beat Maker
 * A web-based drum machine using Web Audio API
 */

class DrumMachine {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.currentStep = 0;
    this.bpm = 120;
    this.volume = 0.7;
    this.intervalId = null;
    this.numSteps = 16;

    // Drum sounds configuration (synthesized)
    this.tracks = ['kick', 'snare', 'hihat', 'openhat', 'clap', 'crash'];
    this.patterns = {};

    // Keyboard mapping for sounds (1-6)
    this.soundKeys = {
      '1': 'kick',
      '2': 'snare',
      '3': 'hihat',
      '4': 'openhat',
      '5': 'clap',
      '6': 'crash'
    };

    // Keyboard mapping for steps (Q-L = 1-16)
    this.stepKeys = 'qwertyuiopasdfgh'.split('').map((key, index) => [key, index]);

    this.init();
  }

  init() {
    this.initAudio();
    this.initPatterns();
    this.renderGrid();
    this.bindEvents();
  }

  initAudio() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = this.volume;
  }

  initPatterns() {
    this.tracks.forEach(track => {
      this.patterns[track] = new Array(this.numSteps).fill(false);
    });
  }

  renderGrid() {
    const grid = document.getElementById('beatGrid');
    grid.innerHTML = '';

    this.tracks.forEach(track => {
      const trackDiv = document.createElement('div');
      trackDiv.className = 'track';

      for (let i = 0; i < this.numSteps; i++) {
        const step = document.createElement('div');
        step.className = 'step';
        step.dataset.track = track;
        step.dataset.step = i;

        if (i % 4 === 0) {
          step.classList.add('beat-start');
        }

        if (this.patterns[track][i]) {
          step.classList.add('active');
        }

        trackDiv.appendChild(step);
      }

      grid.appendChild(trackDiv);
    });
  }

  bindEvents() {
    // Play button
    document.getElementById('playBtn').addEventListener('click', () => this.togglePlay());

    // Stop button
    document.getElementById('stopBtn').addEventListener('click', () => this.stop());

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => this.clearPattern());

    // BPM slider
    const bpmSlider = document.getElementById('bpmSlider');
    bpmSlider.addEventListener('input', (e) => {
      this.bpm = parseInt(e.target.value);
      document.getElementById('bpmValue').textContent = this.bpm;
      if (this.isPlaying) {
        this.restart();
      }
    });

    // Volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('input', (e) => {
      this.volume = parseInt(e.target.value) / 100;
      document.getElementById('volumeValue').textContent = e.target.value;
      this.masterGain.gain.value = this.volume;
    });

    // Grid clicks
    document.getElementById('beatGrid').addEventListener('click', (e) => {
      if (e.target.classList.contains('step')) {
        const track = e.target.dataset.track;
        const step = parseInt(e.target.dataset.step);
        this.toggleStep(track, step, e.target);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Prevent default for our keys
      if (this.soundKeys[e.key] || e.key === ' ' || this.stepKeys.some(([k]) => k === e.key) || e.key.toLowerCase() === 'c') {
        e.preventDefault();
      }

      // Space - play/pause
      if (e.key === ' ') {
        this.togglePlay();
      }

      // Number keys 1-6 - trigger sounds
      if (this.soundKeys[e.key]) {
        this.playSound(this.soundKeys[e.key]);
      }

      // Letter keys Q-P - toggle steps
      const stepMapping = this.stepKeys.find(([key]) => key === e.key.toLowerCase());
      if (stepMapping) {
        const stepIndex = stepMapping[1];
        this.tracks.forEach(track => {
          this.patterns[track][stepIndex] = !this.patterns[track][stepIndex];
        });
        this.updateGridDisplay();
      }

      // C key - clear pattern
      if (e.key.toLowerCase() === 'c') {
        this.clearPattern();
      }
    });
  }

  toggleStep(track, step, element) {
    this.patterns[track][step] = !this.patterns[track][step];
    element.classList.toggle('active');

    // Play sound preview when activating
    if (this.patterns[track][step]) {
      this.playSound(track);
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    document.getElementById('playBtn').textContent = '⏸ Pause';
    document.getElementById('playBtn').classList.add('playing');

    const stepDuration = (60 / this.bpm) / 4 * 1000; // 16th notes
    this.scheduleStep();
    this.intervalId = setInterval(() => this.scheduleStep(), stepDuration);
  }

  scheduleStep() {
    // Highlight current step
    this.highlightStep(this.currentStep);

    // Play sounds for current step
    this.tracks.forEach(track => {
      if (this.patterns[track][this.currentStep]) {
        this.playSound(track);
      }
    });

    // Advance step
    this.currentStep = (this.currentStep + 1) % this.numSteps;
  }

  highlightStep(step) {
    // Remove previous highlighting
    document.querySelectorAll('.step.playing').forEach(el => {
      el.classList.remove('playing');
    });
    document.querySelectorAll('.step-marker.current').forEach(el => {
      el.classList.remove('current');
    });

    // Add new highlighting
    document.querySelectorAll(`.step[data-step="${step}"]`).forEach(el => {
      el.classList.add('playing');
    });
    document.querySelectorAll(`.step-marker[data-step="${step}"]`).forEach(el => {
      el.classList.add('current');
    });
  }

  pause() {
    this.isPlaying = false;
    document.getElementById('playBtn').textContent = '▶ Play';
    document.getElementById('playBtn').classList.remove('playing');
    clearInterval(this.intervalId);
  }

  stop() {
    this.pause();
    this.currentStep = 0;
    this.highlightStep(-1);
  }

  restart() {
    if (this.isPlaying) {
      clearInterval(this.intervalId);
      this.currentStep = 0;
      this.scheduleStep();
      const stepDuration = (60 / this.bpm) / 4 * 1000;
      this.intervalId = setInterval(() => this.scheduleStep(), stepDuration);
    }
  }

  clearPattern() {
    this.tracks.forEach(track => {
      this.patterns[track].fill(false);
    });
    this.updateGridDisplay();
  }

  updateGridDisplay() {
    this.tracks.forEach(track => {
      for (let i = 0; i < this.numSteps; i++) {
        const step = document.querySelector(`.step[data-track="${track}"][data-step="${i}"]`);
        if (step) {
          if (this.patterns[track][i]) {
            step.classList.add('active');
          } else {
            step.classList.remove('active');
          }
        }
      }
    });
  }

  // Sound synthesis methods using Web Audio API
  playSound(type) {
    const now = this.audioContext.currentTime;

    switch (type) {
      case 'kick':
        this.playKick(now);
        break;
      case 'snare':
        this.playSnare(now);
        break;
      case 'hihat':
        this.playHiHat(now, false);
        break;
      case 'openhat':
        this.playHiHat(now, true);
        break;
      case 'clap':
        this.playClap(now);
        break;
      case 'crash':
        this.playCrash(now);
        break;
    }
  }

  playKick(time) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  playSnare(time) {
    // Noise component
    const noiseBuffer = this.createNoiseBuffer();
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);

    // Tone component
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    const oscGain = this.audioContext.createGain();
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  playHiHat(time, open = false) {
    const fundamental = 40;
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
    const baseGain = open ? 0.15 : 0.3;
    const decay = open ? 0.4 : 0.08;

    ratios.forEach(ratio => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.frequency.value = fundamental * ratio;
      osc.type = 'square';

      gain.gain.setValueAtTime(baseGain / ratios.length, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + decay);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + decay);
    });
  }

  playClap(time) {
    const noiseBuffer = this.createNoiseBuffer();
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    const gain = this.audioContext.createGain();

    // Clap envelope - multiple bursts
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.6, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.2);
  }

  playCrash(time) {
    const noiseBuffer = this.createNoiseBuffer();
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const gain = this.audioContext.createGain();

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 1.5);
  }

  createNoiseBuffer() {
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.drumMachine = new DrumMachine();
});
