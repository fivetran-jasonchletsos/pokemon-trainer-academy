/* Dream team builder with combined type coverage. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'pk-team', team = PK.load(KEY, []).filter(function (x) { return x && x.id; }).slice(0, 6), list = [];
  function save() { PK.store(KEY, team); }
  function slots() {
    var h = '';
    for (var i = 0; i < 6; i++) {
      var p = team[i];
      h += p ? '<div class="slot full">' + PK.img(p.id, PK.cap(p.name)) + '<span class="nm">' + PK.esc(PK.cap(p.name)) + '</span><button class="btn sm red" type="button" data-rm="' + i + '">Remove</button></div>'
        : '<div class="slot"><span class="muted">Slot ' + (i + 1) + '</span></div>';
    }
    $('slots').innerHTML = h;
  }
  function results() {
    var q = $('tq').value.trim().toLowerCase().replace(/\s+/g, '-'), r = [];
    if (q) r = /^\d+$/.test(q) ? list.filter(function (p) { return p.id === +q; }) : list.filter(function (p) { return p.name.indexOf(q) >= 0; });
    else r = list.slice(0, 24);
    $('tres').innerHTML = r.slice(0, 40).map(function (p) {
      return '<button class="pk" type="button" data-add="' + p.id + '" data-name="' + p.name + '"><span class="num">' + PK.pad(p.id) + '</span>' + PK.img(p.id, PK.cap(p.name)) + '<span class="nm">' + PK.esc(PK.cap(p.name)) + '</span></button>';
    }).join('') || '<p>No matches.</p>';
  }
  function coverage() {
    var box = $('cov');
    if (!team.length) { box.innerHTML = '<p>Add a Pokemon to see how your team does.</p>'; return; }
    box.innerHTML = PK.loading('Checking your team...');
    Promise.all([PK.allTypes(), Promise.all(team.map(function (t) { return PK.pokemon(t.id); }))]).then(function (r) {
      var T = r[0], ps = r[1];
      var own = {}; ps.forEach(function (p) { p.types.forEach(function (t) { own[t] = 1; }); });
      var hit = PK.TYPES.filter(function (def) { return Object.keys(own).some(function (a) { return PK.mult(T, a, [def]) > 1; }); });
      var miss = PK.TYPES.filter(function (t) { return hit.indexOf(t) < 0; });
      var weak = PK.TYPES.map(function (a) {
        var w = 0, res = 0; ps.forEach(function (p) { var m = PK.mult(T, a, p.types); if (m > 1) w++; else if (m < 1) res++; });
        return { t: a, w: w, r: res };
      });
      var risky = weak.filter(function (x) { return x.w >= 2 && x.w > x.r; });
      box.innerHTML = '<p><b>Team types:</b> ' + Object.keys(own).map(PK.typeBadge).join('') + '</p>' +
        '<h3>Your team hits these types super effectively (' + hit.length + ' of 18)</h3><p>' + hit.map(PK.typeBadge).join('') + '</p>' +
        (miss.length ? '<h3>Tricky matchups for your team</h3><p class="muted">Your Pokemon types are not super effective against these:</p><p>' + miss.map(PK.typeBadge).join('') + '</p>' : '<p><b>Wow, your team covers every type!</b></p>') +
        '<h3>Watch out for</h3>' + (risky.length ? '<p>Several of your Pokemon are weak to these types:</p><p>' + risky.map(function (x) { return PK.typeBadge(x.t) + '<small><b>' + x.w + ' weak</b></small>'; }).join(' ') + '</p>' : '<p>No type is a big danger to several of your Pokemon at once. Nice balance!</p>') +
        (team.length < 6 ? '<p class="small muted">Add ' + (6 - team.length) + ' more to fill your team.</p>' : '');
    }).catch(function () { box.innerHTML = PK.errorBox('Could not check team coverage.', 'retryCov'); $('retryCov').addEventListener('click', coverage); });
  }
  document.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-rm]'), add = e.target.closest('[data-add]');
    if (rm) { team.splice(+rm.dataset.rm, 1); save(); slots(); coverage(); }
    else if (add) {
      if (team.length >= 6) { alert('Your team is full! Remove one first.'); return; }
      if (team.some(function (t) { return t.id === +add.dataset.add; })) { alert('That Pokemon is already on your team!'); return; }
      team.push({ id: +add.dataset.add, name: add.dataset.name }); save(); slots(); coverage();
    }
  });
  $('clearTeam').addEventListener('click', function () { team = []; save(); slots(); coverage(); });
  var t; $('tq').addEventListener('input', function () { clearTimeout(t); t = setTimeout(results, 150); });
  slots(); coverage();
  $('tres').innerHTML = PK.loading('Loading Pokemon...');
  function boot() {
    PK.list().then(function (l) { list = l.filter(function (p) { return p.id <= 1025; }); results(); })
      .catch(function () { $('tres').innerHTML = PK.errorBox('The Pokemon list could not load.', 'retryL'); $('retryL').addEventListener('click', boot); });
  }
  boot();
})();
