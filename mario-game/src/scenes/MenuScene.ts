import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.SKY)

    // Title
    this.add.text(GAME_WIDTH / 2, 120, 'SUPER PIXEL\nADVENTURE', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5)

    // Decorative player sprite
    this.add.image(GAME_WIDTH / 2, 260, 'player').setScale(4)

    // Start instruction
    const startText = this.add.text(GAME_WIDTH / 2, 380, 'PRESS ENTER TO START', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    // Blink effect
    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    // Controls info
    this.add.text(GAME_WIDTH / 2, 460, '← → : Move    SPACE : Jump', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#cccccc',
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, 490, 'ESC : Pause', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#cccccc',
    }).setOrigin(0.5)

    // Copyright
    this.add.text(GAME_WIDTH / 2, 560, '© 2026 Super Pixel Adventure', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5)

    // Input
    const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    enterKey?.on('down', () => {
      this.scene.start('GameScene')
    })

    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    spaceKey?.on('down', () => {
      this.scene.start('GameScene')
    })
  }
}
