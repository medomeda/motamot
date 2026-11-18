#!/usr/bin/env python3
"""Extrait le dictionnaire du prototype et produit js/words.js (nettoyé).
Usage : python3 tools/build-words.py "Mot à mot — jeu de chaînes de mots.html"
"""
import re, sys
src = sys.argv[1]
lines = open(src, encoding="utf-8").read().split("\n")
words = re.search(r'const WORDS="([^"]*)"', "\n".join(lines)).group(1).split(" ")
common = re.search(r'const COMMON="([^"]*)"', "\n".join(lines)).group(1).split(" ")

# Sigles, prénoms, lieux, marques, mots vulgaires ou sensibles : retirés du jeu.
BLOCK = set("""
adn afp aix ali all and ben big bla bob bcp caq cdi cgt cie com con cul dut edf end etc euh gay guy hab hey hop iii ier
joe kim leo lol los luc mac max mdr mme nan nee neo new one ong onu pau pdg pen pib plq plu pme psg psy rdv red rer rez
roy sdf sfr svp taf tel ter tgv the tom tva ump usa web wow xiv xvi xxe you pue jai sms ait
adam afro alex anne arte asie bill caen city coll cool dela eric free fric http hugo inde iran irak jack jean john jose
juif jura leon live love lyon mali marc mari mark maxi metz mien oise open ordi otan ouai ratp rene rhin rome show sida
sncf star team tony trad urss week with xiii xixe yann york yves pute fout viol sexe sexy homo meuf cest
agnes alain alger andre apple black bercy berne cesar chloe chris cyril dakar damas david dijon felix frank hamon harry
henri henry herve james jesus jules julie kevin laval liege lille louis lucie maria marie mario marne penis porno pisse
nique merde chier baise sarah serge simon steve trump turin valls anglo congo coree japon liban libye niger perou maroc
syrie grece chine haiti coran insee suede juive aille
adrien albert alexis alsace amiens angers anvers arabie arnaud benoit berlin bresil canada cecile celine chirac christ
claude daniel didier dubois dupont egypte elysee eugene europe france franck franco gaston gaulle geneve george gerard
google guinee guyane helene hubert iphone israel italie jeanne jerome joseph julien lucien louvre macron madrid marcel
maxime michel monaco moreau moscou nantes naples quebec reims serbie sophie sylvie syrien thomas toulon unesco venise
victor xavier xviiie bordel chiant putain salope encule foutre foutu sexuel violer baiser chatte drogue gueule
""".split())

W = [w for w in words if w and w not in BLOCK]
WS = set(W)
# Mots « de départ / d'arrivée » : pas de pluriels réguliers, pas de mots bloqués.
C = [w for w in common if w in WS and not (w.endswith("s") and w[:-1] in WS)]

with open("js/words.js", "w", encoding="utf-8") as f:
    f.write("/* Dictionnaire généré par tools/build-words.py — ne pas éditer à la main. */\n")
    f.write('const WORDS="%s";\n' % " ".join(W))
    f.write('const COMMON="%s";\n' % " ".join(C))
print("dictionnaire :", len(W), "mots | mots courants :", len(C))
