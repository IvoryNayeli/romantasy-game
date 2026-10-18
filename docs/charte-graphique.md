Éléments visuels du jeu de cartes romantasy (nuit étoilée, dragons, mystique, féérique, moderne et élégant). Le jeu est conçu **pour smartphone, en portrait d'abord**. Ce document ne décrit que l'apparence : l'architecture, les écrans et les textes sont déjà définis ailleurs. Utiliser les variables du bloc CSS de la section 2 telles quelles, sans en inventer d'autres.

## 1. Principes

1. **Nuit profonde, une seule lumière chaude.** 80 % de bleus nuit, 15 % de clair de lune, 5 % d'ambre. L'ambre signale ce qui compte (rareté, action principale, victoire).
2. **Rectangulaire et doux.** Cartes et boutons rectangulaires, coins légèrement arrondis. Pas de pilules, pas d'arches comme forme de carte.
3. **Lumière, pas ombre.** Profondeur par des halos, jamais d'ombres portées noires.
4. **Lignes fines et beaucoup de vide.** Filets de 1 à 1,5 px.
5. **Féérique, pas informatique.** Grain, brume, étoiles, ornements, lettrines. Éviter l'allure « application » : icônes pleines, aplats vifs, alignements trop rigides.
6. **Le tactile d'abord.** Rien ne dépend du survol. Tout est lisible et utilisable au pouce.

## 2. Variables et styles de base (CSS)

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500&display=swap');

:root {
  /* Couleurs */
  --c-nuit: #060B1E;        /* fond principal, texte sur ambre */
  --c-minuit: #0F1E4A;      /* surfaces, haut des cartes */
  --c-brume: #3C5A8C;       /* bordures communes, halos (jamais en texte) */
  --c-lune: #C9D8EE;        /* texte courant, bordures rares */
  --c-lune-douce: #8FA6C8;  /* texte secondaire */
  --c-etoile: #F4F1E8;      /* titres, étoiles */
  --c-ambre: #F0A35E;       /* accent, légendaire, action principale */
  --c-braise: #D9693A;      /* feu, horizon, alertes */

  /* Typographies */
  --f-titre: 'Cormorant Garamond', Georgia, serif;
  --f-texte: 'Jost', system-ui, sans-serif;

  /* Formes */
  --r-carte: 8px;
  --r-bouton: 4px;
  --r-fenetre: 4px;
  --bordure: 1.5px;
  --filet: 1px;

  /* Lueurs (légères, pour rester fluide sur mobile) */
  --lueur-ambre: 0 0 22px #F0A35E44;
  --lueur-lune: 0 0 14px #C9D8EE44;
  --lueur-brume: 0 0 8px #3C5A8C44;

  /* Mouvement */
  --t-rapide: 300ms;
  --t-lent: 600ms;
  --ease: cubic-bezier(.25,.1,.25,1);

  /* Espacements et zones tactiles */
  --cible: 48px;            /* hauteur minimale de tout élément cliquable */
  --marge: 16px;           /* marge latérale d'écran */
  --haut: env(safe-area-inset-top, 0px);
  --bas: env(safe-area-inset-bottom, 0px);
}

html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  min-height: 100dvh;
  padding: var(--haut) var(--marge) var(--bas);
  box-sizing: border-box;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Fond de page : étoiles + halo bleu en haut à droite + lueur de braise en bas */
