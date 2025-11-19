import Phaser from 'phaser';
import LootContainer from './LootContainer';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
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
            this.scene.physics.moveToObject(this, this.target, this.speed);
            this.setRotation(Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y));

            // Shoot if close enough
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
