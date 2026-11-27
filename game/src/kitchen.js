// The kitchen set-pieces and travelling hazards of Giblet Runs for It.
// The oven and the carving knife are the named dangers of the kitchen stage;
// falling knives and rolling pins are the hazards that travel with the run.

import { PALETTE, ellipse, roundRect, text } from './art.js';
import { GROUND_Y } from './turkey.js';

// --- Falling knives: drop from the top of the screen, telegraphed by a shadow. ---
export function makeFallingKnife(x, speed) {
  return { kind: 'fallingKnife', x, y: -30, vy: speed, w: 14, h: 44, dead: false };
}

export function updateFallingKnife(k, dt) {
  k.vy += 900 * dt;
  k.y += k.vy * dt;
  if (k.y > GROUND_Y + 40) k.dead = true;
}

export function drawFallingKnife(ctx, k) {
  // Ground shadow telegraphs where it will land.
  ctx.fillStyle = 'rgba(43,26,16,0.25)';
  ellipse(ctx, k.x, GROUND_Y + 4, 16, 5);
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.fillStyle = PALETTE.knifeSteel;
  ctx.beginPath();
  ctx.moveTo(0, -22); ctx.lineTo(7, 6); ctx.lineTo(0, 18); ctx.lineTo(-7, 6); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(-3, 16, 6, 12);
  ctx.restore();
}

// --- Rolling pins: roll along the ground; jump them or dash past. ---
export function makeRollingPin(x, speed) {
  return { kind: 'rollingPin', x, y: GROUND_Y - 10, vx: -speed, rot: 0, w: 46, h: 20, dead: false };
}

export function updateRollingPin(p, dt, scrollSpeed) {
  p.x -= scrollSpeed * dt;
  p.x += p.vx * dt;
  p.rot += dt * 6;
  if (p.x < -60) p.dead = true;
}

export function drawRollingPin(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.fillStyle = '#c98f5a';
  roundRect(ctx, -23, -10, 46, 20, 9);
  ctx.fill();
  ctx.fillStyle = '#a06a35';
  ctx.fillRect(-28, -6, 5, 12);
  ctx.fillRect(23, -6, 5, 12);
  ctx.restore();
}

// --- The oven: a floor hazard in the kitchen stage. Standing in its glow
// (the orange zone in front of its open door) burns a heart. ---
export function makeOven(x) {
  return { kind: 'oven', x, w: 120, heat: 0, dead: false };
}

export function updateOven(o, dt, scrollSpeed, time) {
  o.x -= scrollSpeed * dt;
  o.heat = 0.6 + Math.sin(time * 5 + o.x * 0.01) * 0.4;
  if (o.x < -160) o.dead = true;
}

export function ovenZone(o) {
  // The danger zone is the glowing floor in front of the oven door.
  return { x: o.x - 8, y: GROUND_Y - 46, w: 96, h: 46 };
}

export function drawOven(ctx, o) {
  const glow = o.heat;
  // Heat shimmer on the floor.
  ctx.fillStyle = `rgba(255, 122, 26, ${0.18 + glow * 0.22})`;
  ctx.beginPath();
  ctx.ellipse(o.x + 40, GROUND_Y + 2, 62, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Iron body.
  ctx.fillStyle = PALETTE.ovenIron;
  roundRect(ctx, o.x - 60, GROUND_Y - 118, 120, 118, 8);
  ctx.fill();
  ctx.fillStyle = '#55555c';
  ctx.fillRect(o.x - 60, GROUND_Y - 118, 120, 14);
  // Open door, glowing inside.
  ctx.fillStyle = '#1c1c20';
  roundRect(ctx, o.x - 48, GROUND_Y - 96, 96, 66, 5);
  ctx.fill();
  ctx.fillStyle = `rgba(255, ${110 + Math.floor(glow * 60)}, 26, ${0.55 + glow * 0.45})`;
  roundRect(ctx, o.x - 42, GROUND_Y - 90, 84, 54, 4);
  ctx.fill();
  // A roast pan silhouette inside, and the warning label.
  ctx.fillStyle = '#4a2c14';
  ellipse(ctx, o.x, GROUND_Y - 62, 30, 10);
  ctx.fillStyle = '#fff3d6';
  text(ctx, 'HOT!', o.x, GROUND_Y - 108, 13, '#fff3d6', 'center');
  // Chimney pipe.
  ctx.fillStyle = '#2c2c30';
  ctx.fillRect(o.x + 34, GROUND_Y - 140, 18, 24);
}

// --- The carving knife: a big blade that swings down from a ceiling hook
// in the kitchen stage. It telegraphs with a glint, then sweeps. ---
export function makeCarvingKnife(x) {
  return { kind: 'carvingKnife', x, angle: -1.1, phase: 0, swing: 0, dead: false };
}

export function updateCarvingKnife(k, dt, scrollSpeed, time) {
  k.x -= scrollSpeed * dt;
  k.phase += dt;
  // Idle sway, then a fast sweep every ~2.4 seconds.
  const cycle = k.phase % 2.4;
  if (cycle < 1.7) {
    k.angle = -1.1 + Math.sin(k.phase * 1.2) * 0.12;
    k.swing = 0;
  } else {
    const t = (cycle - 1.7) / 0.7;
    k.angle = -1.1 + t * t * 2.2;
    k.swing = t;
  }
  if (k.x < -80) k.dead = true;
}

// Blade tip position, for the hit test in main.js.
export function knifeTip(k) {
  const len = 86;
  return {
    x: k.x + Math.sin(k.angle) * len,
    y: GROUND_Y - 190 + Math.cos(k.angle) * len,
  };
}

export function drawCarvingKnife(ctx, k) {
  // Hook and cord from the ceiling.
  ctx.strokeStyle = '#2b1a10';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(k.x, GROUND_Y - 210);
  ctx.lineTo(k.x, GROUND_Y - 190);
  ctx.stroke();
  // Glint telegraph before the sweep.
  if (k.swing === 0 && (k.phase % 2.4) > 1.3) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(k.x + 8, GROUND_Y - 150, 4 + Math.sin(k.phase * 12) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(k.x, GROUND_Y - 190);
  ctx.rotate(k.angle);
  // Handle.
  ctx.fillStyle = '#4a2c14';
  roundRect(ctx, -7, -6, 14, 34, 5);
  ctx.fill();
  // Long steel blade.
  ctx.fillStyle = PALETTE.knifeSteel;
  ctx.beginPath();
  ctx.moveTo(-8, 28);
  ctx.lineTo(8, 28);
  ctx.lineTo(4, 92);
  ctx.lineTo(0, 102);
  ctx.lineTo(-4, 92);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9aa5ab';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 30); ctx.lineTo(0, 92);
  ctx.stroke();
  ctx.restore();
  // Danger marker on the floor under the swing.
  ctx.fillStyle = 'rgba(184,58,38,0.35)';
  ctx.beginPath();
  ctx.ellipse(k.x + 40, GROUND_Y + 3, 44, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}