.ciel {
  background:
    radial-gradient(circle at 6% 8%,  var(--c-etoile) 0 1px,   transparent 2px),
    radial-gradient(circle at 17% 86%, var(--c-etoile) 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 29% 5%,  var(--c-lune) 0 1px,   transparent 2px),
    radial-gradient(circle at 41% 94%, var(--c-etoile) 0 1px,   transparent 2px),
    radial-gradient(circle at 52% 10%, var(--c-etoile) 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 64% 92%, var(--c-lune) 0 1px,   transparent 2px),
    radial-gradient(circle at 74% 6%,  var(--c-etoile) 0 1px,   transparent 2px),
    radial-gradient(circle at 86% 90%, var(--c-etoile) 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 93% 14%, var(--c-lune) 0 1px,   transparent 2px),
    radial-gradient(ellipse at 85% 0%, #3C5A8C55, transparent 50%),
    radial-gradient(ellipse at 50% 110%, #D9693A33, transparent 55%),
    var(--c-nuit);
  color: var(--c-lune);
  font-family: var(--f-texte);
  font-size: 15px;
  line-height: 1.5;
}

/* Scintillement des étoiles (éléments .etoile séparés, optionnel). Seulement opacity. */
@keyframes scintille { 0%,100% {opacity:.35} 50% {opacity:1} }
.etoile { animation: scintille 5s var(--ease) infinite; }
.etoile:nth-child(2n) { animation-duration: 7s; animation-delay: -2s; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition-duration: 1ms !important; }
}
```

## 3. Couleurs

| Variable | Hex | Usage |
|---|---|---|
| `--c-nuit` | `#060B1E` | Fond principal, texte sur ambre |
| `--c-minuit` | `#0F1E4A` | Surfaces, haut des cartes |
| `--c-brume` | `#3C5A8C` | Bordures cartes communes, halos. **Jamais en texte** |
| `--c-lune` | `#C9D8EE` | Texte courant, bordures rares |
| `--c-lune-douce` | `#8FA6C8` | Texte secondaire |
| `--c-etoile` | `#F4F1E8` | Titres, étoiles |
| `--c-ambre` | `#F0A35E` | Accent, légendaire, action principale |
| `--c-braise` | `#D9693A` | Feu, horizon, alertes |

- Dégradé « horizon » (rare, surtout illustrations de dragons) : `linear-gradient(180deg, #0F1E4A 45%, #D9693A 88%, #F0A35E)`.
- Interdits : violets, roses, verts vifs, blanc `#FFF` et noir `#000` purs.

## 4. Typographie (tailles adaptées au smartphone)

- **Titres, noms de cartes, citations** : `--f-titre` (Cormorant Garamond 500/600). Titres d'écran 32–40 px. Noms de cartes en *italique* 500. Logo en capitales, interlettrage `.18em`.
- **Interface et texte** : `--f-texte` (Jost 300/400/500).
- Texte courant : **15–16 px minimum**. Légendes et types : 12 px minimum, capitales, interlettrage `.25em` à `.3em`. Boutons : 14 px, capitales, `.2em`.
- **Lettrine** : première lettre du texte d'une carte en `--f-titre` 600, flottante à gauche, sur 2 lignes, couleur de rareté.
- Lignes de 40 à 60 caractères maximum. Pas de texte justifié.

## 5. Formes et ornements

- Rayons : carte 8 px, bouton 4 px, fenêtre d'illustration 4 px. Le cercle sert uniquement au badge de coût.
- Bordure extérieure 1,5 px ; **double filet** : second contour de 1 px, à 5 px à l'intérieur, couleur de rareté à 33 % d'opacité.
- **Étincelle à 4 branches** (puces, coins, séparateurs), 10×10, `fill="currentColor"` :

```html
<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0Q5.5 4.5 10 5Q5.5 5.5 5 10Q4.5 5.5 0 5Q4.5 4.5 5 0Z" fill="currentColor"/></svg>
```

- **Séparateur filigrane** (150×12, `currentColor`) :

```html
<svg width="150" height="12" viewBox="0 0 150 12" aria-hidden="true"><path d="M4 6C30 6 40 1 62 6M88 6C110 11 120 6 146 6" fill="none" stroke="currentColor"/><path d="M75 0Q76 5 81 6Q76 7 75 12Q74 7 69 6Q74 5 75 0Z" fill="currentColor"/></svg>
```

- Croissant : badges et séparateurs. Volute : coins et filigranes. Arche ogivale : décor uniquement (dos de carte, fonds), jamais forme de carte.
- **Logo** : cercle fin clair de lune contenant un disque bleu minuit, avec une aile de dragon sombre bordée d'ambre et une petite étoile. Texte du nom en capitales espacées `.18em`, sous-titre en ambre `.42em`. Sur mobile : version compacte (symbole seul, 40 px) dans les barres, version complète sur l'écran d'accueil.

## 6. Cartes

**Proportions fixes 2:3.** Toute la carte se dessine à partir de sa propre largeur pour s'adapter aux écrans. Déclarer `container-type: inline-size` sur la carte et exprimer tout en `cqw` (valeurs calculées sur une carte de référence de 230 px).

```css
.carte {
  container-type: inline-size;
  aspect-ratio: 2 / 3;
  position: relative;
  box-sizing: border-box;
  border: var(--bordure) solid var(--rarete);
  border-radius: var(--r-carte);
  background: linear-gradient(180deg, var(--c-minuit), var(--c-nuit));
  box-shadow: var(--lueur);            /* défini par la rareté */
  padding: 6cqw;
  display: flex; flex-direction: column; gap: 4cqw;
}
.carte::before {                         /* double filet */
  content: ""; position: absolute; inset: 2.2cqw; pointer-events: none;
  border: 1px solid color-mix(in srgb, var(--rarete) 33%, transparent);
  border-radius: 4px;
}
.carte .nom { font: italic 500 8.7cqw var(--f-titre); color: var(--c-etoile); }
.carte .cout { width: 10.5cqw; height: 10.5cqw; border: 1px solid var(--rarete); border-radius: 50%;
  font: 600 5.2cqw var(--f-titre); color: var(--rarete); display: grid; place-items: center; }
.carte .fenetre { flex: none; height: 43%; position: relative; overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--rarete) 53%, transparent); border-radius: var(--r-fenetre); }
.carte .fenetre::after { content: ""; position: absolute; inset: auto 0 0 0; height: 40%;
  background: linear-gradient(transparent, #3C5A8CCC); }       /* voile de brume */
.carte .type { font: 500 4.3cqw var(--f-texte); letter-spacing: .3em; text-align: center; color: var(--rarete); text-transform: uppercase; }
.carte .texte { font: 400 5.4cqw/1.5 var(--f-texte); color: var(--c-lune); }
.carte .texte::first-letter { font: 600 14.8cqw/0.85 var(--f-titre); color: var(--rarete); float: left; padding: .5cqw 2.6cqw 0 0; }

.carte.commune    { --rarete: var(--c-brume);  --lueur: var(--lueur-brume); }
.carte.rare       { --rarete: var(--c-lune);   --lueur: var(--lueur-lune); }
.carte.legendaire { --rarete: var(--c-ambre);  --lueur: var(--lueur-ambre); }
```

Structure de haut en bas : en-tête (badge de coût en chiffre romain + nom), fenêtre d'illustration avec voile de brume, ligne de type `TYPE · RARETÉ`, séparateur filigrane, texte avec lettrine. Quatre étincelles de 10 px (≈ 4,3cqw) dans les coins, à 3,5cqw des bords.

**Tailles à l'écran (portrait, 360 à 430 px de large)**

| Contexte | Largeur de carte | Contenu affiché |
|---|---|---|
| Grille / collection | `calc((100vw - 3 * var(--marge)) / 2)`, soit 2 colonnes | En-tête, illustration, type. Texte masqué si la carte fait moins de 150 px |
| Main de jeu (éventail ou défilement horizontal) | 96–110 px, chevauchement de 30 % | Nom, coût, illustration |
| Carte zoomée (appui prolongé ou double appui) | `min(86vw, 340px)`, centrée sur fond assombri | Tout, texte à 5,4cqw (≥ 15 px) |
| Dos de carte | Mêmes proportions | Voir ci-dessous |

Règle : si le texte d'une carte devient inférieur à 12 px à l'écran, il est masqué et accessible au zoom. Ne jamais afficher de texte illisible.

| Rareté | Bordure et accents | Lueur |
|---|---|---|
| Commune | `--c-brume` | `--lueur-brume` |
| Rare | `--c-lune` | `--lueur-lune` |
| Légendaire | `--c-ambre` | `--lueur-ambre`, pulsation très lente |

**Dos de carte** : fond `radial-gradient(circle at 50% 45%, #3C5A8C66, #060B1E 70%)`, bordure ambre, double filet ambre + filet clair de lune à 6cqw du bord, étincelles aux coins, logo (lune + aile) centré à 52 % de la largeur.

## 7. Boutons, panneaux et navigation

- **Bouton principal** : fond `--c-ambre`, texte `--c-nuit`, Jost 500 14 px capitales `.2em`, **hauteur ≥ 48 px**, largeur pleine ou ≥ 140 px, rayon `--r-bouton`, lueur `0 0 20px #F0A35E55`, double filet : `box-shadow: inset 0 0 0 3px #F0A35E, inset 0 0 0 4px #060B1E66, 0 0 20px #F0A35E55`.
- **Bouton secondaire** : transparent, bordure 1 px `--c-lune`, texte `--c-lune`, double filet : `inset 0 0 0 3px #060B1E, inset 0 0 0 4px #C9D8EE44`.
- **États tactiles** : appui (`:active`) = lueur renforcée et léger enfoncement (`transform: scale(.97)`), 150 ms ; focus clavier = contour 2 px `--c-etoile` décalé de 3 px ; désactivé = opacité 40 %, sans lueur. **Aucun état ne dépend de `:hover`.**
- **Panneaux, fenêtres, feuilles du bas** : fond dégradé minuit → nuit, bordure 1,5 px `--c-brume`, double filet, étincelles aux coins, rayon 8 px en haut pour les feuilles du bas, marge de sécurité `--bas` en bas.
- **Zones d'action principales à portée du pouce** : en bas de l'écran. Espace minimal de 8 px entre deux cibles tactiles.
- Barres de navigation : fond `--c-nuit` à 90 %, filet supérieur 1 px `--c-brume`, icônes au trait fin (1,5 px, pas d'icônes pleines), 24 px dans des cibles de 48 px.

## 8. Fond, grain et brume (performances mobiles)

- Fond de page : classe `.ciel`. Ne pas utiliser `background-attachment: fixed` (saccade sur mobile).
- **Grain** : un seul calque par écran, non interactif, `feTurbulence` à 1 octave pour ménager la batterie. Si les performances baissent, le remplacer par une petite image de grain répétée.

```html
<svg style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:overlay;opacity:.18" aria-hidden="true"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="1" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#grain)"/></svg>
```

- **Brume** : dégradé `#3C5A8C` en bas des illustrations et des écrans, jamais par-dessus du texte.
- Limiter les lueurs (`box-shadow` large) aux cartes visibles ; pas de lueur sur chaque carte d'une longue liste.

## 9. Mouvement

- Étoiles : scintillement lent, 5–7 s, opacité seule.
- Apparition d'une carte : fondu depuis la brume (opacité 0→1, flou 6 px→0), 600 ms.
- Légendaires : lueur ambre qui pulse à peine (opacité 0,7→1, 4 s), uniquement sur les cartes visibles.
- Carte sélectionnée ou posée : soulèvement de 4 px et lueur renforcée, 300 ms.
- Écrans : fondu de 300 ms, jamais de transition sèche ni de rebond.
- N'animer que `opacity` et `transform`. Désactiver tout mouvement si `prefers-reduced-motion`. Retour haptique léger possible à la pose d'une carte.

## 10. Illustrations (brief de génération)

Silhouette noire de dragon à contre-jour, ailes déployées, perché sur un rocher ou en vol devant une grande lune pâle, ciel étoilé bleu nuit, nuages éclairés d'orange ambre à l'horizon, forêt de sapins et montagnes en silhouette. Palette limitée à celle de la charte. Style peint, atmosphérique, sans texte ni visage détaillé.
Formats : fenêtre de carte **paysage 4:3** (livrer en 800×600 minimum), plein écran **portrait 9:19,5** (1170×2532) pour les fonds d'accueil. Composition lisible en petit : sujet centré, silhouette nette, contraste fort. Poids maximum conseillé : 150 Ko par image, en WebP.

## 11. Accessibilité

- Texte courant en `--c-lune` ou `--c-etoile` ; `--c-lune-douce` pour le secondaire seulement (≥ 12 px).
- La rareté ne se code jamais par la couleur seule : elle apparaît aussi dans le texte (« · RARE ») et dans la lueur.
- Vrais éléments `<button>`, `<a>`, `<label>`. Ornements en `aria-hidden="true"`. Logo en `role="img"` avec `aria-label`.
- Prévoir un texte alternatif pour chaque illustration de carte.
- Respecter le zoom du système (tailles en `rem` quand c'est possible hors cartes).

## 12. À ne pas faire

Cartes ou boutons en pilule ou en arche · ombres portées noires · icônes pleines type application · violets ou roses · texte en `--c-brume` · effets au survol · cibles tactiles < 44 px · texte de carte < 12 px à l'écran · animations rapides ou rebondissantes · fond fixe ou grain multiple (lenteur sur mobile) · noir ou blanc purs.