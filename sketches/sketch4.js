// Instance-mode sketch for tab 3
// Chess-Style Digital Clock (styled like a real physical chess clock)

registerSketch('sk4', function (p) {

  // ----- CONFIG -----
  let INITIAL_MINUTES = 3; // starting time per player
  let START_TIME_MS = INITIAL_MINUTES * 60 * 1000;

  let leftTimeMs = START_TIME_MS;
  let rightTimeMs = START_TIME_MS;

  // "left", "right", or null when paused / not started
  let activeSide = null;
  let lastTickMs = 0;
  let gameOver = false;

  p.setup = function () {
    p.createCanvas(800, 600);
    p.rectMode(p.CORNER);
    p.textAlign(p.CENTER, p.CENTER);
    lastTickMs = p.millis();
  };

  p.draw = function () {
    p.background(230); // neutral background

    updateTimers();

    drawDevice();      // main chess clock device
    drawStatusBar();   // text under device
    drawResetButton(); // reset at bottom
  };

  // ---------- TIMER LOGIC ----------

  function updateTimers() {
    let now = p.millis();

    if (gameOver || activeSide === null) {
      // Not ticking, just keep lastTickMs updated
      lastTickMs = now;
      return;
    }

    let dt = now - lastTickMs;
    lastTickMs = now;

    if (activeSide === "left") {
      leftTimeMs = Math.max(0, leftTimeMs - dt);
      if (leftTimeMs === 0) {
        gameOver = true;
        activeSide = null;
      }
    } else if (activeSide === "right") {
      rightTimeMs = Math.max(0, rightTimeMs - dt);
      if (rightTimeMs === 0) {
        gameOver = true;
        activeSide = null;
      }
    }
  }

  function formatTime(ms) {
    let totalSeconds = Math.max(0, Math.floor(ms / 1000));
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    return p.nf(minutes, 2) + ":" + p.nf(seconds, 2);
  }

  // ---------- DRAWING THE DEVICE ----------

  function drawDevice() {
    // Overall device dimensions
    let bodyW = 640;
    let bodyH = 180;
    let bodyX = (p.width - bodyW) / 2;
    let bodyY = 150;

    // Dark casing
    p.stroke(40);
    p.strokeWeight(3);
    p.fill(45); // dark gray
    p.rect(bodyX, bodyY, bodyW, bodyH, 12);

    // Slight top bevel
    p.noStroke();
    p.fill(60);
    p.rect(bodyX + 3, bodyY + 3, bodyW - 6, 30, 10, 10, 4, 4);

    // LCD area inside
    let lcdMargin = 18;
    let lcdX = bodyX + lcdMargin;
    let lcdY = bodyY + 40;
    let lcdW = bodyW - lcdMargin * 2;
    let lcdH = bodyH - 40 - 20;

    // Outer LCD frame
    p.stroke(80);
    p.strokeWeight(2);
    p.fill(190, 215, 185); // greenish LCD color
    p.rect(lcdX, lcdY, lcdW, lcdH, 6);

    // Divider between the two screens
    let midX = lcdX + lcdW / 2;
    p.stroke(150);
    p.strokeWeight(2);
    p.line(midX, lcdY + 8, midX, lcdY + lcdH - 8);

    // Draw the two digital displays
    let halfW = lcdW / 2;
    let leftX = lcdX;
    let rightX = lcdX + halfW;

    drawDigitalDisplay(
      leftX,
      lcdY,
      halfW,
      lcdH,
      formatTime(leftTimeMs),
      activeSide === "left",
      gameOver && leftTimeMs === 0
    );

    drawDigitalDisplay(
      rightX,
      lcdY,
      halfW,
      lcdH,
      formatTime(rightTimeMs),
      activeSide === "right",
      gameOver && rightTimeMs === 0
    );

    // Top “paddle” buttons (left/right circles)
    let btnY = bodyY + 12;
    let leftBtnX = bodyX + bodyW * 0.18;
    let rightBtnX = bodyX + bodyW * 0.82;

    p.noStroke();
    p.fill(230); // white paddles
    p.ellipse(leftBtnX, btnY, 34, 18);
    p.ellipse(rightBtnX, btnY, 34, 18);

    // Small red buttons in the center
    p.fill(200, 40, 40);
    let smallBtnW = 22;
    let smallBtnH = 12;
    let smallY = bodyY + 18;
    let centerX = bodyX + bodyW / 2;

    p.rect(centerX - smallBtnW / 2, smallY, smallBtnW, smallBtnH, 3);
    p.rect(centerX - 60 - smallBtnW / 2, smallY, smallBtnW, smallBtnH, 3);
    p.rect(centerX + 60 - smallBtnW / 2, smallY, smallBtnW, smallBtnH, 3);
  }

  function drawDigitalDisplay(x, y, w, h, timeStr, isActive, isFlagged) {
    // Glow / highlight edge if active or flagged
    p.noStroke();
    if (isFlagged) {
      p.fill(255, 200, 200, 120);
    } else if (isActive) {
      p.fill(255, 255, 150, 120);
    } else {
      p.fill(0, 0, 0, 0);
    }
    p.rect(x + 4, y + 4, w - 8, h - 8, 4);

    // Time text
    p.fill(20, 40, 40);
    p.textSize(56);
    p.textFont("monospace");
    p.text(timeStr, x + w / 2, y + h / 2 + 4);

    // Tiny "seconds" text in corner (just a hint like on real LCDs)
    p.textSize(14);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text("s", x + w - 10, y + h - 10);
    p.textAlign(p.CENTER, p.CENTER); // reset
  }

  // ---------- STATUS + RESET ----------

  function drawStatusBar() {
    p.textSize(18);
    p.fill(0);

    let status = "";

    if (gameOver) {
      if (leftTimeMs === 0 && rightTimeMs === 0) {
        status = "Both flags fell!";
      } else if (leftTimeMs === 0) {
        status = "Left flag fell — Right wins!";
      } else if (rightTimeMs === 0) {
        status = "Right flag fell — Left wins!";
      }
    } else if (activeSide === "left") {
      status = "Left player's clock is ticking…";
    } else if (activeSide === "right") {
      status = "Right player's clock is ticking…";
    } else {
      status = "Click a screen to choose whose clock starts.";
    }

    p.text(status, p.width / 2, 380);
  }

  function drawResetButton() {
    let bw = 160;
    let bh = 40;
    let x = p.width / 2 - bw / 2;
    let y = 430;

    p.stroke(40);
    p.strokeWeight(2);
    p.fill(255);
    p.rect(x, y, bw, bh, 10);

    p.noStroke();
    p.fill(0);
    p.textSize(16);
    p.text("Reset clocks", x + bw / 2, y + bh / 2);
  }

  // ---------- INTERACTION ----------

  p.mousePressed = function () {
    let mx = p.mouseX;
    let my = p.mouseY;

    // Device + LCD geometry (must match drawDevice)
    let bodyW = 640;
    let bodyH = 180;
    let bodyX = (p.width - bodyW) / 2;
    let bodyY = 150;

    let lcdMargin = 18;
    let lcdX = bodyX + lcdMargin;
    let lcdY = bodyY + 40;
    let lcdW = bodyW - lcdMargin * 2;
    let lcdH = bodyH - 40 - 20;
    let halfW = lcdW / 2;

    let leftScreen = {
      x: lcdX,
      y: lcdY,
      w: halfW,
      h: lcdH
    };

    let rightScreen = {
      x: lcdX + halfW,
      y: lcdY,
      w: halfW,
      h: lcdH
    };

    // Reset button bounds
    let bw = 160;
    let bh = 40;
    let rx = p.width / 2 - bw / 2;
    let ry = 430;

    // Reset click
    if (mx >= rx && mx <= rx + bw && my >= ry && my <= ry + bh) {
      resetGame();
      return;
    }

    // During game-over, ignore screen clicks
    if (gameOver) return;

    // Clicking LEFT screen → pass turn to RIGHT
    if (
      mx >= leftScreen.x &&
      mx <= leftScreen.x + leftScreen.w &&
      my >= leftScreen.y &&
      my <= leftScreen.y + leftScreen.h
    ) {
      activeSide = "right";
      lastTickMs = p.millis();
      return;
    }

    // Clicking RIGHT screen → pass turn to LEFT
    if (
      mx >= rightScreen.x &&
      mx <= rightScreen.x + rightScreen.w &&
      my >= rightScreen.y &&
      my <= rightScreen.y + rightScreen.h
    ) {
      activeSide = "left";
      lastTickMs = p.millis();
      return;
    }
  };

  function resetGame() {
    leftTimeMs = START_TIME_MS;
    rightTimeMs = START_TIME_MS;
    activeSide = null;
    lastTickMs = p.millis();
    gameOver = false;
  }

});
