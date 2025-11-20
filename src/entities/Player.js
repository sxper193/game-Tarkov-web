import Phaser from 'phaser';
import Weapon from './Weapon.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_body'); // Main physics body is the torso/vest

        this.scene = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Physics Setup
        this.setCollideWorldBounds(true);
        this.body.setSize(24, 24);
        this.body.setOffset(4, 0); // Center in 32x24 sprite

        // Movement Stats
        this.maxSpeed = 200;
        this.acceleration = 800; // High acceleration for responsiveness
        this.drag = 1000; // High drag for quick stops

        this.body.setMaxVelocity(this.maxSpeed);
        this.body.setDrag(this.drag);

        // Game Stats
        this.hp = 100;
        this.maxHp = 100;
        this.inventory = [];

        // --- VISUAL PARTS ---
        // We create other sprites but DO NOT give them physics bodies. 
        // They will follow the main body in update().

        // 1. Left Arm
        this.leftArm = scene.add.sprite(x, y, 'player_arm');
        this.leftArm.setOrigin(0.5, 0.5);
        this.leftArm.setDepth(this.depth + 1);

        // 2. Right Arm
        this.rightArm = scene.add.sprite(x, y, 'player_arm');
        this.rightArm.setOrigin(0.5, 0.5);
        this.rightArm.setDepth(this.depth + 1);

        // 3. Head
        this.head = scene.add.sprite(x, y, 'player_head');
        this.head.setOrigin(0.5, 0.5);
        this.head.setDepth(this.depth + 2); // Above arms/body

        // 4. Weapon
        this.weaponSprite = scene.add.sprite(x, y, 'weapon_rifle');
        this.weaponSprite.setOrigin(0.2, 0.5); // Pivot at stock
        this.weaponSprite.setDepth(this.depth + 1.5); // Between arms and head

        // Initialize Weapon Logic
        this.equippedWeapon = new Weapon(scene, x, y, {
            name: 'Assault Rifle',
            damage: 10,
            fireRate: 100,
            spread: 5,
            maxAmmo: 30,
            reloadTime: 2000,
            automatic: true
        });
        // Hide the weapon's internal sprite since we are handling visuals in Player parts?
        // Or better, let's just use the logic. The Weapon class creates a sprite but we might ignore it or hide it.
        // For now, let's just fix the crash.
        this.equippedWeapon.setVisible(false); // Hide it because Player has its own weaponSprite part

        // Input
        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });
    }

    update(time, delta) {
        // 1. MOVEMENT (Physics)
        this.handleMovement();

        // 2. ROTATION (Aiming)
        this.handleRotation();

        // 3. VISUAL SYNC
        this.syncVisuals();

        // 4. WEAPON
        this.equippedWeapon.update(time);
    }

    handleMovement() {
        const { up, down, left, right, shift } = this.cursors;

        // Sprint Logic
        const isSprinting = shift.isDown;
        const currentMaxSpeed = isSprinting ? this.maxSpeed * 1.5 : this.maxSpeed;
        this.body.setMaxVelocity(currentMaxSpeed);

        // Acceleration
        let ax = 0;
        let ay = 0;

        if (left.isDown) ax = -this.acceleration;
        else if (right.isDown) ax = this.acceleration;

        if (up.isDown) ay = -this.acceleration;
        else if (down.isDown) ay = this.acceleration;

        // Normalize diagonal acceleration
        if (ax !== 0 && ay !== 0) {
            const length = Math.sqrt(ax * ax + ay * ay);
            ax = (ax / length) * this.acceleration;
            ay = (ay / length) * this.acceleration;
        }

        this.setAcceleration(ax, ay);

        // Stop if no input (Drag handles the rest, but we can force 0 accel)
        if (ax === 0 && ay === 0) {
            this.setAcceleration(0, 0);
        }
    }

    handleRotation() {
        const pointer = this.scene.input.activePointer;
        // Calculate target angle (Mouse)
        // Adjust for camera scroll if needed, but worldX/worldY usually handles it
        const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);

        // 1. Head & Weapon: Instant tracking
        this.head.rotation = targetAngle;
        this.weaponSprite.rotation = targetAngle;

        // 2. Body: Lagged rotation (Turn speed)
        // Lerp current rotation to target
        const lerpFactor = 0.1; // Adjust for turn speed
        this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, targetAngle, lerpFactor);
    }

    syncVisuals() {
        // Sync parts to main body position
        this.head.setPosition(this.x, this.y);

        // Weapon Offset (Slightly forward)
        const weaponOffset = 10;
        this.weaponSprite.setPosition(
            this.x + Math.cos(this.rotation) * weaponOffset,
            this.y + Math.sin(this.rotation) * weaponOffset
        );

        // Arms Positioning
        // Calculate arm positions based on body rotation
        const shoulderWidth = 12;
        const armOffsetForward = 5;

        // Left Arm
        const leftAngle = this.rotation - Math.PI / 2;
        this.leftArm.setPosition(
            this.x + Math.cos(leftAngle) * shoulderWidth + Math.cos(this.rotation) * armOffsetForward,
            this.y + Math.sin(leftAngle) * shoulderWidth + Math.sin(this.rotation) * armOffsetForward
        );
        this.leftArm.rotation = this.rotation; // Arms align with body generally

        // Right Arm
        const rightAngle = this.rotation + Math.PI / 2;
        this.rightArm.setPosition(
            this.x + Math.cos(rightAngle) * shoulderWidth + Math.cos(this.rotation) * armOffsetForward,
            this.y + Math.sin(rightAngle) * shoulderWidth + Math.sin(this.rotation) * armOffsetForward
        );
        this.rightArm.rotation = this.rotation;

        // Depth Sorting (Dynamic)
        this.setDepth(this.y);
        this.head.setDepth(this.depth + 2);
        this.weaponSprite.setDepth(this.depth + 1.5);
        this.leftArm.setDepth(this.depth + 1);
        this.rightArm.setDepth(this.depth + 1);
    }

    shoot(time) {
        // Pass the weapon sprite tip as the fire point
        // Tip is roughly 40px from weapon origin
        const tipDist = 40;
        const fireX = this.weaponSprite.x + Math.cos(this.weaponSprite.rotation) * tipDist;
        const fireY = this.weaponSprite.y + Math.sin(this.weaponSprite.rotation) * tipDist;

        this.equippedWeapon.fire(fireX, fireY, this.weaponSprite.rotation, time);

        // Visual Recoil (Kick back)
        this.scene.tweens.add({
            targets: this.weaponSprite,
            x: this.weaponSprite.x - Math.cos(this.weaponSprite.rotation) * 5,
            y: this.weaponSprite.y - Math.sin(this.weaponSprite.rotation) * 5,
            duration: 50,
            yoyo: true
        });
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
            // Die logic
            this.scene.scene.start('GameOverScene', { won: false });
        }
    }

    interact() {
        // Interaction logic (e.g., check for nearby loot)
        console.log("Interacting...");
    }

    destroy() {
        // Clean up parts
        if (this.head) this.head.destroy();
        if (this.leftArm) this.leftArm.destroy();
        if (this.rightArm) this.rightArm.destroy();
        if (this.weaponSprite) this.weaponSprite.destroy();
        super.destroy();
    }
}
