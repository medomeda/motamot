'use strict';
/* Apprentissage : définitions + anecdotes (hors ligne) et Wiktionnaire (en ligne, mis en cache).
   Format : mot sans accent : [définition, anecdote optionnelle, graphie accentuée optionnelle] */
const DEFS = {
  // --- 3 lettres ---
  'ami': ['Personne qu’on aime bien et à qui on peut se confier.'],
  'ane': ['Animal à longues oreilles, proche du cheval, qui fait « hi-han ».', 'Le bonnet d’âne vient des écoles d’autrefois, où l’on coiffait les élèves qui ne savaient pas leur leçon.', 'âne'],
  'arc': ['Arme faite d’une branche souple et d’une corde pour lancer des flèches ; courbe en forme de demi-cercle.'],
  'art': ['Activité qui crée de la beauté ou de l’émotion : peinture, musique, danse…'],
  'axe': ['Ligne autour de laquelle un objet tourne, comme une roue.'],
  'bal': ['Fête où l’on danse.'],
  'bar': ['Lieu où l’on boit des boissons ; poisson de mer (aussi appelé loup) ; unité de pression.'],
  'bec': ['Partie dure de la bouche des oiseaux.'],
  'bus': ['Grand véhicule qui transporte beaucoup de passagers en ville.', '« Bus » vient du latin « omnibus », qui veut dire « pour tous ».'],
  'cap': ['Pointe de terre qui avance dans la mer ; direction suivie par un bateau.'],
  'col': ['Partie du vêtement autour du cou ; passage entre deux montagnes.'],
  'dos': ['Partie arrière du corps, entre la nuque et les fesses.'],
  'duc': ['Titre de noblesse, au-dessus du marquis ; sorte de hibou.'],
  'eau': ['Liquide transparent indispensable à la vie.', 'Le corps humain adulte est composé d’environ 60 % d’eau.'],
  'feu': ['Chaleur et lumière produites par ce qui brûle.'],
  'fil': ['Brin long et fin, fait de fibres, de métal…'],
  'fin': ['Moment où quelque chose s’arrête ; se dit de ce qui est mince.'],
  'jeu': ['Activité qu’on fait pour s’amuser, avec ou sans règles.'],
  'lac': ['Grande étendue d’eau entourée de terre.'],
  'lit': ['Meuble sur lequel on dort ; endroit où coule une rivière.'],
  'loi': ['Règle obligatoire fixée par l’État.'],
  'mer': ['Immense étendue d’eau salée.', 'Les océans et les mers couvrent environ 71 % de la surface de la Terre.'],
  'mot': ['Ensemble de lettres ou de sons qui a un sens.'],
  'mur': ['Paroi verticale d’une maison, d’un jardin…'],
  'nez': ['Partie du visage qui sert à respirer et à sentir.'],
  'nid': ['Abri construit par les oiseaux pour pondre leurs œufs.'],
  'nom': ['Mot qui désigne une personne, un animal ou une chose.'],
  'oui': ['Mot qu’on utilise pour dire d’accord.'],
  'riz': ['Céréale cultivée dans l’eau, base de l’alimentation de la moitié du monde.'],
  'roi': ['Homme qui dirige un royaume.'],
  'rue': ['Voie bordée de maisons dans une ville.'],
  'sac': ['Contenant en tissu, en papier ou en cuir pour transporter des affaires.'],
  'sel': ['Poudre blanche qu’on met dans les plats pour relever le goût.'],
  'sol': ['Surface sur laquelle on marche ; note de musique.'],
  'sud': ['Direction opposée au nord.'],
  'vie': ['Ce qui anime les êtres vivants, de la naissance à la mort.'],
  'vin': ['Boisson faite avec du raisin fermenté.'],
  'vol': ['Déplacement dans les airs ; action de dérober un objet.'],
  // --- 4 lettres ---
  'aile': ['Partie du corps d’un oiseau qui lui permet de voler.'],
  'ange': ['Être céleste, messager de Dieu dans de nombreuses religions.'],
  'arme': ['Objet fait pour attaquer ou se défendre.'],
  'aube': ['Moment où le jour commence à se lever.'],
  'baie': ['Petit fruit rond (framboise, myrtille) ; entrée de mer dans la côte.'],
  'bain': ['Action de se plonger dans l’eau pour se laver ou nager.'],
  'banc': ['Siège long pour plusieurs personnes ; groupe de poissons.'],
  'bebe': ['Enfant très jeune, qui vient de naître.', '', 'bébé'],
  'bete': ['Animal ; personne un peu sotte.', '', 'bête'],
  'bleu': ['Couleur du ciel par beau temps.', 'Le bleu est la couleur préférée de très nombreuses personnes dans le monde.'],
  'bois': ['Matière dure des arbres ; petite forêt.'],
  'cafe': ['Boisson chaude et noire faite avec des graines torréfiées ; lieu où l’on en boit.', 'Selon la légende, un berger éthiopien aurait découvert le café en voyant ses chèvres sautiller après en avoir mangé les baies.', 'café'],
  'camp': ['Lieu où l’on s’installe temporairement, souvent sous la tente ; équipe adverse.'],
  'char': ['Véhicule de guerre blindé ; voiture décorée pour un défilé.'],
  'chat': ['Petit félin domestique qui miaule et ronronne.', 'Les chats passent environ les deux tiers de leur vie à dormir !'],
  'chef': ['Personne qui dirige ; cuisinier en chef.'],
  'cher': ['Qu’on aime beaucoup ; qui coûte beaucoup d’argent.'],
  'chou': ['Légume à grandes feuilles ; petit gâteau rond fourré de crème.'],
  'ciel': ['Espace qu’on voit au-dessus de nous, avec les nuages, le soleil et les étoiles.'],
  'clef': ['Autre façon d’écrire « clé » : objet qui ouvre une serrure.'],
  'club': ['Association de personnes qui partagent une activité.'],
  'coin': ['Angle formé par deux murs ; petit endroit retiré.'],
  'cour': ['Espace découvert entre des bâtiments ; lieu où vit un roi.'],
  'cuir': ['Peau d’animal préparée pour faire des chaussures, des sacs…'],
  'dame': ['Femme adulte ; pièce du jeu d’échecs ou de dames.'],
  'date': ['Indication précise d’un jour, d’un mois et d’une année.'],
  'dent': ['Petit os dur dans la bouche, qui sert à mâcher.'],
  'duel': ['Combat entre deux personnes.'],
  'echo': ['Son qui se répète quand il rebondit sur une paroi.', 'Dans la mythologie grecque, Écho était une nymphe condamnée à répéter la fin des phrases des autres.', 'écho'],
  'epee': ['Arme faite d’une longue lame pointue.', '', 'épée'],
  'etat': ['Manière d’être d’une personne ou d’une chose ; pays organisé.', '', 'état'],
  'exil': ['Obligation de vivre loin de son pays.'],
  'face': ['Côté d’un objet ; visage.'],
  'faim': ['Besoin de manger.'],
  'film': ['Histoire racontée en images animées, au cinéma ou à la télévision.'],
  'foie': ['Organe du corps qui aide à digérer et à nettoyer le sang.'],
  'fond': ['Partie la plus basse d’un récipient ou de la mer.'],
  'fort': ['Qui a de la force ; bâtiment militaire fortifié.'],
  'gare': ['Lieu où l’on prend le train.'],
  'huit': ['Nombre qui vient après sept.'],
  'jupe': ['Vêtement qui part de la taille et descend sur les jambes.'],
  'lait': ['Liquide blanc produit par les mammifères pour nourrir leurs petits.'],
  'lien': ['Ce qui relie deux choses ou deux personnes.'],
  'lieu': ['Endroit précis.'],
  'lire': ['Comprendre ce qui est écrit.', 'Lire un livre fait travailler le cerveau comme un muscle : plus on lit, plus on connaît de mots !'],
  'loup': ['Animal sauvage qui ressemble à un grand chien et hurle en meute.'],
  'lune': ['Astre qui tourne autour de la Terre et brille la nuit.', 'La Lune s’éloigne de la Terre d’environ 3,8 centimètres chaque année.'],
  'main': ['Extrémité du bras, avec cinq doigts.'],
  'mine': ['Trou profond pour extraire des minéraux ; allure du visage ; cœur d’un crayon.'],
  'miel': ['Substance sucrée fabriquée par les abeilles.', 'Pour faire un seul pot de miel, les abeilles parcourent l’équivalent de plusieurs fois le tour de la Terre.'],
  'mode': ['Manière de s’habiller à un moment donné ; façon de faire.'],
  'mont': ['Grande élévation de terrain, une montagne.'],
  'nord': ['Direction vers laquelle pointe l’aiguille d’une boussole.'],
  'note': ['Signe de musique ; petit texte écrit ; évaluation d’un travail.'],
  'nuit': ['Période d’obscurité entre le coucher et le lever du soleil.'],
  'oeil': ['Organe qui permet de voir.', 'Le pluriel d’« œil » est « yeux » : l’un des rares mots dont le pluriel change complètement !', 'œil'],
  'oeuf': ['Ce que pondent les oiseaux, d’où naît un petit.', '', 'œuf'],
  'onde': ['Mouvement qui se propage, comme les ronds dans l’eau.'],
  'page': ['Face d’une feuille de livre ou de cahier.'],
  'pain': ['Aliment fait de farine, d’eau et de levure, cuit au four.', 'En France, la baguette est devenue un symbole national.'],
  'paix': ['Situation sans guerre ni dispute.'],
  'papa': ['Façon affectueuse d’appeler son père.'],
  'parc': ['Grand jardin public ; enclos.'],
  'peau': ['Enveloppe qui recouvre tout le corps.', 'La peau est le plus grand organe du corps humain.'],
  'pere': ['Homme qui a un enfant.', '', 'père'],
  'peur': ['Émotion ressentie face à un danger.'],
  'pied': ['Extrémité de la jambe, sur laquelle on se tient debout.'],
  'plan': ['Dessin d’une maison ou d’une ville vue d’en haut ; projet.'],
  'pont': ['Construction qui permet de franchir une rivière ou une route.'],
  'porc': ['Animal de ferme à la peau rose, aussi appelé cochon.'],
  'port': ['Endroit où les bateaux s’arrêtent ; façon de porter.'],
  'prix': ['Somme à payer pour acheter quelque chose ; récompense.'],
  'race': ['Groupe d’animaux de la même espèce, aux caractères communs.'],
  'robe': ['Vêtement d’une seule pièce pour le haut et le bas du corps.'],
  'rose': ['Fleur parfumée à épines ; couleur entre le rouge et le blanc.'],
  'roue': ['Pièce ronde qui tourne autour d’un axe.', 'La roue est l’une des plus grandes inventions de l’humanité, vieille de plus de 5 000 ans.'],
  'sage': ['Qui est calme et réfléchi ; personne pleine de savoir.'],
  'sang': ['Liquide rouge qui circule dans le corps.'],
  'soie': ['Fil très doux produit par un ver, le ver à soie.', 'Pendant des siècles, les Chinois ont gardé secrète la fabrication de la soie.'],
  'soif': ['Besoin de boire.'],
  'soir': ['Fin de la journée, quand la nuit tombe.'],
  'tour': ['Bâtiment très haut ; mouvement circulaire ; pièce du jeu d’échecs.'],
  'toit': ['Partie supérieure d’une maison, qui protège de la pluie.'],
  'trou': ['Ouverture creusée dans quelque chose.'],
  'vent': ['Air qui se déplace.'],
  'vert': ['Couleur de l’herbe.'],
  'voix': ['Son produit par la bouche quand on parle ou on chante.'],
  'yeux': ['Pluriel d’« œil ».', '', 'yeux'],
  'zero': ['Chiffre qui représente l’absence de quantité.', 'Le zéro a été inventé en Inde, puis transmis à l’Europe par les mathématiciens arabes.', 'zéro'],
  'zone': ['Étendue de terrain ; région aux limites précises.'],
  // --- 5 lettres ---
  'acier': ['Métal très solide, fait de fer et de carbone.'],
  'aigle': ['Grand oiseau de proie aux yeux perçants.'],
  'album': ['Livre de photos ou de dessins ; disque de musique.'],
  'amour': ['Sentiment très fort d’affection pour quelqu’un.'],
  'angle': ['Espace entre deux lignes qui se croisent.'],
  'arbre': ['Grande plante au tronc dur, qui porte des branches et des feuilles.', 'Un grand chêne peut produire en une seule année l’oxygène nécessaire à plusieurs personnes.'],
  'balle': ['Petite boule pour jouer ; projectile d’une arme.'],
  'barbe': ['Poils du menton et des joues.'],
  'blanc': ['Couleur de la neige et du lait.'],
  'boite': ['Récipient fermé par un couvercle.', '', 'boîte'],
  'bombe': ['Engin qui explose ; flacon qui projette un liquide.'],
  'boule': ['Objet rond comme une sphère.'],
  'bruit': ['Ce qu’on entend ; son désagréable ou fort.'],
  'bulle': ['Petite sphère d’air dans un liquide.', 'Les bulles de savon sont rondes parce que cette forme utilise le moins de surface possible.'],
  'cable': ['Gros fil, souvent en métal, qui transporte de l’électricité.', '', 'câble'],
  'canal': ['Rivière creusée par l’homme pour faire passer des bateaux.'],
  'carte': ['Morceau de carton rectangulaire ; dessin d’une région.'],
  'chant': ['Ce qu’on chante ; musique produite par la voix.'],
  'chaud': ['Qui a une température élevée.'],
  'chien': ['Animal domestique, « meilleur ami de l’homme », qui aboie.', 'Un chien peut sentir des odeurs des dizaines de milliers de fois mieux que nous.'],
  'choix': ['Action de choisir entre plusieurs possibilités.'],
  'chute': ['Fait de tomber.'],
  'cible': ['Objet visé pour s’entraîner à tirer.'],
  'coeur': ['Organe qui fait circuler le sang ; siège des sentiments.', 'Le cœur humain bat environ 100 000 fois par jour.', 'cœur'],
  'corde': ['Assemblage de fils tressés, solide et souple.'],
  'crane': ['Os qui protège le cerveau.', '', 'crâne'],
  'creme': ['Partie grasse du lait ; dessert onctueux.', '', 'crème'],
  'croix': ['Signe formé de deux lignes qui se croisent.'],
  'danse': ['Suite de mouvements du corps au rythme de la musique.'],
  'debat': ['Discussion où chacun donne son avis.', '', 'débat'],
  'droit': ['Qui n’est pas courbe ; ce qu’on a le droit de faire.'],
  'ecole': ['Lieu où l’on apprend à lire, écrire et compter.', 'Les premières écoles sont apparues il y a plus de 4 000 ans en Mésopotamie.', 'école'],
  'ecran': ['Surface sur laquelle s’affichent des images.', '', 'écran'],
  'encre': ['Liquide coloré qui sert à écrire ou à imprimer.'],
  'enfer': ['Lieu de tourments, dans certaines religions.'],
  'fleur': ['Partie colorée d’une plante, qui donne ensuite un fruit.'],
  'foret': ['Grande étendue couverte d’arbres.', '', 'forêt'],
  'forme': ['Aspect extérieur d’un objet ; bonne condition physique.'],
  'foule': ['Grand nombre de personnes réunies.'],
  'foyer': ['Endroit où brûle le feu ; maison familiale.'],
  'frein': ['Dispositif qui sert à ralentir ou arrêter un véhicule.'],
  'frere': ['Garçon qui a les mêmes parents que vous.', '', 'frère'],
  'froid': ['Qui a une température basse.'],
  'front': ['Partie du visage au-dessus des yeux.'],
  'fruit': ['Partie de la plante qui contient les graines, souvent sucrée et bonne à manger.'],
  'genou': ['Articulation qui plie la jambe, entre la cuisse et le mollet.'],
  'glace': ['Eau gelée ; dessert froid ; miroir.'],
  'gorge': ['Partie du corps entre la bouche et l’estomac.'],
  'herbe': ['Plante verte qui couvre les prés.'],
  'heure': ['Durée de soixante minutes.'],
  'image': ['Dessin, photo ou reflet qu’on regarde.'],
  'jambe': ['Partie du corps qui va de la hanche au pied.'],
  'jouet': ['Objet fait pour amuser les enfants.'],
  'lampe': ['Appareil qui donne de la lumière.'],
  'lapin': ['Petit animal à longues oreilles qui aime les carottes.'],
  'livre': ['Ensemble de pages reliées ; ancienne unité de poids.', 'Le plus ancien livre imprimé connu date de l’an 868, en Chine.'],
  'magie': ['Art de faire des tours qui semblent impossibles.'],
  'maire': ['Personne qui dirige une commune.'],
  'neige': ['Petits flocons d’eau gelée qui tombent du ciel en hiver.', 'Un flocon de neige est un cristal à six branches, et aucun n’est identique à un autre.'],
  'nuage': ['Masse de gouttelettes d’eau qui flotte dans le ciel.'],
  'ocean': ['Très grande étendue d’eau salée.', 'On a exploré une petite partie seulement des fonds océaniques.', 'océan'],
  'odeur': ['Ce que perçoit le nez.'],
  'ombre': ['Zone sombre là où la lumière est cachée.'],
  'oncle': ['Frère du père ou de la mère.'],
  'orage': ['Tempête avec éclairs, tonnerre et pluie.'],
  'outil': ['Objet qui sert à travailler : marteau, scie…'],
  'place': ['Espace ouvert dans une ville ; endroit où l’on s’assoit.'],
  'plage': ['Bord de mer couvert de sable ou de galets.'],
  'pluie': ['Eau qui tombe du ciel en gouttes.'],
  'plume': ['Élément léger qui recouvre le corps des oiseaux ; ancien outil pour écrire.'],
  'poche': ['Petit sac cousu dans un vêtement.'],
  'pomme': ['Fruit rond, rouge, vert ou jaune, du pommier.', 'Il existe plus de 7 000 variétés de pommes dans le monde.'],
  'porte': ['Panneau qui ferme l’entrée d’une pièce.'],
  'radio': ['Appareil qui diffuse de la musique et des informations.'],
  'rayon': ['Trait de lumière ; planche d’un magasin ; barre d’une roue de vélo.'],
  'reine': ['Femme qui dirige un royaume ; pièce du jeu d’échecs.'],
  'repas': ['Moment où l’on mange.'],
  'sable': ['Poudre faite de petits grains de roche.'],
  'salle': ['Grande pièce d’un bâtiment.'],
  'salon': ['Pièce où l’on reçoit les invités ; grande exposition.'],
  'singe': ['Animal proche de l’homme, qui grimpe aux arbres.'],
  'sucre': ['Substance blanche et douce qui sert à sucrer.'],
  'table': ['Meuble avec un plateau posé sur des pieds.'],
  'tarte': ['Pâtisserie ronde garnie de fruits ou de crème.'],
  'tasse': ['Petit récipient à anse pour boire.'],
  'tigre': ['Grand félin à rayures noires, qui vit en Asie.'],
  'toile': ['Tissu résistant ; tableau peint.'],
  'train': ['Suite de wagons tirés par une locomotive.'],
  'vache': ['Femelle du taureau, qui donne du lait.'],
  'verre': ['Matière transparente et fragile ; récipient pour boire.'],
  'ville': ['Grande agglomération avec beaucoup d’habitants.'],
  // --- 6 lettres ---
  'abbaye': ['Grand monastère où vivent des moines ou des moniales.'],
  'animal': ['Être vivant qui se déplace et se nourrit d’autres êtres vivants.'],
  'argent': ['Métal précieux, gris et brillant ; monnaie qu’on utilise pour payer.'],
  'balcon': ['Plateforme qui dépasse d’un mur, avec une rambarde.'],
  'ballon': ['Grosse balle gonflée d’air pour jouer.'],
  'banane': ['Fruit jaune, long et courbé, qui pousse en régime.'],
  'banque': ['Établissement qui garde l’argent des clients.'],
  'bateau': ['Véhicule qui flotte et se déplace sur l’eau.'],
  'berger': ['Personne qui garde des moutons.'],
  'bureau': ['Table pour écrire ; pièce où l’on travaille.'],
  'cabane': ['Petite construction simple, souvent en bois.'],
  'cadeau': ['Objet qu’on offre à quelqu’un.'],
  'cahier': ['Feuilles de papier reliées, pour écrire.'],
  'camion': ['Grand véhicule qui transporte des marchandises.'],
  'canard': ['Oiseau aquatique qui fait « coin-coin ».'],
  'carnet': ['Petit cahier qu’on garde sur soi.'],
  'carton': ['Papier épais et rigide, qui sert à faire des boîtes.'],
  'casque': ['Coiffure rigide qui protège la tête.'],
  'cheval': ['Grand animal qui galope, qu’on peut monter.'],
  'chemin': ['Voie étroite pour aller d’un endroit à un autre.'],
  'cirque': ['Spectacle avec des clowns, des acrobates et des jongleurs.'],
  'citron': ['Fruit jaune très acide.'],
  'cloche': ['Instrument en métal creux qui sonne quand on le frappe.'],
  'cochon': ['Animal de ferme à la peau rose, aussi appelé porc.'],
  'coffre': ['Grande caisse fermée à clé ; partie arrière d’une voiture.'],
  'crayon': ['Petit bâton pour écrire ou dessiner.'],
  'danger': ['Ce qui peut faire du mal.'],
  'dessin': ['Image tracée avec un crayon ou un pinceau.'],
  'disque': ['Objet plat et rond ; support de musique.'],
  'enfant': ['Garçon ou fille qui n’est pas encore adulte.'],
  'etoile': ['Astre qui brille dans le ciel la nuit.', 'Le Soleil est une étoile : la plus proche de nous.', 'étoile'],
  'fleuve': ['Grand cours d’eau qui se jette dans la mer.'],
  'forcer': ['Obliger quelqu’un ; utiliser sa force.'],
  'gateau': ['Pâtisserie sucrée cuite au four.', '', 'gâteau'],
  'jardin': ['Terrain où l’on cultive des fleurs, des légumes ou des arbres.'],
  'langue': ['Organe de la bouche qui goûte ; système de mots d’un peuple.', 'Il se parle environ 7 000 langues dans le monde.'],
  'lettre': ['Signe de l’alphabet ; message écrit envoyé par la poste.'],
  'maison': ['Bâtiment où l’on habite.'],
  'miroir': ['Surface qui renvoie l’image de ce qu’on place devant.'],
  'moulin': ['Machine qui écrase le grain pour faire de la farine.'],
  'oiseau': ['Animal à plumes et à ailes, qui pond des œufs.'],
  'orange': ['Fruit rond et juteux ; couleur entre le rouge et le jaune.'],
  'papier': ['Matière en feuilles minces, faite de fibres de bois.', 'Le papier a été inventé en Chine il y a près de 2 000 ans.'],
  'pierre': ['Morceau de roche dure.'],
  'poulet': ['Jeune coq ou jeune poule qu’on mange.'],
  'prince': ['Fils d’un roi ou d’une reine.'],
  'rideau': ['Tissu qu’on tire devant une fenêtre ou une scène.'],
  'saison': ['Chacune des quatre périodes de l’année : printemps, été, automne, hiver.'],
  'soleil': ['Étoile qui éclaire et réchauffe la Terre.', 'La lumière du Soleil met environ 8 minutes pour atteindre la Terre.'],
  'souris': ['Petit rongeur qui aime le fromage ; objet pour manipuler un ordinateur.'],
  'tomate': ['Fruit rouge qu’on mange en salade ou en sauce.'],
  'voyage': ['Déplacement vers un lieu éloigné.'],
};

