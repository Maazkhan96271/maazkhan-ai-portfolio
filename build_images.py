#!/usr/bin/env python3
"""Grade the raw portrait into site-ready assets."""
from PIL import Image, ImageFilter, ImageEnhance, ImageChops, ImageDraw
import os, math

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = "/Users/mohdmaazkhan/.config/freebuff-desktop/attachment-images/1e91d1b0a8654943d90f2300f39b0290446a4c3743e3e2a6693c2c74f3000230.jpg"
OUT = os.path.join(ROOT, "assets")
os.makedirs(OUT, exist_ok=True)

src = Image.open(SRC).convert("RGB")
W, H = src.size

# --- framing: square headshot centred on the face -------------------------
FCX, FCY = 675, 390          # face centre in source pixels
SIZE = 820
left = max(0, min(W - SIZE, FCX - SIZE // 2))
top = max(0, min(H - SIZE, FCY - int(SIZE * 0.42)))
crop = src.crop((left, top, left + SIZE, top + SIZE))

def channel_mean(ch):
    hist = ch.histogram()
    total = sum(hist)
    return sum(i * c for i, c in enumerate(hist)) / total

def gray_world(img, strength=0.65):
    """Neutralise the warm indoor cast without going flat."""
    r, g, b = img.split()
    mr, mg, mb = channel_mean(r), channel_mean(g), channel_mean(b)
    target = (mr + mg + mb) / 3.0
    def lut(ch_mean, m):
        f = 1.0 + strength * (target / m - 1.0)
        return [min(255, max(0, int(round(i * f)))) for i in range(256)]
    return Image.merge("RGB", (r.point(lut(mr, mr)), g.point(lut(mg, mg)), b.point(lut(mb, mb))))

def split_tone(img, hi=(6, 3, -6), sh=(-5, -1, 7), pivot=140):
    """Warm highlights, cool shadows — the classic editorial grade."""
    lum = img.convert("L")
    out = []
    for i, ch in enumerate(img.split()):
        h, s = hi[i], sh[i]
        def f(v, h=h, s=s, p=pivot):
            if v >= p:
                t = (v - p) / (255.0 - p)
                return min(255, max(0, v + h * t))
            t = 1.0 - v / float(p)
            return min(255, max(0, v + s * t))
        out.append(ch.point([f(v) for v in range(256)]))
    merged = Image.merge("RGB", tuple(out))
    return Image.blend(img, merged, 0.85)

def soften_skin(img, amount=0.42, radius=4.0):
    """High-pass style smoothing: blurs texture, keeps the face structure."""
    blurred = img.filter(ImageFilter.GaussianBlur(radius))
    smooth = Image.blend(img, blurred, amount)
    return Image.blend(img, smooth, 0.65)

def vignette(img, strength=0.28):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    steps = 60
    for i in range(steps, 0, -1):
        t = i / steps
        val = int(255 * strength * (t ** 2.2))
        rx, ry = w * 0.78 * t, h * 0.78 * t
        d.ellipse([w / 2 - rx, h / 2 - ry, w / 2 + rx, h / 2 + ry], fill=val)
    mask = mask.filter(ImageFilter.GaussianBlur(60))
    dark = Image.new("RGB", (w, h), (4, 6, 14))
    return Image.composite(dark, img, mask.point(lambda v: int(v)))

def grade(img, bokeh=False):
    img = gray_world(img)
    img = ImageEnhance.Brightness(img).enhance(1.05)
    img = ImageEnhance.Contrast(img).enhance(1.10)
    img = ImageEnhance.Color(img).enhance(1.10)
    img = soften_skin(img)
    img = split_tone(img)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=105, threshold=3))
    img = ImageEnhance.Contrast(img).enhance(1.03)
    if bokeh:
        img = vignette(img, 0.30)
    return img

# --- 1. square avatar -----------------------------------------------------
avatar = grade(crop.resize((1000, 1000), Image.LANCZOS))
avatar.save(os.path.join(OUT, "profile.jpg"), quality=90, optimize=True, progressive=True)

# --- 2. portrait card (4:5) with creamy background bokeh -------------------
pw, ph = 880, 1100
pleft = max(0, min(W - pw, FCX - pw // 2 + 10))
ptop = max(0, min(H - ph, FCY - int(ph * 0.36)))
pcrop = src.crop((pleft, ptop, pleft + pw, ptop + ph)).resize((pw, ph), Image.LANCZOS)

sharp = grade(pcrop, bokeh=True)
blurred = grade(pcrop.filter(ImageFilter.GaussianBlur(24)), bokeh=True)
# feathered radial mask keeps the face crisp, melts the room behind it
mask = Image.new("L", (pw, ph), 0)
d = ImageDraw.Draw(mask)
cx, cy = int(pw * 0.50), int(ph * 0.34)
STEPS = 80
for i in range(STEPS, 0, -1):
    t = i / STEPS                      # 1.0 -> 0.01
    r = 560 * t
    # solid over the face, fading out into the room
    if t <= 0.62:
        val = 255
    else:
        val = int(255 * max(0.0, 1.0 - (t - 0.62) / 0.38))
    d.ellipse([cx - r, cy - int(r * 1.25), cx + r, cy + int(r * 1.25)], fill=val)
mask = mask.filter(ImageFilter.GaussianBlur(70))
portrait = Image.composite(sharp, blurred, mask)
portrait.save(os.path.join(OUT, "portrait.jpg"), quality=88, optimize=True, progressive=True)

# --- 3. ambient hero backdrop ---------------------------------------------
bw, bh = 2000, 1250
bg = src.resize((bw, int(W and H * bw / W)), Image.LANCZOS)
bg = bg.crop((0, 60, bw, 60 + bh)) if bg.size[1] > bh + 60 else bg
bg = bg.filter(ImageFilter.GaussianBlur(34))
bg = gray_world(bg)
bg = ImageEnhance.Brightness(bg).enhance(0.55)
bg = ImageEnhance.Color(bg).enhance(1.15)
bg = vignette(bg, 0.55)
bg.save(os.path.join(OUT, "backdrop.jpg"), quality=82, optimize=True, progressive=True)

for f in sorted(os.listdir(OUT)):
    p = os.path.join(OUT, f)
    print(f, Image.open(p).size, os.path.getsize(p))
