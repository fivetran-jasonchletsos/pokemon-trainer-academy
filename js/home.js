/* Home page: deterministic Pokemon of the day. */
(function () {
  var box = document.getElementById('potd');
  function dayNumber() {
    var d = new Date();
    var s = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    var h = s; h = ((h >> 16) ^ h) * 0x45d9f3b; h = ((h >> 16) ^ h) * 0x45d9f3b; h = (h >> 16) ^ h;
    return Math.abs(h);
  }
  function pick(max) { return (dayNumber() % max) + 1; }
  function render(id) {
    return Promise.all([PK.pokemon(id), PK.species(id)]).then(function (r) {
      var p = r[0], s = r[1];
      box.innerHTML = '<div class="grid g2" style="align-items:center"><div class="center sunburst">' + PK.img(p.id, p.name) + '</div><div>' +
        '<h3 style="text-transform:capitalize">' + PK.pad(p.id) + ' ' + PK.esc(PK.cap(p.name)) + '</h3><p class="muted">' + PK.esc(s.genus) + '</p><p>' + p.types.map(PK.typeBadge).join('') + '</p>' +
        '<p>' + PK.esc(PK.flavorFor(s, p.id)) + '</p><a class="btn sm red" href="pokedex.html?id=' + p.id + '">See everything about it</a></div></div>';
    });
  }
  PK.list().then(function (l) { return render(pick(l[l.length - 1].id > 1025 ? 1025 : l[l.length - 1].id)); })
    .catch(function () {
      return render(pick(1025)).catch(function () {
        box.innerHTML = PK.errorBox('We could not fetch today\'s Pokemon.');
      });
    });
})();
