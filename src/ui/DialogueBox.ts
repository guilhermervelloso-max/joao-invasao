import Phaser from "phaser";
import { SPEAKER_LABEL, type Line } from "../data/dialogues";

type DoneCallback = () => void;

export class DialogueBox {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;
  private queue: Line[] = [];
  private active = false;
  private onDone: DoneCallback | null = null;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyEnter!: Phaser.Input.Keyboard.Key;
  private lockedUntil = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const boxW = Math.max(320, width - 40);

    this.bg = scene.add
      .rectangle(0, 0, boxW, 110, 0x0b0d12, 0.92)
      .setStrokeStyle(2, 0xf0c808)
      .setOrigin(0.5);

    this.nameText = scene.add
      .text(-boxW / 2 + 24, -42, "", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        color: "#f0c808",
        fontStyle: "bold",
      })
      .setOrigin(0, 0);

    this.bodyText = scene.add
      .text(-boxW / 2 + 24, -18, "", {
        fontFamily: "Courier New, monospace",
        fontSize: "15px",
        color: "#f5f5f5",
        wordWrap: { width: boxW - 60 },
        lineSpacing: 4,
      })
      .setOrigin(0, 0);

    this.hintText = scene.add
      .text(boxW / 2 - 24, 38, "ESPAÇO / ENTER", {
        fontFamily: "Courier New, monospace",
        fontSize: "11px",
        color: "#9aa3b5",
      })
      .setOrigin(1, 0.5);

    this.root = scene.add
      .container(width / 2, height - 70, [
        this.bg,
        this.nameText,
        this.bodyText,
        this.hintText,
      ])
      .setDepth(1000)
      .setScrollFactor(0)
      .setVisible(false);

    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyEnter = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }
  }

  isOpen() {
    return this.active;
  }

  play(lines: Line[], onDone?: DoneCallback) {
    this.queue = [...lines];
    this.onDone = onDone ?? null;
    this.active = true;
    this.root.setVisible(true);
    this.lockedUntil = this.scene.time.now + 250;
    this.showCurrent();
  }

  update() {
    if (!this.active) return;
    if (this.scene.time.now < this.lockedUntil) return;
    if (!this.keySpace || !this.keyEnter) return;

    if (
      Phaser.Input.Keyboard.JustDown(this.keySpace) ||
      Phaser.Input.Keyboard.JustDown(this.keyEnter)
    ) {
      this.advance();
    }
  }

  private showCurrent() {
    const line = this.queue[0];
    if (!line) {
      this.close();
      return;
    }
    const color = line.speaker === "joao" ? "#7ec8e3" : "#ff6b6b";
    this.nameText.setColor(color);
    this.nameText.setText(SPEAKER_LABEL[line.speaker]);
    this.bodyText.setText(line.text);
  }

  private advance() {
    this.queue.shift();
    this.lockedUntil = this.scene.time.now + 180;
    if (this.queue.length === 0) {
      this.close();
      return;
    }
    this.showCurrent();
  }

  private close() {
    this.active = false;
    this.root.setVisible(false);
    const done = this.onDone;
    this.onDone = null;
    done?.();
  }
}
