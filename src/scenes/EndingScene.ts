import Phaser from "phaser";
import { clearSave } from "../data/save";
import { ENDING_LINES } from "../data/dialogues";
import { DialogueBox } from "../ui/DialogueBox";

/** Tela final — sem sprites “flutuando”; só cenário + diálogo. */
export class EndingScene extends Phaser.Scene {
  private dialogue!: DialogueBox;

  constructor() {
    super("Ending");
  }

  create() {
    clearSave();

    const { width, height } = this.scale;
    this.cameras.main.resetFX();
    this.cameras.main.setBackgroundColor("#101826");
    this.cameras.main.fadeIn(350, 0, 0, 0);

    const bg = this.add.image(width / 2, height / 2, "rio-stage");
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.4);
    this.add.rectangle(width / 2, height / 2, width, height, 0x101826, 0.55);

    this.add
      .text(width / 2, height * 0.22, "Zarok recua… por enquanto", {
        fontFamily: "Courier New, monospace",
        fontSize: "22px",
        color: "#f0c808",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.dialogue = new DialogueBox(this);
    this.dialogue.play(ENDING_LINES, () => {
      this.add
        .text(width / 2, height * 0.42, "FIM DO EPISÓDIO 1", {
          fontFamily: "Courier New, monospace",
          fontSize: "32px",
          color: "#7ec8e3",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 6,
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, height * 0.52, "ENTER — voltar ao menu", {
          fontFamily: "Courier New, monospace",
          fontSize: "16px",
          color: "#e8eef7",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      this.input.keyboard?.once("keydown-ENTER", () => this.scene.start("Title"));
      this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Title"));
      this.input.keyboard?.once("keydown-ESC", () => this.scene.start("Title"));
    });
  }

  update() {
    this.dialogue.update();
  }
}
