# Publicar o João: Invasão no Rio

## Repositório GitHub

**https://github.com/guilhermervelloso-max/joao-invasao**

Código completo do jogo (Vite + Phaser 3), o mesmo do localhost.

---

## Passo a passo: GitHub → Grok (domínio `*.grok.me`)

1. Abra [https://grok.com](https://grok.com) e entre no modo **Build**
2. Conecte o **GitHub** (Settings / Connectors / GitHub), se ainda não conectou
3. No chat do Build, cole:

```
Use o repositório GitHub guilhermervelloso-max/joao-invasao como fonte.
É um jogo Vite + TypeScript + Phaser 3 já pronto (João: Invasão no Rio).
NÃO refaça o jogo do zero.
Importe / clone / use esse código e assets como estão.
Faça o preview rodar e depois publique no domínio grok.me.
```

4. Quando o preview estiver ok → **Publish**
5. Escolha público / link / só você
6. Você recebe o link `https://….grok.me`

Se o Build Mode não tiver botão de importar repo, o texto acima pede para ele puxar o GitHub conectado.

---

## Rodar local (igual antes)

```bash
cd "C:\Users\Guilherme Velloso\joao-invasao"
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

Pasta publicada: `dist/`
