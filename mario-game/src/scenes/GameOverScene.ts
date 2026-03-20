import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants'

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' })
  }

  create(data: { score?: number; coins?: number; cleared?: boolean }): void {
    this.cameras.main.setBackgroundColor(COLORS.BLACK)

    const title = data.cleared ? 'CONGRATULATIONS!' : 'GAME OVER'
    const titleColor = data.cleared ? '#ffd700' : '#ff4444'

    this.add.text(GAME_WIDTH / 2, 150, title, {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, 260, `SCORE: ${data.score ?? 0}`, {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, 310, `COINS: ${data.coins ?? 0}`, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffd700',
    }).setOrigin(0.5)

    // High score
    let highScore = 0
    try {
      const saved = localStorage.getItem('superPixelAdventure')
      if (saved) {
        highScore = JSON.parse(saved).highScore ?? 0
      }
    } catch {
      // ignore
    }

    this.add.text(GAME_WIDTH / 2, 370, `HIGH SCORE: ${highScore}`, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5)

    const retryText = this.add.text(GAME_WIDTH / 2, 460, 'PRESS ENTER TO RETRY\nPRESS M FOR MENU', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5)

    this.tweens.add({
      targets: retryText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    enterKey?.on('down', () => this.scene.start('GameScene'))

    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    spaceKey?.on('down', () => this.scene.start('GameScene'))

    const mKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M)
    mKey?.on('down', () => this.scene.start('MenuScene'))
  }
}
