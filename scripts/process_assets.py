from PIL import Image
from pathlib import Path
from collections import deque

SRC = Path(
    r"C:\Users\Guilherme Velloso\.grok\sessions\C%3A%5CUsers%5CGuilherme%20Velloso\01a0894d-1054-7871-b9cc-28915f77c27d\images"
)
OUT_S = Path("public/assets/sprites")
OUT_B = Path("public/assets/bg")
OUT_S.mkdir(parents=True, exist_ok=True)
OUT_B.mkdir(parents=True, exist_ok=True)


def is_bg(r: int, g: int, b: int) -> bool:
    if r >= 140 and b >= 100 and g <= 140 and (r - g) >= 40:
        return True
    if b >= 190 and g >= 140 and r <= 150 and (g + b) / 2 - r >= 40:
        return True
    if r > 220 and g < 170 and b > 140 and (r - g) > 50:
        return True
    mx, mn = max(r, g, b), min(r, g, b)
    if mx > 180 and (mx - mn) > 60 and r == mx and b > g + 30:
        return True
    return False


def flood_key(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    q: deque[tuple[int, int]] = deque()
    seen = [[False] * w for _ in range(h)]
    seeds = [
        (0, 0),
        (w - 1, 0),
        (0, h - 1),
        (w - 1, h - 1),
        (w // 2, 0),
        (0, h // 2),
        (w - 1, h // 2),
        (w // 2, h - 1),
        (10, 10),
        (w - 10, 10),
    ]
    for sx, sy in seeds:
        r, g, b, _a = px[sx, sy]
        if is_bg(r, g, b):
            q.append((sx, sy))
            seen[sy][sx] = True
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx]:
                seen[ny][nx] = True
                r, g, b, a = px[nx, ny]
                if a and is_bg(r, g, b):
                    q.append((nx, ny))
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and is_bg(r, g, b):
                px[x, y] = (0, 0, 0, 0)
    return img


def autocrop(img: Image.Image, pad: int = 2) -> Image.Image:
    bb = img.getbbox()
    if not bb:
        return img
    l, t, r, b = bb
    return img.crop(
        (max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad))
    )


def fit_box(img: Image.Image, tw: int, th: int) -> Image.Image:
    ratio = min(tw / img.width, th / img.height)
    nw, nh = max(1, int(img.width * ratio)), max(1, int(img.height * ratio))
    scaled = img.resize((nw, nh), Image.NEAREST)
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    canvas.paste(scaled, ((tw - nw) // 2, th - nh), scaled)
    return canvas


def process_sprite(src_name: str, out_name: str, tw: int, th: int) -> None:
    im = flood_key(Image.open(SRC / src_name))
    im = autocrop(im)
    im = fit_box(im, tw, th)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and is_bg(r, g, b):
                px[x, y] = (0, 0, 0, 0)
    dest = OUT_S / out_name
    im.save(dest, "PNG")
    dbg = Image.new("RGBA", im.size, (10, 14, 28, 255))
    Image.alpha_composite(dbg, im).convert("RGB").save(
        OUT_S / f"debug_{out_name.replace('.png', '.jpg')}", quality=95
    )
    transparent = sum(1 for p in im.getdata() if p[3] == 0)
    print(f"{out_name}: transparent={transparent}/{im.size[0]*im.size[1]}")


def process_title_bg() -> None:
    # prefer newest splash if present
    src = SRC / "8.jpg"
    if not src.exists():
        raise SystemExit("title splash 8.jpg missing")
    bg = Image.open(src).convert("RGBA").resize((1600, 600), Image.NEAREST)
    bg.save(OUT_B / "title-splash.png", "PNG")
    print("title-splash.png", bg.size)


if __name__ == "__main__":
    process_sprite("1.jpg", "joao.png", 96, 96)
    process_sprite("6.jpg", "joao-attack.png", 128, 96)
    process_sprite("4.jpg", "alien.png", 96, 96)
    process_sprite("5.jpg", "alien-brute.png", 112, 112)
    process_sprite("2.jpg", "zarok.png", 120, 140)
    process_title_bg()
    print("done")
