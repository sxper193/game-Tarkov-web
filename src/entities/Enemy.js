import Phaser from 'phaser';
import LootContainer from './LootContainer';

const STATES = {
    IDLE: 'IDLE',
    SUSPICIOUS: 'SUSPICIOUS',
    INVESTIGATE: 'INVESTIGATE',
    COMBAT: 'COMBAT',
    CHASE: 'CHASE'
};

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setSize(32, 32);
        this.body.setOffset(0, 0);

        // Stats
        this.speed = {
            walk: 50,
            run: 130
        };
        this.maxHp = 100;
        this.hp = this.maxHp;

        // AI State
        this.currentState = STATES.IDLE;
        this.stateTimer = 0;
        this.alertLevel = 0; // 0-100
        this.target = null; // Player
        this.lastKnownPosition = null; // {x, y}

        // Perception
        this.visionRange = 400;
        this.visionAngle = Math.PI / 2; // 90 degrees
        this.hearingRange = {
            footstep: 150,
            gunshot: 800
        };

        // Combat
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1 sec burst
        this.reactionTime = 500; // ms delay before shooting
        this.reactionTimer = 0;

        // UI Indicators
        this.statusIcon = scene.add.text(x, y - 40, '', { fontSize: '24px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
        this.statusIcon.setDepth(1001);

        // Floating Health Bar
        this.healthBar = scene.add.graphics();
        this.healthBar.setDepth(1000);
        this.healthBar.setVisible(false);
        this.healthBarTimer = 0;
    }

    setTarget(target) {
        this.target = target;
    }

    update(time, delta) {
        if (!this.active || this.hp <= 0) return;

        // 1. Perception Check (Vision & Hearing)
        this.perceptionCheck(time);

        // 2. State Machine
        switch (this.currentState) {
            case STATES.IDLE:
                this.updateIdle(time, delta);
                break;
            case STATES.SUSPICIOUS:
                this.updateSuspicious(time, delta);
                break;
            case STATES.INVESTIGATE:
                this.updateInvestigate(time, delta);
                break;
            case STATES.COMBAT:
                this.updateCombat(time, delta);
                break;
            case STATES.CHASE:
                this.updateChase(time, delta);
                break;
        }

        // 3. Update UI
        this.updateUI();
    }

    // --- PERCEPTION ---
    perceptionCheck(time) {
        if (!this.target) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        // VISION
        let canSee = false;
        if (dist < this.visionRange) {
            const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            const angleDiff = Phaser.Math.Angle.Wrap(angleToTarget - this.rotation);

            // Check Angle
            if (Math.abs(angleDiff) < this.visionAngle / 2) {
                // Check Raycast (Walls & Trees & Metal)
                const ray = new Phaser.Geom.Line(this.x, this.y, this.target.x, this.target.y);
                const obstacles = [
                    ...this.scene.walls.getChildren(),
                    ...this.scene.trees.getChildren(),
                    ...this.scene.metalObstacles.getChildren()
                ];
                let blocked = false;

                for (let obs of obstacles) {
                    if (obs.blocksVision && !obs.blocksVision()) continue; // Skip transparent

                    if (Phaser.Geom.Intersects.LineToRectangle(ray, obs.getBounds())) {
                        blocked = true;
                        break;
                    }
                }

                if (!blocked) {
                    canSee = true;
                }
            }
        }

        // State Transitions based on Vision
        if (canSee) {
            this.lastKnownPosition = { x: this.target.x, y: this.target.y };

            if (this.currentState !== STATES.COMBAT) {
                // Reaction delay
                if (this.reactionTimer === 0) {
                    this.reactionTimer = time + this.reactionTime;
                    this.setState(STATES.SUSPICIOUS); // Brief pause before combat
                } else if (time > this.reactionTimer) {
                    this.setState(STATES.COMBAT);
                }
            }
        } else {
            this.reactionTimer = 0;
            // Lost sight
            if (this.currentState === STATES.COMBAT) {
                this.setState(STATES.CHASE);
            }
        }
    }

    hearSound(sourceX, sourceY, type) {
        // Called by GameScene when sound events happen
        const dist = Phaser.Math.Distance.Between(this.x, this.y, sourceX, sourceY);
        let range = 0;
        if (type === 'footstep') range = this.hearingRange.footstep;
        if (type === 'gunshot') range = this.hearingRange.gunshot;

        if (dist < range) {
            this.lastKnownPosition = { x: sourceX, y: sourceY };

            if (this.currentState === STATES.IDLE) {
                this.setState(STATES.SUSPICIOUS);
            } else if (this.currentState === STATES.SUSPICIOUS) {
                this.setState(STATES.INVESTIGATE);
            }
        }
    }

    // --- STATES ---
    setState(newState) {
        if (this.currentState === newState) return;

        this.currentState = newState;
        this.stateTimer = 0;

        // Enter State Logic
        switch (newState) {
            case STATES.IDLE:
                this.statusIcon.setText('');
                this.setVelocity(0);
                break;
            case STATES.SUSPICIOUS:
                this.statusIcon.setText('?');
                this.statusIcon.setColor('#ffff00'); // Yellow
                this.setVelocity(0);
                this.stateTimer = this.scene.time.now + 2000; // Wait 2s

                // Face the noise/target
                if (this.lastKnownPosition) {
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.lastKnownPosition.x, this.lastKnownPosition.y);
                    this.setRotation(angle);
                }
                break;
            case STATES.INVESTIGATE:
                this.statusIcon.setText('!');
                this.statusIcon.setColor('#ffaa00'); // Orange
                break;
            case STATES.COMBAT:
                this.statusIcon.setText('!!');
                this.statusIcon.setColor('#ff0000'); // Red
                break;
            case STATES.CHASE:
                this.statusIcon.setText('>>');
                this.statusIcon.setColor('#ff4400'); // Red-Orange
                break;
        }
    }

    updateIdle(time, delta) {
        // Patrol logic could go here
        this.setVelocity(0);
    }

    updateSuspicious(time, delta) {
        // Just wait and look
        if (time > this.stateTimer) {
            // If nothing happened, go back to Idle or Investigate
            if (this.lastKnownPosition) {
                this.setState(STATES.INVESTIGATE);
            } else {
                this.setState(STATES.IDLE);
            }
        }
    }

    updateInvestigate(time, delta) {
        if (!this.lastKnownPosition) {
            this.setState(STATES.IDLE);
            return;
        }

        this.moveTo(this.lastKnownPosition, this.speed.walk);

        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.lastKnownPosition.x, this.lastKnownPosition.y);
        if (dist < 50) {
            // Reached point, look around
            this.lastKnownPosition = null;
            this.setState(STATES.SUSPICIOUS); // Wait a bit then Idle
        }
    }

    updateCombat(time, delta) {
        if (!this.target) return;

        // Face target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.setRotation(angle);

        // Stop moving to shoot accuracy
        this.setVelocity(0);

        // Shoot
        if (time > this.lastAttackTime + this.attackCooldown) {
            this.shoot();
            this.lastAttackTime = time;
        }
    }

    updateChase(time, delta) {
        if (!this.lastKnownPosition) {
            this.setState(STATES.INVESTIGATE);
            return;
        }

        this.moveTo(this.lastKnownPosition, this.speed.run);

        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.lastKnownPosition.x, this.lastKnownPosition.y);
        if (dist < 50) {
            // Reached last known pos, but no target seen (otherwise vision would trigger COMBAT)
            this.lastKnownPosition = null;
            this.setState(STATES.SUSPICIOUS); // Look around
        }
    }

    // --- HELPERS ---
    moveTo(targetPos, speed) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetPos.x, targetPos.y);

        // Obstacle Avoidance (Simple)
        const lookAhead = 50;
        const leftRay = new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(angle - 0.5) * lookAhead, this.y + Math.sin(angle - 0.5) * lookAhead);
        const rightRay = new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(angle + 0.5) * lookAhead, this.y + Math.sin(angle + 0.5) * lookAhead);

        let avoidanceForce = 0;
        const walls = this.scene.walls.getChildren();

        for (let wall of walls) {
            const bounds = wall.getBounds();
            if (Phaser.Geom.Intersects.LineToRectangle(leftRay, bounds)) avoidanceForce += 0.8;
            if (Phaser.Geom.Intersects.LineToRectangle(rightRay, bounds)) avoidanceForce -= 0.8;
        }

        const finalAngle = angle + avoidanceForce;
        this.setRotation(finalAngle);
        this.scene.physics.velocityFromRotation(finalAngle, speed, this.body.velocity);
    }

    shoot() {
        const projectile = this.scene.enemyProjectiles.get();
        if (projectile) {
            projectile.setTint(0xffa500);
            // Add some spread
            const spread = Phaser.Math.FloatBetween(-0.1, 0.1);
            projectile.fire(this.x, this.y, this.rotation + spread, 2000, 10); // Speed 2000, Dmg 10
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Instant reaction to damage
        if (this.target) {
            this.lastKnownPosition = { x: this.target.x, y: this.target.y };
            this.setState(STATES.COMBAT); // Or cover?
        } else {
            // Unknown source
            this.setState(STATES.INVESTIGATE);
        }

        // Show Health Bar
        this.healthBar.setVisible(true);
        this.healthBarTimer = this.scene.time.now + 3000;
        this.updateHealthBar();

        if (this.hp <= 0) {
            this.die();
        }
    }

    updateHealthBar() {
        this.healthBar.clear();
        this.healthBar.fillStyle(0x000000);
        this.healthBar.fillRect(0, 0, 32, 4);
        const percent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(0, 0, 32 * percent, 4);
    }

    updateUI() {
        // Update Status Icon Position
        this.statusIcon.x = this.x;
        this.statusIcon.y = this.y - 40;

        // Update Health Bar Position
        if (this.healthBar.visible) {
            this.healthBar.x = this.x - 16;
            this.healthBar.y = this.y - 30;
            if (this.scene.time.now > this.healthBarTimer) {
                this.healthBar.setVisible(false);
            }
        }
    }

    die() {
        // Spawn loot
        const items = [{ id: 'loot_' + Date.now(), color: Phaser.Display.Color.RandomRGB().color }];
        const container = this.scene.lootContainers.get(this.x, this.y);
        if (container) {
            container.setActive(true);
            container.setVisible(true);
            container.body.reset(this.x, this.y);
            container.items = items;
        }

        this.statusIcon.destroy();
        this.healthBar.destroy();
        this.destroy();
    }
}
