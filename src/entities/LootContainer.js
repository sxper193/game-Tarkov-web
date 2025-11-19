import Phaser from 'phaser';

export default class LootContainer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, items = []) {
        super(scene, x, y, 'container');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // Items inside the container
        // Item format: { id: 'item_id', color: 0xffffff }
        this.items = items;
    }
}
