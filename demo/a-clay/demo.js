// 独立 A 黏土样例。读 art/plunger_manifest.json，不改原游戏。
// 贴合后只锁接触点 (256, 628.89)；握持点随压缩帧移动。按压换帧跟手，回弹时长不挡住拖拽。
(function () {
  const STAGE_W = 390, STAGE_H = 780;
  const cv = document.getElementById('c');
  const g = cv.getContext('2d');
  const gate = document.getElementById('gate');
  let SC = 1, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 3);
    SC = Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H);
    cv.style.width = STAGE_W * SC + 'px';
    cv.style.height = STAGE_H * SC + 'px';
    cv.width = Math.round(STAGE_W * SC * DPR);
    cv.height = Math.round(STAGE_H * SC * DPR);
    cv.style.marginTop = Math.max(0, (innerHeight - STAGE_H * SC) / 2) + 'px';
  }
  addEventListener('resize', resize);
  resize();

  function loadImage(src) {
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => resolve(im.naturalWidth ? im : null);
      im.onerror = () => resolve(null);
      im.src = src;
    });
  }

  function validateArt(manifest, images) {
    const errors = [];
    const frames = manifest.frames || [];
    if (frames.length !== 9) errors.push('帧数应为 9，当前 ' + frames.length);
    const canvas = manifest.canvasPx || [];
    frames.forEach(f => {
      const im = images[f.file];
      if (!im) { errors.push('缺帧 ' + f.file); return; }
      if (im.naturalWidth !== canvas[0] || im.naturalHeight !== canvas[1]) {
        errors.push(f.file + ' 为 ' + im.naturalWidth + '×' + im.naturalHeight + '，不是固定 ' + canvas[0] + '×' + canvas[1]);
      }
      if (Math.abs(f.contactAnchorPx[0] - manifest.contactAnchorPx[0]) > 0.05 || Math.abs(f.contactAnchorPx[1] - manifest.contactAnchorPx[1]) > 0.05) {
        errors.push(f.file + ' 接触锚点与总锚点不一致');
      }
    });
    if (frames.length >= 5 && Math.abs(frames[0].gripAnchorPx[1] - frames[4].gripAnchorPx[1]) < 8) {
      errors.push('压缩帧握持点没有移动，不能同时锁死握持点和接触点');
    }
    if (manifest.trim !== false) errors.push('trim 必须为 false，禁止逐帧裁切');
    const shadow = manifest.contactShadow;
    if (!shadow || !images[shadow.file]) errors.push('缺独立阴影 ' + (shadow && shadow.file));
    const fx = manifest.fixture || {};
    if (!images[fx.background]) errors.push('缺 fixture 背景 ' + fx.background);
    if (!images[fx.frontRim]) errors.push('缺前沿遮挡 ' + fx.frontRim);
    if (fx.toolScale !== 0.25) errors.push('显示缩放须为清单的 0.25，不能逐帧另拉');
    return { ok: errors.length === 0, errors: errors };
  }

  function createPlay(manifest, demo) {
    const scale = manifest.fixture.toolScale;
    const A = manifest.contactAnchorPx;
    const target = manifest.fixture.targetContactPx;
    const frames = manifest.frames;
    const press = demo.press;
    const snap = demo.snapRadiusPx;
    const idle = frames[0];
    const s = {
      phase: 'away', locked: false, shadow: false, frame: 0, press: 0, bottom: false, bt: 0,
      hit: null, finger: demo.homeGrip.slice(), down: false, y0: 0, top: [0, 0], rebI: 5, rebT: 0
    };
    function topFromGrip(frame, grip) {
      return [grip[0] - frame.gripAnchorPx[0] * scale, grip[1] - frame.gripAnchorPx[1] * scale];
    }
    function topFromContact() {
      return [target[0] - A[0] * scale, target[1] - A[1] * scale];
    }
    function contactOf(top) { return [top[0] + A[0] * scale, top[1] + A[1] * scale]; }
    function gripOf(frame, top) {
      return [top[0] + frame.gripAnchorPx[0] * scale, top[1] + frame.gripAnchorPx[1] * scale];
    }
    function layout() {
      const frame = frames[s.frame];
      s.top = s.locked ? topFromContact() : topFromGrip(idle, s.finger);
      return { top: s.top, contact: contactOf(s.top), grip: gripOf(frame, s.top) };
    }
    function pickPressFrame() {
      let best = 1, dist = 99;
      for (let i = 1; i <= 4; i++) {
        const d = Math.abs(frames[i].compression - s.press);
        if (d < dist) { dist = d; best = i; }
      }
      s.frame = s.press < 0.08 ? 0 : best;
    }
    function judge() {
      const ws = (press.rebounceMs - press.windowMs / 2) / 1000;
      const we = ws + press.windowMs / 1000;
      s.hit = s.bt < ws ? 'early' : s.bt <= we ? 'good' : 'late';
      s.bottom = false; s.press = 0; s.phase = 'rebound'; s.rebI = 5; s.rebT = 0; s.frame = 5;
    }
    function place(x, y) {
      s.finger = [x, y];
      if (s.locked) {
        const far = Math.hypot(x - s.lockFinger[0], y - s.lockFinger[1]) > press.travelPx + snap;
        if (far) { unlock(); return; }
        if (s.phase === 'rebound') return;
        const down = Math.max(0, y - s.y0);
        s.press = Math.max(0, Math.min(1, down / press.travelPx));
        s.phase = s.press > 0.02 ? 'press' : 'contact';
        if (s.press >= press.bottomAt && !s.bottom) { s.bottom = true; s.bt = 0; }
        if (s.bottom && s.press < press.releaseAt) judge();
        else pickPressFrame();
        layout();
        return;
      }
      layout();
      const c = contactOf(s.top);
      if (Math.hypot(c[0] - target[0], c[1] - target[1]) <= snap) {
        s.locked = true; s.shadow = true; s.phase = 'contact'; s.frame = 0; layout();
        const rest = gripOf(idle, s.top);
        s.y0 = rest[1]; s.lockFinger = rest;
      } else {
        s.phase = 'drag'; s.shadow = false; s.frame = 0;
      }
    }
    function unlock() {
      s.locked = false; s.shadow = false; s.bottom = false; s.press = 0; s.phase = 'lift'; s.frame = 0;
      layout();
    }
    s.pointerDown = function (x, y) { s.down = true; place(x, y); };
    s.pointerMove = function (x, y) { if (s.down) place(x, y); };
    s.pointerUp = function () {
      s.down = false;
      if (s.bottom) { s.press = 0; judge(); layout(); }
      else if (s.phase !== 'rebound') s.phase = s.locked ? 'contact' : 'away';
    };
    s.tick = function (dt) {
      if (s.bottom) s.bt += dt;
      if (s.phase !== 'rebound') return;
      s.rebT += dt * 1000;
      let guard = 0;
      while (s.rebI < 9 && guard++ < 9) {
        const ms = frames[s.rebI].durationMs;
        if (ms > 0 && s.rebT < ms) break;
        s.rebT -= Math.max(ms, 0); s.rebI++;
      }
      if (s.rebI >= 9) { s.phase = s.locked ? 'contact' : 'away'; s.frame = 0; }
      else s.frame = s.rebI;
      layout();
    };
    s.layout = layout;
    layout();
    return s;
  }

  function showGate(errors) {
    gate.hidden = false;
    gate.innerHTML = '<p class="k">样例未能启动</p><ul>' + errors.map(t => '<li>' + t + '</li>').join('') + '</ul>';
    g.setTransform(SC * DPR, 0, 0, SC * DPR, 0, 0);
    g.fillStyle = '#2B1E14'; g.fillRect(0, 0, STAGE_W, STAGE_H);
  }

  Promise.all([fetch('clay.json').then(r => r.json()), fetch('art/plunger_manifest.json').then(r => r.json())]).then(async ([demo, manifest]) => {
    const files = {};
    manifest.frames.forEach(f => files[f.file] = 'art/' + f.file);
    files[manifest.contactShadow.file] = 'art/' + manifest.contactShadow.file;
    files[manifest.fixture.background] = 'art/' + manifest.fixture.background;
    files[manifest.fixture.frontRim] = 'art/' + manifest.fixture.frontRim;
    const images = {};
    await Promise.all(Object.keys(files).map(async name => { images[name] = await loadImage(files[name]); }));
    const report = validateArt(manifest, images);
    if (!report.ok) { showGate(report.errors); window.ClayDemo = { ok: false, report: report }; return; }
    gate.hidden = true;
    const session = createPlay(manifest, demo);
    let last = performance.now();
    function pos(e) {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) / SC, y: (e.clientY - r.top) / SC };
    }
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const p = pos(e); session.pointerDown(p.x, p.y); });
    cv.addEventListener('pointermove', e => { if (!session.down) return; e.preventDefault(); const p = pos(e); session.pointerMove(p.x, p.y); });
    const up = () => { if (session.down) session.pointerUp(); };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    function blit(im, x, y, w, h) { if (im) g.drawImage(im, x, y, w, h); }
    function frame() {
      const now = performance.now();
      session.tick(Math.min(0.05, (now - last) / 1000));
      last = now;
      g.setTransform(SC * DPR, 0, 0, SC * DPR, 0, 0);
      g.fillStyle = demo.dockColor; g.fillRect(0, 0, STAGE_W, STAGE_H);
      blit(images[manifest.fixture.background], 0, 0, STAGE_W, STAGE_H);
      const lay = session.layout();
      const tool = () => blit(images[manifest.frames[session.frame].file], lay.top[0], lay.top[1], manifest.nominalDisplayPx[0], manifest.nominalDisplayPx[1]);
      const rim = () => blit(images[manifest.fixture.frontRim], 0, 0, STAGE_W, STAGE_H);
      const shadow = () => {
        if (!session.shadow) return;
        const sh = manifest.contactShadow;
        const dw = sh.displaySizePx[0], dh = sh.displaySizePx[1];
        const ax = sh.anchorPx[0] * dw / sh.canvasPx[0], ay = sh.anchorPx[1] * dh / sh.canvasPx[1];
        const t = manifest.fixture.targetContactPx;
        blit(images[sh.file], t[0] - ax, t[1] - ay, dw, dh);
      };
      if (session.locked) { shadow(); tool(); rim(); }
      else { rim(); tool(); }
      if (session.down) {
        g.beginPath(); g.arc(session.finger[0], session.finger[1], 16, 0, 7);
        g.fillStyle = 'rgba(243,210,176,.92)'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#5A4030'; g.stroke();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.ClayDemo = { ok: true, session: session, manifest: manifest, demo: demo, report: report };
  });
})();
