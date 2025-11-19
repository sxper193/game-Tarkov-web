import Phaser from 'phaser';
import LootContainer from './LootContainer';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setSize(32, 16); // Extremely squashed body
        this.body.setOffset(0, 64); // Align body with visual "feet"
        this.speed = 100;
        this.target = null;
        this.lastAttackTime = 0;
    }

    setTarget(target) {
        this.target = target;
    }

    update() {
        if (!this.target || !this.active) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        if (distance < 400) {
            // Chase
            // Basic direction to target
            let angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);

            // OBSTACLE AVOIDANCE (Steering)
            const lookAhead = 50;
            const leftRay = new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(angle - 0.5) * lookAhead, this.y + Math.sin(angle - 0.5) * lookAhead);
            const rightRay = new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(angle + 0.5) * lookAhead, this.y + Math.sin(angle + 0.5) * lookAhead);
            const centerRay = new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(angle) * lookAhead, this.y + Math.sin(angle) * lookAhead);

            let avoidanceForce = 0;
            const walls = this.scene.walls.getChildren();

            // Simple raycast check against wall bounds
            for (let wall of walls) {
                const bounds = wall.getBounds();
                if (Phaser.Geom.Intersects.LineToRectangle(leftRay, bounds)) {
                    avoidanceForce += 0.5; // Steer right
                }
                if (Phaser.Geom.Intersects.LineToRectangle(rightRay, bounds)) {
                    avoidanceForce -= 0.5; // Steer left
                }
                if (Phaser.Geom.Intersects.LineToRectangle(centerRay, bounds)) {
                    avoidanceForce += (Math.random() > 0.5 ? 1 : -1); // Steer random
                }
            }

            angle += avoidanceForce;

            // DODGE LOGIC
            // Check if player is aiming at me
            const playerAngle = this.target.rotation;
            const angleToEnemy = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.x, this.y);
            const angleDiff = Phaser.Math.Angle.Wrap(playerAngle - angleToEnemy);

            if (Math.abs(angleDiff) < 0.2 && distance < 250 && Math.random() < 0.02) {
                // Player is aiming at me! Dodge!
                angle += (Math.random() > 0.5 ? 1.5 : -1.5); // Dash side
            }

            // Apply velocity
            this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            this.setRotation(angle);

            // Shoot if close enough (and roughly facing target)
            if (distance < 300) {
                this.shoot();
            }
        } else {
            // Idle
            this.setVelocity(0);
        }
    }

    die() {
        // Spawn loot container
        const items = [
            { id: 'loot_' + Date.now(), color: Phaser.Display.Color.RandomRGB().color }
        ];

        const container = this.scene.lootContainers.get(this.x, this.y);
        if (container) {
            container.setActive(true);
            container.setVisible(true);
            container.body.reset(this.x, this.y);
            container.items = items;
        }

        this.destroy();
    }

    shoot() {
        const now = this.scene.time.now;
        if (now - this.lastAttackTime > 2000) { // 2 second cooldown
            const projectile = this.scene.enemyProjectiles.get();
            if (projectile) {
                projectile.setTint(0xffa500); // Orange color for enemy bullets
                projectile.fire(this.x, this.y, this.rotation);
            }
            this.lastAttackTime = now;
        }
    }
}
