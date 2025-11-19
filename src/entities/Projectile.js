import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'projectile');
    }

    fire(x, y, angle) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setRotation(angle);

        const speed = 600;
        this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Destroy if out of bounds (simple check, can be improved)
        if (this.x < 0 || this.x > 1600 || this.y < 0 || this.y > 1200) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}
