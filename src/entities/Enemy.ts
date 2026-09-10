import Phaser from "phaser";
import type { Player } from "./Player";

export type EnemyKind = "grunt" | "brute" | "zarok";

const STATS: Record<
  EnemyKind,
  {
    hp: number;
    speed: number;
    damage: number;
    texture: string;
    scale: number;
    bodyW: number;
    bodyH: number;
    offX: number;
    offY: number;
  }
> = {
  grunt: {
    hp: 30,
    speed: 85,
    damage: 8,
    texture: "alien",
    scale: 1.7,
    bodyW: 28,
    bodyH: 18,
    offX: 34,
    offY: 78,
  },
  brute: {
    hp: 65,
    speed: 60,
    damage: 12,
    texture: "alien-brute",
    scale: 1.85,
    bodyW: 32,
    bodyH: 20,
    offX: 40,
    offY: 90,
  },
  zarok: {
    hp: 120,
    speed: 75,
    damage: 14,
    texture: "zarok-boss",
    scale: 2.0,
    bodyW: 34,
    bodyH: 22,
    offX: 43,
    offY: 116,
  },
};

let nextEnemyId = 1;

export class Enemy {
  readonly id: number;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly kind: EnemyKind;
  hp: number;
  private scene: Phaser.Scene;
  private attackCooldown = 0;
  private dead = false;
  private readonly damage: number;
  private readonly speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
    this.scene = scene;
    this.id = nextEnemyId++;
    this.kind = kind;
    const s = STATS[kind];
    this.hp = s.hp;
    this.damage = s.damage;
    this.speed = s.speed;

    this.sprite = scene.physics.add.sprite(x, y, s.texture);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setScale(s.scale);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(s.bodyW, Math.max(40, s.bodyH + 24));
    body.setOffset(s.offX, Math.max(20, s.offY - 40));

    this.sprite.setData("enemyRef", this);
    this.sprite.setData("kind", kind);
    this.sprite.setDepth(y);
  }

  get isDead() {
    return this.dead;
  }

  update(player: Player, locked: boolean, laneTop: number, laneBottom: number) {
    if (this.dead) {
      this.sprite.setVelocity(0, 0);
      return;
    }
    if (locked) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    // fica perto o bastante pra o soco do João alcançar
    const stopDist = this.kind === "zarok" ? 70 : 48;

    if (dist > stopDist) {
      this.sprite.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
    } else {
      this.sprite.setVelocity(0, 0);
      if (this.scene.time.now > this.attackCooldown) {
        const hit = player.takeDamage(this.damage, this.sprite.x);
        this.attackCooldown = this.scene.time.now + (this.kind === "zarok" ? 1100 : 1200);
        if (hit) {
          this.scene.events.emit("player-damaged");
        }
      }
    }

    if (this.sprite.y < laneTop) this.sprite.y = laneTop;
    if (this.sprite.y > laneBottom) this.sprite.y = laneBottom;
    this.sprite.setDepth(this.sprite.y);
    this.sprite.setFlipX(dx < 0);
  }

  takeDamage(amount: number, fromX: number) {
    if (this.dead) return false;
    this.hp -= amount;
    const dir = this.sprite.x < fromX ? -1 : 1;
    this.sprite.setVelocityX(dir * (this.kind === "zarok" ? 220 : 180));
    // vermelho forte — branco quase não aparece no Zarok dourado
    this.sprite.setTint(0xff3355);
    this.scene.time.delayedCall(140, () => {
      if (!this.dead) this.sprite.clearTint();
    });
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die() {
    this.dead = true;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.enable = false;
      body.setVelocity(0, 0);
    }
    this.sprite.setVelocity(0, 0);
    this.sprite.setTint(0x333333);
    // avisa a fase NA HORA pra gravar o save (inimigo morto não revive)
    this.scene.events.emit("enemy-killed", this);
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      y: this.sprite.y + 10,
      duration: 320,
      onComplete: () => {
        if (this.sprite.active) this.sprite.destroy();
      },
    });
  }
}
