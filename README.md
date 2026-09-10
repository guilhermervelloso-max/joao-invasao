# João: Invasão no Rio

Beat 'em up 2D pixelado — João vs invasão alienígena no Rio de Janeiro.

## Playtest local (localhost)

```bash
cd joao-invasao
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (geralmente `http://localhost:5173`).

### Controles (PC)

- **A / D** ou setas — mover
- **W / S** — profundidade na rua
- **J** ou **Espaço** — soco
- **Espaço / Enter** — avançar falas
- **ESC** — pausa / menu (nas telas finais)

## Build para Netlify

```bash
npm run build
```

A pasta `dist/` é o que sobe na Netlify.

1. Conecte o repositório (ou faça drag-and-drop da pasta `dist`)
2. Build command: `npm run build`
3. Publish directory: `dist`

O arquivo `netlify.toml` já configura isso.

## Observações

- Só **João** e **Zarok** falam (texto na parte inferior)
- HP finito — se zerar, game over
- Sem dublagem
