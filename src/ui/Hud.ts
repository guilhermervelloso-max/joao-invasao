import Phaser from "phaser";

/**
 * Barra de vida sempre visível: reposiciona todo frame pela câmera
 * (evita bug de scrollFactor/Container no Phaser).
 */
export class Hud {
  private scene: Phaser.Scene;
  private panel: Phaser.GameObjects.Rectangle;
  private barBg: Phaser.GameObjects.Rectangle;
  private barFill: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private readonly maxWidth = 260;
  private readonly barH = 20;
  private readonly ox = 20;
  private readonly oy = 16;
  private curHp = 100;
  private maxHp = 100;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.panel = scene.add
      .rectangle(0, 0, 320, 90, 0x05070e, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(3, 0xf0c808)
      .setDepth(5000)
      .setScrollFactor(0);

    this.label = scene.add
      .text(0, 0, "JOÃO", {
        fontFamily: "Courier New, monospace",
        fontSize: "18px",
        color: "#f0c808",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setDepth(5001)
      .setScrollFactor(0);

    this.barBg = scene.add
      .rectangle(0, 0, this.maxWidth, this.barH, 0x1a1d26)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0xffffff, 0.55)
      .setDepth(5001)
      .setScrollFactor(0);

    this.barFill = scene.add
      .rectangle(0, 0, this.maxWidth, this.barH, 0x3fbf5a)
      .setOrigin(0, 0.5)
      .setDepth(5002)
      .setScrollFactor(0);

    this.hpText = scene.add
      .text(0, 0, "100 / 100", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(5003)
      .setScrollFactor(0);

    this.hint = scene.add
      .text(0, 0, "A/D mover · W/S profundidade · J soco · ESC pausa", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        color: "#d7deea",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setDepth(5001)
      .setScrollFactor(0);

    this.layout();
    this.setHp(100, 100);
  }

  /** Chamar no update da fase para manter a barra na tela. */
  layout() {
    const x = this.ox;
    const y = this.oy;

    this.panel.setPosition(x, y);
    this.label.setPosition(x + 14, y + 10);
    this.barBg.setPosition(x + 14, y + 46);
    this.barFill.setPosition(x + 14, y + 46);
    this.hpText.setPosition(x + 14 + this.maxWidth / 2, y + 46);
    this.hint.setPosition(x + 14, y + 64);
  }

  setHp(current: number, max: number) {
    this.curHp = Math.max(0, Math.round(current));
    this.maxHp = max;
    const ratio = Phaser.Math.Clamp(this.curHp / max, 0, 1);
    const w = Math.max(0, Math.floor(this.maxWidth * ratio));

    this.barFill.setSize(w <= 0 ? 0.0001 : w, this.barH);
    this.barFill.width = w <= 0 ? 0.0001 : w;
    this.barFill.setVisible(w > 0);

    if (ratio > 0.5) this.barFill.setFillStyle(0x3fbf5a, 1);
    else if (ratio > 0.25) this.barFill.setFillStyle(0xf0c808, 1);
    else this.barFill.setFillStyle(0xff2e63, 1);

    this.hpText.setText(`${this.curHp} / ${this.maxHp}`);
  }

  setVisible(v: boolean) {
    this.panel.setVisible(v);
    this.barBg.setVisible(v);
    this.barFill.setVisible(v && this.curHp > 0);
    this.label.setVisible(v);
    this.hpText.setVisible(v);
    this.hint.setVisible(v);
  }

  flashDamage() {
    const targets = [this.panel, this.label, this.barBg, this.hpText];
    this.scene.tweens.add({
      targets,
      alpha: 0.25,
      duration: 70,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        for (const t of targets) t.setAlpha(1);
        this.barFill.setAlpha(1);
      },
    });
  }
}
