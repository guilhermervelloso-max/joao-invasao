import Phaser from "phaser";
import {
  BOSS_INTRO_LINES,
  FIRST_CONTACT_LINES,
  MID_LINES,
} from "../data/dialogues";
import { loadSave, writeSave, type GameSave } from "../data/save";
import { Enemy, type EnemyKind } from "../entities/Enemy";
import { Player, PLAYER_MAX_HP } from "../entities/Player";
import { DialogueBox } from "../ui/DialogueBox";
import { Hud } from "../ui/Hud";

const LEVEL_WIDTH = 3200;
const STAGE_TILE_W = 1280;

type Wave = { x: number; kind: EnemyKind }[];

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private dialogue!: DialogueBox;
  private hud!: Hud;
  private pausedByDialogue = false;
  private gamePaused = false;
  private pauseText!: Phaser.GameObjects.Text;
  private waveIndex = 0;
  private triggered = new Set<string>();
  private bossSpawned = false;
  private bossAlive = false;
  /** Inimigos de onda ainda vivos (não conta Zarok). */
  private waveRemaining = 0;
  private levelWon = false;
  private transitioning = false;
  private lastSaveAt = 0;
  private stageH = 720;
  private laneTop = 520;
  private laneBottom = 660;

  private readonly waves: Wave[] = [
    [
      { x: 520, kind: "grunt" },
      { x: 640, kind: "grunt" },
    ],
    [
      { x: 1000, kind: "grunt" },
      { x: 1120, kind: "grunt" },
      { x: 1240, kind: "grunt" },
    ],
    [
      { x: 1600, kind: "grunt" },
      { x: 1750, kind: "brute" },
      { x: 1900, kind: "grunt" },
    ],
  ];

  constructor() {
    super("Level1");
  }

  create() {
    this.enemies = [];
    this.waveIndex = 0;
    this.triggered.clear();
    this.bossSpawned = false;
    this.bossAlive = false;
    this.waveRemaining = 0;
    this.levelWon = false;
    this.pausedByDialogue = false;
    this.gamePaused = false;
    this.transitioning = false;
    this.lastSaveAt = 0;

    const shouldLoad = this.registry.get("loadGame") === true;
    const save = shouldLoad ? loadSave() : null;
    this.registry.set("loadGame", false);

    this.stageH = this.scale.height;
    this.laneTop = Math.floor(this.stageH * 0.72);
    this.laneBottom = Math.floor(this.stageH * 0.92);

    // evita tela preta herdada do fade da intro
    this.cameras.main.resetFX();
    this.cameras.main.setBackgroundColor("#7eb6e8");
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, this.stageH);
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, this.stageH);

    this.buildWorld();

    const startX = save?.playerX ?? 200;
    const startY = Phaser.Math.Clamp(
      save?.playerY ?? this.laneBottom - 20,
      this.laneTop,
      this.laneBottom,
    );
    this.player = new Player(this, startX, startY);
    if (save) {
      this.player.hp = Phaser.Math.Clamp(save.playerHp, 1, PLAYER_MAX_HP);
      this.waveIndex = save.waveIndex;
      this.bossSpawned = save.bossSpawned;
      this.bossAlive = save.bossAlive;
      this.waveRemaining = save.waveRemaining;
      this.triggered = new Set(save.triggered);
    }

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(-160, 80);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.enemyGroup = this.physics.add.group();

    this.hud = new Hud(this);
    this.hud.setHp(this.player.hp, PLAYER_MAX_HP);
    this.events.on("player-damaged", () => {
      this.hud.setHp(this.player.hp, PLAYER_MAX_HP);
      this.hud.flashDamage();
    });
    this.events.on("enemy-killed", this.onEnemyKilled, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off("player-damaged");
      this.events.off("enemy-killed", this.onEnemyKilled, this);
    });

    this.dialogue = new DialogueBox(this);

    this.pauseText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "PAUSA\nESC para continuar", {
        fontFamily: "Courier New, monospace",
        fontSize: "28px",
        color: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);

    const onEsc = () => {
      if (this.pausedByDialogue || this.levelWon || this.player.isDead || this.transitioning) return;
      this.gamePaused = !this.gamePaused;
      this.pauseText.setVisible(this.gamePaused);
      if (this.gamePaused) {
        this.physics.pause();
        this.persistSave();
      } else {
        this.physics.resume();
      }
    };
    this.input.keyboard?.on("keydown-ESC", onEsc);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown-ESC", onEsc);
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // grava na hora se o jogador der F5 / fechar a aba
    const onUnload = () => this.persistSave();
    window.addEventListener("beforeunload", onUnload);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("beforeunload", onUnload);
    });

    this.time.delayedCall(350, () => {
      if (save) {
        this.restoreFromSave(save);
        this.persistSave();
      } else {
        this.openDialogue(FIRST_CONTACT_LINES, "first");
        this.spawnWave(0);
        this.persistSave();
      }
    });
  }

  /**
   * Restaura progresso SEM reviver mortos.
   * - boss: só Zarok (se ainda vivo)
   * - waveRemaining 0: rua limpa
   * - senão: spawna só a quantidade que faltava
   */
  private restoreFromSave(save: GameSave) {
    if (save.bossSpawned) {
      this.waveRemaining = 0;
      if (save.bossAlive) {
        this.bossSpawned = false; // spawnBoss seta true de novo
        this.spawnBoss();
      } else {
        this.bossSpawned = true;
        this.bossAlive = false;
      }
      return;
    }

    this.bossSpawned = false;
    this.bossAlive = false;

    if (save.waveRemaining <= 0) {
      this.waveRemaining = 0;
      return;
    }

    this.spawnWave(this.waveIndex, save.waveRemaining);
  }

  private persistSave() {
    if (this.player.isDead || this.levelWon) return;
    // sincroniza contagem ao vivo antes de gravar
    if (!this.bossSpawned) {
      this.waveRemaining = this.livingWaveEnemies().length;
    }
    const data: GameSave = {
      version: 3,
      playerHp: this.player.hp,
      playerX: this.player.sprite.x,
      playerY: this.player.sprite.y,
      waveIndex: this.waveIndex,
      bossSpawned: this.bossSpawned,
      bossAlive: this.bossSpawned && this.bossAlive,
      waveRemaining: this.bossSpawned ? 0 : this.waveRemaining,
      triggered: [...this.triggered],
      savedAt: Date.now(),
    };
    writeSave(data);
    this.lastSaveAt = this.time.now;
  }

  private livingWaveEnemies() {
    return this.livingEnemies().filter((e) => e.kind !== "zarok");
  }

  private onEnemyKilled = (enemy: Enemy) => {
    if (enemy.kind === "zarok") {
      this.bossAlive = false;
      this.persistSave();
      return;
    }
    this.waveRemaining = this.livingWaveEnemies().length;
    if (this.waveRemaining <= 0) this.waveRemaining = 0;
    this.persistSave();
  };

  private buildWorld() {
    this.add
      .rectangle(LEVEL_WIDTH / 2, this.stageH * 0.15, LEVEL_WIDTH, this.stageH * 0.3, 0x7eb6e8)
      .setDepth(-30);

    for (let x = 0; x < LEVEL_WIDTH + STAGE_TILE_W; x += STAGE_TILE_W) {
      const plate = this.add.image(x, 0, "rio-stage").setOrigin(0, 0);
      plate.setDisplaySize(STAGE_TILE_W, this.stageH);
      plate.setDepth(-20);
    }

    this.add
      .rectangle(
        LEVEL_WIDTH / 2,
        (this.laneTop + this.laneBottom) / 2,
        LEVEL_WIDTH,
        this.laneBottom - this.laneTop + 50,
        0x000000,
        0.08,
      )
      .setDepth(-15);

    this.add
      .text(24, 16, "Rua — Rio de Janeiro", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#0b0d12",
        backgroundColor: "#f0c808",
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(900);
  }

  /** @param onlyCount se definido, spawna só N inimigos (resto já estava morto no save) */
  private spawnWave(index: number, onlyCount?: number) {
    const wave = this.waves[index];
    if (!wave) return;

    const spawns = wave.filter((s) => s.kind !== "zarok");
    const count =
      onlyCount === undefined
        ? spawns.length
        : Math.max(0, Math.min(onlyCount, spawns.length));

    if (count <= 0) {
      this.waveRemaining = 0;
      this.persistSave();
      return;
    }

    // pega os últimos N spawns (os que “sobraram”)
    const toSpawn = spawns.slice(spawns.length - count);
    this.waveRemaining = count;

    for (const spawn of toSpawn) {
      const y = Phaser.Math.Between(this.laneTop + 10, this.laneBottom - 5);
      const enemy = new Enemy(this, spawn.x, y, spawn.kind);
      this.enemies.push(enemy);
      this.enemyGroup.add(enemy.sprite);
    }
    this.persistSave();
  }

  private spawnBoss() {
    if (this.bossSpawned) return;
    if (this.enemies.some((e) => e.kind === "zarok" && !e.isDead)) return;

    this.bossSpawned = true;
    this.bossAlive = true;
    this.waveRemaining = 0;
    this.openDialogue(BOSS_INTRO_LINES, "boss");
    const boss = new Enemy(
      this,
      this.player.sprite.x + 220,
      this.laneBottom - 15,
      "zarok",
    );
    this.enemies.push(boss);
    this.enemyGroup.add(boss.sprite);
    this.persistSave();
  }

  private openDialogue(lines: typeof FIRST_CONTACT_LINES, id: string) {
    if (this.triggered.has(id)) return;
    this.triggered.add(id);
    this.pausedByDialogue = true;
    this.dialogue.play(lines, () => {
      this.pausedByDialogue = false;
      this.persistSave();
    });
  }

  private livingEnemies() {
    return this.enemies.filter((e) => !e.isDead && e.sprite.active);
  }

  /** Dano por distância — mais confiável que overlap de Zone. */
  private resolvePlayerHits() {
    if (!this.player.canDealHit) return;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      if (this.player.alreadyHit(enemy.id)) continue;
      const bonus = enemy.kind === "zarok" ? 50 : 0;
      if (!this.player.isInPunchRange(enemy.sprite.x, enemy.sprite.y, bonus)) continue;
      this.player.markHit(enemy.id);
      const dmg = enemy.kind === "zarok" ? 28 : 22;
      enemy.takeDamage(dmg, this.player.sprite.x);
    }
  }

  update() {
    this.dialogue.update();
    if (this.gamePaused || this.transitioning) return;

    const locked = this.pausedByDialogue || this.levelWon;
    this.player.update(locked, this.laneTop, this.laneBottom);
    this.resolvePlayerHits();
    this.hud.layout();
    this.hud.setHp(this.player.hp, PLAYER_MAX_HP);

    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        enemy.update(this.player, locked, this.laneTop, this.laneBottom);
      }
    }

    if (this.player.isDead) {
      this.transitioning = true;
      this.persistSave();
      this.time.delayedCall(700, () => {
        if (this.scene.isActive()) this.scene.start("GameOver");
      });
      return;
    }

    if (this.time.now - this.lastSaveAt > 4000) {
      this.persistSave();
    }

    if (this.player.sprite.x > 800 && this.waveIndex < 1) {
      this.waveIndex = 1;
      this.spawnWave(1);
      this.openDialogue(MID_LINES, "mid");
      this.persistSave();
    }
    if (this.player.sprite.x > 1450 && this.waveIndex < 2) {
      this.waveIndex = 2;
      this.spawnWave(2);
      this.persistSave();
    }

    if (
      this.player.sprite.x > 2100 &&
      !this.bossSpawned &&
      this.waveRemaining <= 0 &&
      this.livingWaveEnemies().length === 0
    ) {
      this.spawnBoss();
    }

    if (this.bossSpawned && this.bossAlive === false && !this.levelWon) {
      const zarok = this.enemies.find((e) => e.kind === "zarok");
      // zarok morto (ou já removido após kill event)
      if (!zarok || zarok.isDead) {
        this.levelWon = true;
        this.transitioning = true;
        this.goToEnding();
      }
    }
  }

  /** Limpa sprites da rua e vai pra tela final (evita skins “voando”). */
  private goToEnding() {
    this.player.sprite.setVelocity(0, 0);
    const pBody = this.player.sprite.body as Phaser.Physics.Arcade.Body | undefined;
    if (pBody) pBody.enable = false;

    for (const enemy of this.enemies) {
      this.tweens.killTweensOf(enemy.sprite);
      if (enemy.sprite.active) {
        enemy.sprite.setVelocity(0, 0);
        enemy.sprite.setVisible(false);
        enemy.sprite.destroy();
      }
    }
    this.enemies = [];

    this.player.sprite.setVisible(false);

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(450, () => {
      if (this.scene.isActive()) this.scene.start("Ending");
    });
  }
}
