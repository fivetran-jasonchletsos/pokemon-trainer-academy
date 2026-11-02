/* Shared helpers: navigation, footer, PokeAPI access with caching. */
(function () {
  'use strict';
  var API = 'https://pokeapi.co/api/v2';
  var ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

  var TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
  var TYPE_COLORS = { normal: '#9a9a78', fire: '#ee7f30', water: '#5b8fee', electric: '#e0b50f', grass: '#5fb83a', ice: '#6fc9c9', fighting: '#c03028', poison: '#a040a0', ground: '#c9a84a', flying: '#8f7fe0', psychic: '#f85888', bug: '#98ab18', rock: '#a8902c', ghost: '#705898', dragon: '#6f35fc', dark: '#705848', steel: '#8a8aa8', fairy: '#e87ba7' };
  var GENS = [
    { n: 1, region: 'Kanto', from: 1, to: 151 }, { n: 2, region: 'Johto', from: 152, to: 251 },
    { n: 3, region: 'Hoenn', from: 252, to: 386 }, { n: 4, region: 'Sinnoh', from: 387, to: 493 },
    { n: 5, region: 'Unova', from: 494, to: 649 }, { n: 6, region: 'Kalos', from: 650, to: 721 },
    { n: 7, region: 'Alola', from: 722, to: 809 }, { n: 8, region: 'Galar', from: 810, to: 905 },
    { n: 9, region: 'Paldea', from: 906, to: 1025 }
  ];
  var COLORS = ['red', 'blue', 'yellow', 'green', 'black', 'brown', 'gray', 'pink', 'purple', 'white'];
  var SHAPES = { ball: 'Round ball', squiggle: 'Long and wiggly', fish: 'Fish-like', arms: 'Head and arms', blob: 'Blob', upright: 'Upright with a tail', legs: 'Head and legs', quadruped: 'Four legs', wings: 'Wings', tentacles: 'Tentacles', heads: 'Many heads', humanoid: 'Like a person', 'bug-wings': 'Bug with wings', armor: 'Armored body' };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var KEEP_HYPHEN = ['ho-oh', 'porygon-z', 'jangmo-o', 'hakamo-o', 'kommo-o', 'wo-chien', 'chien-pao', 'ting-lu', 'chi-yu'];
  function cap(name) {
    if (!name) return '';
    var sep = KEEP_HYPHEN.indexOf(name) >= 0 ? '-' : ' ';
    return name.split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(sep);
  }
  function art(id) { return ART + id + '.png'; }
  function pad(n) { return '#' + String(n).padStart(4, '0'); }
  function idFromUrl(u) { var m = /\/(\d+)\/?$/.exec(u); return m ? +m[1] : 0; }
  function typeBadge(t) { return '<span class="badge" style="background:' + (TYPE_COLORS[t] || '#777') + '">' + esc(t) + '</span>'; }
  function img(id, alt, cls) { return '<img ' + (cls ? 'class="' + cls + '" ' : '') + 'src="' + art(id) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" onerror="this.style.opacity=.25">'; }
  function loading(msg) { return '<div class="center"><div class="spinner" role="status"></div><p>' + esc(msg || 'Loading, one moment...') + '</p></div>'; }
  function errorBox(msg, retryId) {
    return '<div class="notice err" role="alert"><b>Oh no, a wild problem appeared!</b><br>' + esc(msg || 'We could not reach the Pokemon library right now.') +
      '<br>Check that you are online, then try again. If it keeps happening, ask a grown-up to help.' +
      (retryId ? '<br><button class="btn sm red" id="' + retryId + '" type="button" style="margin-top:10px">Try again</button>' : '') + '</div>';
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- fetching and caching ---------- */
  var mem = {}, inflight = {};
  function fetchJson(url, tries, timeoutMs) {
    tries = tries || 2; timeoutMs = timeoutMs || 20000;
    var attempt = function (i) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs) : null;
      return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
        if (timer) clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).catch(function (e) {
        if (timer) clearTimeout(timer);
        if (i + 1 >= tries) throw e;
        return sleep(600).then(function () { return attempt(i + 1); });
      });
    };
    return attempt(0);
  }
  function store(key, val) {
    var s = JSON.stringify(val), k = 'pk1:' + key;
    try { localStorage.setItem(k, s); } catch (e) {
      try {
        Object.keys(localStorage).filter(function (x) { return x.indexOf('pk1:pokemon/') === 0 || x.indexOf('pk1:species/') === 0; }).slice(0, 80).forEach(function (x) { localStorage.removeItem(x); });
        localStorage.setItem(k, s);
      } catch (e2) { /* storage full or blocked: memory cache only */ }
    }
  }
  function cached(key, producer) {
    if (mem[key]) return Promise.resolve(mem[key]);
    if (inflight[key]) return inflight[key];
    try { var s = localStorage.getItem('pk1:' + key); if (s) { mem[key] = JSON.parse(s); return Promise.resolve(mem[key]); } } catch (e) { /* ignore */ }
    inflight[key] = producer().then(function (v) { mem[key] = v; store(key, v); delete inflight[key]; return v; }, function (e) { delete inflight[key]; throw e; });
    return inflight[key];
  }

  /* ---------- parsers (pure, testable) ---------- */
  function parsePokemon(d) {
    return {
      id: d.id, name: d.name, height: d.height, weight: d.weight,
      types: d.types.slice().sort(function (a, b) { return a.slot - b.slot; }).map(function (t) { return t.type.name; }),
      stats: d.stats.map(function (s) { return { name: s.stat.name, v: s.base_stat }; }),
      abilities: d.abilities.map(function (a) { return { name: a.ability.name, hidden: a.is_hidden }; })
    };
  }
  function cleanText(t) { return t.replace(/[\n\f\r]+/g, ' ').replace(/é/g, 'e').replace(/\s+/g, ' ').trim(); }
  function parseSpecies(d) {
    var seen = {}, flavor = [];
    (d.flavor_text_entries || []).forEach(function (e) {
      if (e.language.name !== 'en') return;
      var t = cleanText(e.flavor_text);
      if (t && !seen[t.toLowerCase()]) { seen[t.toLowerCase()] = 1; flavor.push(t); }
    });
    var g = (d.genera || []).filter(function (x) { return x.language.name === 'en'; })[0];
    return {
      id: d.id, name: d.name, flavor: flavor.slice(-12), genus: g ? cleanText(g.genus) : '',
      color: d.color ? d.color.name : '', shape: d.shape ? d.shape.name : '',
      evo: d.evolution_chain ? idFromUrl(d.evolution_chain.url) : 0
    };
  }
  function evoHow(details) {
    if (!details || !details.length) return '';
    var d = details[0], bits = [];
    if (d.min_level) bits.push('Level ' + d.min_level);
    if (d.item) bits.push('Use ' + cap(d.item.name));
    if (d.trigger && d.trigger.name === 'trade') bits.push('Trade');
    if (d.min_happiness) bits.push('Friendship');
    if (d.known_move) bits.push('Knows ' + cap(d.known_move.name));
    if (d.location) bits.push('Special place');
    if (d.time_of_day) bits.push(cap(d.time_of_day));
    if (!bits.length && d.trigger && d.trigger.name !== 'level-up') bits.push(cap(d.trigger.name));
    return bits.join(', ');
  }
  function parseEvo(d) {
    function node(n, how) {
      return { name: n.species.name, id: idFromUrl(n.species.url), how: how, kids: n.evolves_to.map(function (k) { return node(k, evoHow(k.evolution_details)); }) };
    }
    return node(d.chain, '');
  }
  function parseType(d) {
    var r = d.damage_relations, nm = function (a) { return a.map(function (x) { return x.name; }); };
    return {
      name: d.name, ddTo: nm(r.double_damage_to), hdTo: nm(r.half_damage_to), ndTo: nm(r.no_damage_to),
      ddFrom: nm(r.double_damage_from), hdFrom: nm(r.half_damage_from), ndFrom: nm(r.no_damage_from),
      ids: d.pokemon.map(function (p) { return idFromUrl(p.pokemon.url); }).filter(function (i) { return i > 0 && i < 10000; })
    };
  }
  function parseIds(d) { return (d.pokemon_species || []).map(function (s) { return idFromUrl(s.url); }); }

  /* ---------- API ---------- */
  var PK = {
    API: API, TYPES: TYPES, TYPE_COLORS: TYPE_COLORS, GENS: GENS, COLORS: COLORS, SHAPES: SHAPES,
    esc: esc, cap: cap, art: art, pad: pad, idFromUrl: idFromUrl, typeBadge: typeBadge, img: img, loading: loading, errorBox: errorBox, sleep: sleep,
    parsePokemon: parsePokemon, parseSpecies: parseSpecies, parseEvo: parseEvo, parseType: parseType, parseIds: parseIds, fetchJson: fetchJson,
    list: function () {
      return cached('species-list', function () {
        return fetchJson(API + '/pokemon-species?limit=2000').then(function (d) {
          return d.results.map(function (r) { return { id: idFromUrl(r.url), name: r.name }; }).sort(function (a, b) { return a.id - b.id; });
        });
      });
    },
    pokemon: function (id) { return cached('pokemon/' + id, function () { return fetchJson(API + '/pokemon/' + id).then(parsePokemon); }); },
    species: function (id) { return cached('species/' + id, function () { return fetchJson(API + '/pokemon-species/' + id).then(parseSpecies); }); },
    evo: function (id) { return cached('evo/' + id, function () { return fetchJson(API + '/evolution-chain/' + id).then(parseEvo); }); },
    type: function (name) { return cached('type/' + name, function () { return fetchJson(API + '/type/' + name).then(parseType); }); },
    allTypes: function () {
      return Promise.all(TYPES.map(function (t) { return PK.type(t); })).then(function (arr) { var m = {}; arr.forEach(function (t) { m[t.name] = t; }); return m; });
    },
    gen: function (n) { return cached('gen/' + n, function () { return fetchJson(API + '/generation/' + n).then(parseIds); }); },
    color: function (c) { return cached('color/' + c, function () { return fetchJson(API + '/pokemon-color/' + c).then(parseIds); }); },
    shape: function (s) { return cached('shape/' + s, function () { return fetchJson(API + '/pokemon-shape/' + s).then(parseIds); }); },
    /* damage multiplier of an attacking type against a list of defending types */
    mult: function (types, att, defs) {
      var a = types[att], m = 1;
      defs.forEach(function (d) {
        if (a.ddTo.indexOf(d) >= 0) m *= 2; else if (a.hdTo.indexOf(d) >= 0) m *= 0.5; else if (a.ndTo.indexOf(d) >= 0) m *= 0;
      });
      return m;
    },
    store: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    load: function (k, d) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch (e) { return d; } },
    qs: function (k) { return new URLSearchParams(location.search).get(k); },
    flavorFor: function (sp, i) { return sp.flavor.length ? sp.flavor[((i % sp.flavor.length) + sp.flavor.length) % sp.flavor.length] : 'This Pokemon is still a mystery. Go explore!'; }
  };
  window.PK = PK;

  /* ---------- header and footer ---------- */
  var MAIN = [['index.html', 'Home'], ['pokedex.html', 'Pokedex'], ['quiz.html', 'Quizzes'], ['cards.html', 'Card Guide'], ['how-to-play.html', 'How to Play'], ['types.html', 'Type Chart']];
  var MORE = [['games.html', 'Video Games'], ['tips.html', 'Trainer Tips'], ['team.html', 'Dream Team'], ['trainer-card.html', 'Trainer ID'], ['glossary.html', 'Glossary']];
  function buildChrome() {
    var cur = location.pathname.split('/').pop() || 'index.html';
    var li = function (p) { return '<li><a href="' + p[0] + '"' + (p[0] === cur ? ' class="active" aria-current="page"' : '') + '>' + p[1] + '</a></li>'; };
    var moreActive = MORE.some(function (p) { return p[0] === cur; });
    var h = document.getElementById('site-header');
    if (h) {
      h.className = 'site-header';
      h.innerHTML = '<div class="nav-in"><a class="brand" href="index.html"><span class="ball"></span>Trainer Academy</a>' +
        '<button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="navLinks">Menu</button>' +
        '<ul class="nav-links" id="navLinks">' + MAIN.map(li).join('') +
        '<li class="has-more"><button class="more-btn' + (moreActive ? ' active' : '') + '" id="moreBtn" type="button" aria-expanded="false">More</button><ul class="more-menu">' + MORE.map(li).join('') + '</ul></li></ul></div>';
      var btn = document.getElementById('menuBtn'), nav = document.getElementById('navLinks'), mb = document.getElementById('moreBtn');
      btn.addEventListener('click', function () { var o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
      mb.addEventListener('click', function (e) { e.stopPropagation(); var p = mb.parentNode, o = p.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });
      document.addEventListener('click', function () { mb.parentNode.classList.remove('open'); });
    }
    var f = document.getElementById('site-footer');
    if (f) {
      f.className = 'site-footer';
      f.innerHTML = '<p>Made with love for young trainers by Aunt Amanda. Unofficial fan site, not affiliated with Nintendo, Game Freak, Creatures, or The Pokemon Company.</p>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildChrome); else buildChrome();
})();
