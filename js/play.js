/* Practice turn tutorial and deck size helper. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var st, i;
  function fresh() {
    return {
      hand: ['Pawmi (Basic)', 'Lightning Energy', 'Lightning Energy', 'Energy Finder (Item)', 'Friendly Coach (Supporter)'],
      active: 'Pichu (Basic)', energy: 0, bench: [], prizes: 6, discard: [],
      foe: { name: 'Pidgey', hp: 60, dmg: 0, ko: false, note: 'Weak to Lightning' }
    };
  }
  function rem(a, x) { var k = a.indexOf(x); if (k >= 0) a.splice(k, 1); }
  var steps = [
    { t: 'Get ready', p: 'Setup is done. You have a Basic Pokemon called Pichu in the Active spot, 6 Prize cards, and 5 cards in your hand. Your opponent has Pidgey, which has 60 HP and is weak to Lightning. It is your turn!', b: 'Start my turn', f: function () {} },
    { t: 'Step 1: Draw a card', p: 'Every turn starts by drawing the top card of your deck. You drew Pikachu, a Stage 1 Pokemon.', b: 'Draw a card', f: function (s) { s.hand.push('Pikachu (Stage 1)'); } },
    { t: 'Bench a Basic Pokemon', p: 'You have a Basic Pokemon in hand called Pawmi. Put it on your Bench. It waits there ready to help later.', b: 'Bench Pawmi', f: function (s) { rem(s.hand, 'Pawmi (Basic)'); s.bench.push('Pawmi'); } },
    { t: 'Evolve Pichu', p: 'Pichu has been in play since the start of the game, so it can evolve. Put Pikachu on top of Pichu. It keeps any damage and Energy.', b: 'Evolve into Pikachu', f: function (s) { rem(s.hand, 'Pikachu (Stage 1)'); s.active = 'Pikachu (Stage 1)'; } },
    { t: 'Attach one Energy', p: 'You may attach one Energy card from your hand each turn. Put a Lightning Energy on your Active Pikachu.', b: 'Attach Lightning Energy', f: function (s) { rem(s.hand, 'Lightning Energy'); s.energy++; } },
    { t: 'Play an Item', p: 'Items are Trainer cards you can play as many times as you like. Energy Finder lets you search your deck for an Energy card. Then it goes to the discard pile.', b: 'Play Energy Finder', f: function (s) { rem(s.hand, 'Energy Finder (Item)'); s.discard.push('Energy Finder'); s.hand.push('Lightning Energy'); } },
    { t: 'Play a Supporter', p: 'You can play only one Supporter each turn. Friendly Coach lets you draw 2 cards.', b: 'Play Friendly Coach', f: function (s) { rem(s.hand, 'Friendly Coach (Supporter)'); s.discard.push('Friendly Coach'); s.hand.push('Cozy Scarf (Tool)', 'Water Energy'); } },
    { t: 'Retreat? Not this time', p: 'You could retreat by discarding Energy to swap your Active Pokemon with a Benched one. Pikachu is doing great, so it stays right where it is.', b: 'Keep Pikachu Active', f: function () {} },
    { t: 'Step 3: Attack!', p: 'Pikachu has the Energy it needs for Thunder Jolt, which does 30 damage. Pidgey is weak to Lightning, so the damage is doubled to 60. That equals its HP! Attacking ends your turn.', b: 'Use Thunder Jolt', f: function (s) { s.foe.dmg = 60; s.foe.ko = true; } },
    { t: 'Knock Out!', p: 'Pidgey has 60 damage on 60 HP, so it is Knocked Out. It goes to the discard pile and you take 1 Prize card. Your opponent must now pick a new Active Pokemon from their Bench.', b: 'Take a Prize card', f: function (s) { s.prizes = 5; s.hand.push('Prize card'); } },
    { t: 'Pokemon Checkup', p: 'Between turns, check for special conditions like Poison or Burn. Nobody has any right now, so nothing happens. Your turn is over, and now it is your opponent\'s turn. You did it!', b: 'End turn', f: function () {} }
  ];
  function mini(a, cls) { return a.length ? a.map(function (x) { return '<span class="mini ' + (cls || '') + '">' + PK.esc(x) + '</span>'; }).join('') : '<span class="muted small">empty</span>'; }
  function draw() {
    var s = st, f = s.foe;
    $('board').innerHTML =
      '<div class="zone"><h4>Opponent Active</h4><span class="mini' + (f.ko ? ' ko' : '') + '">' + f.name + ' (HP ' + f.hp + ', damage ' + f.dmg + ')</span> <span class="small">' + f.note + (f.ko ? ', Knocked Out!' : '') + '</span></div>' +
      '<div class="zone"><h4>Your Active</h4><span class="mini">' + PK.esc(s.active) + '</span>' + (s.energy ? '<span class="mini en2">' + s.energy + ' Lightning Energy attached</span>' : '') + '</div>' +
      '<div class="zone"><h4>Your Bench (up to 5)</h4>' + mini(s.bench) + '</div>' +
      '<div class="zone"><h4>Your hand</h4>' + mini(s.hand, 'tr') + '</div>' +
      '<div class="zone"><h4>Prize cards left: ' + s.prizes + '</h4><span class="small">Discard pile: ' + (s.discard.length ? s.discard.join(', ') : 'empty') + '</span></div>';
    var cur = steps[i];
    $('tutText').innerHTML = '<h3>' + cur.t + '</h3><p>' + cur.p + '</p>';
    $('tutProg').textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
    var last = i === steps.length - 1;
    $('tutBtn').textContent = cur.b;
  }
  var done = false;
  function reset() { st = fresh(); i = 0; done = false; $('tutBtn').disabled = false; draw(); }
  $('tutBtn').addEventListener('click', function () {
    if (done) return;
    steps[i].f(st);
    if (i < steps.length - 1) { i++; draw(); }
    else { done = true; $('tutText').innerHTML = '<h3>Great job, trainer!</h3><p>You drew, benched, evolved, attached Energy, played Trainers, attacked, and took a Prize card. That is a whole turn. Want to try it again?</p>'; $('tutBtn').disabled = true; $('tutProg').textContent = 'Practice complete'; }
  });
  $('tutReset').addEventListener('click', reset);
  reset();

  /* deck helper */
  function deck() {
    var a = Math.max(0, +$('dPoke').value || 0), b = Math.max(0, +$('dTrain').value || 0), c = Math.max(0, +$('dEn').value || 0), tot = a + b + c;
    var w = Math.max(tot, 60);
    $('bPoke').style.width = a / w * 100 + '%'; $('bTrain').style.width = b / w * 100 + '%'; $('bEn').style.width = c / w * 100 + '%';
    $('deckMsg').innerHTML = '<b>' + (tot === 60 ? 'Total: 60 cards. Perfect, that is a full deck!' : tot < 60 ? 'Total: ' + tot + ' cards. You need ' + (60 - tot) + ' more.' : 'Total: ' + tot + ' cards. Take out ' + (tot - 60) + '.') + '</b> Red is Pokemon, blue is Trainers, yellow is Energy.';
  }
  ['dPoke', 'dTrain', 'dEn'].forEach(function (id) { $(id).addEventListener('input', deck); });
  deck();
})();
