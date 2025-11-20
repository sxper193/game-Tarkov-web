import Phaser from 'phaser';
import { MATERIALS } from '../utils/Materials';

export default class Obstacle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, material = MATERIALS.CONCRETE) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body

        this.material = material;

        // Apply material visual hint (tint) if needed, though texture usually dictates look
        // this.setTint(this.material.color);
    }

    // Helper to check if this obstacle blocks vision
    blocksVision() {
        return this.material.opacity > 0.5;
    }
}
