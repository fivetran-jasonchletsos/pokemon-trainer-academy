/* Card Finder using the Pokemon TCG API. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var URL_BASE = 'https://api.pokemontcg.io/v2/cards';
  var cards = [];
  function buildUrl(name) {
    var clean = name.replace(/["\\*]/g, '').trim();
    var q = 'name:"' + clean + '"';
    return URL_BASE + '?q=' + encodeURIComponent(q) + '&pageSize=24&orderBy=-set.releaseDate&select=id,name,number,rarity,set,images';
  }
  function search(name) {
    var out = $('cardOut');
    name = name.trim();
    if (!name) { out.innerHTML = '<div class="notice">Type a Pokemon name first!</div>'; return; }
    out.innerHTML = PK.loading('Searching the card binders. This can take a few seconds...');
    PK.fetchJson(buildUrl(name), 2, 30000).then(function (d) {
      cards = d.data || [];
      if (!cards.length) { out.innerHTML = '<div class="notice">No cards found for "' + PK.esc(name) + '". Check the spelling, or try a different Pokemon.</div>'; return; }
      out.innerHTML = '<p><b>Showing ' + cards.length + ' cards (newest sets first). Tap a card to see it bigger.</b></p><div class="card-grid">' + cards.map(function (c, i) {
        var im = c.images && c.images.small ? '<img src="' + PK.esc(c.images.small) + '" alt="' + PK.esc(c.name) + ' card" loading="lazy" decoding="async" data-i="' + i + '">' : '<p>No picture</p>';
        return '<div class="card-result">' + im + '<b>' + PK.esc(c.name) + '</b>' + PK.esc(c.set ? c.set.name : 'Unknown set') + '<br>' + PK.esc((c.number || '?') + (c.set && c.set.printedTotal ? ' of ' + c.set.printedTotal : '')) + (c.rarity ? '<br><span class="tag">' + PK.esc(c.rarity) + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    }).catch(function () {
      out.innerHTML = '<div class="notice err" role="alert"><b>The card binder is stuck.</b><br>The card search service did not answer. It is sometimes slow or busy. Wait a moment and try again, or ask a grown-up to help. You can still use the guide above to learn about cards!<br><button class="btn sm red" id="retryCards" type="button" style="margin-top:10px">Try again</button></div>';
      $('retryCards').addEventListener('click', function () { search(name); });
    });
  }
  $('cardForm').addEventListener('submit', function (e) { e.preventDefault(); search($('cardName').value); });
  $('cardOut').addEventListener('click', function (e) {
    var i = e.target.getAttribute('data-i'); if (i === null) return;
    var c = cards[+i]; if (!c) return;
    $('cardBig').innerHTML = '<img src="' + PK.esc(c.images.large || c.images.small) + '" alt="' + PK.esc(c.name) + ' card, large" style="width:100%;border-radius:14px"><h3>' + PK.esc(c.name) + '</h3><p>' + PK.esc(c.set ? c.set.name : '') + '</p>';
    $('cardModal').classList.remove('hidden');
  });
  $('cardClose').addEventListener('click', function () { $('cardModal').classList.add('hidden'); });
  $('cardModal').addEventListener('click', function (e) { if (e.target === $('cardModal')) $('cardModal').classList.add('hidden'); });
  var pre = PK.qs('name');
  if (pre) { $('cardName').value = pre; search(pre); document.getElementById('finder').scrollIntoView(); }
  window.__cardsBuildUrl = buildUrl;
})();
