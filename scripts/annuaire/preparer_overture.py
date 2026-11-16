"""
Prépare les lieux Overture pour l'annuaire de leed.

  python scripts/annuaire/preparer_overture.py

Lit    D:\\leed-donnees\\overture\\*.parquet            (jamais modifiés)
Écrit  D:\\leed-donnees\\_prepare\\overture_annuaire.jsonl  (une entreprise par ligne, prête à charger)
       D:\\leed-donnees\\_prepare\\overture_rapport.json    (les chiffres : combien gardé, combien écarté et pourquoi)

Les données restent sur D: et ne vont JAMAIS dans le dépôt (il est public).
Aucune connexion à la base ici : c'est charger_annuaire.py qui s'en occupe.

Règles (voir docs/CHANTIER-5-ANNUAIRE.md) :
  - le pays vient de l'adresse du lieu, pas du rectangle de téléchargement (le fichier « Bénin » contient surtout le Nigeria) ;
  - un lieu présent dans deux fichiers n'est gardé qu'une fois (même identifiant Overture) ;
  - confiance d'au moins 0,4 ;
  - seulement des entreprises (pas de rivières, d'églises, de sites historiques, d'administrations) ;
  - pas de jeux d'argent ni de contenu pour adultes (activités refusées, voir INTERDITS.md) ;
  - au moins une voie de contact valide ;
  - téléphones validés avec libphonenumber, normalisés au format international.
"""
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

import duckdb
import phonenumbers

DONNEES = Path(r"D:\leed-donnees")
ENTREE = DONNEES / "overture"
SORTIE = DONNEES / "_prepare"
PAYS = {"BJ", "SN", "CI", "TG"}
CONFIANCE_MIN = 0.4

# ───── Catégories : ce qu'on garde, et sous quel nom de secteur ─────

# Catégories exclues quel que soit leur groupe (lieux publics, équipements, activités refusées par leed)
EXCLUES = {
    "airport", "train_station", "bus_station", "parking", "bridge", "national_park", "park", "wildlife_sanctuary",
    "soccer_field", "basketball_court", "tennis_court", "sport_league", "amateur_sport_team", "professional_sport_team",
    "stadium_arena", "soccer_stadium", "football_stadium", "campus_building", "public_school", "library", "museum",
    "art_museum", "history_museum", "zoo", "aquarium", "auditorium", "casino", "adult_entertainment_venue",
    "gambling", "betting", "religious_school",
}
GROUPES_ENTREPRISE = {
    "services_and_business", "shopping", "food_and_drink", "education", "lodging", "travel_and_transportation",
    "lifestyle_services", "health_care", "arts_and_entertainment", "sports_and_recreation",
}
REGLES_SECTEUR = [  # première règle qui correspond (sur la catégorie fine)
    (r"real_estate|home_developer|property", "Immobilier"),
    (r"bank|credit_union|financial|insurance|money_transfer|loan|accounting|tax", "Finance et assurance"),
    (r"construction|contractor|building|plumb|electric|architect|engineer", "Bâtiment et travaux"),
    (r"information_technology|computer|software|web_design|data_", "Informatique"),
    (r"advertising|marketing|printing|graphic|photograph|media|public_relations", "Communication et impression"),
    (r"freight|cargo|logistic|moving|courier|delivery", "Transport et logistique"),
    (r"agricultur|farm", "Agriculture"),
    (r"party|event|wedding|catering", "Événementiel"),
    (r"gas_station|fuel", "Stations-service"),
    (r"automotive|auto_|car_|tire|motorcycle|oil_change|mechanic", "Automobile"),
    (r"travel|tour|airline|passport|hotel_booking", "Voyage et tourisme"),
    (r"taxi|boat|shipping|transportation", "Transport et logistique"),
    (r"pharmacy|health|hospital|clinic|doctor|dentist|medical|laborator|optic|eyewear", "Santé"),
    (r"restaurant|food|cafe|coffee|bar$|pub|bakery|snack|fast_food|pizza|grill|diner", "Restauration"),
    (r"hotel|lodging|guest_house|hostel|resort|motel|bed_and_breakfast", "Hôtellerie"),
    (r"school|university|college|education|training|tutor|language|coaching|preschool|driving", "Éducation et formation"),
    (r"beauty|salon|spa|barber|hair|nail|massage|makeup|cosmetic|skin", "Beauté et bien-être"),
    (r"gym|fitness|yoga|martial|swimming|dance_studio|sport", "Sport et fitness"),
    (r"dance_club|music_venue|nightclub|movie|theat|art_gallery|amusement|entertainment|arcade", "Loisirs et sorties"),
    (r"clothing|fashion|shoe|jewel|boutique|store|shop|market|mall|supermarket|grocery|furniture|electronic|hardware|book|gift|toy", "Commerce"),
    (r"professional_service|legal|lawyer|consult|notary|business|company|industrial", "Services aux entreprises"),
]
GROUPE_PAR_DEFAUT = {
    "food_and_drink": "Restauration", "lodging": "Hôtellerie", "education": "Éducation et formation", "health_care": "Santé",
    "lifestyle_services": "Beauté et bien-être", "shopping": "Commerce", "services_and_business": "Services aux entreprises",
    "travel_and_transportation": "Transport et logistique", "arts_and_entertainment": "Loisirs et sorties", "sports_and_recreation": "Sport et fitness",
}


