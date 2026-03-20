import Phaser from 'phaser'
import { TILE_SIZE, COLORS } from '../config/constants'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    this.generateTextures()
  }

  create(): void {
    this.scene.start('MenuScene')
  }

  private generateTextures(): void {
    this.createPlayerTexture()
    this.createEnemyTexture()
    this.createCoinTexture()
    this.createBlockTexture()
    this.createGroundTexture()
    this.createBrickTexture()
    this.createQuestionBlockTexture()
    this.createFlagTexture()
    this.createCloudTexture()
    this.createBushTexture()
    this.createPipeTexture()
    this.createMushroomTexture()
    this.createStarTexture()
  }

  private createPlayerTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    // Body (red)
    g.fillStyle(0xff0000)
    g.fillRect(8, 8, 16, 16)
    // Head (skin)
    g.fillStyle(0xffcc99)
    g.fillRect(10, 0, 12, 10)
    // Hat (red)
    g.fillStyle(0xff0000)
    g.fillRect(8, 0, 16, 4)
    // Eyes
    g.fillStyle(0x000000)
    g.fillRect(14, 4, 2, 2)
    g.fillRect(18, 4, 2, 2)
    // Legs (blue)
    g.fillStyle(0x0000cc)
    g.fillRect(10, 24, 5, 8)
    g.fillRect(17, 24, 5, 8)
    // Shoes (brown)
    g.fillStyle(0x8b4513)
    g.fillRect(8, 28, 7, 4)
    g.fillRect(17, 28, 7, 4)
    g.generateTexture('player', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }

  private createEnemyTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    // Body (brown mushroom)
    g.fillStyle(0x8b4513)
    g.fillRect(4, 0, 24, 16)
    // Stem
    g.fillStyle(0xf5deb3)
    g.fillRect(8, 16, 16, 16)
    // Eyes (angry)
    g.fillStyle(0xffffff)
    g.fillRect(8, 6, 6, 6)
    g.fillRect(18, 6, 6, 6)
    g.fillStyle(0x000000)
    g.fillRect(10, 8, 3, 3)
    g.fillRect(20, 8, 3, 3)
    // Feet
    g.fillStyle(0x000000)
    g.fillRect(4, 28, 10, 4)
    g.fillRect(18, 28, 10, 4)
    g.generateTexture('enemy', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }

  private createCoinTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(COLORS.GOLD)
    g.fillCircle(16, 16, 10)
    g.fillStyle(0xffa500)
    g.fillCircle(16, 16, 6)
    g.fillStyle(COLORS.GOLD)
    g.fillRect(14, 10, 4, 12)
    g.generateTexture('coin', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }

  private createBlockTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x8b6914)
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    g.lineStyle(2, 0x5a4510)
    g.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2)
    g.generateTexture('block', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }

  private createGroundTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xc84c09)
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    g.fillStyle(0x00aa00)
    g.fillRect(0, 0, TILE_SIZE, 4)
    g.lineStyle(1, 0x8b3500)
    g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE)
    g.generateTexture('ground', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }

  private createBrickTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xc84c09)
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    g.lineStyle(1, 0x8b3500)
    g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE)
    g.strokeRect(0, 0, 16, 16)
    g.strokeRect(16, 0, 16, 16)
    g.strokeRect(8, 16, 16, 16)
    g.generateTexture('brick', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }

  private createQuestionBlockTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xf5a623)
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    g.lineStyle(2, 0xc88415)
    g.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2)
    // Question mark
    g.fillStyle(COLORS.WHITE)
    g.fillRect(12, 6, 8, 4)
    g.fillRect(16, 10, 4, 4)
    g.fillRect(12, 14, 4, 4)
    g.fillRect(12, 22, 4, 4)
    g.generateTexture('question', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }

  private createFlagTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x00aa00)
    g.fillTriangle(8, 0, 8, 20, 28, 10)
    g.fillStyle(0x888888)
    g.fillRect(6, 0, 4, TILE_SIZE)
    g.generateTexture('flag', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }

  private createCloudTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(COLORS.WHITE)
    g.fillCircle(24, 24, 16)
    g.fillCircle(40, 20, 20)
    g.fillCircle(56, 24, 16)
    g.generateTexture('cloud', 80, 48)
    g.destroy()
  }

  private createBushTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x228b22)
    g.fillCircle(16, 24, 16)
    g.fillCircle(32, 20, 20)
    g.fillCircle(48, 24, 16)
    g.generateTexture('bush', 64, 40)
    g.destroy()
  }

  private createPipeTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x00aa00)
    g.fillRect(0, 8, 64, 56)
    g.fillStyle(0x00cc00)
    g.fillRect(0, 0, 64, 16)
    g.lineStyle(2, 0x008800)
    g.strokeRect(0, 0, 64, 64)
    g.generateTexture('pipe', 64, 64)
    g.destroy()
  }

  private createMushroomTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xff0000)
    g.fillRect(4, 0, 24, 14)
    g.fillStyle(COLORS.WHITE)
    g.fillCircle(10, 7, 4)
    g.fillCircle(22, 7, 4)
    g.fillStyle(0xf5deb3)
    g.fillRect(8, 14, 16, 18)
    g.generateTexture('mushroom', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }

  private createStarTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(COLORS.GOLD)
    g.fillRect(12, 0, 8, 8)
    g.fillRect(4, 8, 24, 8)
    g.fillRect(0, 12, 32, 8)
    g.fillRect(4, 20, 8, 8)
    g.fillRect(20, 20, 8, 8)
    g.generateTexture('star', TILE_SIZE, TILE_SIZE)
    g.destroy()
  }
}
