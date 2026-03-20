import Phaser from 'phaser'
import {
  GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, PLAYER_SPEED, JUMP_VELOCITY,
  MAX_FALL_SPEED, ENEMY_SPEED, COIN_SCORE, ENEMY_KILL_SCORE,
  INITIAL_LIVES, INVINCIBLE_DURATION, COLORS,
} from '../config/constants'
import { LEVEL_1 } from '../config/levels'

interface GameState {
  readonly score: number
  readonly coins: number
  readonly lives: number
  readonly level: number
  readonly isSuper: boolean
  readonly isInvincible: boolean
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private coins!: Phaser.Physics.Arcade.StaticGroup
  private enemies!: Phaser.Physics.Arcade.Group
  private questionBlocks!: Phaser.Physics.Arcade.StaticGroup
  private flag!: Phaser.Physics.Arcade.Sprite
  private gameState: GameState = {
    score: 0, coins: 0, lives: INITIAL_LIVES,
    level: 1, isSuper: false, isInvincible: false,
  }
  private isPaused = false
  private isPlayerDead = false
  private pauseText?: Phaser.GameObjects.Text
  private facingRight = true

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.isPlayerDead = false
    this.isPaused = false
    this.facingRight = true
    this.gameState = {
      score: 0, coins: 0, lives: INITIAL_LIVES,
      level: 1, isSuper: false, isInvincible: false,
    }

    this.cameras.main.setBackgroundColor(COLORS.SKY)