def secteur_de(groupe, fine):
    texte = (fine or "").lower()
    for motif, nom in REGLES_SECTEUR:
        if re.search(motif, texte):
            return nom
    return GROUPE_PAR_DEFAUT.get(groupe, "Autres")


# ───── Nettoyage ─────


def normaliser_nom(nom):
    s = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def nettoyer_nom(nom):
    n = re.sub(r"\s+", " ", (nom or "")).strip()
    if len(n) < 2 or not re.search(r"[A-Za-zÀ-ÿ]", n):
        return None
    return n[:200]


def telephone_valide(brut, pays):
    try:
        tel = phonenumbers.parse(brut, pays)
    except phonenumbers.NumberParseException:
        return None
    if not phonenumbers.is_valid_number(tel):
        return None
    est_mobile = phonenumbers.number_type(tel) in (phonenumbers.PhoneNumberType.MOBILE, phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE)
    return phonenumbers.format_number(tel, phonenumbers.PhoneNumberFormat.E164), est_mobile


EMAIL = re.compile(r"^[a-z0-9._%+\-]+@[a-z0-9\-]+(\.[a-z0-9\-]+)+$")


def email_valide(brut):
    e = (brut or "").strip().lower()
    return e if 5 <= len(e) <= 120 and EMAIL.match(e) else None


def site_propre(brut):
    """Garde l'adresse sans les paramètres ni l'ancre ; refuse les adresses démesurées ou sans nom de domaine."""
    try:
        u = urlsplit((brut or "").strip())
    except ValueError:
        return None
    if u.scheme not in ("http", "https") or not u.netloc or "." not in u.netloc:
        return None
    propre = f"{u.scheme}://{u.netloc.lower()}{u.path}".rstrip("/")
    return propre if len(propre) <= 160 else None


RESEAUX = {"facebook.com": "facebook", "fb.com": "facebook", "instagram.com": "instagram", "linkedin.com": "linkedin", "tiktok.com": "tiktok"}


def liens_sociaux(urls):
    out = {}
    for brut in urls or []:
        try:
            hote = urlsplit(brut).netloc.lower().removeprefix("www.").removeprefix("m.")
        except ValueError:
            continue
        for domaine, cle in RESEAUX.items():
            if hote == domaine or hote.endswith("." + domaine):
                out.setdefault(cle, brut.strip()[:200])
    return out


