import Phaser from "phaser";
import { INTRO_LINES } from "../data/dialogues";
import { DialogueBox } from "../ui/DialogueBox";

/**
 * Cena 1 — João sai de casa.
 */
export class IntroScene extends Phaser.Scene {
  private dialogue!: DialogueBox;
  private leaving = false;

  constructor() {
    super("Intro");
  }

  create() {
    this.leaving = false;
    const { width, height } = this.scale;
    this.cameras.main.resetFX();
    this.cameras.main.setBackgroundColor("#1a1520");

    const dialogueZoneH = 130;
    const stageBottom = height - dialogueZoneH;

    const bg = this.add.image(width / 2, stageBottom / 2, "intro-home");
    bg.setDisplaySize(width, stageBottom);
    bg.setDepth(0);

    this.add
      .rectangle(width / 2, height - dialogueZoneH / 2, width, dialogueZoneH, 0x0b0d12, 1)
      .setDepth(5);

    this.add
      .text(width / 2, 28, "Manhã no Rio — João sai de casa", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(20);

    const joaoH = Math.floor(stageBottom * 0.72);
    const joaoW = Math.floor(joaoH * 0.78);
    this.add
      .image(width * 0.45, stageBottom - 6, "joao")
      .setDisplaySize(joaoW, joaoH)
      .setOrigin(0.5, 1)
      .setDepth(10);

    this.dialogue = new DialogueBox(this);
    this.dialogue.play(INTRO_LINES, () => this.goToStreet());
  }

  private goToStreet() {
    if (this.leaving) return;
    this.leaving = true;
    this.registry.set("loadGame", false);

    // timeout garante transição mesmo se o evento de fade falhar (evita tela preta)
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start("Level1");
    });
  }

  update() {
    this.dialogue.update();
  }
}
