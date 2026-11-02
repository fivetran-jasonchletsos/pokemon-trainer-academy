/* Interactive type chart using PokeAPI damage relations. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var types = null, sel = 'fire', mode = 'att';
  $('typeBtns').innerHTML = PK.TYPES.map(function (t) { return '<button type="button" class="type-btn" data-t="' + t + '" style="background:' + PK.TYPE_COLORS[t] + '">' + t + '</button>'; }).join('');
  function group(title, arr, cls) {
    return '<div class="card ' + cls + '" style="margin-bottom:12px"><h3>' + title + '</h3>' + (arr.length ? arr.map(PK.typeBadge).join('') : '<p class="muted">None</p>') + '</div>';
  }
  function draw() {
    Array.prototype.forEach.call(document.querySelectorAll('.type-btn'), function (b) { b.classList.toggle('on', b.dataset.t === sel); });
    $('modeAtt').classList.toggle('on', mode === 'att'); $('modeDef').classList.toggle('on', mode === 'def');
    if (!types) return;
    var t = types[sel];
    $('result').innerHTML = mode === 'att'
      ? '<h2 class="center">' + PK.typeBadge(sel) + ' attacks</h2><div class="grid g3">' + group('Super effective against (2 times)', t.ddTo, 'green') + group('Not very effective against (half)', t.hdTo, 'yellow') + group('No effect on', t.ndTo, 'red') + '</div>'
      : '<h2 class="center">' + PK.typeBadge(sel) + ' defends</h2><div class="grid g3">' + group('Weak to (takes 2 times)', t.ddFrom, 'red') + group('Resists (takes half)', t.hdFrom, 'green') + group('Immune to (takes none)', t.ndFrom, 'blue') + '</div>';
  }
  $('typeBtns').addEventListener('click', function (e) { var b = e.target.closest('.type-btn'); if (b) { sel = b.dataset.t; draw(); } });
  $('modeAtt').addEventListener('click', function () { mode = 'att'; draw(); });
  $('modeDef').addEventListener('click', function () { mode = 'def'; draw(); });
  function matrix() {
    var h = '<table class="matrix"><thead><tr><th style="background:#1d3e73">ATK / DEF</th>' + PK.TYPES.map(function (t) { return '<th style="background:' + PK.TYPE_COLORS[t] + '">' + t.slice(0, 4) + '</th>'; }).join('') + '</tr></thead><tbody>';
    PK.TYPES.forEach(function (a) {
      h += '<tr><th style="background:' + PK.TYPE_COLORS[a] + '">' + a + '</th>' + PK.TYPES.map(function (d) {
        var m = PK.mult(types, a, [d]);
        return m === 2 ? '<td class="m2">2</td>' : m === 0.5 ? '<td class="mh">1/2</td>' : m === 0 ? '<td class="m0">0</td>' : '<td></td>';
      }).join('') + '</tr>';
    });
    $('matrix').innerHTML = h + '</tbody></table>';
  }
  function boot() {
    PK.allTypes().then(function (t) { types = t; draw(); matrix(); })
      .catch(function () { $('result').innerHTML = PK.errorBox('The type chart could not load.', 'retryC'); $('retryC').addEventListener('click', boot); });
  }
  draw(); boot();
})();
