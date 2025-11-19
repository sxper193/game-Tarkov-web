import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // Movement speed
        this.speed = 200;

        // Inventory
        this.inventory = [];

        // Health
        this.maxHp = 100;
        this.hp = this.maxHp;

        // Input keys
        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    update() {
        this.handleMovement();
        this.handleRotation();
    }

    handleMovement() {
        this.setVelocity(0);

        let dx = 0;
        let dy = 0;

        if (this.cursors.left.isDown) {
            dx = -1;
        } else if (this.cursors.right.isDown) {
            dx = 1;
        }

        if (this.cursors.up.isDown) {
            dy = -1;
        } else if (this.cursors.down.isDown) {
            dy = 1;
        }

        // Normalize vector to prevent faster diagonal movement
        if (dx !== 0 || dy !== 0) {
            const vec = new Phaser.Math.Vector2(dx, dy).normalize().scale(this.speed);
            this.setVelocity(vec.x, vec.y);
        }
    }

    handleRotation() {
        // Rotate towards mouse pointer
        const pointer = this.scene.input.activePointer;
        // Adjust for camera scroll
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

        const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
        this.setRotation(angle);
    }

    shoot() {
        const projectile = this.scene.projectiles.get();
        if (projectile) {
            projectile.fire(this.x, this.y, this.rotation);
        }
    }

    interact() {
        // Find nearest container
        const containers = this.scene.lootContainers.getChildren();
        let nearest = null;
        let minDist = 100; // Interaction range

        containers.forEach(container => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, container.x, container.y);
            if (dist < minDist) {
                nearest = container;
                minDist = dist;
            }
        });

        if (nearest) {
            // Open inventory with this container
            this.scene.scene.pause('GameScene');
            this.scene.scene.launch('InventoryScene', { player: this, container: nearest });
        } else {
            // Open inventory (player only)
            this.scene.scene.pause('GameScene');
            this.scene.scene.launch('InventoryScene', { player: this, container: null });
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        // Flash red
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        if (this.hp <= 0) {
            this.scene.scene.start('GameOverScene', { won: false });
        }
    }
}
