import Phaser from "phaser";
import { clearSave, hasSave } from "../data/save";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#05040c");

    // Fundo em brilho normal — sem tint cinza e sem overlay preto em tela cheia
    const bg = this.add.image(width / 2, height / 2, "title-splash");
    bg.setDisplaySize(width, height);
    bg.setAlpha(1);

    // Só uma faixa suave atrás do título/botões pra leitura (não escurece o quadro inteiro)
    const shade = this.add.graphics();
    shade.fillStyle(0x05040c, 0.35);
    shade.fillRect(width / 2 - 220, height * 0.18, 440, 120);
    shade.fillStyle(0x05040c, 0.4);
    shade.fillRect(width / 2 - 170, height * 0.52, 340, 150);

    this.add
      .text(width / 2, height * 0.26, "JOÃO", {
        fontFamily: "Courier New, monospace",
        fontSize: "72px",
        color: "#f0c808",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.26 + 58, "INVASÃO NO RIO", {
        fontFamily: "Courier New, monospace",
        fontSize: "22px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const canLoad = hasSave();
    const btnY = height * 0.58;

    this.makeButton(width / 2, btnY, "NOVO JOGO", true, () => {
      clearSave();
      this.registry.set("loadGame", false);
      this.scene.start("Intro");
    });

    this.makeButton(width / 2, btnY + 64, "CARREGAR JOGO", canLoad, () => {
      if (!canLoad) return;
      this.registry.set("loadGame", true);
      this.scene.start("Level1");
    });

    this.input.keyboard?.once("keydown-ENTER", () => {
      clearSave();
      this.registry.set("loadGame", false);
      this.scene.start("Intro");
    });
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    enabled: boolean,
    onClick: () => void,
  ) {
    const w = 280;
    const h = 48;
    const bgColor = enabled ? 0xf0c808 : 0x3a3f4a;
    const textColor = enabled ? "#0b0d12" : "#7a8294";

    const hit = this.add
      .rectangle(x, y, w, h, bgColor, 1)
      .setStrokeStyle(2, enabled ? 0xffe66d : 0x2a2f3a)
      .setInteractive({ useHandCursor: enabled });

    const text = this.add
      .text(x, y, label, {
        fontFamily: "Courier New, monospace",
        fontSize: "18px",
        color: textColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    if (!enabled) {
      hit.disableInteractive();
      return;
    }

    hit.on("pointerover", () => {
      hit.setFillStyle(0xffe066);
      text.setScale(1.03);
    });
    hit.on("pointerout", () => {
      hit.setFillStyle(0xf0c808);
      text.setScale(1);
    });
    hit.on("pointerdown", () => {
      hit.setFillStyle(0xd4a800);
    });
    hit.on("pointerup", () => {
      hit.setFillStyle(0xffe066);
      onClick();
    });
  }
}
