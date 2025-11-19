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
        graphics.fillStyle(0x00ff00, 1.0); // Green player
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('player', 32, 32);

        // Create a simple placeholder texture for walls
        graphics.clear();
        graphics.fillStyle(0x555555, 1.0); // Gray wall
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('wall', 32, 32);

        // Create texture for projectile
        graphics.clear();
        graphics.fillStyle(0xffff00, 1.0); // Yellow projectile
        graphics.fillRect(0, 0, 8, 8);
        graphics.generateTexture('projectile', 8, 8);

        // Create texture for enemy
        graphics.clear();
        graphics.fillStyle(0xff0000, 1.0); // Red enemy
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('enemy', 32, 32);

        // Create texture for container
        graphics.clear();
        graphics.fillStyle(0x8B4513, 1.0); // Brown container
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('container', 32, 32);
    }

    create() {
        // Create map (simple bounds)
        this.physics.world.setBounds(0, 0, 1600, 1200);

        // Add some random walls
        this.walls = this.physics.add.staticGroup();
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(100, 1500);
            const y = Phaser.Math.Between(100, 1100);
            this.walls.create(x, y, 'wall').setScale(2).refreshBody();
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

        // Camera follow
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, 1600, 1200);
        this.cameras.main.setZoom(1);

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.collider(this.player, this.enemies); // Just block, no damage

        // Player Projectile collisions
        this.physics.add.collider(this.projectiles, this.walls, (projectile) => {
            projectile.setActive(false);
            projectile.setVisible(false);
        });

        this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
            projectile.setActive(false);
            projectile.setVisible(false);
            enemy.die(); // Use die method to spawn loot
        });

        // Enemy Projectile collisions
        this.physics.add.collider(this.enemyProjectiles, this.walls, (projectile) => {
            projectile.setActive(false);
            projectile.setVisible(false);
        });

        this.physics.add.overlap(this.player, this.enemyProjectiles, (player, projectile) => {
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

        // Spotlight following player
        this.spotlight = this.lights.addLight(this.player.x, this.player.y, 300).setIntensity(2);

        // Apply pipeline to sprites
        this.player.setPipeline('Light2D');
        this.walls.getChildren().forEach(wall => wall.setPipeline('Light2D'));
        this.enemies.getChildren().forEach(enemy => enemy.setPipeline('Light2D'));
        this.lootContainers.getChildren().forEach(c => c.setPipeline('Light2D'));
    }

    update(time, delta) {
        this.player.update();

        // Update spotlight position
        this.spotlight.x = this.player.x;
        this.spotlight.y = this.player.y;

        // Update HP UI
        this.hpText.setText('HP: ' + this.player.hp);
        if (this.player.hp < 30) {
            this.hpText.setColor('#ff0000');
        } else {
            this.hpText.setColor('#00ff00');
        }
    }
}
