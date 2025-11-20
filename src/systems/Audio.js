export class AudioManager {
    constructor(state) {
        this.state = state;
        this.context = null;
        this.unlocked = false;
        this.buffers = new Map();

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.context = new AudioContextClass();
        }
    }

    buildBuffer(frequency, duration, decay) {
        if (!this.context) return null;
        const length = Math.floor(this.context.sampleRate * duration);
        const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) {
            const t = i / this.context.sampleRate;
            const envelope = Math.exp(-decay * t);
            channel[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
        }
        return buffer;
    }

    ensureBuffers() {
        if (this.buffers.size > 0 || !this.context) return;
        this.buffers.set('unbox', this.buildBuffer(520, 0.32, 2.2));
        this.buffers.set('place', this.buildBuffer(820, 0.18, 3.1));
        this.buffers.set('delete', this.buildBuffer(440, 0.2, 2.5));
        this.buffers.set('rotate', this.buildBuffer(1200, 0.1, 4.0));
    }

    unlock() {
        if (this.unlocked || !this.context) return;
        this.ensureBuffers();
        if (this.context.state === 'suspended') {
            this.context.resume().catch(() => { });
        }
        this.unlocked = true;
    }

    play(name) {
        if (!this.unlocked || this.state.audioMuted || !this.context) return;
        this.ensureBuffers();
        const buffer = this.buffers.get(name);
        if (!buffer) return;
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.start();
    }

    setMuted(muted) {
        this.state.audioMuted = muted;
    }
}
