import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'projectile');
    }

    fire(x, y, rotation, speed = 800, damage = 10, properties = {}) {
        this.enableBody(true, x, y, true, true);
        this.setVisible(true);
        this.setActive(true);
        this.setRotation(rotation);

        // Ballistics Properties
        this.damage = damage;
        this.speed = speed;
        this.initialSpeed = speed;

        // Height Simulation (Z-axis)
        this.height = properties.height || 1.5; // Meters (approx)
        this.verticalSpeed = 0;
        this.gravity = 9.8; // m/s^2

        // Physics Properties
        this.penetrationPower = properties.penetration || 10; // 0-100
        this.drag = properties.drag || 0.995; // Air resistance per frame

        // Set velocity
        this.scene.physics.velocityFromRotation(rotation, speed, this.body.velocity);

        // Set depth based on Y (simple sort)
        this.setDepth(this.y);

        // VISIBILITY IN DARK
        // By default, if we don't set the Light2D pipeline, it renders at full brightness.
        // But if the scene has a global dark layer, we might need to be on top of it.
        // For now, let's assume removing the pipeline (or never setting it) is enough.
        this.resetPipeline(); // Ensure no light pipeline is active

        // Trail effect (Optional, simple line for now)
        this.startX = x;
        this.startY = y;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // 1. Drag (Air Resistance)
        this.body.velocity.scale(this.drag);

        // 2. Gravity (Fake Z-axis)
        // Convert delta to seconds for physics calc
        const dt = delta / 1000;
        this.verticalSpeed -= this.gravity * dt;
        this.height += this.verticalSpeed * dt;

        // 3. Ground Hit Check
        if (this.height <= 0) {
            this.hitGround();
        }

        // 4. Out of bounds check
        if (this.x < 0 || this.x > 2000 || this.y < 0 || this.y > 2000) {
            this.setActive(false);
            this.setVisible(false);
        }

        // Update depth
        this.setDepth(this.y);
    }

    hitGround() {
        // Spawn dust particle
        // this.scene.emitDust(this.x, this.y);
        this.setActive(false);
        this.setVisible(false);
    }

    hitObstacle(obstacle) {
        // Default material if missing
        const material = obstacle.material || { hardness: 50, damageReduction: 0.5, color: 0x888888 };

        // Visual Feedback
        if (this.scene && this.scene.emitHit) {
            this.scene.emitHit(this.x, this.y);
        }

        // 1. Ricochet Check - REMOVED
        // User requested to remove ricochet.

        // 2. Penetration Check
        // If penetration power is LESS than hardness, we stop.
        if (this.penetrationPower < material.hardness) {
            // Blocked completely
            this.setActive(false);
            this.setVisible(false);
            this.body.stop(); // Stop physics
        } else {
            // Penetrate
            this.penetrationPower -= material.hardness;
            this.damage *= (1 - material.damageReduction);
            this.speed *= (1 - material.damageReduction);

            this.body.velocity.normalize().scale(this.speed);

            if (this.speed < 50 || this.damage < 1) {
                this.setActive(false);
                this.setVisible(false);
                this.body.stop();
            }
        }
    }
}
