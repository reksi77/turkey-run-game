// Old Man Bramble, the farmer: he patrols, spots Giblet, gives chase, and when
// he loses the trail he searches the last place he saw the bird, then corners
// back toward the turkey's side of the yard. Line of sight is blocked by
// haystacks and tables, so hiding breaks his chase for real.

import { PALETTE, ellipse, roundRect } from './art.js';
import { TURKEY_X } from './turkey.js';

export const FARMER_STATES = ['patrol', 'alert', 'chase', 'search'];

export function makeFarmer() {
  return {
    x: -80,           // screen x; he approaches from the left edge
    y: 452,            // feet line, same ground as the turkey
    state: 'patrol',
    stateTime: 0,
    speed: 0,
    lastSeenX: 0,      // where he last saw the turkey (search target)
    searchReturn: false, // true once he has checked the spot and walks back
    patrolDir: 1,
    patrolAnchor: 60,
    stride: 0,
    shout: 0,          // seconds left on the "!" alert bubble
  };
}

// sightBlocked: true when a haystack / table stands between farmer and turkey.
// scrollSpeed: how fast the world is scrolling past (the turkey's run speed).
// turkeyX: the turkey's current screen x (the haystack's x while hiding).
// The farmer's screen motion is RELATIVE to the run: he closes in only a
// little faster than the turkey runs, so a dash pulls Giblet away and a
// clean hide breaks the chase entirely.
export function updateFarmer(f, turkey, dt, sightBlocked, difficulty, scrollSpeed, turkeyX, baseSpeed) {
  f.stateTime += dt;
  if (f.shout > 0) f.shout -= dt;

  const gap = turkeyX - f.x; // positive while the farmer is behind the turkey
  const seesTurkey = !turkey.hiding && !sightBlocked && gap > 0 && gap < 560;

  switch (f.state) {
    case 'patrol': {
      // Ambling near the left edge, muttering about dinner. He jogs in place
      // to keep up with the run; give the turkey a breath at the start.
      const target = f.patrolAnchor + Math.sin(f.stateTime * 0.8) * 40;
      const d = target - f.x;
      f.speed = Math.abs(d) > 4 ? Math.sign(d) * 60 : 0;
      f.x += f.speed * dt;
      if (seesTurkey && f.stateTime > 1.2) {
        f.state = 'alert';
        f.stateTime = 0;
        f.shout = 0.9;
        f.lastSeenX = turkeyX;
      }
      break;
    }
    case 'alert': {
      // A beat of disbelief — "!" — then the chase starts.
      f.speed = 0;
      if (f.stateTime > 0.55) {
        f.state = 'chase';
        f.stateTime = 0;
      }
      break;
    }
    case 'chase': {
      // He runs a little faster than the turkey's base run: a slow, steady
      // closing. A dash (the world scrolling faster than he runs) pulls
      // Giblet away from him.
      const chaseWorldSpeed = baseSpeed + 16 + difficulty * 8;
      f.speed = chaseWorldSpeed - scrollSpeed;
      f.x += f.speed * dt;
      if (seesTurkey) f.lastSeenX = turkeyX;
      if (gap < 34) {
        // He is on top of the turkey: the catch is handled by main.js.
        f.speed = 0;
      }
      if (!seesTurkey && f.stateTime > 1.4) {
        f.state = 'search';
        f.stateTime = 0;
        f.searchReturn = false;
      }
      break;
    }
    case 'search': {
      // He stomps across the screen toward the last place he saw the bird,
      // looks around, then walks back to his patrol beat — he does not stand
      // on the spot, so a turkey that slips out of hiding gets a chance.
      const target = f.searchReturn ? f.patrolAnchor : Math.min(f.lastSeenX - 30, 320);
      const dir = target > f.x ? 1 : -1;
      f.speed = dir * 95;
      f.x += f.speed * dt;
      if (!f.searchReturn && Math.abs(target - f.x) < 12) {
        if (f.stateTime > 2.2) f.searchReturn = true;
      } else if (f.searchReturn && Math.abs(target - f.x) < 20) {
        f.state = 'patrol';
        f.stateTime = 0;
        f.searchReturn = false;
      }
      if (f.stateTime > 6) {
        // Safety valve: never search forever.
        f.state = 'patrol';
        f.stateTime = 0;
        f.searchReturn = false;
      }
      if (seesTurkey) {
        f.state = 'alert';
        f.stateTime = 0;
        f.shout = 0.9;
      }
      break;
    }
  }
  f.stride += dt * (Math.abs(f.speed) / 16 + 2);
  return f;
}

// How close the farmer is to catching the turkey, 0 (far) to 1 (caught).
export function catchPressure(f, turkeyX = TURKEY_X) {
  const gap = turkeyX - f.x;
  return Math.max(0, Math.min(1, 1 - gap / 420));
}

export function drawFarmer(ctx, f, time) {
  const step = Math.abs(f.speed) > 5 ? Math.sin(f.stride * 2) * 5 : 0;
  ctx.save();
  ctx.translate(f.x, f.y);
  if (f.state === 'chase' || f.state === 'alert') ctx.globalAlpha = 1;

  // Legs: heavy boots stomping.
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-6, -34); ctx.lineTo(-6 + step, 0);
  ctx.moveTo(8, -34); ctx.lineTo(8 - step, 0);
  ctx.stroke();
  // Overalls: barn-red dungarees over a checked shirt.
  ctx.fillStyle = PALETTE.barnRed;
  roundRect(ctx, -16, -78, 34, 48, 6);
  ctx.fill();
  ctx.fillStyle = '#e8d8a8';
  ctx.fillRect(-16, -78, 34, 12);
  // Arms reaching forward, grabbing for a turkey.
  ctx.strokeStyle = '#e8d8a8';
  ctx.lineWidth = 7;
  const reach = f.state === 'chase' ? 14 : 6;
  ctx.beginPath();
  ctx.moveTo(10, -70); ctx.lineTo(26 + reach, -58 + step * 0.3);
  ctx.moveTo(10, -62); ctx.lineTo(24 + reach, -44 - step * 0.3);
  ctx.stroke();
  // Head: straw hat, grey beard, determined eyes.
  ctx.fillStyle = '#e8c39a';
  ellipse(ctx, 2, -88, 12, 11);
  ctx.fillStyle = '#d8d8d8';
  ellipse(ctx, 2, -80, 9, 6);
  ctx.fillStyle = PALETTE.hay;
  ctx.beginPath();
  ctx.ellipse(2, -96, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.hayDark;
  ctx.beginPath();
  ctx.ellipse(2, -100, 11, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 6, -90, 1.8, 1.8);
  ellipse(ctx, 12, -90, 1.8, 1.8);
  // Alert bubble when he spots the turkey.
  if (f.shout > 0 || f.state === 'alert') {
    ctx.fillStyle = '#fff3d6';
    ellipse(ctx, 26, -128, 16, 14);
    ctx.fillStyle = '#b83a26';
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 26, -120);
  }
  // Search state: a "?" bubble while he looks around.
  if (f.state === 'search') {
    ctx.fillStyle = '#fff3d6';
    ellipse(ctx, 26, -128, 16, 14);
    ctx.fillStyle = '#4a2c14';
    ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', 26, -121);
  }
  ctx.restore();
}
