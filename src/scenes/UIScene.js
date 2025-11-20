import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const padding = 20;

        // --- HUD CONTAINER ---
        // Health Bar (Bottom Left)
        // Anchor: Bottom-Left
        const healthY = height - padding - 20; // 20 is bar height
        this.healthBarBg = this.add.rectangle(padding, healthY, 200, 20, 0x000000, 0.5).setOrigin(0, 0);
        this.healthBarFill = this.add.rectangle(padding, healthY, 200, 20, 0x00ff00, 1).setOrigin(0, 0);
        this.healthText = this.add.text(padding + 210, healthY, '100/100', { fontSize: '18px', color: '#ffffff' }).setOrigin(0, 0);
        this.add.text(padding, healthY - 20, 'HEALTH', { fontSize: '14px', color: '#aaaaaa' });

        // Weapon Info (Bottom Right)
        // Anchor: Bottom-Right
        const ammoX = width - padding;
        const ammoY = height - padding;

        this.ammoText = this.add.text(ammoX - 60, ammoY - 40, '30', { fontSize: '48px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 1);
        this.maxAmmoText = this.add.text(ammoX - 60, ammoY - 40, '/ 30', { fontSize: '24px', color: '#aaaaaa' }).setOrigin(0, 1);
        this.weaponNameText = this.add.text(ammoX, ammoY, 'Assault Rifle', { fontSize: '18px', color: '#ffffff' }).setOrigin(1, 1);

        // Time Display (Top Right)
        // Anchor: Top-Right
        const timeX = width - padding;
        const timeY = padding;

        // Background for time
        this.add.rectangle(timeX - 60, timeY + 20, 120, 40, 0x000000, 0.5).setOrigin(0.5, 0.5);
        this.timeText = this.add.text(timeX - 60, timeY + 20, '06:00', { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0.5);

        // Listen for events from GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('updateHUD', this.updateHUD, this);
        gameScene.events.on('updateTime', this.updateTime, this);
    }

    updateHUD(data) {
        // Update Health
        const hpPercent = Phaser.Math.Clamp(data.hp / data.maxHp, 0, 1);
        this.healthBarFill.width = 200 * hpPercent;
        this.healthText.setText(`${Math.ceil(data.hp)}/${data.maxHp}`);

        // Color gradient (Green -> Red)
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            { r: 255, g: 0, b: 0 },
            { r: 0, g: 255, b: 0 },
            100, hpPercent * 100
        );
        this.healthBarFill.fillColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

        // Update Weapon
        if (data.weapon) {
            this.ammoText.setText(data.weapon.currentAmmo);
            this.maxAmmoText.setText('/ ' + data.weapon.maxAmmo);
            this.weaponNameText.setText(data.weapon.name);

            if (data.weapon.isReloading) {
                this.ammoText.setText('REL');
                this.ammoText.setColor('#ffaa00');
            } else {
                this.ammoText.setColor('#ffffff');
            }
        }
    }

    updateTime(timeString) {
        this.timeText.setText(timeString);
    }
}
