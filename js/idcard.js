/* Printable trainer ID card. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var list = [], saved = PK.load('pk-idcard', { name: '', poke: 'pikachu', type: 'electric', region: 'Kanto' });
  PK.TYPES.forEach(function (t) { $('iType').insertAdjacentHTML('beforeend', '<option value="' + t + '">' + PK.cap(t) + '</option>'); });
  PK.GENS.forEach(function (g) { $('iRegion').insertAdjacentHTML('beforeend', '<option>' + g.region + '</option>'); });
  $('iName').value = saved.name; $('iPoke').value = PK.cap(saved.poke); $('iType').value = saved.type; $('iRegion').value = saved.region;
  function idNum() { var n = $('iName').value || 'x', h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 9000; return 1000 + h; }
  function draw() {
    var name = $('iName').value.trim(), pk = $('iPoke').value.trim().toLowerCase().replace(/\s+/g, '-');
    var type = $('iType').value;
    $('cName').textContent = name || 'Trainer';
    $('cPoke').textContent = pk ? PK.cap(pk) : 'Not chosen yet';
    $('cType').textContent = PK.cap(type); $('cRegion').textContent = $('iRegion').value; $('cId').textContent = 'ID ' + idNum();
    $('idcard').style.setProperty('--accent', PK.TYPE_COLORS[type]);
    var m = list.filter(function (p) { return p.name === pk; })[0];
    if (m) { $('cImg').src = PK.art(m.id); $('cImg').alt = PK.cap(m.name); $('iNote').textContent = ''; }
    else if (list.length && pk) $('iNote').textContent = 'That name is not in the Pokedex yet. Pick one from the list that appears as you type.';
    PK.store('pk-idcard', { name: name, poke: pk || 'pikachu', type: type, region: $('iRegion').value });
  }
  ['iName', 'iPoke', 'iType', 'iRegion'].forEach(function (id) { $(id).addEventListener('input', draw); $(id).addEventListener('change', draw); });
  $('printBtn').addEventListener('click', function () { window.print(); });
  draw();
  PK.list().then(function (l) {
    list = l.filter(function (p) { return p.id <= 1025; });
    $('pokeList').innerHTML = list.map(function (p) { return '<option value="' + PK.esc(PK.cap(p.name)) + '">'; }).join('');
    draw();
  }).catch(function () { $('iNote').textContent = 'The Pokemon list could not load, so the picture will stay on Pikachu. You can still print your card!'; });
})();
