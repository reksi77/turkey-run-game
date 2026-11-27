// The three stages of Giblet's escape: farmyard, barn, kitchen. Each stage has
// its own backdrop, its own distance goal, and its own spawn table; the hazards
// get denser and faster as the turkey gets closer to the back door.

import { PALETTE, drawLeaf, ellipse } from './art.js';
import { GROUND_Y } from './turkey.js';

export const STAGES = [
  {
    key: 'farmyard',
    name: '1 · THE FARMYARD',
    sub: 'Dawn. The farmer is still yawning.',
    start: 0,
    end: 550,
    sky: PALETTE.skyDawn,
    ground: PALETTE.groundFarm,
    spawnGap: 150,      // metres between hazard spawns (roughly)
    knifeChance: 0.30,
    pinChance: 0.25,
    hayEvery: 260,      // a haystack to hide in this often
    speed: 235,
  },
  {
    key: 'barn',
    name: '2 · THE BARN',
    sub: 'Dark, dusty, full of rolling pins.',
    start: 550,
    end: 1150,
    sky: '#e89a4e',
    ground: PALETTE.groundBarn,
    spawnGap: 118,
    knifeChance: 0.38,
    pinChance: 0.42,
    hayEvery: 300,
    speed: 268,
  },
  {
    key: 'kitchen',
    name: '3 · THE KITCHEN',
    sub: 'The oven is on. The knife is out. Run.',
    start: 1150,
    end: 1800,
    sky: PALETTE.skyDusk,
    ground: PALETTE.groundKitchen,
    spawnGap: 96,
    knifeChance: 0.34,
    pinChance: 0.30,
    hayEvery: 340,      // tables to hide under, fewer and farther apart
    speed: 300,
  },
];

export const ESCAPE_DISTANCE = 1800; // metres to the back door

export function stageFor(distance) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (distance >= STAGES[i].start) return STAGES[i];
  }
  return STAGES[0];
}

export function stageIndexFor(distance) {
  return STAGES.indexOf(stageFor(distance));
}

// Draw the scrolling backdrop for a stage: sky, sun, hills, fences or barn
// walls or kitchen tiles, then the ground. Pure canvas, no images.
export function drawBackdrop(ctx, stage, scroll, time, w, h) {
  // Sky gradient.
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, stage.sky);
  g.addColorStop(0.62, '#f7d9a0');
  g.addColorStop(1, '#e8b478');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Low autumn sun.
  ctx.fillStyle = 'rgba(255, 236, 180, 0.9)';
  ctx.beginPath();
  ctx.arc(w - 130, 84, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 236, 180, 0.35)';
  ctx.beginPath();
  ctx.arc(w - 130, 84, 52, 0, Math.PI * 2);
  ctx.fill();

  // Drifting leaves.
  const leafColors = [PALETTE.leafOrange, PALETTE.leafRed, PALETTE.leafGold];
  for (let i = 0; i < 14; i++) {
    const lx = ((i * 173 + scroll * (0.3 + (i % 3) * 0.12)) % (w + 80)) - 40;
    const ly = 40 + ((i * 97 + time * 12) % 240);
    drawLeaf(ctx, lx, ly, 5 + (i % 3), i, leafColors[i % 3]);
  }

  // Far hills.
  ctx.fillStyle = 'rgba(138, 90, 43, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 60);
  for (let x = 0; x <= w; x += 60) {
    ctx.lineTo(x, GROUND_Y - 70 - Math.sin((x + scroll * 0.2) * 0.008) * 26);
  }
  ctx.lineTo(w, GROUND_Y - 40);
  ctx.lineTo(0, GROUND_Y - 40);
  ctx.closePath();
  ctx.fill();

  if (stage.key === 'farmyard') {
    // Fence posts scrolling past, and a red barn in the distance.
    ctx.fillStyle = PALETTE.barnRed;
    const bx = w - 260 - ((scroll * 0.4) % (w + 400));
    ctx.fillRect(bx, GROUND_Y - 130, 120, 90);
    ctx.fillStyle = PALETTE.barnDark;
    ctx.beginPath();
    ctx.moveTo(bx - 8, GROUND_Y - 130); ctx.lineTo(bx + 60, GROUND_Y - 168); ctx.lineTo(bx + 128, GROUND_Y - 130);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(bx + 46, GROUND_Y - 96, 28, 56);
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      const fx = ((i * 160 - scroll * 0.85) % (w + 160) + w + 160) % (w + 160) - 80;
      ctx.beginPath(); ctx.moveTo(fx, GROUND_Y - 52); ctx.lineTo(fx, GROUND_Y - 6); ctx.stroke();
    }
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y - 44); ctx.lineTo(w, GROUND_Y - 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y - 24); ctx.lineTo(w, GROUND_Y - 24); ctx.stroke();
  } else if (stage.key === 'barn') {
    // Barn interior: plank walls and hanging lanterns.
    ctx.fillStyle = 'rgba(74, 44, 20, 0.55)';
    ctx.fillRect(0, 0, w, GROUND_Y - 40);
    ctx.strokeStyle = 'rgba(43, 26, 16, 0.6)';
    ctx.lineWidth = 3;
    for (let x = 0; x < w; x += 46) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND_Y - 40); ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const lx = ((i * 340 - scroll * 0.5) % (w + 200) + w + 200) % (w + 200) - 100;
      ctx.fillStyle = '#f7c873';
      ellipse(ctx, lx, 90, 14, 18);
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(lx - 14, 68, 28, 6);
    }
  } else {
    // Kitchen: warm plaster wall, a window with the yard outside, and pans
    // hanging on hooks — the room Giblet has to cross to reach the back door.
    ctx.fillStyle = '#eec184';
    ctx.fillRect(0, 0, w, GROUND_Y - 40);
    ctx.strokeStyle = 'rgba(160, 100, 40, 0.5)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 52) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND_Y - 40); ctx.stroke(); }
    for (let y = 0; y < GROUND_Y - 40; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // Hanging pans fill the middle of the wall.
    for (let i = 0; i < 3; i++) {
      const px = 330 + i * 130;
      ctx.strokeStyle = '#4a2c14';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, 96); ctx.lineTo(px, 118); ctx.stroke();
      ctx.fillStyle = '#3a3a40';
      ctx.beginPath(); ctx.arc(px, 152, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#55555c';
      ctx.beginPath(); ctx.arc(px, 152, 20, 0, Math.PI * 2); ctx.fill();
    }
    // Window on the right, below the HUD: the yard, so close.
    ctx.fillStyle = '#7fb3d5';
    ctx.fillRect(792, 96, 132, 104);
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(800, 104, 116, 88);
    ctx.fillStyle = '#8a5a2b';
    ellipse(ctx, 858, 178, 30, 13);
    ctx.fillStyle = '#7fce5a';
    ellipse(ctx, 830, 186, 22, 8);
    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(800, 104, 116, 6);
    ctx.fillStyle = '#a63d2a';
    ctx.fillRect(0, GROUND_Y - 56, w, 16);
  }

  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y);
  ctx.fillStyle = 'rgba(43, 26, 16, 0.35)';
  ctx.fillRect(0, GROUND_Y, w, 5);
  // Scuff marks scrolling with the world.
  ctx.fillStyle = 'rgba(43, 26, 16, 0.25)';
  for (let i = 0; i < 10; i++) {
    const sx = ((i * 211 - scroll) % (w + 120) + w + 120) % (w + 120) - 60;
    ctx.fillRect(sx, GROUND_Y + 22 + (i % 4) * 12, 26, 3);
  }
}
