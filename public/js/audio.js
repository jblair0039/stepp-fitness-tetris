/**
 * Stepp Fitness Tetris - Web Audio Synthesizer
 * Pure Web Audio API: Zero external audio files required.
 */

class SoundController {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.bgmEnabled = false;
        this.sfxVolume = 0.5;
        this.bgmVolume = 0.35;
        this.bgmNode = null;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.tempo = 128; // BPM
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }

    toggleBgm() {
        this.init();
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) {
            this.startBgm();
        } else {
            this.stopBgm();
        }
        return this.bgmEnabled;
    }

    // --- Sound Effects ---

    playMove() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);

        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    playRotate() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.07);

        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    playDrop() {
        // Soft drop tick
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.03);

        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    playHardDrop() {
        // Heavy Olympic barbell / iron plate slam
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Sub bass slam
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(160, now);
        bassOsc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
        bassGain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.23);

        // Metallic iron clank (bandpass noise + high harmonics)
        const clankOsc = this.ctx.createOscillator();
        const clankGain = this.ctx.createGain();
        clankOsc.type = 'sawtooth';
        clankOsc.frequency.setValueAtTime(880, now);
        clankOsc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
        clankGain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
        clankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        clankOsc.connect(clankGain);
        clankGain.connect(this.ctx.destination);
        clankOsc.start(now);
        clankOsc.stop(now + 0.13);
    }

    playHold() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.09);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playClear(lines) {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        if (lines >= 4) {
            // STEPP FITNESS PR! Power Chord Fanfare
            this.playTetrisPR();
            return;
        }

        // 1-3 lines clear: harmonic gym iron chimes
        const chords = [
            [392, 523.25],          // G4, C5 (Single)
            [392, 523.25, 659.25],   // G4, C5, E5 (Double)
            [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (Triple)
        ];
        const notes = chords[Math.min(lines - 1, 2)];

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = now + idx * 0.04;
            const duration = 0.28;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25 * this.sfxVolume, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.02);
        });

        // Add plate clank
        const noise = this.ctx.createOscillator();
        const nGain = this.ctx.createGain();
        noise.type = 'square';
        noise.frequency.setValueAtTime(1200, now);
        noise.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        nGain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        noise.connect(nGain);
        nGain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.09);
    }

    playTetrisPR() {
        // 4 lines: Heavy Synth Rock Power Fanfare
        const now = this.ctx.currentTime;
        const notes = [
            { f: 261.63, t: 0.00, d: 0.12 }, // C4
            { f: 329.63, t: 0.08, d: 0.12 }, // E4
            { f: 392.00, t: 0.16, d: 0.12 }, // G4
            { f: 523.25, t: 0.24, d: 0.40 }, // C5
            { f: 659.25, t: 0.28, d: 0.40 }, // E5
            { f: 1046.5, t: 0.32, d: 0.50 }  // C6 power peak
        ];

        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(n.f, now + n.t);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2400, now + n.t);

            gain.gain.setValueAtTime(0, now + n.t);
            gain.gain.linearRampToValueAtTime(0.28 * this.sfxVolume, now + n.t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + n.t);
            osc.stop(now + n.t + n.d + 0.05);
        });

        // Bass punch
        const bass = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(130, now);
        bass.frequency.exponentialRampToValueAtTime(45, now + 0.45);
        bGain.gain.setValueAtTime(0.55 * this.sfxVolume, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        bass.connect(bGain);
        bGain.connect(this.ctx.destination);
        bass.start(now);
        bass.stop(now + 0.46);
    }

    playLevelUp() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Boxing ring bell chime
        [880, 1760].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            gain.gain.setValueAtTime(0.3 * this.sfxVolume, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.45);
        });
    }

    playGameOver() {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [293.66, 261.63, 220.00, 146.83]; // D4, C4, A3, D3
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = now + idx * 0.14;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.25 * this.sfxVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.26);
        });
    }

    // --- Procedural Synth Workout BGM ---

    startBgm() {
        this.stopBgm();
        this.bgmStep = 0;
        const stepTimeMs = (60 / this.tempo / 4) * 1000; // 16th notes
        this.bgmTimer = setInterval(() => {
            this.tickBgm();
        }, stepTimeMs);
    }

    stopBgm() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    tickBgm() {
        if (!this.ctx || !this.bgmEnabled) return;
        const now = this.ctx.currentTime;
        const step = this.bgmStep % 16;
        this.bgmStep++;

        // Kick drum on 0, 4, 8, 12 (4-on-the-floor gym pump)
        if (step % 4 === 0) {
            const kick = this.ctx.createOscillator();
            const kGain = this.ctx.createGain();
            kick.type = 'sine';
            kick.frequency.setValueAtTime(140, now);
            kick.frequency.exponentialRampToValueAtTime(45, now + 0.08);
            kGain.gain.setValueAtTime(0.3 * this.bgmVolume, now);
            kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            kick.connect(kGain);
            kGain.connect(this.ctx.destination);
            kick.start(now);
            kick.stop(now + 0.1);
        }

        // Snare/Clap on 4 and 12
        if (step === 4 || step === 12) {
            const snare = this.ctx.createOscillator();
            const sGain = this.ctx.createGain();
            snare.type = 'triangle';
            snare.frequency.setValueAtTime(240, now);
            snare.frequency.exponentialRampToValueAtTime(80, now + 0.07);
            sGain.gain.setValueAtTime(0.18 * this.bgmVolume, now);
            sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            snare.connect(sGain);
            sGain.connect(this.ctx.destination);
            snare.start(now);
            snare.stop(now + 0.08);
        }

        // Hi-Hat on every off-beat (2, 6, 10, 14) and 16ths
        if (step % 2 === 1) {
            const hat = this.ctx.createOscillator();
            const hGain = this.ctx.createGain();
            hat.type = 'square';
            hat.frequency.setValueAtTime(3500 + Math.random() * 800, now);
            hGain.gain.setValueAtTime(0.04 * this.bgmVolume, now);
            hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
            hat.connect(hGain);
            hGain.connect(this.ctx.destination);
            hat.start(now);
            hat.stop(now + 0.03);
        }

        // Synth Bassline: Dark driving electro-rock bass
        // Bassline pattern in A minor: A1 (55Hz), C2 (65.4Hz), D2 (73.4Hz), E2 (82.4Hz)
        const bassNotes = [55, 55, 65.4, 55, 73.4, 55, 82.4, 73.4, 55, 55, 65.4, 55, 98.0, 82.4, 73.4, 65.4];
        const freq = bassNotes[step];
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        const bFilter = this.ctx.createBiquadFilter();

        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(freq, now);

        bFilter.type = 'lowpass';
        bFilter.frequency.setValueAtTime(450, now);
        bFilter.Q.setValueAtTime(4, now);

        bGain.gain.setValueAtTime(0.14 * this.bgmVolume, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        bOsc.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(this.ctx.destination);

        bOsc.start(now);
        bOsc.stop(now + 0.11);
    }
}

window.soundController = new SoundController();
