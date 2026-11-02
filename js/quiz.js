/* Quiz games: silhouette guessing and type matchup. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function Score(prefix, key) {
    var best = PK.load(key, 0), score = 0, streak = 0;
    function draw() { $(prefix + 'Score').textContent = score; $(prefix + 'Streak').textContent = streak; $(prefix + 'Best').textContent = best; }
    draw();
    return {
      right: function () { score++; streak++; if (streak > best) { best = streak; PK.store(key, best); } draw(); },
      wrong: function () { streak = 0; draw(); }
    };
  }

  /* tabs */
  function tab(which) {
    $('silGame').classList.toggle('hidden', which !== 'sil'); $('typeGame').classList.toggle('hidden', which !== 'type');
    $('tabSil').classList.toggle('on', which === 'sil'); $('tabType').classList.toggle('on', which === 'type');
    if (which === 'type' && !typeStarted) startType();
  }
  $('tabSil').addEventListener('click', function () { tab('sil'); });
  $('tabType').addEventListener('click', function () { tab('type'); });

  /* ---------- silhouette ---------- */
  var sc = Score('s', 'pk-best-sil'), list = [], cur = null, locked = false;
  var range = $('sRange');
  range.innerHTML = '<option value="all">All Pokemon</option>' + PK.GENS.map(function (g) { return '<option value="' + g.n + '">Gen ' + g.n + ' - ' + g.region + '</option>'; }).join('');
  range.value = '1';
  function pool() {
    var v = range.value, lo = 1, hi = 1025;
    if (v !== 'all') { var g = PK.GENS[+v - 1]; lo = g.from; hi = g.to; }
    return list.filter(function (p) { return p.id >= lo && p.id <= hi; });
  }
  function round() {
    var p = pool(); if (p.length < 4) p = list;
    var ans = p[rnd(p.length)], opts = [ans];
    while (opts.length < 4) { var c = p[rnd(p.length)]; if (opts.indexOf(c) < 0) opts.push(c); }
    cur = ans; locked = false;
    $('sFeed').textContent = ''; $('sHintText').textContent = ''; $('sNext').hidden = true; $('sHint').hidden = false;
    $('silBox').innerHTML = '<img class="dark" id="silImg" alt="A mystery Pokemon silhouette" src="' + PK.art(ans.id) + '" decoding="async">';
    $('sOpts').innerHTML = shuffle(opts).map(function (o) { return '<button type="button" class="opt" data-id="' + o.id + '">' + PK.esc(PK.cap(o.name)) + '</button>'; }).join('');
    var im = $('silImg'); im.onerror = function () { $('sFeed').textContent = 'That picture would not load. Tap Next Pokemon to try another!'; $('sNext').hidden = false; locked = true; };
  }
  $('sOpts').addEventListener('click', function (e) {
    var b = e.target.closest('.opt'); if (!b || locked) return;
    locked = true;
    var ok = +b.dataset.id === cur.id;
    $('silImg').classList.remove('dark'); $('silImg').alt = PK.cap(cur.name);
    Array.prototype.forEach.call($('sOpts').children, function (x) { x.disabled = true; if (+x.dataset.id === cur.id) x.classList.add('right'); });
    if (ok) { sc.right(); $('sFeed').textContent = 'Yes! It is ' + PK.cap(cur.name) + '!'; } else { b.classList.add('wrong'); sc.wrong(); $('sFeed').textContent = 'Oops, it was ' + PK.cap(cur.name) + '. Streak reset, you can do it!'; }
    $('sNext').hidden = false; $('sHint').hidden = true; $('sNext').focus();
  });
  $('sNext').addEventListener('click', round);
  range.addEventListener('change', round);
  $('sHint').addEventListener('click', function () { if (cur) $('sHintText').textContent = 'Its name starts with the letter ' + cur.name.charAt(0).toUpperCase() + ' and has ' + cur.name.replace(/-/g, '').length + ' letters.'; });
  $('silBox').innerHTML = PK.loading('Finding mystery Pokemon...');
  function boot() {
    PK.list().then(function (l) { list = l.filter(function (p) { return p.id <= 1025; }); round(); })
      .catch(function () { $('silBox').innerHTML = PK.errorBox('The mystery Pokemon could not be loaded.', 'retryS'); $('retryS').addEventListener('click', function () { $('silBox').innerHTML = PK.loading(); boot(); }); });
  }
  boot();

  /* ---------- type matchup ---------- */
  var typeStarted = false, tsc = Score('t', 'pk-best-type'), types = null, q = null, tlock = false;
  var CHOICES = [[2, 'Super effective'], [1, 'Normal damage'], [0.5, 'Not very effective'], [0, 'No effect']];
  function bucket(m) { return m > 1 ? 2 : m === 1 ? 1 : m === 0 ? 0 : 0.5; }
  function startType() {
    typeStarted = true;
    $('tBody').innerHTML = PK.loading('Loading the type chart...');
    PK.allTypes().then(function (t) { types = t; tround(); })
      .catch(function () { typeStarted = false; $('tBody').innerHTML = PK.errorBox('The type chart could not load.', 'retryT'); $('retryT').addEventListener('click', startType); });
  }
  function tround() {
    var att = PK.TYPES[rnd(18)], d1 = PK.TYPES[rnd(18)], defs = [d1];
    if (Math.random() < 0.3) { var d2 = PK.TYPES[rnd(18)]; if (d2 !== d1) defs.push(d2); }
    q = { att: att, defs: defs, ans: bucket(PK.mult(types, att, defs)), mult: PK.mult(types, att, defs) }; tlock = false;
    $('tBody').innerHTML = '<p class="center" style="font-size:1.25rem">A ' + PK.typeBadge(att) + ' move hits a ' + defs.map(PK.typeBadge).join(' and ') + ' Pokemon. What happens?</p>' +
      '<div class="opts">' + CHOICES.map(function (c) { return '<button type="button" class="opt" data-v="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<div class="feedback" id="tFeed" aria-live="polite"></div><div class="center"><button class="btn" id="tNext" type="button" hidden>Next question</button></div>';
    $('tNext').addEventListener('click', tround);
  }
  $('tBody').addEventListener('click', function (e) {
    var b = e.target.closest('.opt'); if (!b || tlock || !q) return;
    tlock = true;
    var ok = +b.dataset.v === q.ans;
    Array.prototype.forEach.call(document.querySelectorAll('#tBody .opt'), function (x) { x.disabled = true; if (+x.dataset.v === q.ans) x.classList.add('right'); });
    var note = q.mult === 4 ? ' (4 times damage!)' : q.mult === 0.25 ? ' (only a quarter damage)' : '';
    if (ok) { tsc.right(); $('tFeed').textContent = 'Correct!' + note; } else { b.classList.add('wrong'); tsc.wrong(); $('tFeed').textContent = 'Not quite. The answer is: ' + CHOICES.filter(function (c) { return c[0] === q.ans; })[0][1] + '.' + note; }
    $('tNext').hidden = false; $('tNext').focus();
  });
})();
