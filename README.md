# Trainer Academy

A friendly, unofficial Pokemon fan site for young trainers (roughly ages 6 to 12). It is plain HTML, CSS, and JavaScript with no build step. Open `index.html` or serve the folder with any static host.

## Pages

- Home with Pokemon of the day (same Pokemon all day, chosen by date)
- Pokedex with search, type, generation, and color filters, a "Who is this?" identify helper, and detail views
- Quiz games: silhouette guessing and a type matchup quiz
- Trading Card Guide with an annotated card diagram, rarity symbols, and a Card Finder
- How to Play the Trading Card Game with a practice turn and a deck size helper
- Type Chart, Video Games guide, Trainer Tips, Dream Team builder, printable Trainer ID card, and Glossary

## Data

Live data comes from PokeAPI (https://pokeapi.co) and the Pokemon TCG API (https://pokemontcg.io), fetched in the browser. Trimmed responses are cached in localStorage. Team, ID card, and best streaks are also stored in localStorage.

## Structure

- `css/style.css` shared styles
- `js/common.js` shared navigation, footer, and API helpers
- `js/<page>.js` per-page logic

Unofficial fan site, not affiliated with Nintendo, Game Freak, Creatures, or The Pokemon Company.
