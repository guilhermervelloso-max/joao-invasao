import Phaser from "phaser";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#12080c");
    const bg = this.add.image(width / 2, height / 2, "rio-stage");
    bg.setDisplaySize(width, height).setAlpha(0.25);
    this.add.image(width / 2, height / 2 + 120, "joao").setScale(1.6).setTint(0x555555).setAngle(-20);

    this.add
      .text(width / 2, height / 2 - 40, "JOÃO CAIU", {
        fontFamily: "Courier New, monospace",
        fontSize: "42px",
        color: "#ff2e63",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 10, "A invasão não espera. Levanta e tenta de novo.", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#9aa3b5",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 70, "ENTER — tentar de novo    ESC — menu", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#f0c808",
      })
      .setOrigin(0.5);

    // tenta de novo a partir do save; ESC volta ao menu
    this.input.keyboard?.once("keydown-ENTER", () => {
      this.registry.set("loadGame", true);
      this.scene.start("Level1");
    });
    this.input.keyboard?.once("keydown-SPACE", () => {
      this.registry.set("loadGame", true);
      this.scene.start("Level1");
    });
    this.input.keyboard?.once("keydown-ESC", () => this.scene.start("Title"));
  }
}
