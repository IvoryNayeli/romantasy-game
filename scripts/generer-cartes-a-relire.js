#!/usr/bin/env node
// Génère docs/cartes-a-relire.md à partir de public/data/cartes.json.
// Usage : node scripts/generer-cartes-a-relire.js
// Aucune dépendance. Le fichier produit ne doit pas être modifié à la main.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const FICHIER_CARTES = path.join(RACINE, 'public', 'data', 'cartes.json');
const FICHIER_SORTIE = path.join(RACINE, 'docs', 'cartes-a-relire.md');

const TYPES = [
  { type: 'revelation', titre: 'Révélations', prefixe: 'rev' },
  { type: 'epreuve', titre: 'Épreuves', prefixe: 'epr' },
];

const DUREES = {
  prochain_tour: "jusqu'à son prochain tour",
  fin_partie: "jusqu'à la fin de la partie",
};

function echapper(texte) {
  return texte.replace(/\|/g, '\\|');
}

function genererTableau(cartes) {
  const lignes = [];
  lignes.push('# Cartes à relire');
  lignes.push('');
  lignes.push(
    '> Fichier **généré** par `scripts/generer-cartes-a-relire.js` à partir de `public/data/cartes.json`. Ne pas le modifier à la main : pour corriger un texte, modifier `docs/cartes-source.md` (sur demande de la propriétaire) puis `cartes.json`, et relancer `node scripts/generer-cartes-a-relire.js`.'
  );
  lignes.push('');
  lignes.push('## Format de `cartes.json`');
  lignes.push('');
  lignes.push('Tableau de 40 cartes, dans l\'ordre de `docs/cartes-source.md`. Chaque carte est un objet :');
  lignes.push('');
  lignes.push('| Champ | Obligatoire | Valeur |');
  lignes.push('|---|---|---|');
  lignes.push('| `id` | oui | `rev-01` à `rev-20` (Révélations), `epr-01` à `epr-20` (Épreuves) |');
  lignes.push('| `type` | oui | `revelation` ou `epreuve` (sans accent) |');
  lignes.push("| `duree` | cartes à effet durable seulement | `prochain_tour` ou `fin_partie` |");
  lignes.push("| `effet` | cartes à effet durable seulement | libellé court du bandeau d'effets |");
  lignes.push('| `texte` | oui | texte de la carte, repris tel quel de `docs/cartes-source.md` |');
  lignes.push('');
  lignes.push('Les champs `duree` et `effet` vont toujours ensemble : les 31 cartes immédiates n\'ont ni l\'un ni l\'autre.');
  lignes.push('');

  for (const { type, titre, prefixe } of TYPES) {
    const duType = cartes.filter((c) => c.type === type);
    lignes.push(`## ${titre} (${duType.length})`);
    lignes.push('');
    lignes.push('| N° | Identifiant | Texte | Effet durable |');
    lignes.push('|---|---|---|---|');
    for (const carte of duType) {
      const numero = Number(carte.id.slice(prefixe.length + 1));
      let durable = '';
      if (carte.duree) {
        durable = `${echapper(carte.effet)} (${DUREES[carte.duree] || carte.duree})`;
      }
      lignes.push(`| ${numero} | \`${carte.id}\` | ${echapper(carte.texte)} | ${durable} |`);
    }
    lignes.push('');
  }

  const nbDurables = cartes.filter((c) => c.duree).length;
  lignes.push(`Cartes à effet durable : ${nbDurables}.`);
  lignes.push('');
  return lignes.join('\n');
}

function main() {
  const cartes = JSON.parse(fs.readFileSync(FICHIER_CARTES, 'utf8'));
  fs.writeFileSync(FICHIER_SORTIE, genererTableau(cartes));
  console.log(`Écrit : ${path.relative(RACINE, FICHIER_SORTIE)} (${cartes.length} cartes)`);
}

if (require.main === module) {
  main();
}

module.exports = { genererTableau, FICHIER_CARTES, FICHIER_SORTIE };
