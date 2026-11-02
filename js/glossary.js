(function () {
  var T = [
    ['Ability', 'A special power some Pokemon have, in both the video games and the card game.'],
    ['Active Pokemon', 'The Pokemon at the front that attacks and gets attacked. You have one Active Pokemon at a time.'],
    ['Asleep', 'A special condition. The Pokemon cannot attack or retreat until it wakes up.'],
    ['Basic Pokemon', 'A Pokemon card you can play straight from your hand. It does not need to evolve from anything.'],
    ['Bench', 'The spot for your waiting Pokemon. It holds up to 5.'],
    ['Burned', 'A special condition that puts damage on the Pokemon at each Pokemon Checkup.'],
    ['Confused', 'A special condition. When the Pokemon attacks, you flip a coin and it might hurt itself.'],
    ['Damage counter', 'A marker that stands for 10 damage on a Pokemon.'],
    ['Deck', 'Your 60 cards for the trading card game.'],
    ['Discard pile', 'Where used cards and Knocked Out Pokemon go.'],
    ['Energy', 'Cards you attach to Pokemon to pay for their attacks.'],
    ['Evolve', 'When a Pokemon changes into a stronger form. In the card game, you play the next stage on top of it.'],
    ['Generation', 'A group of Pokemon games and the new Pokemon introduced in them.'],
    ['Gym', 'A place in the video games where a strong trainer called a Gym Leader tests you.'],
    ['Holo', 'Short for holographic. A shiny, sparkly card picture.'],
    ['HP', 'Hit Points. How much damage a Pokemon can take before being Knocked Out.'],
    ['Item', 'A kind of Trainer card. You can play as many as you want each turn.'],
    ['Knock Out', 'When a Pokemon has damage equal to or more than its HP. The other player takes a Prize card.'],
    ['Mulligan', 'When you have no Basic Pokemon in your starting hand, so you show your hand and draw a new one.'],
    ['Paralyzed', 'A special condition. The Pokemon cannot attack or retreat.'],
    ['Poisoned', 'A special condition that puts damage on the Pokemon at each Pokemon Checkup.'],
    ['Pokemon Checkup', 'The step between turns where special conditions are checked.'],
    ['Pokedex', 'A guide to all the Pokemon, like the one on this website.'],
    ['Prize cards', 'Six face-down cards you set aside at the start. Take them all to win.'],
    ['Rarity', 'How hard a card is to find in a pack. The symbol is near the set number.'],
    ['Resistance', 'A type a Pokemon takes less damage from.'],
    ['Retreat', 'Swapping your Active Pokemon with one from the Bench by discarding Energy.'],
    ['Stadium', 'A Trainer card that stays in play and affects both players. One per turn.'],
    ['Stage 1 and Stage 2', 'Evolved Pokemon cards. Stage 1 evolves from a Basic. Stage 2 evolves from a Stage 1.'],
    ['Starter Pokemon', 'The first Pokemon you choose in a video game, a Grass, Fire, or Water type.'],
    ['Super effective', 'An attack of a type that does double damage to the other Pokemon.'],
    ['Supporter', 'A Trainer card for powerful help. You can play only one each turn.'],
    ['Tera', 'A power in Scarlet and Violet where a Pokemon takes on a crystal form and its type can change.'],
    ['Trainer', 'A person who catches and battles with Pokemon. That is you! Trainer is also a kind of card.'],
    ['Type', 'A Pokemon\'s element, like Fire or Water. Types decide who is strong or weak against whom.'],
    ['Weakness', 'A type a Pokemon takes extra damage from.']
  ];
  var gl = document.getElementById('gl');
  function draw() {
    var q = document.getElementById('gq').value.trim().toLowerCase();
    var r = T.filter(function (t) { return !q || t[0].toLowerCase().indexOf(q) >= 0 || t[1].toLowerCase().indexOf(q) >= 0; });
    gl.innerHTML = r.length ? r.map(function (t) { return '<dt>' + t[0] + '</dt><dd>' + t[1] + '</dd>'; }).join('') : '<p>No words found. Try something else!</p>';
  }
  document.getElementById('gq').addEventListener('input', draw);
  draw();
})();
