export const SAVE_KEY = "joao-invasao-save-v3";
const OLD_KEYS = ["joao-invasao-save-v2", "joao-invasao-save-v1"];

export type GameSave = {
  version: 3;
  playerHp: number;
  playerX: number;
  playerY: number;
  waveIndex: number;
  bossSpawned: boolean;
  /** Se o chefão já apareceu: ainda está vivo? */
  bossAlive: boolean;
  /**
   * Quantos inimigos da ONDA ATUAL ainda estão vivos.
   * 0 = onda limpa (não respawnar).
   */
  waveRemaining: number;
  triggered: string[];
  savedAt: number;
};

function cleanOldKeys() {
  for (const k of OLD_KEYS) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

export function hasSave(): boolean {
  try {
    if (localStorage.getItem(SAVE_KEY)) return true;
    return OLD_KEYS.some((k) => localStorage.getItem(k) !== null);
  } catch {
    return false;
  }
}

export function loadSave(): GameSave | null {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    let fromOld = false;
    if (!raw) {
      for (const k of OLD_KEYS) {
        raw = localStorage.getItem(k);
        if (raw) {
          fromOld = true;
          break;
        }
      }
    }
    if (!raw) return null;

    const data = JSON.parse(raw) as Record<string, unknown>;
    const version = Number(data.version ?? 0);

    const base = {
      playerHp: Number(data.playerHp ?? 100),
      playerX: Number(data.playerX ?? 200),
      playerY: Number(data.playerY ?? 500),
      waveIndex: Number(data.waveIndex ?? 0),
      bossSpawned: Boolean(data.bossSpawned),
      triggered: Array.isArray(data.triggered) ? (data.triggered as string[]) : [],
      savedAt: Number(data.savedAt ?? Date.now()),
    };

    // v3 nativo
    if (version === 3) {
      return {
        version: 3,
        ...base,
        bossAlive: data.bossAlive !== false,
        waveRemaining: Math.max(0, Number(data.waveRemaining ?? 0)),
      };
    }

    // v2: currentWaveCleared
    if (version === 2) {
      const cleared = Boolean(data.currentWaveCleared) || base.bossSpawned;
      return {
        version: 3,
        ...base,
        bossAlive: base.bossSpawned,
        // se não estava limpa, não sabemos quantos faltavam → 0 pra NÃO reviver mortos
        // (melhor rua vazia do que inimigos voltando)
        waveRemaining: cleared ? 0 : 0,
      };
    }

    // v1 ou desconhecido: se boss, só boss; senão não respawna onda
    if (fromOld || version === 1) {
      return {
        version: 3,
        ...base,
        bossAlive: base.bossSpawned,
        waveRemaining: 0,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function writeSave(save: GameSave): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    cleanOldKeys();
  } catch {
    /* ignore */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    cleanOldKeys();
  } catch {
    /* ignore */
  }
}
