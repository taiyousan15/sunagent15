import Phaser from 'phaser'
import { GAME_WIDTH } from '../config/constants'

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text
  private coinText!: Phaser.GameObjects.Text
  private livesText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'HudScene' })
  }

  create(): void {
    this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    })

    this.coinText = this.add.text(GAME_WIDTH / 2, 16, 'COINS: 0', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0)

    this.livesText = this.add.text(GAME_WIDTH - 16, 16, 'LIVES: 3', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0)

    // Listen for updates from GameScene
    const gameScene = this.scene.get('GameScene')
    gameScene.events.on('updateHud', (state: { score: number; coins: number; lives: number }) => {
      this.scoreText.setText(`SCORE: ${state.score}`)
      this.coinText.setText(`COINS: ${state.coins}`)
      this.livesText.setText(`LIVES: ${state.lives}`)
    })
  }
}
