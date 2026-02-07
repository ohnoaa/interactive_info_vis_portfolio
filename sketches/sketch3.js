// Instance-mode sketch for tab 3
// Flip Sand Timer Clock — aligned geometry, solid white frame, better behavior

registerSketch('sk3', function (p) {

  // Timer options in seconds
  const durations = [30, 60, 120, 300];
  const labels = ["30 s", "1 min", "2 min", "5 min"];
  let selectedIndex = 1; // default: 1 min

  let timerDurationMs = durations[selectedIndex] * 1000;
  let timerStartMs = 0;
  let isRunning = false;
  let isFinished = false;

  // Flip animation state
  const FLIP_DURATION = 500; // ms
  let isFlipping = false;
  let flipStartMs = 0;

  // Glass geometry
  const GLASS_W = 120;
  const GLASS_H = 220;
  const TOP_Y = -GLASS_H / 2;
  const BOTTOM_Y = GLASS_H / 2;
  const NECK_Y = 0;
  const NECK_TOP_Y = -6;
  const NECK_BOTTOM_Y = 6;

  p.setup = function () {
    p.createCanvas(800, 600); // ≤ 800x800
    p.rectMode(p.CORNER);
    p.ellipseMode(p.CENTER);
    p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = function () {
    const now = p.millis();
    const h = p.hour();
    const m = p.minute();
    const s = p.second();

    const tint = p.map(m, 0, 59, 0, 50);
    p.background(10, 40 + tint, 60);

    p.noStroke();
    p.fill(110, 80, 40);
    p.rect(40, 80, p.width - 80, p.height - 140, 30);

    // --- TIMER FRACTION ---
    let frac = 0; // 0–1 fraction of elapsed time

    if (isFlipping) {
      // During flip: freeze sand full-top/empty-bottom
      frac = 0;
    } else if (isRunning) {
      const elapsed = now - timerStartMs;
      if (elapsed >= timerDurationMs) {
        frac = 1;
        isRunning = false;
        isFinished = true;
      } else {
        frac = elapsed / timerDurationMs;
      }
    } else if (isFinished) {
      frac = 1;
    } else {
      frac = 0;
    }

    // Hourglass center
    const cx = p.width / 2;
    const cy = p.height / 2 - 20;

    // Flip animation angle
    let flipAngle = 0;
    if (isFlipping) {
      const t = p.constrain((now - flipStartMs) / FLIP_DURATION, 0, 1);
      flipAngle = t * p.PI;
      if (t >= 1) {
        // Finish flip → start timer
        isFlipping = false;
        isRunning = true;
        isFinished = false;
        timerStartMs = p.millis();
        flipAngle = 0;
      }
    }

    // Draw hourglass
    p.push();
    p.translate(cx, cy);
    p.rotate(flipAngle);
    drawHourglassOutline(p);
    drawSand(p, frac);
    p.pop();

    // Labels + current time
    drawLabels(p, frac, h, m, s);

    // Duration buttons
    drawButtons(p);
  };

  // ----------------- GEOMETRY HELPERS -----------------

  // x position of left glass inner wall at a given y
  function leftWallXAtY(y) {
    if (y <= NECK_Y) {
      // Top segment: from (-GLASS_W/2, TOP_Y) to (0, NECK_Y)
      const t = (y - TOP_Y) / (NECK_Y - TOP_Y);
      return p.lerp(-GLASS_W / 2, 0, t);
    } else {
      // Bottom segment: from (0, NECK_Y) to (-GLASS_W/2, BOTTOM_Y)
      const t = (y - NECK_Y) / (BOTTOM_Y - NECK_Y);
      return p.lerp(0, -GLASS_W / 2, t);
    }
  }

  // ----------------- HOURGLASS OUTLINE -----------------

  function drawHourglassOutline(p) {
    const w = GLASS_W;

    // Frame bars (solid white)
    p.fill(255);
    p.stroke(240);
    p.strokeWeight(4);
    p.rect(-w, TOP_Y - 24, 2 * w, 30, 10);    // top bar
    p.rect(-w, BOTTOM_Y - 6, 2 * w, 30, 10);  // bottom bar

    // Glass outline — thin lines, no fill so sand shows
    p.noFill();
    p.stroke(240);
    p.strokeWeight(3);

    p.beginShape();
    p.vertex(-w / 2, TOP_Y);
    p.vertex(0, NECK_Y);
    p.vertex(-w / 2, BOTTOM_Y);
    p.endShape();

    p.beginShape();
    p.vertex(w / 2, TOP_Y);
    p.vertex(0, NECK_Y);
    p.vertex(w / 2, BOTTOM_Y);
    p.endShape();

    // Neck line
    p.line(-8, 0, 8, 0);
  }

  // ----------------- SAND DRAWING -----------------

  function drawSand(p, frac) {
    const margin = 10;
    const neckWidth = 12;

    const topFrac = 1 - frac;
    const bottomFrac = frac;

    // Top sand: shrinks toward neck
    if (topFrac > 0.001) {
      const yTop = p.lerp(NECK_TOP_Y - margin, TOP_Y + margin, topFrac);
      const xLeftTop = leftWallXAtY(yTop);
      const xRightTop = -xLeftTop;

      p.noStroke();
      p.fill(245, 225, 150);
      p.beginShape();
      p.vertex(xLeftTop, yTop);
      p.vertex(xRightTop, yTop);
      p.vertex(neckWidth / 2, NECK_TOP_Y);
      p.vertex(-neckWidth / 2, NECK_TOP_Y);
      p.endShape(p.CLOSE);
    }

    // Bottom sand: grows from neck downward
    if (bottomFrac > 0.001) {
      const yBottom = p.lerp(NECK_BOTTOM_Y + margin, BOTTOM_Y - margin, bottomFrac);
      const xLeftBottom = leftWallXAtY(yBottom);
      const xRightBottom = -xLeftBottom;

      p.noStroke();
      p.fill(245, 225, 150);
      p.beginShape();
      p.vertex(-neckWidth / 2, NECK_BOTTOM_Y);
      p.vertex(neckWidth / 2, NECK_BOTTOM_Y);
      p.vertex(xRightBottom, yBottom);
      p.vertex(xLeftBottom, yBottom);
      p.endShape(p.CLOSE);
    }

    // Falling stream, only when actually running
    if (isRunning && bottomFrac > 0 && bottomFrac < 1) {
      const now = p.millis();
      const jitter = 1.2 * p.sin((now % 400) / 400 * p.TWO_PI);
      p.stroke(245, 225, 150);
      p.strokeWeight(2);
      p.line(jitter, NECK_TOP_Y, 0, NECK_BOTTOM_Y);
    }
  }

  // ----------------- LABELS -----------------

  function drawLabels(p, frac, h, m, s) {
    const cx = p.width / 2;
    const cy = p.height / 2 - 20;

    p.fill(255);
    p.noStroke();

    // Status text above hourglass
    p.textSize(24);
    if (isFlipping) {
      p.text("Flipping hourglass…", cx, 110);
    } else if (!isRunning && !isFinished) {
      p.text("Click the hourglass to start the timer", cx, 110);
    } else if (isRunning) {
      p.text("Timer running", cx, 110);
    } else if (isFinished) {
      p.text("Time's up! Click the hourglass to restart", cx, 110);
    }

    // Remaining time well below hourglass
    p.textSize(20);
    let remaining = 0;
    if (isRunning) {
      remaining = Math.ceil(timerDurationMs * (1 - frac) / 1000);
    } else if (isFinished) {
      remaining = 0;
    } else {
      remaining = Math.round(timerDurationMs / 1000);
    }
    p.text(`Remaining: ${remaining} s`, cx, cy + 185);

    // Real-world clock (HH:MM:SS) in top-right
    p.push();
    p.fill(255);
    p.textSize(14);
    p.text(
      `Current time: ${p.nf(h, 2)}:${p.nf(m, 2)}:${p.nf(s, 2)}`,
      p.width - 150,
      35
    );
    p.pop();
  }

  // ----------------- DURATION BUTTONS -----------------

  function drawButtons(p) {
    const cx = p.width / 2;
    const y = p.height - 60;
    const buttonWidth = 100;
    const buttonHeight = 32;
    const gap = 15;
    const totalWidth = durations.length * buttonWidth + (durations.length - 1) * gap;
    let x = cx - totalWidth / 2;

    for (let i = 0; i < durations.length; i++) {
      const isSelected = (i === selectedIndex);
      p.stroke(10, 40, 60);
      p.strokeWeight(isSelected ? 3 : 1);
      p.fill(isSelected ? [255, 220, 130] : [245, 245, 245]);
      p.rect(x, y, buttonWidth, buttonHeight, 8);

      p.fill(0);
      p.noStroke();
      p.textSize(14);
      p.text(labels[i], x + buttonWidth / 2, y + buttonHeight / 2);

      x += buttonWidth + gap;
    }
  }

  // ----------------- INTERACTION -----------------

  p.mousePressed = function () {
    const mx = p.mouseX;
    const my = p.mouseY;

    // Hourglass hitbox
    const cx = p.width / 2;
    const cy = p.height / 2 - 20;
    const hw = 90;
    const hh = 170;

    // Click on hourglass → start flip (only if not already flipping)
    if (
      !isFlipping &&
      mx >= cx - hw && mx <= cx + hw &&
      my >= cy - hh && my <= cy + hh
    ) {
      isFlipping = true;
      isRunning = false;
      isFinished = false;
      flipStartMs = p.millis();
      return;
    }

    // Click on duration buttons
    const buttonWidth = 100;
    const buttonHeight = 32;
    const gap = 15;
    const bxCenter = p.width / 2;
    const y = p.height - 60;
    const totalWidth = durations.length * buttonWidth + (durations.length - 1) * gap;
    let x = bxCenter - totalWidth / 2;

    for (let i = 0; i < durations.length; i++) {
      if (mx >= x && mx <= x + buttonWidth && my >= y && my <= y + buttonHeight) {
        selectedIndex = i;
        timerDurationMs = durations[selectedIndex] * 1000;

        // Changing duration always resets timer & pauses
        isRunning = false;
        isFinished = false;
        isFlipping = false;
        timerStartMs = 0;
        return;
      }
      x += buttonWidth + gap;
    }
  };

});
