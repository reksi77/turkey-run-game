// Giblet the turkey: run, jump, dash, and hide. All movement is the player's
// own; the world scrolls past while Giblet stays near the left third of the screen.

import { PALETTE, ellipse } from './art.js';

export const GROUND_Y = 452; // feet line, in logical pixels (canvas 960 x 540)
export const TURKEY_X = 210;

export function makeTurkey() {
  return {
    y: GROUND_Y,        // feet position
    vy: 0,              // vertical speed while jumping
    jumping: false,
    dashTime: 0,        // seconds of dash left
    dashCooldown: 0,
    hiding: false,
    hideMeter: 100,     // drains while hidden, refills while out
    hiddenTimer: 0,     // how long continuously hidden
    invuln: 0,          // seconds of post-hit flashing
    runCycle: 0,        // leg animation phase
    squash: 0,          // landing squash animation
  };
}

// Returns the turkey's body box for collisions (in screen space).
export function turkeyBox(t, x = TURKEY_X) {
  const h = t.hiding ? 34 : 52;
  return { x: x - 26, y: t.y - h, w: 52, h };
}

export function updateTurkey(t, input, dt, speed, nearHaystack) {
  // Jump (Space / ArrowUp / W) — only from the ground, never while hiding.
  if (input.jumpPressed && !t.jumping && !t.hiding) {
    t.jumping = true;
    t.vy = -560;
    t.squash = 0;
  }
  if (t.jumping) {
    t.vy += 1500 * dt;
    t.y += t.vy * dt;
    if (t.y >= GROUND_Y) {
      t.y = GROUND_Y;
      t.jumping = false;
      t.vy = 0;
      t.squash = 0.22;
    }
  }
  // Dash (Shift / X) — a short burst of speed with a cooldown.
  if (input.dashPressed && t.dashCooldown <= 0 && !t.hiding) {
    t.dashTime = 0.35;
    t.dashCooldown = 1.6;
  }
  if (t.dashTime > 0) t.dashTime -= dt;
  if (t.dashCooldown > 0) t.dashCooldown -= dt;

  // Hide (Down / S) — only beside a haystack or under a table.
  const wantHide = input.down && nearHaystack && !t.jumping;
  if (wantHide && t.hideMeter > 5) {
    if (!t.hiding) t.hiddenTimer = 0;
    t.hiding = true;
    t.hiddenTimer += dt;
    t.hideMeter = Math.max(0, t.hideMeter - 34 * dt);
  } else {
    t.hiding = false;
    t.hideMeter = Math.min(100, t.hideMeter + 16 * dt);
  }

  if (t.invuln > 0) t.invuln -= dt;
  if (t.squash > 0) t.squash -= dt;
  if (!t.hiding) t.runCycle += dt * (speed / 28);
  return t.dashTime > 0 ? 1.55 : 1; // dash speed multiplier
}

export function drawTurkey(ctx, t, time, x = TURKEY_X) {
  const bob = t.jumping ? 0 : Math.sin(t.runCycle * 2) * 2;
  const squashK = t.squash > 0 ? 1 + t.squash * 0.8 : 1;
  const blink = t.invuln > 0 && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(x, t.y - bob);
  ctx.scale(1 / Math.sqrt(squashK), squashK);
  if (blink) ctx.globalAlpha = 0.35;

  if (t.hiding) {
    // Crouched low, only the head and tail feathers peeking out of the hay.
    ctx.fillStyle = PALETTE.hay;
    ellipse(ctx, 0, -12, 34, 16);
    ctx.fillStyle = PALETTE.hayDark;
    ellipse(ctx, -8, -16, 20, 9);
    drawTurkeyHead(ctx, 16, -30, 0.8);
    ctx.restore();
    return;
  }

  // Tail feathers: a fan of autumn browns and oranges.
  const tailColors = [PALETTE.leafRed, PALETTE.leafOrange, PALETTE.leafGold, '#8a5a2b'];
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(-20, -30);
    ctx.rotate(-0.7 + i * 0.42);
    ctx.fillStyle = tailColors[i];
    ctx.beginPath();
    ctx.ellipse(0, -16, 7, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body: a plump brown oval with a cream belly.
  ctx.fillStyle = '#7a4a22';
  ellipse(ctx, 0, -26, 26, 24);
  ctx.fillStyle = PALETTE.cream;
  ellipse(ctx, 6, -20, 15, 13);
  // Wing, flapping with the run cycle.
  const flap = Math.sin(t.runCycle * 2) * 6;
  ctx.fillStyle = '#5d3a1a';
  ctx.beginPath();
  ctx.ellipse(-4, -26 + flap * 0.4, 14, 9, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Legs: two orange sticks alternating with the run.
  const legSwing = t.jumping ? 6 : Math.sin(t.runCycle * 2) * 7;
  ctx.strokeStyle = '#e07b39';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, -6); ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -6); ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  drawTurkeyHead(ctx, 18, -52, 1);
  ctx.restore();
}

function drawTurkeyHead(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Neck and head.
  ctx.strokeStyle = '#c96a3b';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(2, -4); ctx.stroke();
  ctx.fillStyle = '#c96a3b';
  ellipse(ctx, 2, -8, 9, 8);
  // Beak, snood and a worried eye.
  ctx.fillStyle = '#e8a13c';
  ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(20, -6); ctx.lineTo(8, -4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b83a26';
  ctx.beginPath(); ctx.ellipse(12, -2, 3, 6, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ellipse(ctx, 4, -11, 3.4, 3.4);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 5, -11, 1.8, 1.8);
  ctx.restore();
}
