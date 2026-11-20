"""Cut Dhaka silhouette motifs out of public/art/landmarks-dark.jpg.

Each silhouette gets a real alpha matte keyed from ink luminance (dark ink on
light paper), is trimmed to its own bounding box so its base sits exactly on
the ground line, and is saved as white-on-transparent WebP. The UI uses these
as CSS mask-image, so their colour always comes from the palette.

    python scripts/build-motifs.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / "public/art/landmarks-dark.jpg"
OUT = ROOT / "public/art/motifs"

# (x, y, w, h) boxes on the 1792x2400 sheet; labels are left outside the boxes.
BOXES = {
    "parliament": (80, 210, 560, 230),
    "memorial": (686, 76, 440, 364),
    "shaheed-minar": (1224, 156, 490, 284),
    "ahsan-manzil": (80, 580, 576, 314),
    "lalbagh": (720, 676, 456, 218),
    "curzon": (1256, 550, 450, 344),
    "skyline": (236, 1024, 1320, 412),
    "metro": (80, 1580, 624, 274),
    "mosque": (750, 1536, 436, 320),
    "boat": (90, 1990, 540, 250),
    "rickshaw": (730, 2020, 324, 236),
    "banyan": (1116, 1836, 620, 420),
}

# Stray print marks inside a box, relative (x, y, w, h), painted out before matting.
ERASE = {"banyan": (0, 0, 60, 18)}

PAPER_CUTOFF = 212  # luminance at or above this is paper (alpha 0)
INK_FULL = 96       # luminance at or below this is solid ink (alpha 1)


def matte(img: Image.Image) -> Image.Image:
    rgb = np.asarray(img.convert("RGB"), dtype=np.float32)
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    alpha = np.clip((PAPER_CUTOFF - lum) / (PAPER_CUTOFF - INK_FULL), 0, 1)
    alpha[alpha < 0.08] = 0  # drop paper grain
    out = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    out[..., :3] = 255
    out[..., 3] = (alpha * 255).round().astype(np.uint8)
    cut = Image.fromarray(out, "RGBA")
    bbox = cut.getchannel("A").getbbox()
    assert bbox, "empty crop"
    return cut.crop(bbox)


def save(img: Image.Image, name: str) -> None:
    path = OUT / f"{name}.webp"
    img.save(path, "WEBP", quality=82, alpha_quality=90, method=6)
    print(f"{path.relative_to(ROOT)}  {img.width}x{img.height}  {path.stat().st_size // 1024} KB")


def ridge(cuts: dict[str, Image.Image], order: list[tuple[str, int]], height: int, gap: int) -> Image.Image:
    """Lays silhouettes side by side on one ground line; each (name, h) is scaled to height h."""
    parts = []
    for name, h in order:
        src = cuts[name]
        parts.append(src.resize((round(src.width * h / src.height), h), Image.LANCZOS))
    width = sum(p.width for p in parts) + gap * len(parts)
    canvas = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    x = gap // 2
    for p in parts:
        canvas.alpha_composite(p, (x, height - p.height))
        x += p.width + gap
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SHEET)
    assert sheet.size == (1792, 2400), sheet.size
    cuts = {}
    for name, (x, y, w, h) in BOXES.items():
        crop = sheet.crop((x, y, x + w, y + h)).convert("RGB")
        if name in ERASE:
            ex, ey, ew, eh = ERASE[name]
            crop.paste((255, 255, 255), (ex, ey, ex + ew, ey + eh))
        cuts[name] = matte(crop)

    for name in ("rickshaw", "boat"):
        save(cuts[name], name)

    # One wide, tileable Dhaka ridge: trees, heritage, monuments, metro, towers.
    save(ridge(cuts, [
        ("banyan", 200), ("lalbagh", 104), ("rickshaw", 78), ("memorial", 236), ("parliament", 108),
        ("metro", 112), ("skyline", 196), ("shaheed-minar", 128), ("curzon", 150), ("mosque", 150),
        ("ahsan-manzil", 128),
    ], height=240, gap=34), "ridge")


if __name__ == "__main__":
    main()
