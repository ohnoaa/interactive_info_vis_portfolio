registerSketch("sk15", function (p) {
  let table;

  const CANVAS = 1080;

  // Text
  const TITLE = "Seattle’s offense isn’t balanced — It’s concentrated";
  const SUBTITLE =
    "Throughout this 2025 NFL season, three players account for nearly all total receiving yards for the Seattle Seahawks.";
  const FOOTER_LEFT = "Source: ESPN (INFO 474)";

  // Colors
  const THEME = {
    bgTop: "#1b2336",
    bgBottom: "#24304a",
    text: "#f6f7fb",
    muted: "rgba(246,247,251,0.70)",
    faint: "rgba(246,247,251,0.18)",
    divider: "rgba(246,247,251,0.15)",

    top1: "#002244",
    top2: "#1D4F91",
    top3: "#69BE28",
    others: "rgba(246,247,251,0.20)",
  };

  // Data
  let ranked = [];
  let segments = [];
  let totalYds = 0;
  let top3Share = 0;
  let othersPlayers = []; // store "everyone else" names

  // Hover
  let hoverSeg = -1;

  // --- Helper: parse numbers that might contain commas like "1,793"
  function parseNum(val) {
    if (val === null || val === undefined) return NaN;
    const s = String(val).trim();
    if (!s) return NaN;
    return Number(s.replace(/,/g, ""));
  }

  p.preload = () => {
    table = p.loadTable("data/Seahawks_Stats.csv", "csv", "header");
  };

  p.setup = () => {
    p.createCanvas(CANVAS, CANVAS);
    p.textFont("system-ui");
    computeData();
    p.noLoop();
  };

  p.draw = () => {
    drawBackground();

    const pad = 72;
    const contentW = p.width - pad * 2;

    // Title block
    const titleTop = 64;

    // Bar block
    const barX = pad;
    const barY = 640;
    const barW = contentW;
    const barH = 110;

    // Badge (centered) — smaller
    const badgeW = 420;
    const badgeH = 120;
    const badgeX = (p.width - badgeW) / 2;
    const badgeY = 320;

    // Title + subtitle
    const titleBottomY = drawTitleBlock(pad, titleTop, contentW, 52, 22);

    // Divider
    p.stroke(THEME.divider);
    p.strokeWeight(2);
    p.line(pad, titleBottomY + 30, p.width - pad, titleBottomY + 30);

    // Badge
    drawBadge(badgeX, badgeY, badgeW, badgeH);

    // Bar + brackets
    drawStackedBar(barX, barY, barW, barH, 24);
    drawTop3BracketFromBadge(badgeX, badgeY, badgeW, badgeH, barX, barY, barW, barH);
    drawTotalBarLength(barX, barY, barW, barH);

    // Legend
    drawLegendRow(barX, barY + barH + 120);

    // Footer
    drawFooter(pad, p.height - 38);

    // Tooltip
    drawTooltip(barX, barY, barW, barH);
  };

  p.mouseMoved = () => {
    p.redraw();
  };

  function computeData() {
    ranked = [];
    totalYds = 0;
    othersPlayers = [];

    for (let r = 0; r < table.getRowCount(); r++) {
      const player = table.getString(r, "NAME");
      const yds = parseNum(table.getString(r, "YDS"));

      if (!player || Number.isNaN(yds)) continue;

      ranked.push({ player, yds });
      totalYds += yds;
    }

    ranked.sort((a, b) => b.yds - a.yds);
    ranked = ranked.map((d) => ({ ...d, share: d.yds / totalYds }));

    const top1 = ranked[0];
    const top2 = ranked[1];
    const top3 = ranked[2];

    const others = ranked.slice(3);
    const othersYds = others.reduce((s, d) => s + d.yds, 0);
    const othersShare = othersYds / totalYds;

    // store everyone-else player list for tooltip
    othersPlayers = others.map((d) => d.player);

    top3Share = top1.share + top2.share + top3.share;

    segments = [
      { label: top1.player, share: top1.share, yds: top1.yds, col: p.color(THEME.top1) },
      { label: top2.player, share: top2.share, yds: top2.yds, col: p.color(THEME.top2) },
      { label: top3.player, share: top3.share, yds: top3.yds, col: p.color(THEME.top3) },
      { label: "Everyone else", share: othersShare, yds: othersYds, col: p.color(THEME.others) },
    ];
  }

  function drawBackground() {
    // Gradient
    for (let y = 0; y < p.height; y++) {
      const t = y / p.height;
      const c = p.lerpColor(p.color(THEME.bgTop), p.color(THEME.bgBottom), t);
      p.stroke(c);
      p.line(0, y, p.width, y);
    }

    // soft “lights”
    p.noStroke();
    p.fill(255, 255, 255, 10);
    p.ellipse(p.width * 0.12, p.height * 0.12, 420, 420);
    p.ellipse(p.width * 0.88, p.height * 0.12, 420, 420);

    // grain
    p.randomSeed(7);
    for (let i = 0; i < 2400; i++) {
      p.fill(255, 255, 255, p.random(6, 16));
      p.rect(p.random(p.width), p.random(p.height), 1, 1);
    }
  }

  function drawTitleBlock(x, y, w, titleSize, subtitleSize) {
    const lines = wrapText(TITLE, w, titleSize, p.BOLD);

    p.fill(THEME.text);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    p.textSize(titleSize);

    let cursorY = y;
    const lineH = titleSize * 1.12;
    for (const ln of lines) {
      p.text(ln, x, cursorY);
      cursorY += lineH;
    }

    cursorY += 12;
    p.textStyle(p.NORMAL);
    p.textSize(subtitleSize);
    p.fill(THEME.muted);
    p.text(SUBTITLE, x, cursorY, w, 200);

    return cursorY + subtitleSize * 2.0;
  }

  function drawBadge(x, y, w, h) {
    const pct = p.nf(top3Share * 100, 0, 1);

    p.noStroke();
    p.fill(255, 255, 255, 18);
    p.rect(x, y, w, h, 18);

    p.fill(THEME.muted);
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    p.textSize(16);
    p.text("TOP 3 PLAYERS", x + 18, y + 14);

    p.fill(THEME.text);
    p.textStyle(p.BOLD);
    p.textSize(60);
    p.text(`${pct}%`, x + 18, y + 38);

    p.textStyle(p.NORMAL);
    p.textSize(18);
    p.fill(THEME.muted);
    p.text("of total yards", x + 210, y + 58);
    p.text("in this dataset", x + 210, y + 80);

    p.fill(p.color(THEME.top3));
    p.rect(x + 18, y + h - 16, w - 36, 6, 4);
  }

  function drawStackedBar(x, y, w, h, r) {
    hoverSeg = getHoveredSegmentIndex(x, y, w, h);

    // container
    p.noStroke();
    p.fill(255, 255, 255, 12);
    p.rect(x, y, w, h, r);

    let cursor = x;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segW = Math.max(3, w * seg.share);

      let c = seg.col;
      if (i === hoverSeg) c = p.lerpColor(c, p.color(255), 0.08);

      p.fill(c);
      p.rect(cursor, y, segW, h, r);

      // dividers
      if (i > 0) {
        p.stroke(255, 255, 255, 80);
        p.strokeWeight(3);
        p.line(cursor, y + 10, cursor, y + h - 10);
        p.noStroke();
      }

      // label color for readability (dark text on green)
      const labelFill = () => {
        if (i === 2) p.fill(10, 20, 35);
        else p.fill(255);
      };

      if (i < 3 && segW > 200) {
        labelFill();
        p.textAlign(p.CENTER, p.CENTER);

        p.textStyle(p.BOLD);
        p.textSize(22);
        p.text(shortName(seg.label), cursor + segW / 2, y + h / 2 - 16);

        p.textStyle(p.NORMAL);
        p.textSize(20);
        p.text(`${p.nf(seg.share * 100, 0, 1)}%`, cursor + segW / 2, y + h / 2 + 18);
      } else if (i === 2 && segW > 170) {
        labelFill();
        p.textAlign(p.CENTER, p.CENTER);

        p.textStyle(p.BOLD);
        p.textSize(20);
        p.text(shortName(seg.label), cursor + segW / 2, y + h / 2 - 12);

        p.textStyle(p.NORMAL);
        p.textSize(18);
        p.text(`${p.nf(seg.share * 100, 0, 1)}%`, cursor + segW / 2, y + h / 2 + 16);
      } else if (i < 3 && segW > 140) {
        labelFill();
        p.textAlign(p.CENTER, p.CENTER);

        p.textStyle(p.BOLD);
        p.textSize(22);
        p.text(`${p.nf(seg.share * 100, 0, 1)}%`, cursor + segW / 2, y + h / 2);
      } else if (i === 3 && segW > 140) {
        p.fill(255, 255, 255, 200);
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);
        p.textSize(18);
        p.text("Others", cursor + segW / 2, y + h / 2);
      }

      cursor += segW;
    }
  }

  function drawTop3BracketFromBadge(bx, by, bw, bh, x, y, w, h) {
    const top3W = w * top3Share;
    const leftX = x;
    const rightX = x + top3W;

    const bracketY = y - 10;

    p.stroke(255, 255, 255, 220);
    p.strokeWeight(3);
    p.line(leftX, bracketY, rightX, bracketY);

    p.line(leftX, bracketY, leftX, bracketY + 14);
    p.line(rightX, bracketY, rightX, bracketY + 14);

    const badgeCenterX = bx + bw / 2;
    const badgeBottomY = by + bh;

    p.stroke(255, 255, 255, 120);
    p.strokeWeight(2);
    p.line(badgeCenterX, badgeBottomY + 8, badgeCenterX, bracketY - 12);
  }

  function drawTotalBarLength(x, y, w, h) {
    const bracketY = y + h + 44;

    p.stroke(255, 255, 255, 160);
    p.strokeWeight(2);
    p.line(x, bracketY, x + w, bracketY);

    p.line(x, bracketY - 7, x, bracketY + 7);
    p.line(x + w, bracketY - 7, x + w, bracketY + 7);

    p.noStroke();
    p.fill(255, 255, 255, 190);
    p.textAlign(p.CENTER, p.TOP);
    p.textStyle(p.BOLD);
    p.textSize(18);
    p.text(`${formatNumber(totalYds)} total yards`, x + w / 2, bracketY + 10);
  }

  function drawLegendRow(x, y) {
    const items = [
      { name: segments[0].label, col: segments[0].col },
      { name: segments[1].label, col: segments[1].col },
      { name: segments[2].label, col: segments[2].col },
      { name: "Everyone else", col: segments[3].col },
    ];

    let cx = x;
    const chip = 14;
    const gap = 26;

    p.textAlign(p.LEFT, p.CENTER);
    p.textStyle(p.NORMAL);
    p.textSize(18);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];

      p.noStroke();
      p.fill(it.col);
      p.rect(cx, y - chip / 2, chip, chip, 4);

      p.fill(255, 255, 255, 210);
      const label = i < 3 ? shortName(it.name) : it.name;
      p.text(label, cx + chip + 10, y);

      cx += chip + 10 + p.textWidth(label) + gap;
    }
  }

  function drawFooter(pad, y) {
    p.fill(THEME.muted);
    p.noStroke();
    p.textAlign(p.LEFT, p.BASELINE);
    p.textStyle(p.NORMAL);
    p.textSize(16);
    p.text(FOOTER_LEFT, pad, y);
  }

  function drawTooltip(x, y, w, h) {
    if (hoverSeg < 0) return;
    const seg = segments[hoverSeg];

    const pct = p.nf(seg.share * 100, 0, 1);

    let title = seg.label;
    let lines = [];

    if (hoverSeg === 3) {
      title = "Everyone else";
      const names = othersPlayers.map((n) => shortName(n)).join(", ");
      lines = wrapText(names, 420, 14, p.NORMAL);
    } else {
      lines = [`${formatNumber(seg.yds)} yards • ${pct}%`];
    }

    const pad = 16;
    const lineH = 18;
    const bw = 460;
    const bh = 16 + 20 + lines.length * lineH + 12;

    const tx = p.constrain(p.mouseX + 16, 18, p.width - bw - 18);
    const ty = p.constrain(p.mouseY - bh - 10, 18, p.height - bh - 18);

    p.noStroke();
    p.fill(0, 0, 0, 130);
    p.rect(tx + 6, ty + 6, bw, bh, 14);

    p.fill(255, 255, 255, 235);
    p.rect(tx, ty, bw, bh, 14);

    p.fill(30);
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    p.textSize(16);
    p.text(title, tx + pad, ty + 12);

    p.textStyle(p.NORMAL);
    p.textSize(14);
    p.fill(80);

    let cy = ty + 38;
    for (const ln of lines) {
      p.text(ln, tx + pad, cy);
      cy += lineH;
    }
  }

  function getHoveredSegmentIndex(x, y, w, h) {
    if (p.mouseX < x || p.mouseX > x + w || p.mouseY < y || p.mouseY > y + h) return -1;

    const relX = p.mouseX - x;
    let cursor = 0;

    for (let i = 0; i < segments.length; i++) {
      const segW = w * segments[i].share;
      if (relX >= cursor && relX <= cursor + segW) return i;
      cursor += segW;
    }
    return -1;
  }

  function formatNumber(n) {
    return p.nf(n, 0, 0);
  }

  function wrapText(str, maxW, fontSize, fontStyleConst) {
    p.push();
    p.textSize(fontSize);
    p.textStyle(fontStyleConst);

    const words = String(str).split(" ");
    const lines = [];
    let current = "";

    for (const w of words) {
      const test = current.length ? current + " " + w : w;
      if (p.textWidth(test) <= maxW) {
        current = test;
      } else {
        if (current.length) lines.push(current);
        current = w;
      }
    }
    if (current.length) lines.push(current);

    p.pop();
    return lines;
  }

  function shortName(name) {
    if (!name) return "";
    if (name.length <= 14) return name;

    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;

    return name.slice(0, 13) + "…";
  }
});