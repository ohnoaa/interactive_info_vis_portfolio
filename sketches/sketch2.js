// Instance-mode sketch for tab 2
// Dice Turn Timer — INFO 474 HWK 4

registerSketch('sk2', function (p) {

  // ---- Timer / dice state ----
  let die1 = 0;
  let die2 = 0;
  let timerDuration = 0;   // ms
  let timerStart = 0;      // ms
  let isRunning = false;
  let isRolling = false;
  let rollStart = 0;

  // ---- Animation constants ----
  const ROLL_DURATION = 800;
  const SHAKE_DURATION = 500;
  let shakeEndTime = 0;

  p.setup = function () {
    // Fixed canvas size
    p.createCanvas(800, 600);
    p.rectMode(p.CORNER);
    p.ellipseMode(p.CENTER);
    p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = function () {
    const now = p.millis();

    // Subtle background influenced by real clock time
    const bg = p.map(p.hour(), 0, 23, 30, 60);
    p.background(20, 40, bg);

    // ---- Dice roll animation ----
    let shakeX = 0;
    let shakeY = 0;
    if (now < shakeEndTime) {
      shakeX = p.random(-6, 6);
      shakeY = p.random(-6, 6);
    }

    if (isRolling) {
      if (now - rollStart > ROLL_DURATION) {
        finalizeRoll(now);
      } else {
        die1 = p.floor(p.random(1, 7));
        die2 = p.floor(p.random(1, 7));
      }
    }

    // ---- Timer logic ----
    let remaining = 0;
    let progress = 0;
    if (isRunning) {
      const elapsed = now - timerStart;
      remaining = p.max(0, timerDuration - elapsed);
      progress = elapsed / timerDuration;
      if (remaining <= 0) isRunning = false;
    }

    const frac = (now % 1000) / 1000;

    p.push();
    p.translate(shakeX, shakeY);

    // ---- Board ----
    p.noStroke();
    p.fill(40, 80, 50);
    p.rect(50, 80, p.width - 100, p.height - 200, 20);

    // ---- Dice layout ----
    const size = 150;
    const gap = 60;
    const x0 = (p.width - (size * 2 + gap)) / 2;
    const y0 = 200;

    drawDie(x0, y0, size, die1);
    drawDie(x0 + size + gap, y0, size, die2);

    // ---- Status text ----
    p.fill(255);
    p.textSize(26);
    if (isRolling) {
      p.text('Rolling…', p.width / 2, 140);
    } else if (isRunning) {
      p.text('Turn timer running', p.width / 2, 140);
    } else if (timerDuration > 0) {
      p.text('Time’s up — click to roll again', p.width / 2, 140);
    } else {
      p.text('Click to roll and start timer', p.width / 2, 140);
    }

    // ---- Countdown ----
    p.textSize(24);
    if (isRunning) {
      p.text(`${Math.ceil(remaining / 1000)} s remaining`,
        p.width / 2, y0 + size + 40);
    }

    // ---- Progress track ----
    drawTrack(progress, frac);

    p.pop();

    // Small real-time clock
    p.push();               
    p.fill(255);            
    p.noStroke();
    p.textSize(14);
    p.text(
      `Current time: ${p.nf(p.hour(), 2)}:${p.nf(p.minute(), 2)}:${p.nf(p.second(), 2)}`,
      p.width - 160,
      20
    );
    p.pop(); 
  };

  function finalizeRoll(now) {
    isRolling = false;
    die1 = p.floor(p.random(1, 7));
    die2 = p.floor(p.random(1, 7));
    timerDuration = (die1 + die2) * 5 * 1000;
    timerStart = now;
    isRunning = true;
  }

  function drawDie(x, y, s, val) {
    p.stroke(255);
    p.strokeWeight(3);
    p.fill(240);
    p.rect(x, y, s, s, 25);

    const r = s * 0.075;
    const o = s * 0.28;
    const cx = x + s / 2;
    const cy = y + s / 2;

    const pips = {
      1: [[cx, cy]],
      2: [[x + o, y + o], [x + s - o, y + s - o]],
      3: [[x + o, y + o], [cx, cy], [x + s - o, y + s - o]],
      4: [[x + o, y + o], [x + s - o, y + o], [x + o, y + s - o], [x + s - o, y + s - o]],
      5: [[x + o, y + o], [x + s - o, y + o], [cx, cy], [x + o, y + s - o], [x + s - o, y + s - o]],
      6: [[x + o, y + o], [x + s - o, y + o], [x + o, cy], [x + s - o, cy], [x + o, y + s - o], [x + s - o, y + s - o]],
    }[val] || [];

    p.noStroke();
    p.fill(30);
    pips.forEach(([px, py]) => p.circle(px, py, r));
  }

  function drawTrack(progress, frac) {
    const total = 60;
    const size = 10;
    const gap = 2;
    const startX = (p.width - (total * size + (total - 1) * gap)) / 2;
    const y = 470;
    const remaining = Math.round((1 - progress) * total);

    for (let i = 0; i < total; i++) {
      const x = startX + i * (size + gap);
      if (i < remaining) {
        const pulse = i === remaining - 1 ? 1 + 0.3 * p.sin(frac * p.TWO_PI) : 1;
        p.fill(250);
        p.rect(x, y, size * pulse, size * pulse, 2);
      } else {
        p.noFill();
        p.stroke(180);
        p.rect(x, y, size, size, 2);
      }
    }

    p.noStroke();
    p.fill(255);
    p.textSize(14);
    p.text('Turn timer progress', p.width / 2, y + 30);
  }

  p.mousePressed = function () {
    const now = p.millis();
    if (!isRolling) {
      isRolling = true;
      isRunning = false;
      rollStart = now;
      shakeEndTime = now + SHAKE_DURATION;
    }
  };
});

