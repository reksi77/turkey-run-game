// Shared autumn palette and small canvas helpers for Giblet Runs for It.
// Every drawing in the game is original canvas art; nothing is loaded from a file.

// Autumn palette: burnt orange, harvest gold, barn red, deep brown, cream.
export const PALETTE = {
  skyDawn: '#f7c873',
  skyNoon: '#f2a65a',
  skyDusk: '#e07b39',
  groundFarm: '#8a5a2b',
  groundBarn: '#6e4a26',
  groundKitchen: '#7a4a30',
  hay: '#e8b64c',
  hayDark: '#c98f2e',
  barnRed: '#a63d2a',
  barnDark: '#7e2c1e',
  cream: '#fff3d6',
  brown: '#4a2c14',
  dark: '#2b1a10',
  leafOrange: '#d96c2c',
  leafRed: '#b83a26',
  leafGold: '#e9a13b',
  ovenIron: '#3a3a40',
  ovenGlow: '#ff7a1a',
  knifeSteel: '#dfe6ea',
  cornYellow: '#ffd23e',
};

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function outlinedText(ctx, str, x, y, size, fill, outline, align = 'left') {
  ctx.font = `bold ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = Math.max(3, size / 8);
  ctx.strokeStyle = outline;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(str, x, y);
}

// A small falling leaf, drawn fresh each frame from its seed.
export function drawLeaf(ctx, x, y, size, seed, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(seed * 2.1 + y * 0.01) * 0.6);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.55, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
