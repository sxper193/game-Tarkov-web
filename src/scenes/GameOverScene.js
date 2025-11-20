import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.won = data.won;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const message = this.won ? 'YOU ESCAPED!' : 'YOU DIED';
        const color = this.won ? '#00ff00' : '#ff0000';

        // Message
        this.add.text(width / 2, height / 3, message, {
            fontSize: '80px',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Restart Button
        const restartBtn = this.add.text(width / 2, height / 2, 'PLAY AGAIN', {
            fontSize: '32px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 40, y: 15 }
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setStyle({ backgroundColor: '#cccccc' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ backgroundColor: '#ffffff' }));
        restartBtn.on('pointerdown', () => {
            // Stop all scenes and restart GameScene from scratch
            this.scene.stop('GameOverScene');
            this.scene.stop('UIScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        });

        // Main Menu Button
        const menuBtn = this.add.text(width / 2, height / 2 + 100, 'MAIN MENU', {
            fontSize: '24px',
            color: '#aaaaaa',
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setStyle({ color: '#ffffff' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ color: '#aaaaaa' }));
        menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }
}
