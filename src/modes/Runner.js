import * as THREE from 'three';

export class RunnerMode {
    constructor(group, callbacks) {
        this.group = group;
        this.callbacks = callbacks; // { showUI, loadBest, saveBest, awardMilestone, isDone, updateHUD, showFinish }

        this.running = false;
        this.t = 0;
        this.speed = 6;
        this.stars = 0;
        this.lane = 0;
        this.y = 0;
        this.vy = 0;
        this.gravity = -32;
        this.onGround = true;
        this.best = { seconds: 0, stars: 0 };
        this.lastSpawn = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.player = null;

        this.setupScene();
    }

    setupScene() {
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 200), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        ground.rotation.x = -Math.PI / 2;
        this.group.add(ground);

        const player = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
        player.position.y = 0.5;
        this.group.add(player);
        this.player = player;
    }

    enter() {
        this.best = this.callbacks.loadBest() || { seconds: 0, stars: 0 };
        this.reset();
        this.callbacks.showUI(true);
    }

    exit() {
        this.callbacks.showUI(false);
        this.running = false;
    }

    reset() {
        this.t = 0;
        this.speed = 6;
        this.stars = 0;
        this.lane = 0;
        this.y = 0;
        this.vy = 0;
        this.onGround = true;
        this.lastSpawn = 0;

        this.obstacles.forEach(o => this.group.remove(o));
        this.collectibles.forEach(c => this.group.remove(c));
        this.obstacles = [];
        this.collectibles = [];
    }

    spawnEntity() {
        const isObstacle = Math.random() > 0.5;
        const lane = Math.floor(Math.random() * 3) - 1;
        const geometry = isObstacle ? new THREE.BoxGeometry(1, 1, 1) : new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: isObstacle ? 0xff0000 : 0xffff00 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(lane * 1.6, 0.5, -20);
        this.group.add(mesh);

        if (isObstacle) {
            this.obstacles.push(mesh);
        } else {
            this.collectibles.push(mesh);
        }
    }

    update(dt) {
        if (!this.running) return;

        this.t += dt;
        this.speed = Math.min(14, 6 + 0.02 * this.t);

        if (this.t - this.lastSpawn > Math.random() * 0.5 + 0.9) {
            this.spawnEntity();
            this.lastSpawn = this.t;
        }

        // Vertical movement
        this.vy += this.gravity * dt;
        this.y = Math.max(0, this.y + this.vy * dt);
        if (this.y === 0) this.onGround = true;

        // Sync player mesh
        if (this.player) {
            this.player.position.x = THREE.MathUtils.lerp(this.player.position.x, this.lane * 1.6, dt * 10);
            this.player.position.y = 0.5 + this.y;
        }

        // Move world objects
        const removalThreshold = 5;

        // Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            o.position.z += this.speed * dt;

            // Collision
            if (Math.abs(o.position.z) < 0.8 && Math.abs(o.position.x - this.lane * 1.6) < 0.8 && this.y < 0.8) {
                this.endRun();
                return;
            }

            if (o.position.z > removalThreshold) {
                this.group.remove(o);
                this.obstacles.splice(i, 1);
            }
        }

        // Collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const c = this.collectibles[i];
            c.position.z += this.speed * dt;
            c.rotation.y += dt * 2;

            // Collection
            if (Math.abs(c.position.z) < 0.8 && Math.abs(c.position.x - this.lane * 1.6) < 0.8 && this.y < 0.8) {
                this.stars += 1;
                this.group.remove(c);
                this.collectibles.splice(i, 1);
                // Optional: play sound via callback if needed
                continue;
            }

            if (c.position.z > removalThreshold) {
                this.group.remove(c);
                this.collectibles.splice(i, 1);
            }
        }

        this.callbacks.updateHUD(this.t, this.stars, this.best);

        if (this.t >= 30 && !this.callbacks.isDone('runner_30s')) this.callbacks.awardMilestone('runner_30s');
        if (this.stars >= 3 && !this.callbacks.isDone('runner_3stars')) this.callbacks.awardMilestone('runner_3stars');
    }

    endRun() {
        let improved = false;
        if (this.t > this.best.seconds) { this.best.seconds = this.t; improved = true; }
        if (this.stars > this.best.stars) { this.best.stars = this.stars; improved = true; }

        this.callbacks.saveBest(this.best);

        if (improved && !this.callbacks.isDone('runner_best_update')) {
            this.callbacks.awardMilestone('runner_best_update');
        }

        this.callbacks.showFinish(this.t, this.stars, this.best);
        this.running = false;
    }
}
