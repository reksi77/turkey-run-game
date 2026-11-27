// Giblet Runs for It — the game loop, screens, input, spawning, collisions,
// and the ?shot= staging hooks the screenshots use. Everything here is
// original code written for this entry.

import { PALETTE, drawLeaf, ellipse, outlinedText, roundRect, text } from './art.js';
import { sfx } from './audio.js';
import { drawTurkey, makeTurkey, turkeyBox, updateTurkey, GROUND_Y, TURKEY_X } from './turkey.js';
import { catchPressure, drawFarmer, makeFarmer, updateFarmer } from './farmer.js';
import {
  drawCarvingKnife, drawFallingKnife, drawOven, drawRollingPin,
  knifeTip, makeCarvingKnife, makeFallingKnife, makeOven, makeRollingPin,
  ovenZone, updateCarvingKnife, updateFallingKnife, updateOven, updateRollingPin,
} from './kitchen.js';
import { ESCAPE_DISTANCE, drawBackdrop, stageFor, stageIndexFor, STAGES } from './stages.js';
import { drawHUD } from './hud.js';

const W = 960;
const H = 540;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot'); // start | play | end | caught — staging only

// --- Input ---------------------------------------------------------------
const keys = {};
let jumpQueued = false;
let dashQueued = false;
let anyKey = false;

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (!e.repeat) {
    anyKey = true;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') jumpQueued = true;
    if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') dashQueued = true;
    if (e.key === 'r' || e.key === 'R') restartQueued = true;
    if (e.key === 'm' || e.key === 'M') sfx.toggleMute();
  }
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousedown', () => { anyKey = true; clickQueued = true; });
let restartQueued = false;
let clickQueued = false;

// --- Game state ----------------------------------------------------------
function freshState() {
  return {
    screen: 'title',
    score: 0,
    scoreFloat: 0, // fractional distance score, floored into score each frame
    corn: 0,
    lives: 3,
    distance: 0,
    scroll: 0,
    time: 0,
    stage: STAGES[0],
    stageIndex: 0,
    bannerTime: 0,
    spottedTime: 0,
    turkey: makeTurkey(),
    farmer: makeFarmer(),
    hazards: [],      // falling knives, rolling pins, ovens, carving knives
    corns: [],        // pickups: {x, y, taken}
    hides: [],        // haystacks / tables: {x, kind, w}
    hideSpot: null,   // the hide spot the turkey is crouched in, while hiding
    nextSpawnAt: 120, // distance of the next hazard spawn
    nextCornAt: 60,
    nextHideAt: 120, // the first haystack comes early, so hiding is learned fast
    hurtFlash: 0,
    endReason: '',
    best: 0,
  };
}

let state = freshState();

function startRun() {
  const best = state.best;
  state = freshState();
  state.best = best;
  state.screen = 'play';
  state.bannerTime = 2.4;
  announce('The run begins. Giblet sprints out of the farmyard.');
}