    // World bounds
    const worldWidth = LEVEL_1.width * TILE_SIZE
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT)
    this.cameras.main.setBounds(0, 0, worldWidth, GAME_HEIGHT)

    // Background decorations
    this.createBackground(worldWidth)

    // Create level
    this.platforms = this.physics.add.staticGroup()
    this.coins = this.physics.add.staticGroup()
    this.enemies = this.physics.add.group({ runChildUpdate: true })
    this.questionBlocks = this.physics.add.staticGroup()

    this.buildLevel(LEVEL_1)

    // Player
    this.player = this.physics.add.sprite(
      LEVEL_1.playerStart.x * TILE_SIZE + TILE_SIZE / 2,
      LEVEL_1.playerStart.y * TILE_SIZE - TILE_SIZE / 2,
      'player'
    )
    this.player.setCollideWorldBounds(true)
    this.player.setBounce(0)
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setMaxVelocityY(MAX_FALL_SPEED)
    body.setSize(24, 30)
    body.setOffset(4, 2)

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    // Collisions
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.overlap(this.player, this.coins, this.collectCoin as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
    this.physics.add.collider(this.player, this.questionBlocks, this.hitQuestionBlock as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
    this.physics.add.overlap(this.player, this.enemies, this.handleEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)

    if (this.flag) {
      this.physics.add.overlap(this.player, this.flag, this.reachFlag, undefined, this)
    }

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys()

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey?.on('down', () => this.togglePause())

    // Launch HUD
    this.scene.launch('HudScene', { gameState: this.gameState })

    // Emit initial state
    this.events.emit('updateHud', this.gameState)
  }

  update(): void {
    if (this.isPaused || this.isPlayerDead) return

    const body = this.player.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down || body.touching.down

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED)
      this.facingRight = false
      this.player.setFlipX(true)
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED)
      this.facingRight = true
      this.player.setFlipX(false)
    } else {
      this.player.setVelocityX(0)
    }

    // Jump (variable height)
    if (this.cursors.space?.isDown && onGround) {
      this.player.setVelocityY(JUMP_VELOCITY)
    }
    // Short hop when releasing space
    if (this.cursors.space?.isUp && body.velocity.y < JUMP_VELOCITY / 2) {
      this.player.setVelocityY(JUMP_VELOCITY / 2)
    }

    // Fall death
    if (this.player.y > GAME_HEIGHT + 50) {
      this.playerDie()
    }

    // Update enemies patrol
    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as Phaser.Physics.Arcade.Sprite
      const eb = e.body as Phaser.Physics.Arcade.Body
      if (eb.blocked.right) {
        e.setVelocityX(-ENEMY_SPEED)
        e.setFlipX(false)
      } else if (eb.blocked.left) {
        e.setVelocityX(ENEMY_SPEED)
        e.setFlipX(true)
      }
    })
  }

  private createBackground(worldWidth: number): void {
    // Clouds
    for (let x = 100; x < worldWidth; x += Phaser.Math.Between(300, 500)) {
      this.add.image(x, Phaser.Math.Between(40, 120), 'cloud')
        .setAlpha(0.8)
        .setScrollFactor(0.3)
    }
    // Bushes
    for (let x = 50; x < worldWidth; x += Phaser.Math.Between(200, 400)) {
      this.add.image(x, GAME_HEIGHT - 52, 'bush')
        .setScrollFactor(0.6)
    }
  }

  private buildLevel(level: typeof LEVEL_1): void {
    const { tiles } = level
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        const tile = tiles[row][col]
        const x = col * TILE_SIZE + TILE_SIZE / 2
        const y = row * TILE_SIZE + TILE_SIZE / 2

        switch (tile) {
          case 'G': // Ground
            this.platforms.create(x, y, 'ground')
            break
          case 'B': // Brick
            this.platforms.create(x, y, 'brick')
            break
          case '?': // Question block
            this.questionBlocks.create(x, y, 'question')
            break
          case 'K': // Block (solid)
            this.platforms.create(x, y, 'block')
            break
          case 'C': // Coin
            this.coins.create(x, y, 'coin')
            break
          case 'E': { // Enemy
            const enemy = this.enemies.create(x, y, 'enemy') as Phaser.Physics.Arcade.Sprite
            enemy.setVelocityX(-ENEMY_SPEED)
            enemy.setBounce(0)
            enemy.setCollideWorldBounds(true)
            const eb = enemy.body as Phaser.Physics.Arcade.Body
            eb.setSize(28, 28)
            eb.setOffset(2, 4)
            break
          }
          case 'P': // Pipe
            this.platforms.create(x, y, 'pipe').setScale(1).refreshBody()
            break
          case 'F': // Flag
            this.flag = this.physics.add.sprite(x, y, 'flag')
            ;(this.flag.body as Phaser.Physics.Arcade.Body).allowGravity = false
            ;(this.flag.body as Phaser.Physics.Arcade.Body).setImmovable(true)
            break
        }
      }
    }
  }

  private collectCoin(_player: Phaser.GameObjects.GameObject, coin: Phaser.GameObjects.GameObject): void {
    const c = coin as Phaser.Physics.Arcade.Sprite
    c.destroy()

    this.gameState = {
      ...this.gameState,
      score: this.gameState.score + COIN_SCORE,
      coins: this.gameState.coins + 1,
    }
    this.events.emit('updateHud', this.gameState)

    // Coin animation
    const text = this.add.text(c.x, c.y - 20, `+${COIN_SCORE}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    })
  }

  private hitQuestionBlock(player: Phaser.GameObjects.GameObject, block: Phaser.GameObjects.GameObject): void {
    const p = player as Phaser.Physics.Arcade.Sprite
    const b = block as Phaser.Physics.Arcade.Sprite
    const pb = p.body as Phaser.Physics.Arcade.Body

    // Only trigger when hitting from below
    if (pb.velocity.y >= 0) return

    // Convert to used block
    b.setTexture('block')

    // Spawn coin above
    const coinText = this.add.text(b.x, b.y - TILE_SIZE, `+${COIN_SCORE}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: coinText,
      y: coinText.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => coinText.destroy(),
    })

    this.gameState = {
      ...this.gameState,
      score: this.gameState.score + COIN_SCORE,
      coins: this.gameState.coins + 1,
    }
    this.events.emit('updateHud', this.gameState)

    // Block bump animation
    this.tweens.add({
      targets: b,
      y: b.y - 8,
      duration: 100,
      yoyo: true,
    })
  }

  private handleEnemyCollision(player: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject): void {
    if (this.gameState.isInvincible) return

    const p = player as Phaser.Physics.Arcade.Sprite
    const e = enemy as Phaser.Physics.Arcade.Sprite
    const pb = p.body as Phaser.Physics.Arcade.Body

    // Stomp from above
    if (pb.velocity.y > 0 && p.y < e.y - 10) {
      this.stompEnemy(e)
      p.setVelocityY(JUMP_VELOCITY / 2) // Bounce
    } else {
      this.playerHit()
    }
  }

  private stompEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    enemy.setVelocity(0, 0)
    ;(enemy.body as Phaser.Physics.Arcade.Body).allowGravity = false

    this.tweens.add({
      targets: enemy,
      scaleY: 0.2,
      alpha: 0,
      duration: 300,
      onComplete: () => enemy.destroy(),
    })

    this.gameState = {
      ...this.gameState,
      score: this.gameState.score + ENEMY_KILL_SCORE,
    }
    this.events.emit('updateHud', this.gameState)

    const text = this.add.text(enemy.x, enemy.y - 20, `+${ENEMY_KILL_SCORE}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    })
  }

  private playerHit(): void {
    if (this.gameState.isInvincible) return

    this.gameState = {
      ...this.gameState,
      lives: this.gameState.lives - 1,
      isInvincible: true,
    }
    this.events.emit('updateHud', this.gameState)

    // Invincibility blink
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
    })

    this.player.setVelocityY(JUMP_VELOCITY / 2)

    this.time.delayedCall(INVINCIBLE_DURATION, () => {
      this.gameState = { ...this.gameState, isInvincible: false }
      this.player.setAlpha(1)
    })

    if (this.gameState.lives <= 0) {
      this.time.delayedCall(500, () => this.playerDie())
    }
  }

  private playerDie(): void {
    if (this.isPlayerDead) return
    this.isPlayerDead = true

    this.player.setVelocityX(0)
    this.player.setVelocityY(JUMP_VELOCITY)
    this.player.setTint(0xff0000)
    ;(this.player.body as Phaser.Physics.Arcade.Body).allowGravity = true
    ;(this.player.body as Phaser.Physics.Arcade.Body).checkCollision.none = true

    this.time.delayedCall(1500, () => {
      this.scene.stop('HudScene')
      this.scene.start('GameOverScene', {
        score: this.gameState.score,
        coins: this.gameState.coins,
      })
    })
  }

  private reachFlag(): void {
    if (this.isPlayerDead) return
    this.isPlayerDead = true

    this.player.setVelocityX(0)
    this.player.setVelocityY(0)
    ;(this.player.body as Phaser.Physics.Arcade.Body).allowGravity = false

    // Victory!
    this.gameState = {
      ...this.gameState,
      score: this.gameState.score + 1000,
    }
    this.events.emit('updateHud', this.gameState)

    const clearText = this.add.text(this.player.x, this.player.y - 60, 'LEVEL CLEAR!', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0)

    this.tweens.add({
      targets: clearText,
      y: clearText.y - 40,
      duration: 2000,
    })

    // Save high score
    this.saveHighScore()

    this.time.delayedCall(3000, () => {
      this.scene.stop('HudScene')
      this.scene.start('GameOverScene', {
        score: this.gameState.score,
        coins: this.gameState.coins,
        cleared: true,
      })
    })
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused

    if (this.isPaused) {
      this.physics.pause()
      this.pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED\n\nPress ESC to Resume', {
        fontSize: '32px',
        fontFamily: 'monospace',
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 4,
        align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100)
    } else {
      this.physics.resume()
      this.pauseText?.destroy()
    }
  }

  private saveHighScore(): void {
    try {
      const saved = localStorage.getItem('superPixelAdventure')
      const data = saved ? JSON.parse(saved) : { highScore: 0 }
      if (this.gameState.score > data.highScore) {
        localStorage.setItem('superPixelAdventure', JSON.stringify({
          highScore: this.gameState.score,
          timestamp: new Date().toISOString(),
        }))
      }
    } catch {
      // localStorage not available - silently continue
    }
  }
}
