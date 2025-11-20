import Phaser from 'phaser';
import Player from '../entities/Player';
import Projectile from '../entities/Projectile';
import Enemy from '../entities/Enemy';
import LootContainer from '../entities/LootContainer';
import Obstacle from '../entities/Obstacle';
import { MATERIALS } from '../utils/Materials';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // --- PROCEDURAL TEXTURE GENERATION ---

        // 1. Player Parts (Tactical Top-Down)
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Body (Vest)
        graphics.clear();
        graphics.fillStyle(0x2e8b57, 1.0); // SeaGreen tactical vest
        graphics.fillRoundedRect(0, 0, 32, 24, 8); // Rectangular body
        graphics.generateTexture('player_body', 32, 24);

        // Head (Helmet)
        graphics.clear();
        graphics.fillStyle(0x1a1a1a, 1.0); // Dark Grey Helmet
        graphics.fillCircle(12, 12, 12);
        // Goggles/Visor
        graphics.fillStyle(0x444444, 1.0);
        graphics.fillRect(6, 2, 12, 6);
        graphics.generateTexture('player_head', 24, 24);

        // Arm (Single)
        graphics.clear();
        graphics.fillStyle(0x2e8b57, 1.0); // Sleeves
        graphics.fillCircle(8, 8, 8);
        // Hand
        graphics.fillStyle(0xd2b48c, 1.0); // Skin color
        graphics.fillCircle(8, 14, 6);
        graphics.generateTexture('player_arm', 16, 20);

        // 2. Enemy (Bandit)
        graphics.clear();
        graphics.fillStyle(0x8b0000, 1.0); // Dark Red Shirt
        graphics.fillCircle(16, 16, 16);
        graphics.fillStyle(0x333333, 1.0); // Black Balaclava
        graphics.fillCircle(16, 16, 10);
        graphics.generateTexture('enemy', 32, 32);

        // 3. Wall (Concrete Block)
        graphics.clear();
        graphics.fillStyle(0x888888, 1.0); // Grey Top
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0x666666, 1.0); // Darker Side
        graphics.fillRect(0, 60, 64, 4);
        graphics.generateTexture('wall_block', 64, 64);

        // 4. Projectile (Long Cylinder / Tracer)
        graphics.clear();
        graphics.fillStyle(0xffd700, 1.0); // Gold/Yellow
        graphics.fillRoundedRect(0, 0, 20, 4, 2); // Long thin bullet
        graphics.generateTexture('projectile', 20, 4);

        // 5. Weapon (Rifle)
        graphics.clear();
        graphics.fillStyle(0x111111, 1.0); // Black Body
        graphics.fillRect(0, 0, 40, 8);
        graphics.fillStyle(0x5c4033, 1.0); // Brown Stock
        graphics.fillRect(-10, 0, 10, 8);
        graphics.generateTexture('weapon_rifle', 50, 8);

        // 6. Flashlight Texture (Procedural Soft Cone)
        // We generate this pixel-by-pixel to get a perfect soft falloff without sharp edges.
        const width = 512;
        const height = 512;
        const texture = this.textures.createCanvas('flashlight', width, height);
        const ctx = texture.getContext();
        const imgData = ctx.createImageData(width, height);
        const data = imgData.data;

        const centerY = height / 2;
        const maxDist = width; // Light range
        const maxAngle = Math.PI / 4; // 45 degrees spread (Wider)

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;

                // 1. Distance Falloff
                const dx = x;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > maxDist) {
                    data[index + 3] = 0; // Transparent
                    continue;
                }

                // 2. Angle Falloff
                const angle = Math.atan2(dy, dx);
                if (Math.abs(angle) > maxAngle) {
                    data[index + 3] = 0;
                    continue;
                }

                // Calculate Intensity
                // Distance factor: Linear fade + slight curve
                const distFactor = 1 - (dist / maxDist);

                // Angle factor: Cubic fade for soft edges (1 at center, 0 at maxAngle)
                const angleRatio = Math.abs(angle) / maxAngle;
                const angleFactor = Math.pow(1 - angleRatio, 3);

                // Combine
                let alpha = distFactor * angleFactor * 255;

                // Boost center brightness
                alpha = Math.min(255, alpha * 1.5);

                // Set Pixel (White with Alpha)
                data[index] = 255;     // R
                data[index + 1] = 255; // G
                data[index + 2] = 255; // B
                data[index + 3] = Math.floor(alpha); // A
            }
        }

        ctx.putImageData(imgData, 0, 0);
        texture.refresh();

        // --- ENVIRONMENT (Procedural) ---

        // 7. Grass Tile (Noise)
        graphics.clear();
        graphics.fillStyle(0x1a3300, 1.0); // Dark Green Base
        graphics.fillRect(0, 0, 64, 64);
        // Add Noise
        for (let i = 0; i < 100; i++) {
            graphics.fillStyle(0x264d00, Phaser.Math.FloatBetween(0.3, 0.8));
            graphics.fillRect(Phaser.Math.Between(0, 64), Phaser.Math.Between(0, 64), 2, 2);
        }
        graphics.generateTexture('tile_grass', 64, 64);

        // 8. Road Tile (Asphalt)
        graphics.clear();
        graphics.fillStyle(0x333333, 1.0); // Dark Grey
        graphics.fillRect(0, 0, 64, 64);
        // Noise
        for (let i = 0; i < 50; i++) {
            graphics.fillStyle(0x444444, 0.5);
            graphics.fillRect(Phaser.Math.Between(0, 64), Phaser.Math.Between(0, 64), 2, 2);
        }
        graphics.generateTexture('tile_road', 64, 64);

        // 9. Tree (Stylized)
        graphics.clear();
        graphics.fillStyle(0x000000, 0.4); // Shadow
        graphics.fillCircle(40, 40, 30);
        graphics.fillStyle(0x004d00, 1.0); // Dark Leaves
        graphics.fillCircle(40, 40, 32); // Centered at 40,40
        graphics.fillStyle(0x006600, 1.0); // Light Leaves
        graphics.fillCircle(40, 40, 24); // Centered at 40,40
        graphics.generateTexture('spr_tree', 80, 80);

        // 10. Roof (Simple)
        graphics.clear();
        graphics.fillStyle(0x800000, 1.0); // Maroon
        graphics.fillRect(0, 0, 200, 150);
        graphics.fillStyle(0x500000, 1.0); // Ridge
        graphics.fillRect(0, 70, 200, 10);
        graphics.generateTexture('spr_roof', 200, 150);

        // 11. Crate
        graphics.clear();
        graphics.fillStyle(0x8b4513, 1.0); // SaddleBrown
        graphics.fillRect(0, 0, 32, 32);
        graphics.lineStyle(2, 0x5c2e0e);
        graphics.strokeRect(0, 0, 32, 32);
        graphics.lineBetween(0, 0, 32, 32);
        graphics.lineBetween(32, 0, 0, 32);
        graphics.generateTexture('spr_crate', 32, 32);

        // 12. Car (Top Down)
        graphics.clear();
        graphics.fillStyle(0x333333, 1.0); // Dark Grey Body
        graphics.fillRoundedRect(0, 0, 100, 50, 10);
        graphics.fillStyle(0x111111, 1.0); // Windshield
        graphics.fillRect(70, 5, 20, 40);
        graphics.fillStyle(0xcc0000, 1.0); // Tail lights
        graphics.fillRect(0, 5, 5, 10);
        graphics.fillRect(0, 35, 5, 10);
        graphics.generateTexture('spr_car', 100, 50);

        // 12b. Car Vertical (Top Down)
        graphics.clear();
        graphics.fillStyle(0x333333, 1.0); // Dark Grey Body
        graphics.fillRoundedRect(0, 0, 50, 100, 10);
        graphics.fillStyle(0x111111, 1.0); // Windshield
        graphics.fillRect(5, 70, 40, 20);
        graphics.fillStyle(0xcc0000, 1.0); // Tail lights
        graphics.fillRect(5, 0, 10, 5);
        graphics.fillRect(35, 0, 10, 5);
        graphics.generateTexture('spr_car_vertical', 50, 100);

        // 13. Barrel (Metal)
        graphics.clear();
        graphics.fillStyle(0x555555, 1.0); // Grey Metal
        graphics.fillCircle(16, 16, 16);
        graphics.lineStyle(2, 0x333333);
        graphics.strokeCircle(16, 16, 16);
        graphics.generateTexture('spr_barrel', 32, 32);
    }

    create() {
        console.log('GameScene: create started');

        // Create map (simple bounds)
        this.physics.world.setBounds(0, 0, 2000, 2000);
        this.cameras.main.setBounds(0, 0, 2000, 2000);

        // --- MAP GENERATION ---

        // 1. Ground Layer (Grass everywhere)
        this.add.tileSprite(1000, 1000, 2000, 2000, 'tile_grass').setDepth(-100).setPipeline('Light2D');

        // 2. Roads (Grid)
        const roadWidth = 128; // 2 tiles wide
        const blockSize = 500;
        const roads = this.add.group();

        // Horizontal Roads
        for (let y = 250; y < 2000; y += blockSize) {
            const road = this.add.tileSprite(1000, y, 2000, 64, 'tile_road');
            road.setRotation(Math.PI / 2); // Rotate texture to match? No, just stretch.
            // Actually tile_road is vertical dash. For horizontal road, we want horizontal dash.
            // Let's just use it as is for now, maybe rotate the sprite 90 deg?
            // TileSprite rotation rotates the whole strip.
            road.setAngle(90);
            road.setDepth(-99).setPipeline('Light2D');
        }

        // Vertical Roads
        for (let x = 250; x < 2000; x += blockSize) {
            const road = this.add.tileSprite(x, 1000, 64, 2000, 'tile_road');
            road.setDepth(-98).setPipeline('Light2D');
        }

        // 3. Objects Groups
        this.walls = this.physics.add.staticGroup({
            classType: Obstacle
        });
        this.wallSprites = this.add.group();
        this.trees = this.physics.add.staticGroup({
            classType: Obstacle
        }); // Trees are obstacles
        this.metalObstacles = this.physics.add.staticGroup({
            classType: Obstacle
        }); // Cars, Barrels

        // 4. Populate Blocks (Houses & Trees)
        for (let x = 0; x < 2000; x += 64) {
            for (let y = 0; y < 2000; y += 64) {
                // Check if on road (Simple distance check to grid lines)
                const distToVertRoad = Math.abs((x % blockSize) - 250);
                const distToHorzRoad = Math.abs((y % blockSize) - 250);

                const isRoad = distToVertRoad < 50 || distToHorzRoad < 50;

                if (isRoad) {
                    // Place Cars on Road (Rare)
                    if (Phaser.Math.FloatBetween(0, 1) < 0.02) {
                        let car;
                        if (distToVertRoad < 50) {
                            // Vertical Road
                            car = this.metalObstacles.create(x, y, 'spr_car_vertical');
                            car.setSize(40, 80); // Body size
                            car.setOffset(5, 10); // Center body in 50x100 sprite
                        } else {
                            // Horizontal Road
                            car = this.metalObstacles.create(x, y, 'spr_car');
                            car.setSize(80, 40); // Body size
                            car.setOffset(10, 5); // Center body in 100x50 sprite
                        }

                        car.material = MATERIALS.METAL;
                        car.refreshBody();
                        this.wallSprites.add(car);
                    }
                } else {
                    // Random generation
                    const rand = Phaser.Math.FloatBetween(0, 1);

                    // House Placement (Rare, big)
                    // Only place if enough space and random chance
                    if (rand < 0.005) {
                        // Place House (4x4 tiles approx)
                        const houseX = x;
                        const houseY = y;

                        // Physics Body (Walls)
                        const houseW = 180;
                        const houseH = 130;
                        const wall = this.walls.create(houseX, houseY, null);
                        wall.setSize(houseW, houseH).setVisible(false);
                        wall.material = MATERIALS.CONCRETE; // Set Material
                        wall.refreshBody();

                        // Visual (Roof)
                        // Roof should be higher than ground.
                        // Sort bottom = houseY + houseH/2
                        const roof = this.add.image(houseX, houseY - 20, 'spr_roof');
                        roof.setData('sortBottom', houseY + houseH / 2);
                        this.wallSprites.add(roof);
                    }
                    // Tree Placement (Common)
                    else if (rand > 0.9) {
                        const tree = this.trees.create(x + Phaser.Math.Between(-20, 20), y + Phaser.Math.Between(-20, 20), null);
                        tree.setCircle(10); // Radius 10 (Diameter 20)
                        tree.setOffset(30, 30); // Center in 80x80 sprite
                        tree.setVisible(false);
                        tree.material = MATERIALS.WOOD; // Trees are wood
                        tree.refreshBody();

                        const treeSpr = this.add.image(tree.x, tree.y - 30, 'spr_tree');
                        treeSpr.setData('sortBottom', tree.y + 20);
                        this.wallSprites.add(treeSpr);
                    }
                    // Barrel Placement (Scattered)
                    else if (rand > 0.88 && rand < 0.9) {
                        const barrel = this.metalObstacles.create(x, y, 'spr_barrel');
                        barrel.setCircle(12); // Radius 12 (Diameter 24)
                        barrel.setOffset(4, 4); // Center in 32x32 sprite
                        barrel.material = MATERIALS.METAL;
                        barrel.refreshBody();
                        this.wallSprites.add(barrel);
                    }
                }
            }
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
        this.cameras.main.setBounds(0, 0, 2000, 2000);
        this.cameras.main.setZoom(1.5);

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.player, this.metalObstacles);
        this.physics.add.collider(this.enemies, this.metalObstacles);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.collider(this.player, this.enemies); // Just block, no damage

        // Player Projectile collisions
        // Projectile vs Obstacles
        this.physics.add.collider(this.projectiles, this.walls, (projectile, wall) => {
            projectile.hitObstacle(wall);
        });
        this.physics.add.collider(this.projectiles, this.trees, (projectile, tree) => {
            projectile.hitObstacle(tree);
        });
        this.physics.add.collider(this.projectiles, this.metalObstacles, (projectile, obs) => {
            projectile.hitObstacle(obs);
        });

        this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
            this.emitBlood(enemy.x, enemy.y);

            // Enemy hit logic
            enemy.takeDamage(projectile.damage || 10);

            // Flesh is soft
            projectile.hitObstacle({ material: { hardness: 5, damageReduction: 0.1 } });
        });

        // Enemy Projectile collisions
        this.physics.add.collider(this.enemyProjectiles, this.walls, (projectile, wall) => {
            projectile.hitObstacle(wall);
        });
        this.physics.add.collider(this.enemyProjectiles, this.trees, (projectile, tree) => {
            projectile.hitObstacle(tree);
        });
        this.physics.add.collider(this.enemyProjectiles, this.metalObstacles, (projectile, obs) => {
            projectile.hitObstacle(obs);
        });

        this.physics.add.overlap(this.player, this.enemyProjectiles, (player, projectile) => {
            this.emitBlood(player.x, player.y);
            projectile.setActive(false);
            projectile.setVisible(false);
            player.takeDamage(10);
        });

        // Grid for visual reference - REMOVED for production visual
        // this.add.grid(800, 600, 1600, 1200, 32, 32, 0x000000, 0, 0x222222, 1).setPipeline('Light2D');



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

        // UI: Launch UI Scene
        this.scene.launch('UIScene');

        // Initial HUD Update
        this.time.delayedCall(100, () => {
            this.events.emit('updateHUD', {
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                weapon: this.player.equippedWeapon
            });
        });

        // LIGHTING
        this.lights.enable();
        this.lights.setAmbientColor(0x111111); // Dark ambient

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
            blendMode: 'NORMAL', // Changed from ADD to NORMAL for blood
            emitting: false
        });

        // Volumetric Dust Particles (Scattering)
        const dustGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        dustGraphics.fillStyle(0xffffff, 1);
        dustGraphics.fillCircle(2, 2, 2);
        dustGraphics.generateTexture('particle_dust', 4, 4);

        this.dustEmitter = this.add.particles(0, 0, 'particle_dust', {
            lifespan: 1000,
            speed: { min: 10, max: 50 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.2, end: 0 },
            blendMode: 'ADD',
            emitting: true,
            frequency: 50,
            quantity: 1,
            follow: this.player
        });

        // Apply pipeline to sprites
        this.player.setPipeline('Light2D');
        this.wallSprites.getChildren().forEach(wall => wall.setPipeline('Light2D'));
        this.enemies.getChildren().forEach(enemy => enemy.setPipeline('Light2D'));
        this.lootContainers.getChildren().forEach(c => c.setPipeline('Light2D'));
        // Ground layers
        this.children.list.forEach(child => {
            if (child.texture && (child.texture.key === 'tile_grass' || child.texture.key === 'tile_road')) {
                child.setPipeline('Light2D');
            }
        });

        // --- TIME SYSTEM ---
        this.gameTime = 22 * 60; // Start at 22:00 (10 PM)
        this.dayDuration = 20 * 60; // 20 minutes real time = 24 hours game time
        // Game minutes per real second = (24 * 60) / (20 * 60) = 1.2 game min / real sec
        this.timeScale = 0; // Lock time (Night Mode Forever)

        // UI: Time Display
        this.timeText = this.add.text(1400, 20, '22:00', { fontSize: '24px', color: '#ffffff' });
        this.timeText.setScrollFactor(0);

        console.log('GameScene: create finished');
    }

    update(time, delta) {
        this.player.update(time, delta);

        // --- TIME UPDATE ---
        // Time is locked, but we keep the code structure in case we want it back later
        // const dtSeconds = delta / 1000;
        // this.gameTime += dtSeconds * this.timeScale;
        // if (this.gameTime >= 24 * 60) {
        //     this.gameTime -= 24 * 60;
        // }

        // Format Time
        // const hours = Math.floor(this.gameTime / 60);
        // const minutes = Math.floor(this.gameTime % 60);
        // const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        // this.events.emit('updateTime', timeString);

        // Emit HUD Update (Optimize: Only emit on change? For now every frame is fine for smooth bars)
        this.events.emit('updateHUD', {
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            weapon: this.player.equippedWeapon
        });

        // --- AMBIENT LIGHT CYCLE ---
        // Locked to Night
        let ambientColor = { r: 20, g: 20, b: 50 };
        let intensity = 0.1;

        // We can skip the cycle logic since time is locked

        this.lights.setAmbientColor(Phaser.Display.Color.GetColor(ambientColor.r, ambientColor.g, ambientColor.b));
        // Ambient intensity isn't a direct property in Phaser 3 Lights, usually controlled by color brightness.
        // But we can simulate "darkness" by the ambient color itself.
        // The color calculated above handles brightness.

        // --- FLASHLIGHT LOGIC ---
        // Always on at night
        const isDark = true;

        if (isDark) {
            // Enable Flashlight & Dust
            if (!this.dustEmitter.emitting) {
                this.dustEmitter.start();
                this.spotlight.setVisible(true);
            }

            // Update Dust Emitter (Emit in cone)
            this.dustEmitter.setParticleSpeed(100, 200);
            const deg = Phaser.Math.RadToDeg(this.player.rotation);
            this.dustEmitter.setAngle({ min: deg - 15, max: deg + 15 });

            // RAYCASTING LIGHT CONE
            // 1. Update Flashlight Sprite
            this.flashlightBeam.setVisible(true);
            this.flashlightBeam.setPosition(this.player.x, this.player.y);
            this.flashlightBeam.setRotation(this.player.rotation);

            // 2. Create/Clear Graphics for Mask
            if (!this.lightGraphics) {
                this.lightGraphics = this.make.graphics(); // Use make.graphics for mask source
                // Create mask if not exists
                const mask = this.lightGraphics.createGeometryMask();
                this.flashlightBeam.setMask(mask);
            }
            this.lightGraphics.clear();

            // 3. Cast Rays
            const startAngle = this.player.rotation - 0.5; // +/- 0.5 radians (~28 degrees)
            const endAngle = this.player.rotation + 0.5;
            const rayCount = 60; // Reduced for performance
            const rayLength = 400; // Max distance
            const points = [{ x: this.player.x, y: this.player.y }]; // Start at player

            // Collect all obstacles that block vision
            const allObstacles = [
                ...this.walls.getChildren(),
                ...this.trees.getChildren(),
                ...this.metalObstacles.getChildren()
            ];

            // Filter: Active, Blocks Vision, AND Within Range
            const rangeSq = (rayLength + 50) * (rayLength + 50); // rayLength + max obstacle size
            const pX = this.player.x;
            const pY = this.player.y;

            const obstacles = allObstacles.filter(obs => {
                if (!obs.active) return false;

                // Distance check (Optimization)
                const distSq = (obs.x - pX) * (obs.x - pX) + (obs.y - pY) * (obs.y - pY);
                if (distSq > rangeSq) return false;

                if (typeof obs.blocksVision === 'function') {
                    return obs.blocksVision();
                }
                return true;
            });

            let errorLogged = false; // Prevent console spam

            for (let i = 0; i <= rayCount; i++) {
                const rayAngle = Phaser.Math.Linear(startAngle, endAngle, i / rayCount);
                const rayDir = new Phaser.Math.Vector2(Math.cos(rayAngle), Math.sin(rayAngle));

                let closestIntersection = null;
                let minDist = rayLength;

                // Ray line segment
                const rayEnd = new Phaser.Math.Vector2(
                    this.player.x + rayDir.x * rayLength,
                    this.player.y + rayDir.y * rayLength
                );
                const rayLine = new Phaser.Geom.Line(this.player.x, this.player.y, rayEnd.x, rayEnd.y);

                obstacles.forEach(obs => {
                    if (!obs.body) return; // Safety check
                    const body = obs.body;
                    let intersection = null;

                    try {
                        if (body.isCircle) {
                            // Circle Intersection
                            if (!body.center) {
                                return;
                            }
                            const circle = new Phaser.Geom.Circle(body.center.x, body.center.y, body.halfWidth);
                            const intersects = Phaser.Geom.Intersects.GetLineToCircle(rayLine, circle);
                            if (intersects.length > 0) intersection = intersects;
                        } else {
                            // Rectangle Intersection
                            // Note: body.x/y are top-left.
                            const rect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
                            const intersects = Phaser.Geom.Intersects.GetLineToRectangle(rayLine, rect);
                            if (intersects.length > 0) intersection = intersects;
                        }
                    } catch (e) {
                        if (!errorLogged) {
                            console.error('Raycast Error (Throttled):', e);
                            errorLogged = true;
                        }
                    }

                    if (intersection) {
                        // Find closest point
                        intersection.forEach(p => {
                            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
                            if (d < minDist) {
                                minDist = d;
                                closestIntersection = p;
                            }
                        });
                    }
                });

                if (closestIntersection) {
                    points.push(closestIntersection);
                } else {
                    points.push(rayEnd);
                }
            }

            // 4. Draw Polygon for Mask (Invisible but active for mask)
            this.lightGraphics.fillStyle(0xffffff);
            this.lightGraphics.fillPoints(points, true);

        } else {
            // Disable Flashlight & Dust
            if (this.dustEmitter.emitting) {
                this.dustEmitter.stop();
                this.spotlight.setVisible(false);
                if (this.lightGraphics) this.lightGraphics.setVisible(false);
            }
        }

        // Update Camera Target (Look Ahead)
        // Camera should look at a point between player and mouse
        const pointer = this.input.activePointer;
        const mouseX = pointer.worldX;
        const mouseY = pointer.worldY;

        // Calculate midpoint with bias towards mouse (e.g., 30% towards mouse)
        const lookAheadFactor = 0.3;
        const targetX = Phaser.Math.Linear(this.player.x, mouseX, lookAheadFactor);
        const targetY = Phaser.Math.Linear(this.player.y, mouseY, lookAheadFactor);

        // Lerp camera target for smoothness
        this.cameraTarget.x = Phaser.Math.Linear(this.cameraTarget.x, targetX, 0.1);
        this.cameraTarget.y = Phaser.Math.Linear(this.cameraTarget.y, targetY, 0.1);

        // Update spotlight and beam position
        this.spotlight.x = this.player.x;
        // Update Flashlight
        if (this.flashlightBeam) {
            // Attach to weapon
            const weapon = this.player.weaponSprite;
            const offset = 40; // Distance from player center to weapon tip

            this.flashlightBeam.x = this.player.x + Math.cos(weapon.rotation) * offset;
            this.flashlightBeam.y = this.player.y + Math.sin(weapon.rotation) * offset;
            this.flashlightBeam.rotation = weapon.rotation;

            // Sync spotlight too
            this.spotlight.x = this.flashlightBeam.x;
            this.spotlight.y = this.flashlightBeam.y;
        }


        // Handle shooting input (Continuous for automatic)
        if (this.input.activePointer.isDown) {
            this.player.shoot(time);
        }

        // DEPTH SORTING
        // Sort Walls
        this.wallSprites.getChildren().forEach(wall => {
            wall.setDepth(wall.getData('sortBottom'));
        });
        // Sort Player (Bottom of sprite)
        // Sprite is 32px tall. Center is 16. Bottom is y + 16.
        this.player.setDepth(this.player.y + 16);
        // Sort Enemies
        this.enemies.getChildren().forEach(enemy => {
            enemy.setDepth(enemy.y + 16);
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

    // --- SOUND SYSTEM ---
    emitSound(x, y, type) {
        // Notify all enemies
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                enemy.hearSound(x, y, type);
            }
        });
    }
}
