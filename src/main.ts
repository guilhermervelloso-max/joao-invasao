import "./style.css";
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { TitleScene } from "./scenes/TitleScene";
import { IntroScene } from "./scenes/IntroScene";
import { LevelScene } from "./scenes/LevelScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { EndingScene } from "./scenes/EndingScene";

/** Resolução interna fixa 16:9 — estável, sem loop de resize. */
const GAME_W = 1280;
const GAME_H = 720;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: GAME_W,
  height: GAME_H,
  backgroundColor: "#0b0d12",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    IntroScene,
    LevelScene,
    GameOverScene,
    EndingScene,
  ],
  scale: {
    // cobre a janela inteira (sem barras pretas); pode cortar um pouco nas bordas
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  render: {
    antialias: false,
    powerPreference: "high-performance",
  },
};

new Phaser.Game(config);
