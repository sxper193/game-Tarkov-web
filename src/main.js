import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import InventoryScene from './scenes/InventoryScene';
import MainMenuScene from './scenes/MainMenuScene';
import GameOverScene from './scenes/GameOverScene';
import UIScene from './scenes/UIScene';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'app',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Top-down game, no gravity
      debug: false // Disable debug for production feel
    }
  },
  lights: { enable: true }, // Enable lights for Light2D pipeline
  scene: [MainMenuScene, GameScene, InventoryScene, GameOverScene, UIScene]
};

const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
