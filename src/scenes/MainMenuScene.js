import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Title
        this.add.text(width / 2, height / 3, 'TARKOV WEB GAME', {
            fontSize: '64px',
            color: '#e0e0e0',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Start Button
        const startBtn = this.add.text(width / 2, height / 2, 'START GAME', {
            fontSize: '32px',
            color: '#000000',
            backgroundColor: '#00ff00',
            padding: { x: 40, y: 15 }
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#ccffcc' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ backgroundColor: '#00ff00' }));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));
    }
}
