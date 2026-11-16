"""
Extrait de GLEIF (Golden Copy) les entités du Bénin, du Sénégal, de la Côte d'Ivoire et du Togo.

  python scripts/annuaire/preparer_gleif.py

Lit    D:\\leed-donnees\\gleif\\*lei2*.zip   (sans rien modifier : lecture en flux, le fichier de 5 Go n'est jamais décompressé sur le disque)
Écrit  D:\\leed-donnees\\_prepare\\gleif_annuaire.jsonl, gleif_rapport.json

GLEIF est sous licence CC0. On garde : LEI, nom légal, statut, forme juridique, adresse du siège, ville, pays, date de création,
et le numéro de registre du commerce quand il est donné. Ce sont des entreprises (il y a très peu de personnes dans cette base).
"""
import csv
import io
import json
import re
import sys
import unicodedata
import zipfile
from collections import Counter
from pathlib import Path

DONNEES = Path(r"D:\leed-donnees")
PAYS = {"BJ", "SN", "CI", "TG"}
csv.field_size_limit(10_000_000)


def normaliser(nom):
    s = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sortie = DONNEES / "_prepare"
    sortie.mkdir(parents=True, exist_ok=True)
    archives = sorted((DONNEES / "gleif").glob("*lei2*.zip"))
    if not archives:
        sys.exit("Fichier GLEIF LEI-CDF introuvable dans D:\\leed-donnees\\gleif")

    stats = Counter()
    gardes = []
    with zipfile.ZipFile(archives[0]) as z:
        nom_csv = z.namelist()[0]
        with z.open(nom_csv) as brut:
            lecteur = csv.reader(io.TextIOWrapper(brut, encoding="utf-8", newline=""))
            entete = next(lecteur)
            idx = {c: i for i, c in enumerate(entete)}

            def col(*noms):
                for n in noms:
                    if n in idx:
                        return idx[n]
                raise KeyError(noms)

            c_lei = col("LEI")
            c_nom = col("Entity.LegalName")
            c_pays_legal = col("Entity.LegalAddress.Country")
            c_ville = col("Entity.LegalAddress.City")
            c_ligne = col("Entity.LegalAddress.FirstAddressLine")
            c_pays_siege = col("Entity.HeadquartersAddress.Country")
            c_ville_siege = col("Entity.HeadquartersAddress.City")
            c_statut = col("Entity.EntityStatus")
            c_categorie = col("Entity.EntityCategory")
            c_creation = col("Entity.EntityCreationDate")
            c_reg_statut = col("Registration.RegistrationStatus")
            c_autorite = col("Entity.RegistrationAuthority.RegistrationAuthorityID")
            c_numero = col("Entity.RegistrationAuthority.RegistrationAuthorityEntityID")
            c_forme = col("Entity.LegalForm.EntityLegalFormCode")

            for ligne in lecteur:
                stats["lignes_lues"] += 1
                if len(ligne) <= c_forme:
                    stats["lignes_mal_formees"] += 1
                    continue
                pays = ligne[c_pays_legal] if ligne[c_pays_legal] in PAYS else (ligne[c_pays_siege] if ligne[c_pays_siege] in PAYS else None)
                if not pays:
                    continue
                nom = ligne[c_nom].strip()
                if not nom:
                    stats["sans_nom"] += 1
                    continue
                gardes.append({
                    "lei": ligne[c_lei],
                    "nom": nom[:200],
                    "nom_normalise": normaliser(nom),
                    "pays": pays,
                    "ville": (ligne[c_ville] or ligne[c_ville_siege]).strip() or None,
                    "adresse": ligne[c_ligne].strip() or None,
                    "statut_entite": ligne[c_statut],
                    "statut_lei": ligne[c_reg_statut],
                    "categorie": ligne[c_categorie] or None,
                    "creation": ligne[c_creation][:10] or None,
                    "registre": ligne[c_autorite] or None,
                    "numero_registre": ligne[c_numero] or None,
                    "forme_juridique": ligne[c_forme] or None,
                })

    with open(sortie / "gleif_annuaire.jsonl", "w", encoding="utf-8", newline="\n") as f:
        for g in gardes:
            f.write(json.dumps(g, ensure_ascii=False) + "\n")

    rapport = {
        "lignes_lues_dans_gleif": stats["lignes_lues"],
        "entites_des_4_pays": len(gardes),
        "par_pays": dict(Counter(g["pays"] for g in gardes)),
        "actives": sum(1 for g in gardes if g["statut_entite"] == "ACTIVE"),
        "lei_a_jour_ISSUED": sum(1 for g in gardes if g["statut_lei"] == "ISSUED"),
        "avec_numero_de_registre": sum(1 for g in gardes if g["numero_registre"]),
        "par_categorie": dict(Counter(g["categorie"] for g in gardes).most_common(8)),
        "villes_principales": dict(Counter(g["ville"] for g in gardes).most_common(8)),
        "ecarts": dict(stats),
    }
    (sortie / "gleif_rapport.json").write_text(json.dumps(rapport, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(rapport, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
