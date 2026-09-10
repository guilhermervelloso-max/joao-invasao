import Phaser from "phaser";

export const PLAYER_MAX_HP = 100;
const PLAYER_SCALE = 1.85;

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  hp = PLAYER_MAX_HP;
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private attacking = false;
  private attackEndsAt = 0;
  /** Janela em que o soco ainda pode acertar (ms). */
  private hitWindowUntil = 0;
  private hurtUntil = 0;
  private dead = false;
  private readonly speed = 200;
  private readonly depthSpeed = 140;
  /** Inimigos já atingidos neste soco. */
  private hitIds = new Set<number>();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, "joao");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setScale(PLAYER_SCALE);
    this.applyBody();
    this.sprite.setDepth(y);

    const kb = scene.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyJ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    }
  }

  get isDead() {
    return this.dead;
  }

  get isAttacking() {
    return this.attacking;
  }

  /** True enquanto o golpe ainda pode causar dano. */
  get canDealHit() {
    return this.attacking && this.scene.time.now <= this.hitWindowUntil;
  }

  get isInvulnerable() {
    return this.scene.time.now < this.hurtUntil;
  }

  private body() {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  private applyBody() {
    // corpo largo no tronco (frame 96x96, origem nos pés)
    this.body().setSize(36, 48);
    this.body().setOffset(30, 48);
  }

  /** Já acertou este inimigo neste swing? */
  alreadyHit(id: number) {
    return this.hitIds.has(id);
  }

  markHit(id: number) {
    this.hitIds.add(id);
  }

  update(locked: boolean, laneTop: number, laneBottom: number) {
    if (this.dead) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    if (this.attacking && this.scene.time.now >= this.attackEndsAt) {
      this.endAttack();
    }

    const body = this.body();

    if (locked) {
      body.setVelocity(0, 0);
      return;
    }

    if (this.attacking) {
      body.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.keyA.isDown) vx -= this.speed;
    if (this.cursors.right.isDown || this.keyD.isDown) vx += this.speed;
    if (this.cursors.up.isDown || this.keyW.isDown) vy -= this.depthSpeed;
    if (this.cursors.down.isDown || this.keyS.isDown) vy += this.depthSpeed;

    body.setVelocity(vx, vy);

    if (this.sprite.y < laneTop) this.sprite.y = laneTop;
    if (this.sprite.y > laneBottom) this.sprite.y = laneBottom;
    this.sprite.setDepth(this.sprite.y);

    if (vx < 0) this.sprite.setFlipX(true);
    if (vx > 0) this.sprite.setFlipX(false);

    if (Phaser.Input.Keyboard.JustDown(this.keyJ)) {
      this.doAttack();
    }

    if (this.isInvulnerable) {
      this.sprite.setAlpha(Math.sin(this.scene.time.now / 40) > 0 ? 1 : 0.45);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  private doAttack() {
    if (this.attacking || this.dead) return;
    this.attacking = true;
    this.hitIds.clear();
    this.attackEndsAt = this.scene.time.now + 280;
    this.hitWindowUntil = this.scene.time.now + 220;
    this.sprite.setTexture("joao-attack");
    this.sprite.setOrigin(0.5, 1);
    this.applyBody();
  }

  private endAttack() {
    this.attacking = false;
    this.hitIds.clear();
    if (this.dead) return;
    this.sprite.setTexture("joao");
    this.sprite.setOrigin(0.5, 1);
    this.applyBody();
  }

  /**
   * Alcance do soco à frente do João (pés no mundo).
   * @param rangeBonus aumenta o alcance (ex.: chefão maior)
   */
  isInPunchRange(ex: number, ey: number, rangeBonus = 0): boolean {
    const dir = this.sprite.flipX ? -1 : 1;
    const dx = ex - this.sprite.x;
    const dy = ey - this.sprite.y;

    const forward = dir * dx;
    // à frente ou colado; bonus para inimigos grandes (Zarok)
    if (forward < -35 || forward > 150 + rangeBonus) return false;
    if (Math.abs(dy) > 55 + rangeBonus * 0.25) return false;
    return true;
  }

  takeDamage(amount: number, fromX: number): boolean {
    if (this.dead || this.isInvulnerable) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.hurtUntil = this.scene.time.now + 750;
    const dir = this.sprite.x < fromX ? -1 : 1;
    this.sprite.setVelocityX(dir * 200);
    this.sprite.setTint(0xff6b6b);
    this.scene.time.delayedCall(120, () => {
      if (!this.dead) this.sprite.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
    }
    return true;
  }

  private die() {
    this.dead = true;
    this.attacking = false;
    this.sprite.setVelocity(0, 0);
    this.sprite.setTexture("joao");
    this.sprite.setOrigin(0.5, 1);
    this.applyBody();
    this.sprite.setTint(0x555555);
    this.sprite.setAngle(-90);
  }
}
