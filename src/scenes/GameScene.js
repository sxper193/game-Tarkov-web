import Phaser from 'phaser';
import Player from '../entities/Player';
import Projectile from '../entities/Projectile';
import Enemy from '../entities/Enemy';
import LootContainer from '../entities/LootContainer';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Create a simple placeholder texture for the player
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Create 2.5D Player Texture (Extreme Low Angle)
        graphics.clear();
        graphics.fillStyle(0x00aa00, 1.0); // Darker Green Body
        graphics.fillRect(0, 16, 32, 64); // Very Tall body
        graphics.fillStyle(0x00ff00, 1.0); // Lighter Green Head
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('player', 32, 80); // 80px tall

        // Create 2.5D Wall Texture (Extreme Low Angle)
        graphics.clear();
        // Top Face (Light) - Extremely squashed
        graphics.fillStyle(0x888888, 1.0);
        graphics.fillRect(0, 0, 64, 10);
        // Front Face (Dark) - Extremely Tall
        graphics.fillStyle(0x444444, 1.0);
        graphics.fillRect(0, 10, 64, 190);
        graphics.generateTexture('wall_block', 64, 200);

        // Create texture for projectile
        graphics.clear();
        graphics.fillStyle(0xffff00, 1.0); // Yellow projectile
        graphics.fillRect(0, 0, 8, 8);
        graphics.generateTexture('projectile', 8, 8);

        // Create 2.5D Enemy Texture (Extreme Low Angle)
        graphics.clear();
        graphics.fillStyle(0xaa0000, 1.0); // Darker Red Body
        graphics.fillRect(0, 16, 32, 64);
        graphics.fillStyle(0xff0000, 1.0); // Lighter Red Head
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('enemy', 32, 80);

        // Create texture for container
        graphics.clear();
        graphics.fillStyle(0x8B4513, 1.0); // Brown container
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('container', 32, 32);
    }

    create() {
        // Create map (simple bounds)
        this.physics.world.setBounds(0, 0, 1600, 1200);

        // Add 2.5D Walls
        this.walls = this.physics.add.staticGroup();
        this.wallSprites = this.add.group();

        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(100, 1500);
            const y = Phaser.Math.Between(100, 1100);

            // Physics Body (Invisible Base)
            // Extremely squashed depth (64x16)
            const wall = this.walls.create(x, y, null).setSize(64, 16).setVisible(false);
            wall.refreshBody();

            // Visual Sprite
            // Physics Bottom: y + 8 (height 16, center y)
            // Sprite Height: 200. Center to Bottom: 100.
            // Sprite Y = (y + 8) - 100 = y - 92
            const wallSprite = this.add.image(x, y - 92, 'wall_block');
            wallSprite.setData('sortBottom', y + 8); // Sort by bottom of physics body
            this.wallSprites.add(wallSprite);
        }

        // Create projectile group (Player)
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            maxSize: 30,
            runChildUpdate: true
        });

        // Create projectile group (Enemy)
        this.enemyProjectiles = this.physics.add.group({
            classType: Projectile,
            maxSize: 30,
            runChildUpdate: true
        });

        // Create loot containers group
        this.lootContainers = this.physics.add.group({
            classType: LootContainer
        });

        // Create player
        this.player = new Player(this, 400, 300);

        // Create enemies group
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });

        // Spawn some enemies
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(100, 1500);
            const y = Phaser.Math.Between(100, 1100);
            const enemy = this.enemies.get(x, y);
            if (enemy) {
                enemy.setTarget(this.player);
            }
        }

        // Camera Target (Invisible)
        this.cameraTarget = this.add.image(this.player.x, this.player.y, null).setVisible(false);

        // Camera follow
        this.cameras.main.startFollow(this.cameraTarget, true, 0.05, 0.05); // Smooth follow
        this.cameras.main.setBounds(0, 0, 1600, 1200);
        this.cameras.main.setZoom(2.5);

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.collider(this.player, this.enemies); // Just block, no damage

        // Player Projectile collisions
        this.physics.add.collider(this.projectiles, this.walls, (projectile) => {
            this.emitHit(projectile.x, projectile.y);
            projectile.setActive(false);
            projectile.setVisible(false);
        });

        this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
            this.emitBlood(enemy.x, enemy.y);
            projectile.setActive(false);
            projectile.setVisible(false);
            enemy.die(); // Use die method to spawn loot
        });

        // Enemy Projectile collisions
        this.physics.add.collider(this.enemyProjectiles, this.walls, (projectile) => {
            this.emitHit(projectile.x, projectile.y);
            projectile.setActive(false);
            projectile.setVisible(false);
        });

        this.physics.add.overlap(this.player, this.enemyProjectiles, (player, projectile) => {
            this.emitBlood(player.x, player.y);
            projectile.setActive(false);
            projectile.setVisible(false);
            player.takeDamage(10);
        });

        // Grid for visual reference
        this.add.grid(800, 600, 1600, 1200, 32, 32, 0x000000, 0, 0x222222, 1).setPipeline('Light2D');

        // Input for shooting
        this.input.on('pointerdown', () => {
            this.player.shoot();
        });

        // Input for interaction
        this.input.keyboard.on('keydown-F', () => {
            this.player.interact();
        });

        // Extraction Zone
        this.extractionZone = this.add.rectangle(1500, 1100, 100, 100, 0x0000ff, 0.5);
        this.physics.add.existing(this.extractionZone, true);

        // Overlap for extraction
        this.physics.add.overlap(this.player, this.extractionZone, () => {
            this.scene.start('GameOverScene', { won: true });
        });

        // Collision for enemy attack
        // this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
        //     enemy.attack(player);
        // });

        // UI: Health Bar
        this.hpText = this.add.text(20, 20, 'HP: 100', { fontSize: '24px', color: '#00ff00' });
        this.hpText.setScrollFactor(0); // Fix to screen

        // LIGHTING
        this.lights.enable();
        this.lights.setAmbientColor(0x111111); // Dark ambient

        // Generate Flashlight Texture (Procedural)
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 0.1);
        // Draw a triangle pointing right, centered vertically in the 200px height
        // Tip at (0, 100), Top-Right at (300, 0), Bottom-Right at (300, 200)
        graphics.fillTriangle(0, 100, 300, 0, 300, 200);
        graphics.fillGradientStyle(0xffffff, 0xffffff, 0x000000, 0x000000, 0.5, 0.5, 0, 0);
        graphics.generateTexture('flashlight', 300, 200);

        // Flashlight Beam Sprite (Fake Volumetric)
        this.flashlightBeam = this.add.image(this.player.x, this.player.y, 'flashlight');
        this.flashlightBeam.setOrigin(0, 0.5); // Origin at the player
        this.flashlightBeam.setBlendMode(Phaser.BlendModes.ADD);
        this.flashlightBeam.setAlpha(0.3);
        this.flashlightBeam.setDepth(10000); // Always on top of floor, but sorted? No, light should be above everything or additive.

        // Spotlight (Actual Light) - Reduced radius, higher intensity for center
        this.spotlight = this.lights.addLight(this.player.x, this.player.y, 400).setIntensity(1.5);

        // PARTICLES
        // Hit Effect (Sparks/Dust)
        const particleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        particleGraphics.fillStyle(0xffaa00, 1);
        particleGraphics.fillRect(0, 0, 4, 4);
        particleGraphics.generateTexture('particle_spark', 4, 4);

        this.hitEmitter = this.add.particles(0, 0, 'particle_spark', {
            lifespan: 300,
            speed: { min: 100, max: 200 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            emitting: false
        });

        // Blood Effect
        const bloodGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        bloodGraphics.fillStyle(0xcc0000, 1);
        bloodGraphics.fillCircle(4, 4, 4);
        bloodGraphics.generateTexture('particle_blood', 8, 8);

        this.bloodEmitter = this.add.particles(0, 0, 'particle_blood', {
            lifespan: 500,
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0.5 },
            alpha: { start: 1, end: 0 },
            emitting: false
        });

        // Apply pipeline to sprites
        this.player.setPipeline('Light2D');
        this.wallSprites.getChildren().forEach(wall => wall.setPipeline('Light2D'));
        this.enemies.getChildren().forEach(enemy => enemy.setPipeline('Light2D'));
        this.lootContainers.getChildren().forEach(c => c.setPipeline('Light2D'));
    }

    update(time, delta) {
        this.player.update();

        // Update Camera Target (Look ahead)
        const lookAheadDist = 150;
        const targetX = this.player.x + Math.cos(this.player.rotation) * lookAheadDist;
        const targetY = this.player.y + Math.sin(this.player.rotation) * lookAheadDist;

        // Lerp camera target for smoothness
        this.cameraTarget.x = Phaser.Math.Linear(this.cameraTarget.x, targetX, 0.1);
        this.cameraTarget.y = Phaser.Math.Linear(this.cameraTarget.y, targetY, 0.1);

        // Update spotlight and beam position
        this.spotlight.x = this.player.x;
        this.spotlight.y = this.player.y;

        this.flashlightBeam.x = this.player.x;
        this.flashlightBeam.y = this.player.y;
        this.flashlightBeam.rotation = this.player.rotation;

        // Update HP UI
        this.hpText.setText('HP: ' + this.player.hp);
        if (this.player.hp < 30) {
            this.hpText.setColor('#ff0000');
        } else {
            this.hpText.setColor('#00ff00');
        }

        // DEPTH SORTING
        // Sort Walls
        this.wallSprites.getChildren().forEach(wall => {
            wall.setDepth(wall.getData('sortBottom'));
        });
        // Sort Player (Bottom of sprite)
        // Sprite is 80px tall. Center is 40. Bottom is y + 40.
        this.player.setDepth(this.player.y + 40);
        // Sort Enemies
        this.enemies.getChildren().forEach(enemy => {
            enemy.setDepth(enemy.y + 40);
        });
        // Sort Loot
        this.lootContainers.getChildren().forEach(loot => {
            loot.setDepth(loot.y + 16);
        });
        // Sort Projectiles
        this.projectiles.getChildren().forEach(p => p.setDepth(p.y));
        this.enemyProjectiles.getChildren().forEach(p => p.setDepth(p.y));

        // Flashlight beam should be above floor but below walls?
        // Actually, light beam is additive, so it can be high depth or handled by pipeline.
        // For now, let's keep it high.
        this.flashlightBeam.setDepth(this.player.depth + 1);
    }

    emitHit(x, y) {
        this.hitEmitter.emitParticleAt(x, y, 5);
    }

    emitBlood(x, y) {
        this.bloodEmitter.emitParticleAt(x, y, 10);
    }
}
