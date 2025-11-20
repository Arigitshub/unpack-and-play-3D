export class HistoryManager {
    constructor(captureFn, applyFn) {
        this.entries = [];
        this.index = -1;
        this.captureFn = captureFn;
        this.applyFn = applyFn;
    }

    push(label) {
        const items = this.captureFn();
        if (!items || items.length === 0) {
            return;
        }
        const snapshot = {
            label,
            timestamp: performance.now(),
            items
        };
        // Remove any future history if we pushed a new state while in the middle of the stack
        if (this.index < this.entries.length - 1) {
            this.entries.splice(this.index + 1);
        }
        this.entries.push(snapshot);
        this.index = this.entries.length - 1;
    }

    undo() {
        if (this.index <= 0) {
            return false;
        }
        this.index -= 1;
        this.applyFn(this.entries[this.index].items);
        return true;
    }

    redo() {
        if (this.index >= this.entries.length - 1) {
            return false;
        }
        this.index += 1;
        this.applyFn(this.entries[this.index].items);
        return true;
    }

    reset(label) {
        this.entries.length = 0;
        this.index = -1;
        this.push(label);
    }
}
