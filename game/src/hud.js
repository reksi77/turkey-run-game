// The HUD of Giblet Runs for It: score, distance to the back door, three
// hearts, the stage name, the hide meter, and the banners that announce
// stage changes, spotting, and the end of the run.

import { PALETTE, outlinedText, roundRect, text } from './art.js';
import { ESCAPE_DISTANCE } from './stages.js';

export function drawHUD(ctx, state, w) {
  // Top bar.
  ctx.fillStyle = 'rgba(43, 26, 16, 0.78)';
  roundRect(ctx, 12, 10, 300, 66, 10);
  ctx.fill();
  text(ctx, `SCORE ${state.score}`, 26, 36, 20, PALETTE.cream);
  text(ctx, `CORN ${state.corn}`, 26, 60, 15, PALETTE.cornYellow);

  // Distance to the back door, right side.
  const left = Math.max(0, ESCAPE_DISTANCE - Math.floor(state.distance));
  ctx.fillStyle = 'rgba(43, 26, 16, 0.78)';
  roundRect(ctx, w - 262, 10, 250, 66, 10);
  ctx.fill();
  text(ctx, `${left}m TO THE BACK DOOR`, w - 250, 36, 18, PALETTE.cream);
  // Progress bar.
  ctx.fillStyle = 'rgba(255, 243, 214, 0.25)';
  roundRect(ctx, w - 250, 48, 226, 12, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.leafOrange;
  roundRect(ctx, w - 250, 48, 226 * Math.min(1, state.distance / ESCAPE_DISTANCE), 12, 6);
  ctx.fill();

  // Hearts, top centre.
  for (let i = 0; i < 3; i++) {
    const hx = w / 2 - 44 + i * 46;
    drawHeart(ctx, hx, 40, i < state.lives);
  }

  // Stage name, under the hearts, on a dark pill so it reads on any wall.
  const stageLabel = state.stage.name;
  ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
  const labelW = ctx.measureText(stageLabel).width + 28;
  ctx.fillStyle = 'rgba(43, 26, 16, 0.78)';
  roundRect(ctx, w / 2 - labelW / 2, 76, labelW, 28, 14);
  ctx.fill();
  text(ctx, stageLabel, w / 2, 96, 17, PALETTE.cream, 'center');

  // Hide meter, bottom left — only while it matters.
  if (state.turkey.hiding || state.turkey.hideMeter < 100) {
    ctx.fillStyle = 'rgba(43, 26, 16, 0.78)';
    roundRect(ctx, 12, 496, 220, 30, 8);
    ctx.fill();
    text(ctx, 'HIDDEN', 24, 516, 14, PALETTE.hay);
    ctx.fillStyle = 'rgba(255, 243, 214, 0.25)';
    roundRect(ctx, 96, 503, 124, 14, 7);
    ctx.fill();
    ctx.fillStyle = state.turkey.hideMeter > 30 ? PALETTE.hay : PALETTE.leafRed;
    roundRect(ctx, 96, 503, 124 * (state.turkey.hideMeter / 100), 14, 7);
    ctx.fill();
  }

  // Dash cooldown pip, bottom right.
  if (state.turkey.dashCooldown > 0) {
    text(ctx, 'DASH…', w - 24, 516, 14, 'rgba(255,243,214,0.6)', 'right');
  } else {
    text(ctx, 'DASH READY  [SHIFT]', w - 24, 516, 14, PALETTE.cornYellow, 'right');
  }

  // Stage banner, fading in and out after a stage change.
  if (state.bannerTime > 0) {
    const a = Math.min(1, state.bannerTime);
    ctx.globalAlpha = a;
    outlinedText(ctx, state.stage.name, w / 2, 210, 44, PALETTE.cream, PALETTE.dark, 'center');
    text(ctx, state.stage.sub, w / 2, 244, 19, PALETTE.cream, 'center');
    ctx.globalAlpha = 1;
  }

  // "SPOTTED!" flash when the farmer goes alert.
  if (state.spottedTime > 0) {
    const a = Math.min(1, state.spottedTime * 2);
    ctx.globalAlpha = a;
    outlinedText(ctx, 'SPOTTED!', w / 2, 150, 40, '#ff5a3c', PALETTE.dark, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawHeart(ctx, x, y, full) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = full ? '#e8452c' : 'rgba(255, 243, 214, 0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-16, -2, -10, -14, 0, -6);
  ctx.bezierCurveTo(10, -14, 16, -2, 0, 12);
  ctx.fill();
  ctx.restore();
}