function announce(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function endRun(escaped, reason) {
  state.screen = escaped ? 'escaped' : 'caught';
  state.endReason = reason;
  state.best = Math.max(state.best, state.score);
  if (escaped) sfx.escaped();
  else sfx.caught();
  announce(escaped ? 'Escaped! Giblet slipped out the back door.' : 'Caught! ' + reason);
}

// --- Spawning ------------------------------------------------------------
function spawnHazard(stage, d) {
  const roll = Math.random();
  const x = W + 60;
  if (stage.key === 'kitchen' && roll < 0.22) {
    state.hazards.push(makeOven(x + 40));
    return;
  }
  if (stage.key === 'kitchen' && roll < 0.42) {
    state.hazards.push(makeCarvingKnife(x + 120));
    return;
  }
  if (roll < stage.knifeChance) {
    const kx = TURKEY_X + 120 + Math.random() * 420;
    state.hazards.push(makeFallingKnife(kx, 120 + Math.random() * 120));
  } else if (roll < stage.knifeChance + stage.pinChance) {
    state.hazards.push(makeRollingPin(x, 40 + Math.random() * 60));
  } else {
    // A cluster of corn instead of a hazard — a breather with a reward.
    for (let i = 0; i < 3; i++) state.corns.push({ x: x + i * 44, y: GROUND_Y - 52 - (i % 2) * 26, taken: false });
  }
}

function spawnHide(stage) {
  const kind = stage.key === 'kitchen' ? 'table' : 'haystack';
  state.hides.push({ x: W + 80, kind, w: kind === 'table' ? 110 : 90 });
}

function spawnCornLine() {
  const base = W + 60;
  const arc = Math.random() < 0.5;
  for (let i = 0; i < 4; i++) {
    state.corns.push({
      x: base + i * 42,
      y: GROUND_Y - 52 - (arc ? Math.sin(i * 0.9) * 34 : 0),
      taken: false,
    });
  }
}

// --- Collision helpers ---------------------------------------------------
function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function hurtTurkey(reason) {
  if (state.turkey.invuln > 0 || state.screen !== 'play') return;
  state.lives -= 1;
  state.turkey.invuln = 1.6;
  state.hurtFlash = 0.35;
  sfx.hurt();
  // A hit knocks Giblet back toward the farmer — the escape gets tighter.
  state.farmer.x += 46;
  if (state.lives <= 0) endRun(false, reason);
}

// --- Per-frame update ----------------------------------------------------
function update(dt) {
  state.time += dt;
  const t = state.turkey;
  const stage = stageFor(state.distance);
  if (stage !== state.stage) {
    state.stage = stage;
    state.stageIndex = stageIndexFor(state.distance);
    state.bannerTime = 2.6;
    sfx.stageUp();
  }
  if (state.bannerTime > 0) state.bannerTime -= dt;
  if (state.spottedTime > 0) state.spottedTime -= dt;
  if (state.hurtFlash > 0) state.hurtFlash -= dt;

  const speed = state.stage.speed;
  const input = {
    jumpPressed: jumpQueued,
    dashPressed: dashQueued,
    down: keys['arrowdown'] || keys['s'],
  };
  jumpQueued = false;
  dashQueued = false;

  // Nearest hide spot, and whether the turkey is beside one.
  let nearHaystack = false;
  let sightBlocked = false;
  for (const h of state.hides) {
    if (Math.abs(h.x - TURKEY_X) < h.w / 2 + 90) nearHaystack = true;
    // A haystack between the farmer and the turkey blocks line of sight.
    if (h.x > state.farmer.x && h.x < TURKEY_X) sightBlocked = true;
  }

  const dashMult = updateTurkey(t, input, dt, speed, nearHaystack);
  if (input.dashPressed && t.dashTime > 0) sfx.dash();

  // While hidden, Giblet crouches in the haystack: the turkey stops advancing
  // and the world stops scrolling past. Track which hide spot he is in, and
  // his screen x is the spot's x, not the usual running spot.
  if (t.hiding) {
    if (!state.hideSpot) {
      state.hideSpot = state.hides.find((h) => Math.abs(h.x - TURKEY_X) < h.w / 2 + 90) || null;
      if (!state.hideSpot) t.hiding = false;
    }
  } else {
    state.hideSpot = null;
  }
  const turkeyX = t.hiding && state.hideSpot ? state.hideSpot.x : TURKEY_X;
  const worldSpeed = t.hiding ? 0 : speed * dashMult;

  // Distance and scrolling.
  const step = worldSpeed * dt;
  state.distance += step / 10; // 10 px of scroll ≈ 1 metre
  state.scroll += step;

  // Farmer AI.
  const prevFarmerState = state.farmer.state;
  updateFarmer(state.farmer, t, dt, sightBlocked, state.stageIndex, worldSpeed, turkeyX, speed);
  if (prevFarmerState !== 'alert' && state.farmer.state === 'alert') {
    state.spottedTime = 1.1;
    sfx.spotted();
  }
  // Caught: the farmer reaches the turkey (never while hidden).
  if (!t.hiding && state.farmer.x >= turkeyX - 30) {
    state.farmer.x = turkeyX - 30;
    hurtTurkey('Old Man Bramble grabbed Giblet by the tail feathers.');
    if (state.screen === 'play') state.farmer.x = -60; // shoved back after the grab
  }

  // Spawning by distance.
  if (state.distance >= state.nextSpawnAt) {
    spawnHazard(state.stage, state.distance);
    state.nextSpawnAt = state.distance + state.stage.spawnGap * (0.8 + Math.random() * 0.5);
  }
  if (state.distance >= state.nextCornAt) {
    spawnCornLine();
    state.nextCornAt = state.distance + 130 + Math.random() * 120;
  }
  if (state.distance >= state.nextHideAt) {
    spawnHide(state.stage);
    state.nextHideAt = state.distance + state.stage.hayEvery;
  }

  // Hazards.
  for (const hz of state.hazards) {
    if (hz.kind === 'fallingKnife') updateFallingKnife(hz, dt);
    else if (hz.kind === 'rollingPin') updateRollingPin(hz, dt, worldSpeed);
    else if (hz.kind === 'oven') updateOven(hz, dt, worldSpeed, state.time);
    else if (hz.kind === 'carvingKnife') updateCarvingKnife(hz, dt, worldSpeed, state.time);
  }
  state.hazards = state.hazards.filter((h) => !h.dead);
  for (const h of state.hides) h.x -= worldSpeed * dt;
  state.hides = state.hides.filter((h) => h.x > -160);
  for (const c of state.corns) c.x -= worldSpeed * dt;
  state.corns = state.corns.filter((c) => c.x > -40 && !c.taken);

  // Collisions (skip while hidden: the haystack covers Giblet).
  if (!t.hiding && t.invuln <= 0) {
    const tb = turkeyBox(t, turkeyX);
    for (const hz of state.hazards) {
      if (hz.kind === 'fallingKnife') {
        if (boxesOverlap(tb, { x: hz.x - 8, y: hz.y - 22, w: 16, h: 44 })) {
          hurtTurkey('A carving knife dropped out of the sky onto Giblet.');
          hz.dead = true;
        }
      } else if (hz.kind === 'rollingPin') {
        if (boxesOverlap(tb, { x: hz.x - 23, y: hz.y - 10, w: 46, h: 20 })) {
          hurtTurkey('A rolling pin bowled Giblet over.');
        }
      } else if (hz.kind === 'oven') {
        if (boxesOverlap(tb, ovenZone(hz))) {
          hurtTurkey('Giblet singed his tail feathers on the open oven.');
        }
      } else if (hz.kind === 'carvingKnife') {
        const tip = knifeTip(hz);
        if (hz.swing > 0.25 && Math.abs(tip.x - (tb.x + tb.w / 2)) < 26 && tip.y > tb.y && tip.y < tb.y + tb.h) {
          hurtTurkey('The carving knife swept down and clipped Giblet.');
        }
      }
    }
  }

  // Corn pickups.
  const tb = turkeyBox(t, turkeyX);
  for (const c of state.corns) {
    if (!c.taken && boxesOverlap(tb, { x: c.x - 14, y: c.y - 14, w: 28, h: 28 })) {
      c.taken = true;
      state.corn += 1;
      sfx.gobble();
    }
  }
  state.scoreFloat += step / 10; // a point per metre, roughly
  state.score = Math.floor(state.scoreFloat) + state.corn * 25;

  // Escape!
  if (state.distance >= ESCAPE_DISTANCE) {
    endRun(true, 'Out the back door, into the autumn leaves.');
  }
}

// --- Drawing -------------------------------------------------------------
function drawHideSpot(ctx, h) {
  if (h.kind === 'haystack') {
    ctx.fillStyle = PALETTE.hayDark;
    ctx.beginPath();
    ctx.ellipse(h.x, GROUND_Y, h.w / 2, 40, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.ellipse(h.x, GROUND_Y - 4, h.w / 2 - 8, 34, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = PALETTE.hayDark;
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(h.x + i * 14, GROUND_Y - 34);
      ctx.lineTo(h.x + i * 18, GROUND_Y - 8);
      ctx.stroke();
    }
  } else {
    // Kitchen table to hide under.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(h.x - h.w / 2, GROUND_Y - 84, h.w, 12);
    ctx.fillRect(h.x - h.w / 2 + 8, GROUND_Y - 72, 10, 72);
    ctx.fillRect(h.x + h.w / 2 - 18, GROUND_Y - 72, 10, 72);
    ctx.fillStyle = '#e8d8a8';
    ctx.fillRect(h.x - h.w / 2 + 12, GROUND_Y - 84, h.w - 24, 8);
    ctx.fillStyle = '#b83a26';
    ctx.beginPath();
    ctx.ellipse(h.x, GROUND_Y - 92, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCorn(ctx, c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(0.5);
  ctx.fillStyle = PALETTE.cornYellow;
  ellipse(ctx, 0, 0, 8, 15);
  ctx.fillStyle = '#7a9a2e';
  ctx.beginPath();
  ctx.ellipse(0, -16, 5, 8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(122, 74, 34, 0.5)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(i * 5, -12); ctx.lineTo(i * 5, 12); ctx.stroke();
  }
  ctx.restore();
}

function drawTitle(ctx) {
  drawBackdrop(ctx, STAGES[0], 0, state.time, W, H);
  // The farmhouse roofline at the bottom, framing the title.
  ctx.fillStyle = 'rgba(43, 26, 16, 0.55)';
  ctx.fillRect(0, 0, W, H);
  outlinedText(ctx, 'GIBLET', W / 2, 150, 84, PALETTE.cornYellow, PALETTE.dark, 'center');
  outlinedText(ctx, 'RUNS FOR IT', W / 2, 215, 52, PALETTE.cream, PALETTE.dark, 'center');
  text(ctx, 'A turkey escape in 3 stages · 1 relentless farmer · hide, dash, slip out the back door', W / 2, 258, 18, PALETTE.cream, 'center');
  // Feature strip: the numbers the game is proud of.
  ctx.fillStyle = 'rgba(43, 26, 16, 0.8)';
  roundRect(ctx, W / 2 - 330, 292, 660, 54, 10);
  ctx.fill();
  text(ctx, '3 STAGES · 1800m TO FREEDOM · 3 HEARTS · HIDE IN THE HAY', W / 2, 326, 18, PALETTE.hay, 'center');
  text(ctx, 'PRESS ENTER OR CLICK TO RUN', W / 2, 396, 22, PALETTE.cornYellow, 'center');
  text(ctx, 'Arrows / WASD move · SPACE jump · SHIFT dash · DOWN hide · M mute', W / 2, 488, 15, PALETTE.cream, 'center');
  text(ctx, 'Thanksgiving morning. The oven is already on. Giblet is not on the menu.', W / 2, 514, 15, '#e8b478', 'center');
  // Giblet and Bramble facing off on the title screen.
  drawTurkey(ctx, { ...state.turkey, y: GROUND_Y, hiding: false, jumping: false, invuln: 0, runCycle: state.time * 3, squash: 0 }, state.time);
  const fakeFarmer = { ...state.farmer, x: 90, state: 'patrol', speed: 0, stride: state.time * 2, shout: 0 };
  drawFarmer(ctx, fakeFarmer, state.time);
}

function drawEnd(ctx, escaped) {
  // Keep the last frame of the run dimmed behind the end card.
  drawPlay(ctx);
  ctx.fillStyle = 'rgba(43, 26, 16, 0.62)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(43, 26, 16, 0.88)';
  roundRect(ctx, W / 2 - 300, 92, 600, 330, 14);
  ctx.fill();
  if (escaped) {
    outlinedText(ctx, 'ESCAPED!', W / 2, 178, 62, '#7fce5a', PALETTE.dark, 'center');
    text(ctx, 'Giblet slipped out the back door and into the autumn leaves.', W / 2, 216, 18, PALETTE.cream, 'center');
    text(ctx, 'Old Man Bramble is still looking under the table.', W / 2, 242, 16, '#e8b478', 'center');
  } else {
    outlinedText(ctx, 'CAUGHT!', W / 2, 178, 62, '#ff5a3c', PALETTE.dark, 'center');
    text(ctx, state.endReason, W / 2, 216, 18, PALETTE.cream, 'center');
    text(ctx, 'The oven was already warm. So close — the back door was right there.', W / 2, 242, 16, '#e8b478', 'center');
  }
  text(ctx, `SCORE ${state.score}   ·   CORN ${state.corn}   ·   DISTANCE ${Math.floor(state.distance)}m`, W / 2, 292, 20, PALETTE.cornYellow, 'center');
  if (state.best > 0) text(ctx, `BEST THIS SESSION ${state.best}`, W / 2, 322, 15, PALETTE.cream, 'center');
  text(ctx, 'PRESS R OR CLICK TO RUN AGAIN', W / 2, 372, 22, PALETTE.cornYellow, 'center');
}

function drawPlay(ctx) {
  drawBackdrop(ctx, state.stage, state.scroll, state.time, W, H);
  for (const h of state.hides) drawHideSpot(ctx, h);
  for (const c of state.corns) drawCorn(ctx, c);
  for (const hz of state.hazards) {
    if (hz.kind === 'fallingKnife') drawFallingKnife(ctx, hz);
    else if (hz.kind === 'rollingPin') drawRollingPin(ctx, hz);
    else if (hz.kind === 'oven') drawOven(ctx, hz);
    else if (hz.kind === 'carvingKnife') drawCarvingKnife(ctx, hz);
  }
  // Farmer behind the turkey, turkey in front.
  const turkeyX = state.turkey.hiding && state.hideSpot ? state.hideSpot.x : TURKEY_X;
  drawFarmer(ctx, state.farmer, state.time);
  drawTurkey(ctx, state.turkey, state.time, turkeyX);
  // Catch-pressure vignette: the screen edges redden as Bramble closes in.
  const pressure = catchPressure(state.farmer, turkeyX);
  if (pressure > 0.25 && state.screen === 'play') {
    ctx.fillStyle = `rgba(184, 58, 38, ${(pressure - 0.25) * 0.5})`;
    ctx.fillRect(0, 0, W, 18);
    ctx.fillRect(0, H - 18, W, 18);
    ctx.fillRect(0, 0, 14, H);
  }
  drawHUD(ctx, state, W);
  if (state.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255, 60, 40, ${state.hurtFlash * 0.8})`;
    ctx.fillRect(0, 0, W, H);
  }
  // Hint line while the first haystack approaches.
  if (state.distance < 220 && state.screen === 'play') {
    text(ctx, 'Hold DOWN beside a haystack to hide — the farmer cannot see you there', W / 2, 512, 15, PALETTE.cream, 'center');
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (state.screen === 'title') drawTitle(ctx);
  else if (state.screen === 'play') drawPlay(ctx);
  else drawEnd(ctx, state.screen === 'escaped');
}

// --- Screenshot staging --------------------------------------------------
// ?shot=start  → title screen
// ?shot=play   → mid-run in the kitchen: turkey + chasing farmer + oven +
//                carving knife + HUD, all in one frame (the cover)
// ?shot=end    → escaped end screen
// ?shot=caught → caught end screen
function stageShot() {
  if (!shot) return;
  if (shot === 'start') {
    state.screen = 'title';
    state.time = 1.2;
  } else if (shot === 'play') {
    state.screen = 'play';
    state.time = 3.0;
    state.distance = 1420;
    state.stage = STAGES[2];
    state.stageIndex = 2;
    state.score = 1240;
    state.corn = 14;
    state.lives = 2;
    state.scroll = 14200;
    state.turkey = makeTurkey();
    state.turkey.runCycle = 2.4;
    state.farmer = makeFarmer();
    state.farmer.x = 108;
    state.farmer.state = 'chase';
    state.farmer.speed = 260;
    state.farmer.stride = 5;
    state.hazards = [
      makeOven(640),
      makeCarvingKnife(830),
      makeRollingPin(520, 40),
    ];
    state.hazards[1].angle = -0.2;
    state.hazards[1].swing = 0.6;
    state.hazards[1].phase = 2.0;
    state.corns = [
      { x: 330, y: GROUND_Y - 52, taken: false },
      { x: 372, y: GROUND_Y - 78, taken: false },
      { x: 414, y: GROUND_Y - 52, taken: false },
    ];
    state.hides = [{ x: 420, kind: 'table', w: 110 }];
    state.bannerTime = 0;
  } else if (shot === 'end') {
    state.screen = 'escaped';
    state.score = 2480;
    state.corn = 27;
    state.distance = 1800;
    state.stage = STAGES[2];
    state.stageIndex = 2;
    state.endReason = 'Out the back door, into the autumn leaves.';
    state.best = 2480;
  } else if (shot === 'caught') {
    state.screen = 'caught';
    state.score = 860;
    state.corn = 9;
    state.distance = 912;
    state.stage = STAGES[1];
    state.stageIndex = 1;
    state.endReason = 'Old Man Bramble grabbed Giblet by the tail feathers.';
    state.best = 1240;
  }
}
stageShot();

// Small debug hook for automated play-tests (used by the builder only):
// snapshot the run, warp the distance, or summon the farmer next to Giblet.
window.__giblet = {
  snapshot: () => ({
    screen: state.screen,
    score: state.score,
    distance: Math.floor(state.distance),
    lives: state.lives,
    farmer: state.farmer.state,
    stage: state.stage.key,
    hiding: state.turkey.hiding,
    hideMeter: Math.round(state.turkey.hideMeter),
  }),
  warp: (d) => { state.distance = d; },
  summonFarmer: () => { state.farmer.x = TURKEY_X - 25; state.farmer.state = 'chase'; },
};

// --- Main loop -----------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shot) {
    if (state.screen === 'title') {
      state.time += dt;
      if (anyKey || clickQueued) { startRun(); }
    } else if (state.screen === 'play') {
      update(dt);
    } else if (restartQueued || clickQueued) {
      startRun();
    }
    anyKey = false;
    clickQueued = false;
    restartQueued = false;
    // Enter also starts from the title screen.
    if (state.screen === 'title' && keys['enter']) startRun();
  }
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
