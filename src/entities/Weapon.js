import Phaser from 'phaser';

export default class Weapon extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        scene.add.existing(this);

        this.name = config.name || 'Weapon';
        this.damage = config.damage || 10;
        this.fireRate = config.fireRate || 100; // ms between shots
        this.spread = config.spread || 0; // degrees
        this.recoil = config.recoil || 0; // visual kickback
        this.bulletSpeed = config.bulletSpeed || 3000;
        this.maxAmmo = config.maxAmmo || 30;
        this.reloadTime = config.reloadTime || 2000; // ms
        this.automatic = config.automatic !== undefined ? config.automatic : true;

        this.currentAmmo = this.maxAmmo;
        this.lastFired = 0;
        this.isReloading = false;

        // Visuals
        this.sprite = scene.add.sprite(0, 0, 'weapon_rifle'); // Default texture
        this.sprite.setOrigin(0, 0.5); // Pivot at the handle/back
        this.add(this.sprite);

        // Muzzle flash (hidden by default)
        this.muzzleFlash = scene.add.sprite(30, 0, 'particle_spark'); // Placeholder
        this.muzzleFlash.setVisible(false);
        this.muzzleFlash.setScale(2);
        this.add(this.muzzleFlash);
    }

    fire(x, y, rotation, time) {
        if (this.isReloading || this.currentAmmo <= 0) {
            if (this.currentAmmo <= 0 && !this.isReloading) {
                this.reload();
            }
            return false;
        }

        if (time < this.lastFired + this.fireRate) {
            return false;
        }

        this.lastFired = time;
        this.currentAmmo--;

        // Calculate spread
        const spreadAngle = Phaser.Math.FloatBetween(-this.spread, this.spread);
        const finalRotation = rotation + Phaser.Math.DegToRad(spreadAngle);

        // Spawn projectile
        const projectile = this.scene.projectiles.get();
        if (projectile) {
            projectile.fire(x, y, finalRotation, this.bulletSpeed, this.damage, {
                penetration: 20, // Default rifle penetration
                drag: 0.99 // Low drag for rifle
            });

            // Emit Gunshot Sound
            this.scene.emitSound(x, y, 'gunshot');
        }

        // Muzzle flash effect
        this.muzzleFlash.setVisible(true);
        this.muzzleFlash.setAlpha(1);
        this.scene.time.delayedCall(50, () => {
            this.muzzleFlash.setVisible(false);
        });

        // Recoil (Visual kickback)
        this.sprite.x = -5;
        this.scene.tweens.add({
            targets: this.sprite,
            x: 0,
            duration: 50,
            ease: 'Linear'
        });

        return true;
    }

    reload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo) return;

        this.isReloading = true;
        console.log('Reloading...');

        // Visual indicator (optional, maybe text or animation)

        this.scene.time.delayedCall(this.reloadTime, () => {
            this.currentAmmo = this.maxAmmo;
            this.isReloading = false;
            console.log('Reloaded!');
        });
    }

    update(time, delta) {
        // Handle any continuous updates if needed
    }
}