def score(confiance, tel, site, mail, soc, ville):
    s = round((confiance or 0) * 60) + (12 if tel else 0) + (10 if site else 0) + (6 if mail else 0) + (6 if soc else 0) + (6 if ville else 0)
    return max(0, min(100, s))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    SORTIE.mkdir(parents=True, exist_ok=True)
    fichiers = sorted(ENTREE.glob("*.parquet"))
    if not fichiers:
        sys.exit(f"Aucun fichier .parquet dans {ENTREE}")

    con = duckdb.connect()
    union = " union all by name ".join(f"select * from read_parquet('{f.as_posix()}')" for f in fichiers)
    lignes = con.execute(f"""
      select distinct on (id) id, confidence, names.primary as nom, phones, websites, emails, socials,
             addresses[1].locality as ville, addresses[1].region as region, addresses[1].country as pays,
             taxonomy.primary as fine, taxonomy.hierarchy[1] as groupe, operating_status as statut,
             (bbox.xmin + bbox.xmax) / 2 as lon, (bbox.ymin + bbox.ymax) / 2 as lat
      from ({union})
      order by id, confidence desc
    """).fetchall()

    rapport = Counter()
    rapport["lieux_uniques_lus"] = len(lignes)
    gardes = []
    for (oid, conf, nom, phones, sites, mails, socials, ville, region, pays, fine, groupe, statut, lon, lat) in lignes:
        if pays not in PAYS:
            rapport["ecarte_hors_des_4_pays"] += 1
            continue
        if (conf or 0) < CONFIANCE_MIN:
            rapport["ecarte_confiance_trop_basse"] += 1
            continue
        if groupe not in GROUPES_ENTREPRISE or (fine or "") in EXCLUES:
            rapport["ecarte_pas_une_entreprise"] += 1
            continue
        nom_net = nettoyer_nom(nom)
        if not nom_net:
            rapport["ecarte_sans_nom"] += 1
            continue
        tel_mobile = next((t for t in (telephone_valide(p, pays) for p in (phones or [])) if t), None)
        tel, est_mobile = tel_mobile if tel_mobile else (None, False)
        mail = next((m for m in (email_valide(e) for e in (mails or [])) if m), None)
        site = next((s for s in (site_propre(w) for w in (sites or [])) if s), None)
        soc = liens_sociaux(socials)
        if not (tel or mail or site or soc):
            rapport["ecarte_aucun_contact_valide"] += 1
            continue
        if phones and not tel:
            rapport["telephone_invalide_retire"] += 1
        ville_nette = (ville or "").strip() or None
        gardes.append({
            "source_ref": oid,
            "nom": nom_net,
            "nom_normalise": normaliser_nom(nom_net),
            "pays": pays,
            "ville": ville_nette,
            "secteur": secteur_de(groupe, fine),
            "sous_secteur": fine,
            "site": site,
            "telephone": tel,
            # un mobile : WhatsApp probable, à confirmer à l'envoi (jamais présenté comme certain)
            "whatsapp_probable": bool(tel and est_mobile),
            "email": mail,
            "liens_sociaux": soc,
            "lon": round(lon, 6) if lon is not None else None,
            "lat": round(lat, 6) if lat is not None else None,
            "score_qualite": score(conf, tel, site, mail, soc, ville_nette),
            "actif": statut == "open",
        })

    # Doublons probables à l'intérieur d'Overture (même pays, même nom, même ville) : comptés, pas fusionnés (c'est l'étape de rapprochement)
    cles = Counter((g["pays"], g["nom_normalise"], g["ville"]) for g in gardes)
    doublons = sum(n - 1 for n in cles.values() if n > 1)

    with open(SORTIE / "overture_annuaire.jsonl", "w", encoding="utf-8", newline="\n") as f:
        for g in gardes:
            f.write(json.dumps(g, ensure_ascii=False) + "\n")

    par_pays = Counter(g["pays"] for g in gardes)
    rapport_final = {
        "gardes": len(gardes),
        "par_pays": dict(par_pays),
        "par_secteur": dict(Counter(g["secteur"] for g in gardes).most_common()),
        "avec_telephone": sum(1 for g in gardes if g["telephone"]),
        "avec_mobile_whatsapp_probable": sum(1 for g in gardes if g["whatsapp_probable"]),
        "avec_site": sum(1 for g in gardes if g["site"]),
        "avec_email": sum(1 for g in gardes if g["email"]),
        "avec_reseau_social": sum(1 for g in gardes if g["liens_sociaux"]),
        "avec_ville": sum(1 for g in gardes if g["ville"]),
        "doublons_probables_meme_nom_meme_ville": doublons,
        "ecarts": dict(rapport),
    }
    (SORTIE / "overture_rapport.json").write_text(json.dumps(rapport_final, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(rapport_final, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
