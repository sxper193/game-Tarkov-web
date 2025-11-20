import Phaser from 'phaser';

export default class LootContainer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, items = []) {
        super(scene, x, y, 'spr_crate'); // Use crate sprite

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(32, 32);
        this.body.setImmovable(true);

        // Items inside the container
        // Item format: { id: 'item_id', color: 0xffffff }
        this.items = items;
    }
}
