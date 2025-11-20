export class TutorialSystem {
    constructor(ui, sceneObjects) {
        this.ui = ui; // { overlay, text, rotateLeftBtn, rotateRightBtn }
        this.sceneObjects = sceneObjects; // { boxes }
        this.highlightSnapTargets = false;

        this.steps = [
            {
                id: 'welcome',
                text: 'Welcome to Unpack & Play 3D! We\'ll help you decorate this cozy room.',
                waitFor: null,
                highlight: null
            },
            {
                id: 'openBox',
                text: 'Start by clicking the glowing box to open it up.',
                waitFor: 'boxOpened',
                highlight: 'box'
            },
            {
                id: 'dragItem',
                text: 'Drag an item out of the box and explore the room.',
                waitFor: 'itemDragged',
                highlight: null
            },
            {
                id: 'snapItem',
                text: 'Place the item on a glowing spot to snap it into place.',
                waitFor: 'itemSnapped',
                highlight: 'snap'
            },
            {
                id: 'rotateItem',
                text: 'Use Q/E keys or the rotate buttons to angle your items just right.',
                waitFor: 'itemRotated',
                highlight: 'rotate'
            },
            {
                id: 'freePlay',
                text: 'All set! Keep unpacking and make the room yours.',
                waitFor: null,
                highlight: null
            }
        ];

        this.index = -1;
        this.awaitingEvent = null;
    }

    setHighlights(step) {
        if (this.sceneObjects.boxes) {
            this.sceneObjects.boxes.forEach((box) => {
                box.highlight = step.highlight === 'box' && !box.hasOpened;
            });
        }

        this.highlightSnapTargets = step.highlight === 'snap';

        const rotateHighlight = step.highlight === 'rotate';
        if (this.ui.rotateLeftBtn) this.ui.rotateLeftBtn.classList.toggle('pulse', rotateHighlight);
        if (this.ui.rotateRightBtn) this.ui.rotateRightBtn.classList.toggle('pulse', rotateHighlight);
    }

    start() {
        this.restart();
    }

    advance() {
        this.index += 1;
        if (this.index >= this.steps.length) {
            if (this.ui.overlay) this.ui.overlay.classList.add('hidden');
            return;
        }

        const step = this.steps[this.index];
        this.awaitingEvent = step.waitFor;

        if (this.ui.text) this.ui.text.textContent = step.text;
        if (this.ui.overlay) {
            this.ui.overlay.classList.remove('hidden');
            this.ui.overlay.classList.add('visible');
        }

        this.setHighlights(step);

        if (!this.awaitingEvent && step.id === 'freePlay') {
            setTimeout(() => {
                this.hideOverlay();
            }, 2800);
        }
    }

    hideOverlay() {
        if (this.ui.overlay) {
            this.ui.overlay.classList.remove('visible');
            this.ui.overlay.classList.add('hidden');
        }
    }

    onOverlayAccepted() {
        if (this.index < 0 || this.index >= this.steps.length) return;

        const step = this.steps[this.index];
        if (!this.awaitingEvent) {
            this.advance();
        } else if (step.highlight === 'box') {
            // Re-apply box highlight if they clicked "Sounds good" but haven't opened the box yet
            if (this.sceneObjects.boxes) {
                this.sceneObjects.boxes.forEach((box) => {
                    box.highlight = !box.hasOpened;
                });
            }
        }
    }

    notify(eventId) {
        if (this.awaitingEvent && this.awaitingEvent === eventId) {
            this.awaitingEvent = null;
            this.advance();
        }
    }

    restart() {
        this.index = -1;
        this.awaitingEvent = null;
        this.advance();
    }
}
