/* Pokedex: search, filters, Who is this helper, detail view. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var all = [], filtered = [], shown = 0, PAGE = 30, token = 0;
  var grid = $('grid'), status = $('status'), more = $('more');

  /* fill selects */
  PK.TYPES.forEach(function (t) { $('ftype').insertAdjacentHTML('beforeend', '<option value="' + t + '">' + PK.cap(t) + '</option>'); });
  PK.GENS.forEach(function (g) { $('fgen').insertAdjacentHTML('beforeend', '<option value="' + g.n + '">Gen ' + g.n + ' - ' + g.region + '</option>'); });
  PK.COLORS.forEach(function (c) { $('fcolor').insertAdjacentHTML('beforeend', '<option value="' + c + '">' + PK.cap(c) + '</option>'); });

  function cardHtml(p) {
    return '<button class="pk" type="button" data-id="' + p.id + '"><span class="num">' + PK.pad(p.id) + '</span>' + PK.img(p.id, PK.cap(p.name)) + '<span class="nm">' + PK.esc(PK.cap(p.name)) + '</span></button>';
  }
  function renderMore() {
    var next = filtered.slice(shown, shown + PAGE);
    grid.insertAdjacentHTML('beforeend', next.map(cardHtml).join(''));
    shown += next.length;
    more.hidden = shown >= filtered.length;
  }
  function intersect(ids, set) { return ids.filter(function (p) { return set[p.id]; }); }
  function toSet(arr) { var s = {}; arr.forEach(function (i) { s[i] = 1; }); return s; }

  function apply() {
    var my = ++token;
    var q = $('q').value.trim().toLowerCase(), type = $('ftype').value, gen = $('fgen').value, color = $('fcolor').value;
    var jobs = [];
    if (type) jobs.push(PK.type(type).then(function (t) { return t.ids; }));
    if (gen) jobs.push(PK.gen(gen));
    if (color) jobs.push(PK.color(color));
    status.textContent = jobs.length ? 'Searching the Pokedex...' : '';
    Promise.all(jobs).then(function (sets) {
      if (my !== token) return;
      var res = all;
      sets.forEach(function (s) { res = intersect(res, toSet(s)); });
      if (q) {
        if (/^\d+$/.test(q)) res = res.filter(function (p) { return p.id === +q; });
        else { var qq = q.replace(/\s+/g, '-'); res = res.filter(function (p) { return p.name.indexOf(qq) >= 0; }); }
      }
      filtered = res; shown = 0; grid.innerHTML = '';
      if (!res.length) status.innerHTML = '<div class="notice">No Pokemon match that. Try fewer filters or check the spelling!</div>';
      else { status.textContent = 'Showing ' + res.length + ' Pokemon'; renderMore(); }
    }).catch(function () {
      if (my !== token) return;
      status.innerHTML = PK.errorBox('The filters could not load.', 'retryF');
      var b = $('retryF'); if (b) b.addEventListener('click', apply);
    });
  }

  function init() {
    status.innerHTML = PK.loading('Opening the Pokedex...');
    PK.list().then(function (l) {
      all = l; apply();
      var id = PK.qs('id') || (location.hash && location.hash.slice(1));
      if (id && /^\d+$/.test(id)) openDetail(+id);
    }).catch(function () {
      status.innerHTML = PK.errorBox('The Pokedex could not open.', 'retryI');
      var b = $('retryI'); if (b) b.addEventListener('click', init);
    });
  }
  var timer;
  $('q').addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(apply, 200); });
  ['ftype', 'fgen', 'fcolor'].forEach(function (id) { $(id).addEventListener('change', apply); });
  $('clear').addEventListener('click', function () { $('q').value = ''; ['ftype', 'fgen', 'fcolor'].forEach(function (id) { $(id).value = ''; }); apply(); });
  more.addEventListener('click', renderMore);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-id]');
    if (b && (b.classList.contains('pk') || b.classList.contains('evo-card') || b.dataset.open)) openDetail(+b.dataset.id);
  });

  /* ---------- Who is this helper ---------- */
  var clues = { color: '', type: '', size: '', shape: '' };
  var SIZES = { small: 'Small (under 0.7 m)', medium: 'Medium', big: 'Big (1.6 m or taller)' };
  function chipGroup(key, title, opts) {
    return '<div class="clue-group"><h4>' + title + '</h4>' + opts.map(function (o) {
      return '<button type="button" class="chip' + (clues[key] === o[0] ? ' on' : '') + '" data-clue="' + key + '" data-val="' + o[0] + '">' + PK.esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }
  function drawClues() {
    $('clues').innerHTML =
      chipGroup('color', 'What color is it mostly?', PK.COLORS.map(function (c) { return [c, PK.cap(c)]; })) +
      chipGroup('type', 'What kind of Pokemon do you think it is?', PK.TYPES.map(function (t) { return [t, PK.cap(t)]; })) +
      chipGroup('size', 'How big is it?', Object.keys(SIZES).map(function (k) { return [k, SIZES[k]]; })) +
      chipGroup('shape', 'What shape is its body?', Object.keys(PK.SHAPES).map(function (k) { return [k, PK.SHAPES[k]]; }));
  }
  drawClues();
  $('clues').addEventListener('click', function (e) {
    var b = e.target.closest('[data-clue]'); if (!b) return;
    var k = b.dataset.clue; clues[k] = clues[k] === b.dataset.val ? '' : b.dataset.val; drawClues();
  });
  $('resetClues').addEventListener('click', function () { clues = { color: '', type: '', size: '', shape: '' }; drawClues(); $('helperOut').innerHTML = ''; });
  $('findBtn').addEventListener('click', function () {
    var out = $('helperOut');
    if (!clues.color && !clues.type && !clues.shape && !clues.size) { out.innerHTML = '<div class="notice">Pick at least one clue first!</div>'; return; }
    out.innerHTML = PK.loading('Searching for clues...');
    PK.list().then(function (l) {
      var jobs = [];
      if (clues.color) jobs.push(PK.color(clues.color));
      if (clues.type) jobs.push(PK.type(clues.type).then(function (t) { return t.ids; }));
      if (clues.shape) jobs.push(PK.shape(clues.shape));
      return Promise.all(jobs).then(function (sets) {
        var res = l; sets.forEach(function (s) { res = intersect(res, toSet(s)); });
        if (!clues.size) return res;
        if (res.length > 120) return { tooMany: res.length };
        return Promise.all(res.map(function (p) { return PK.pokemon(p.id); })).then(function (ps) {
          return ps.filter(function (p) {
            return clues.size === 'small' ? p.height < 7 : clues.size === 'medium' ? (p.height >= 7 && p.height < 16) : p.height >= 16;
          }).map(function (p) { return { id: p.id, name: p.name }; });
        });
      });
    }).then(function (res) {
      if (res.tooMany) { out.innerHTML = '<div class="notice">That is a lot of Pokemon (' + res.tooMany + ' before checking size). Pick one more clue like color or shape, then try again!</div>'; return; }
      if (!res.length) { out.innerHTML = '<div class="notice">Hmm, nothing matches all of those clues. Try taking one clue away. Memories can be tricky!</div>'; return; }
      var top = res.slice(0, 60);
      out.innerHTML = '<p><b>' + res.length + ' possible Pokemon' + (res.length > 60 ? ' (showing the first 60, add more clues to narrow it down)' : '') + '. Tap one to learn more!</b></p><div class="pk-grid">' + top.map(cardHtml).join('') + '</div>';
    }).catch(function () { out.innerHTML = PK.errorBox('The clue search hit a snag.'); });
  });

  /* ---------- detail view ---------- */
  var cur = null, factIdx = 0, dtoken = 0;
  function closeDetail() { $('modal').classList.add('hidden'); document.body.style.overflow = ''; if (location.hash) history.replaceState(null, '', location.pathname); }
  $('closeModal').addEventListener('click', closeDetail);
  $('modal').addEventListener('click', function (e) { if (e.target === $('modal')) closeDetail(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDetail(); });

  var STAT_NAMES = { hp: 'HP', attack: 'Attack', defense: 'Defense', 'special-attack': 'Sp. Atk', 'special-defense': 'Sp. Def', speed: 'Speed' };
  function statColor(v) { return v >= 100 ? '#3bb273' : v >= 60 ? '#ffcb05' : '#ee7f30'; }
  function evoHtml(n, curId, isRoot) {
    var me = '<button type="button" class="evo-card' + (n.id === curId ? ' cur' : '') + '" data-id="' + n.id + '">' + PK.img(n.id, PK.cap(n.name)) + '<span>' + PK.esc(PK.cap(n.name)) + '</span></button>';
    if (!n.kids.length) return '<div class="evo-node">' + me + '</div>';
    return '<div class="evo-node">' + me + '<div class="evo-kids">' + n.kids.map(function (k) {
      return '<div class="evo-kid"><div><div class="evo-how">' + PK.esc(k.how || 'Evolves') + '</div><div class="evo-arrow" style="margin:auto"></div></div>' + evoHtml(k, curId) + '</div>';
    }).join('') + '</div></div>';
  }
  function weaknessHtml(p, types) {
    var rows = { 4: [], 2: [], 0.5: [], 0.25: [], 0: [] };
    PK.TYPES.forEach(function (a) { var m = PK.mult(types, a, p.types); if (rows[m]) rows[m].push(a); });
    var line = function (label, arr) {
      return arr.length ? '<p><b>' + label + '</b><br>' + arr.map(function (t) { return PK.typeBadge(t); }).join('') + '</p>' : '';
    };
    return line('Very weak to (4 times damage)', rows[4]) + line('Weak to (2 times damage)', rows[2]) + line('Resists (half damage)', rows[0.5].concat(rows[0.25])) + line('Cannot be hurt by', rows[0]);
  }
  function openDetail(id) {
    var my = ++dtoken;
    $('modal').classList.remove('hidden'); document.body.style.overflow = 'hidden';
    $('modal').scrollTop = 0;
    history.replaceState(null, '', '#' + id);
    var d = $('detail'); d.innerHTML = PK.loading('Looking up Pokemon number ' + id + '...');
    Promise.all([PK.pokemon(id), PK.species(id)]).then(function (r) {
      if (my !== dtoken) return;
      var p = r[0], s = r[1]; cur = { p: p, s: s }; factIdx = 0;
      d.innerHTML = '<div class="detail-top"><div class="artbox">' + PK.img(p.id, PK.cap(p.name)).replace('loading="lazy"', 'loading="eager"') + '</div><div>' +
        '<div class="muted"><b>' + PK.pad(p.id) + '</b></div><h2 style="margin:0">' + PK.esc(PK.cap(p.name)) + '</h2><p class="muted">' + PK.esc(s.genus) + '</p>' +
        '<p>' + p.types.map(PK.typeBadge).join('') + '</p>' +
        '<p><b>Height:</b> ' + (p.height / 10).toFixed(1) + ' m &nbsp; <b>Weight:</b> ' + (p.weight / 10).toFixed(1) + ' kg</p>' +
        '<p><b>Abilities:</b> ' + p.abilities.map(function (a) { return PK.esc(PK.cap(a.name)) + (a.hidden ? ' (hidden)' : ''); }).join(', ') + '</p></div></div>' +
        '<h3>What the Pokedex says</h3><div class="flavor" id="flavor">' + PK.esc(PK.flavorFor(s, factIdx)) + '</div>' +
        (s.flavor.length > 1 ? '<p style="margin-top:8px"><button type="button" class="btn sm yellow" id="another">Tell me more</button></p>' : '') +
        '<h3>Base stats</h3>' + p.stats.map(function (st) {
          return '<div class="stat"><span>' + (STAT_NAMES[st.name] || st.name) + '</span><span>' + st.v + '</span><div class="bar"><i style="width:' + Math.min(100, st.v / 255 * 100) + '%;background:' + statColor(st.v) + '"></i></div></div>';
        }).join('') +
        '<h3>Weaknesses and strengths</h3><div id="weak">' + PK.loading('Working out the type matchups...') + '</div>' +
        '<h3>Evolution</h3><div id="evo">' + PK.loading('Checking the family tree...') + '</div>' +
        '<p style="margin-top:16px"><a class="btn sm" href="cards.html?name=' + encodeURIComponent(p.name.split('-')[0]) + '">Find trading cards</a></p>';
      var an = $('another'); if (an) an.addEventListener('click', function () { factIdx++; $('flavor').textContent = PK.flavorFor(s, factIdx); });
      PK.allTypes().then(function (t) { if (my === dtoken) $('weak').innerHTML = weaknessHtml(p, t); })
        .catch(function () { if (my === dtoken) $('weak').innerHTML = '<div class="notice err">Could not work out type matchups right now.</div>'; });
      (s.evo ? PK.evo(s.evo) : Promise.reject()).then(function (tree) {
        if (my !== dtoken) return;
        $('evo').innerHTML = tree.kids.length ? '<div class="evo">' + evoHtml(tree, p.id) + '</div>' : '<p>' + PK.esc(PK.cap(p.name)) + ' does not evolve. It is one of a kind!</p>';
      }).catch(function () { if (my === dtoken) $('evo').innerHTML = '<div class="notice">Could not load the evolution family right now.</div>'; });
    }).catch(function () {
      if (my !== dtoken) return;
      d.innerHTML = PK.errorBox('We could not find that Pokemon.', 'retryD');
      var b = $('retryD'); if (b) b.addEventListener('click', function () { openDetail(id); });
    });
  }
  window.openDetail = openDetail;
  init();
})();
