import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0b0d12");

    const barBg = this.add.rectangle(width / 2, height / 2 + 20, 320, 18, 0x1a1d26);
    const bar = this.add
      .rectangle(width / 2 - 160, height / 2 + 20, 0, 14, 0xf0c808)
      .setOrigin(0, 0.5);
    this.add
      .text(width / 2, height / 2 - 24, "Carregando…", {
        fontFamily: "Courier New, monospace",
        fontSize: "18px",
        color: "#f0c808",
      })
      .setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      bar.width = 320 * value;
      void barBg;
    });

    const v = "?v=12";
    this.load.image("joao", `/assets/sprites/joao.png${v}`);
    this.load.image("joao-attack", `/assets/sprites/joao-attack.png${v}`);
    this.load.image("alien", `/assets/sprites/alien.png${v}`);
    this.load.image("alien-brute", `/assets/sprites/alien-brute.png${v}`);
    this.load.image("zarok-boss", `/assets/sprites/zarok-boss.png${v}`);
    this.load.image("rio-stage", `/assets/bg/rio-stage.png${v}`);
    this.load.image("title-splash", `/assets/bg/title-splash.png${v}`);
    this.load.image("intro-home", `/assets/bg/intro-home.png${v}`);
  }

  create() {
    for (const key of [
      "joao",
      "joao-attack",
      "alien",
      "alien-brute",
      "zarok-boss",
      "rio-stage",
      "title-splash",
      "intro-home",
    ]) {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
    this.scene.start("Title");
  }
}