const Learn = (function () {
  const KEY = 'motamot.defs.v1';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { cache = {}; }
  const pending = new Map();
  const miss = new Set();

  function save() {
    try {
      const keys = Object.keys(cache);
      if (keys.length > 400) keys.slice(0, keys.length - 400).forEach(k => delete cache[k]);
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch (e) { /* stockage plein ou indisponible */ }
  }

  function local(w) {
    const e = DEFS[w];
    if (!e) return null;
    return { word: w, def: e[0], fact: e[1] || '', acc: e[2] || w, src: 'local' };
  }

  const POS = /^(Nom commun|Nom propre|Verbe|Adjectif|Adverbe|Préposition|Pronom|Conjonction|Interjection|Nom|Forme de )/;
  const SKIP = /^\(?(pluriel|féminin|masculin|participe|première|deuxième|troisième|forme|variante|synonyme|orthographe)/i;

  function parseExtract(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const fr = lines.indexOf('Français');
    if (fr < 0) return null;
    let i = lines.findIndex((l, k) => k > fr && POS.test(l) && l.length < 40);
    if (i < 0) return null;
    i += 2; // ligne grammaticale (« mot \prononciation\ genre »), puis définitions
    let first = null;
    for (; i < lines.length && i < 40; i++) {
      const l = lines[i];
      if (POS.test(l) && l.length < 40) break;                 // autre catégorie grammaticale
      if (/ — /.test(l) || l.length < 12) continue;           // exemples cités, lignes trop courtes
      if (!first) first = l;
      if (!SKIP.test(l)) return l;
    }
    return first;
  }

  async function remote(w) {
    if (!navigator.onLine) return null;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4500);
    try {
      const url = 'https://fr.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&format=json&formatversion=2&origin=*&titles=' + encodeURIComponent(w);
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) return null;
      const j = await r.json();
      const page = j.query && j.query.pages && j.query.pages[0];
      if (!page || page.missing || !page.extract) return null;
      let best = parseExtract(page.extract);
      if (!best) return null;
      if (best.length > 170) best = best.slice(0, 167).replace(/\s+\S*$/, '') + '…';
      return { word: w, def: best, fact: '', acc: w, src: 'wiktionnaire' };
    } catch (e) {
      return null;
    } finally { clearTimeout(timer); }
  }

  /** Renvoie une définition (locale d'abord, puis Wiktionnaire si connecté), ou null. */
  async function get(w) {
    const l = local(w);
    if (l) return l;
    if (cache[w]) return cache[w];
    if (miss.has(w)) return null;
    if (pending.has(w)) return pending.get(w);
    const p = remote(w).then(r => {
      pending.delete(w);
      if (r) { cache[w] = r; save(); } else if (navigator.onLine) miss.add(w);
      return r;
    });
    pending.set(w, p);
    return p;
  }

  const keys = Object.keys(DEFS);
  /** Mot du jour : même mot pour tout le monde un jour donné. */
  function wordOfDay(date) {
    const d = date || new Date();
    const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    const w = keys[n % keys.length];
    return local(w);
  }
  return { get, local, wordOfDay, count: keys.length };
})();
