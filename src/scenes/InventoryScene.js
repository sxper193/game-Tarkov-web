import Phaser from 'phaser';

export default class InventoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InventoryScene' });
    }

    init(data) {
        this.player = data.player;
        this.container = data.container;
    }

    create() {
        // Semi-transparent background
        const bg = this.add.rectangle(400, 300, 600, 400, 0x1a1a1a, 0.95);
        bg.setStrokeStyle(2, 0x444444);
        bg.setInteractive(); // Block clicks to game scene

        // Title
        this.add.text(400, 130, 'INVENTORY', { fontSize: '24px', color: '#e0e0e0', fontStyle: 'bold' }).setOrigin(0.5);

        // Player Inventory Grid (Left)
        this.createGrid(150, 200, 'PLAYER', this.player.inventory, (item, index) => {
            // Drop item (simple logic: remove from player)
            // In a real game, this might drop it on the ground
            this.player.inventory.splice(index, 1);
            this.refresh();
        });

        // Container Inventory Grid (Right)
        if (this.container) {
            this.createGrid(450, 200, 'CONTAINER', this.container.items, (item, index) => {
                // Take item: Move from container to player
                this.container.items.splice(index, 1);
                this.player.inventory.push(item);
                this.refresh();
            });
        }

        // Close button (or instruction)
        this.add.text(400, 480, '[F] / [ESC] TO CLOSE', { fontSize: '14px', color: '#888888' }).setOrigin(0.5);

        // Input to close
        this.input.keyboard.on('keydown-F', () => {
            this.closeInventory();
        });
        this.input.keyboard.on('keydown-ESC', () => {
            this.closeInventory();
        });
    }

    createGrid(startX, startY, title, items, onItemClick) {
        this.add.text(startX + 100, startY - 30, title, { fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5);

        const cols = 4;
        const rows = 4;
        const cellSize = 50;
        const padding = 5;

        for (let i = 0; i < cols * rows; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cellSize + padding);
            const y = startY + row * (cellSize + padding);

            // Slot background
            this.add.rectangle(x + cellSize / 2, y + cellSize / 2, cellSize, cellSize, 0x222222).setStrokeStyle(1, 0x444444);

            // Item
            if (items[i]) {
                const item = items[i];
                const itemRect = this.add.rectangle(x + cellSize / 2, y + cellSize / 2, cellSize - 6, cellSize - 6, item.color);
                itemRect.setInteractive();
                itemRect.on('pointerdown', () => {
                    onItemClick(item, i);
                });

                // Hover effect
                itemRect.on('pointerover', () => itemRect.setAlpha(0.8));
                itemRect.on('pointerout', () => itemRect.setAlpha(1));
            }
        }
    }

    refresh() {
        this.scene.restart({ player: this.player, container: this.container });
    }

    closeInventory() {
        this.scene.stop();
        this.scene.resume('GameScene');
    }
}
