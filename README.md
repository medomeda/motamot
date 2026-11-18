# Mot à mot

Jeu de chaînes de mots : on passe d'un mot à un autre en changeant **une lettre à la fois**
(CHAT → CHAR → CHER → CHEF). Chaque étape doit être un vrai mot.

## Modes de jeu

| Mode | Hors ligne ? | Description |
|---|---|---|
| **Parcours** | ✅ | 5 mondes, 30 niveaux, jusqu'à 3 ⭐ par niveau (indices, annulation). Un niveau rejoué reçoit de nouveaux mots au hasard, pour ne pas apprendre les réponses par cœur |
| **Défi du jour** | ✅ | Même défi pour tout le monde chaque jour, série de jours consécutifs |
| **Défi libre** | ✅ | Départ/arrivée au hasard, longueur et distance au choix |
| **Duel contre l'ordinateur** | ✅ | 3 niveaux (facile, moyen, difficile) |
| **Duel à 2 sur le même écran** | ✅ | Tour par tour, mots imposés ou choisis par les joueurs |
| **Duel en ligne** | ❌ (internet requis) | Salon avec un code à 4 lettres, connexion directe entre les deux appareils |

Pour apprendre : définitions et anecdotes (≈ 270 mots hors ligne, les autres via Wiktionnaire quand on est connecté),
« Mot du jour », carnet des mots découverts, succès et titres.

## Lancer le jeu

Le jeu est 100 % statique (HTML / CSS / JS, sans dépendance à installer).

```bash
cd motamot
python3 -m http.server 8000      # puis ouvrir http://localhost:8000
```

Ouvrir `index.html` directement fonctionne aussi, mais **le mode hors ligne et l'installation** ne sont actifs
que lorsque le jeu est servi en `http://localhost` ou en `https://`.

### Publier (gratuit)

Déposer le dossier tel quel sur GitHub Pages, Netlify, Cloudflare Pages… (HTTPS fourni).
Les joueurs peuvent alors **installer** l'application depuis leur navigateur (« Ajouter à l'écran d'accueil »)
et y jouer sans connexion. À chaque publication, **changer `APP_VERSION` dans `js/version.js`** (seul endroit à modifier) : le numéro s'affiche dans le jeu
(accueil et réglages) et les joueurs voient une bannière « Nouvelle version disponible » avec un bouton **Mettre à jour**.

## Organisation

```
index.html            page unique
css/style.css         styles (thème clair/sombre automatique)
js/words.js           dictionnaire (généré)
js/engine.js          dictionnaire, chemins, défis reproductibles, IA
js/learn.js           définitions, anecdotes, Wiktionnaire
js/store.js           sauvegarde locale, succès, titres
js/fx.js              sons synthétisés, musique, vibrations, confettis
js/online.js          duel en ligne (PeerJS / WebRTC)
js/app.js             écrans et modes de jeu
sw.js, manifest.*     mode hors ligne et installation
tools/build-words.py  régénère js/words.js depuis le prototype d'origine
```

## À savoir

- Le dictionnaire (≈ 34 000 mots) est **sans accents** : on écrit CAFE pour « café ». Les sigles, prénoms, lieux
  et mots vulgaires du prototype ont été retirés.
- Le duel en ligne utilise le service public de mise en relation de PeerJS ; ensuite les coups circulent
  directement d'un joueur à l'autre. Aucun serveur à héberger. Si ce service public est indisponible,
  le jeu l'indique et les autres modes restent utilisables.
- Les données de progression restent sur l'appareil (localStorage) ; rien n'est envoyé nulle part.
# motamot
