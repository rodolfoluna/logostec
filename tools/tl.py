"""Helpers to vectorize color masks into SVG path data (potrace)."""
import numpy as np, cv2, potrace
from PIL import Image

import os
IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'referencias') + os.sep


def load(name):
    im = np.array(Image.open(IMG + name).convert('RGBA')).astype(np.float32)
    return im


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def dist(im, color):
    return np.sqrt(((im[..., :3] - hexrgb(color)) ** 2).sum(-1))


def nearest(im, colors, alpha_min=128):
    """Label each pixel with index of nearest color (or -1 if transparent)."""
    d = np.stack([dist(im, c) for c in colors], -1)
    lab = d.argmin(-1)
    lab[im[..., 3] < alpha_min] = -1
    return lab


def clean(mask, open_=0, close=0, blur=0):
    m = mask.astype(np.uint8) * 255
    if close:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close))
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    if open_:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (open_, open_))
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    if blur:
        m = cv2.GaussianBlur(m, (0, 0), blur)
    return m > 127


def fill_holes(mask):
    m = mask.astype(np.uint8)
    h, w = m.shape
    ff = np.pad(m, 1).copy()
    cv2.floodFill(ff, None, (0, 0), 2)
    return (ff[1:-1, 1:-1] != 2)


def components(mask, min_area=0):
    n, lab, stats, cent = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    out = []
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if a >= min_area:
            out.append(dict(i=i, x=x, y=y, w=w, h=h, a=a, cx=cent[i][0], cy=cent[i][1], mask=(lab == i)))
    return out


def upscale(mask, f):
    if f == 1:
        return mask
    m = mask.astype(np.uint8) * 255
    m = cv2.resize(m, None, fx=f, fy=f, interpolation=cv2.INTER_CUBIC)
    m = cv2.GaussianBlur(m, (0, 0), f * 0.6)
    return m > 127


def trace(mask, scale=1.0, dx=0.0, dy=0.0, turd=6, alphamax=1.0, opttol=0.3, prec=1, up=1):
    """Trace a boolean mask. Output coordinates = (px * scale + dx, py * scale + dy)."""
    if up != 1:
        mask = upscale(mask, up)
        scale = scale / up
    bm = potrace.Bitmap(~mask.astype(bool))
    path = bm.trace(turdsize=turd * up * up, alphamax=alphamax, opticurve=True, opttolerance=opttol)

    def f(p):
        x = p.x * scale + dx
        y = p.y * scale + dy
        return _n(x, prec) + ' ' + _n(y, prec)

    parts = []
    for c in path:
        parts.append('M' + f(c.start_point))
        for s in c.segments:
            if s.is_corner:
                parts.append('L' + f(s.c) + 'L' + f(s.end_point))
            else:
                parts.append('C' + f(s.c1) + ' ' + f(s.c2) + ' ' + f(s.end_point))
        parts.append('Z')
    return ''.join(parts)


def _n(v, prec):
    s = f"{v:.{prec}f}"
    if '.' in s:
        s = s.rstrip('0').rstrip('.')
    if s == '-0':
        s = '0'
    return s


def bbox(mask, scale=1.0, dx=0.0, dy=0.0):
    ys, xs = np.nonzero(mask)
    return [round(xs.min() * scale + dx, 1), round(ys.min() * scale + dy, 1),
            round((xs.max() + 1) * scale + dx, 1), round((ys.max() + 1) * scale + dy, 1)]


def save_mask(mask, name):
    Image.fromarray((mask * 255).astype(np.uint8)).save(name)
