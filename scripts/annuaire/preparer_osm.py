"""
Extrait d'OpenStreetMap les commerces et entreprises nommés du Bénin, du Sénégal, de la Côte d'Ivoire et du Togo.

  python scripts/annuaire/preparer_osm.py

Lit    D:\\leed-donnees\\osm\\*.osm.pbf   (jamais modifiés)
Écrit  D:\\leed-donnees\\_prepare\\osm_annuaire.jsonl, osm_rapport.json
Licence ODbL : mention obligatoire « © contributeurs OpenStreetMap » (voir LISEZ-MOI.txt de la source).

Le fichier du Sénégal contient aussi la Gambie : on retrouve la frontière de la Gambie dans le fichier lui-même
et on écarte tout point situé à l'intérieur.
Un point à moins de 150 m d'un lieu Overture au nom proche est marqué `proche_overture` (le chargement ne l'ajoute pas deux fois).
"""
import difflib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import osmium
import phonenumbers
from shapely import wkt as shapely_wkt
from shapely.geometry import Point
from shapely.prepared import prep

DONNEES = Path(r"D:\leed-donnees")
FICHIERS = {  # fichier -> pays par défaut des points
    "benin": "BJ", "senegal-and-gambia": "SN", "ivory-coast": "CI", "togo": "TG",
}
ISO_PAR_NOM = {"BJ": "BJ", "SN": "SN", "CI": "CI", "TG": "TG", "GM": "GM"}

AMENITES_ENTREPRISE = {
    "restaurant", "cafe", "bar", "pub", "fast_food", "food_court", "biergarten", "ice_cream", "pharmacy", "clinic", "hospital", "doctors", "dentist",
    "veterinary", "bank", "bureau_de_change", "money_transfer", "payment_centre", "school", "college", "university", "kindergarten", "language_school",
    "driving_school", "music_school", "training", "fuel", "car_wash", "car_rental", "car_sharing", "cinema", "nightclub", "theatre", "marketplace", "studio",
    "coworking_space", "events_venue", "conference_centre", "spa", "internet_cafe", "laundry",
}
TOURISME = {"hotel", "guest_house", "hostel", "motel", "apartment", "chalet", "resort", "camp_site", "gallery", "attraction"}
EXCLURE_OFFICE = {"government", "diplomatic", "ngo", "religion", "political_party", "association", "foundation", "union", "administrative", "quango"}


def normaliser(nom):
    s = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def secteur(t):
    a, shop, off, tour, craft = t.get("amenity"), t.get("shop"), t.get("office"), t.get("tourism"), t.get("craft")
    if a in {"restaurant", "cafe", "bar", "pub", "fast_food", "food_court", "biergarten", "ice_cream"}:
        return "Restauration"
    if a in {"pharmacy", "clinic", "hospital", "doctors", "dentist", "veterinary"} or t.get("healthcare"):
        return "Santé"
    if a in {"bank", "bureau_de_change", "money_transfer", "payment_centre"} or off in {"insurance", "financial", "accountant", "tax_advisor"}:
        return "Finance et assurance"
    if a in {"school", "college", "university", "kindergarten", "language_school", "driving_school", "music_school", "training"} or off == "educational_institution":
        return "Éducation et formation"
    if a == "fuel":
        return "Stations-service"
    if a in {"car_wash", "car_rental", "car_sharing"} or shop in {"car", "car_repair", "car_parts", "motorcycle", "tyres"}:
        return "Automobile"
    if tour in TOURISME:
        return "Hôtellerie"
    if shop in {"hairdresser", "beauty", "cosmetics", "massage", "tattoo", "nails"} or a == "spa":
        return "Beauté et bien-être"
    if a in {"cinema", "nightclub", "theatre", "events_venue"} or t.get("leisure") in {"adult_gaming_centre"}:
        return "Loisirs et sorties"
    if t.get("leisure") in {"fitness_centre", "sports_centre", "swimming_pool"}:
        return "Sport et fitness"
    if off == "estate_agent" or shop == "estate_agent":
        return "Immobilier"
    if off in {"travel_agent"} or shop == "travel_agency":
        return "Voyage et tourisme"
    if shop:
        return "Commerce"
    if craft:
        return "Artisanat"
    if off:
        return "Services aux entreprises"
    if a == "marketplace":
        return "Commerce"
    return "Autres"


def est_entreprise(t):
    if "name" not in t:
        return False
    a, off = t.get("amenity"), t.get("office")
    if a in AMENITES_ENTREPRISE or t.get("shop") or t.get("craft") or t.get("healthcare"):
        return True
    if off and off not in EXCLURE_OFFICE:
        return True
    if t.get("tourism") in TOURISME and t.get("tourism") != "attraction":
        return True
    if t.get("leisure") in {"fitness_centre", "sports_centre"}:
        return True
    return False


def interdit(t):  # activités refusées par leed (voir INTERDITS.md)
    return t.get("shop") in {"bookmaker", "lottery", "erotic"} or t.get("amenity") in {"casino", "gambling", "brothel", "stripclub", "love_hotel"} or t.get("leisure") in {"adult_gaming_centre"} or t.get("shop") == "weapons"


def valeur(t, *cles):
    for c in cles:
        v = t.get(c)
        if v:
            return v.strip()
    return None


def telephones(t, pays):
    """Renvoie (numéro au format international, est un mobile) ou (None, False)."""
    brut = valeur(t, "phone", "contact:phone", "mobile", "contact:mobile") or ""
    for morceau in re.split(r"[;,/]", brut):
        try:
            n = phonenumbers.parse(morceau.strip(), pays)
        except phonenumbers.NumberParseException:
            continue
        if not phonenumbers.is_valid_number(n) and pays == "BJ":
            # Bénin : 10 chiffres avec « 01 » depuis le 30 novembre 2024 ; les anciens numéros ont 8 chiffres
            e164 = phonenumbers.format_number(n, phonenumbers.PhoneNumberFormat.E164)
            if re.fullmatch(r"\+229\d{8}", e164):
                n = phonenumbers.parse("+22901" + e164[4:], "BJ")
        if phonenumbers.is_valid_number(n):
            mobile = phonenumbers.number_type(n) in (phonenumbers.PhoneNumberType.MOBILE, phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE)
            return phonenumbers.format_number(n, phonenumbers.PhoneNumberFormat.E164), mobile
    return None, False


def site_net(v):
    if not v:
        return None
    v = v.split(";")[0].strip()
    if not re.match(r"^https?://", v):
        v = "http://" + v
    m = re.match(r"^(https?://[^/?#\s]+)([^?#\s]*)", v)
    if not m or "." not in m.group(1):
        return None
    s = (m.group(1).lower() + m.group(2)).rstrip("/")
    return s if len(s) <= 160 else None


def lien_social(v, reseau):
    if not v:
        return None
    v = v.strip()
    if v.startswith("http"):
        return v[:200]
    return f"https://www.{reseau}.com/{v.lstrip('@/')}"[:200]


def frontiere_gambie(chemin):
    """Retrouve dans le fichier du Sénégal la frontière de la Gambie (relation administrative ISO3166-1 = GM)."""
    fabrique = osmium.geom.WKTFactory()
    fp = osmium.FileProcessor(str(chemin)).with_locations().with_areas(osmium.filter.TagFilter(("boundary", "administrative")))
    for o in fp:
        if o.is_area() and o.tags.get("ISO3166-1") == "GM" and o.tags.get("admin_level") == "2":
            return prep(shapely_wkt.loads(fabrique.create_multipolygon(o)))
    return None


def lire_fichier(chemin, pays_defaut):
    gambie = frontiere_gambie(chemin) if "gambia" in chemin.name else None
    fp = osmium.FileProcessor(str(chemin), osmium.osm.NODE | osmium.osm.WAY).with_locations().with_filter(osmium.filter.KeyFilter("name"))
    for o in fp:
        t = {x.k: x.v for x in o.tags}
        if not est_entreprise(t) or interdit(t):
            continue
        if o.is_node():
            if not o.location.valid():
                continue
            lon, lat, ref = o.location.lon, o.location.lat, f"n{o.id}"
        else:
            pts = [(n.lon, n.lat) for n in o.nodes if n.location.valid()]
            if not pts:
                continue
            lon, lat, ref = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts), f"w{o.id}"
        if gambie is not None and gambie.contains(Point(lon, lat)):
            yield None, "gambie", None
            continue
        pays = (t.get("addr:country") or pays_defaut).upper()
        if pays not in {"BJ", "SN", "CI", "TG"}:
            yield None, "autre_pays", None
            continue
        yield ref, pays, (t, lon, lat)


def charger_overture():
    chemin = DONNEES / "_prepare" / "overture_annuaire.jsonl"
    if not chemin.exists():
        return {}
    grille = defaultdict(list)
    with open(chemin, encoding="utf-8") as f:
        for ligne in f:
            g = json.loads(ligne)
            if g["lon"] is not None:
                grille[(round(g["lon"] / 0.002), round(g["lat"] / 0.002))].append(g)
    return grille


def proche_overture(grille, nom_norm, lon, lat):
    cx, cy = round(lon / 0.002), round(lat / 0.002)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for g in grille.get((cx + dx, cy + dy), []):
                if abs(g["lon"] - lon) > 0.0014 or abs(g["lat"] - lat) > 0.0014:  # environ 150 m
                    continue
                if difflib.SequenceMatcher(None, nom_norm, g["nom_normalise"]).ratio() >= 0.8:
                    return g["source_ref"]
    return None


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sortie = DONNEES / "_prepare"
    sortie.mkdir(parents=True, exist_ok=True)
    grille = charger_overture()
    stats = Counter()
    gardes = []
    for fichier in sorted((DONNEES / "osm").glob("*.osm.pbf")):
        pays_defaut = next((p for k, p in FICHIERS.items() if fichier.name.startswith(k)), None)
        if not pays_defaut:
            continue
        print("lecture", fichier.name, flush=True)
        for ref, pays, contenu in lire_fichier(fichier, pays_defaut):
            if contenu is None:
                stats[f"ecarte_{pays}"] += 1
                continue
            t, lon, lat = contenu
            nom = re.sub(r"\s+", " ", t["name"]).strip()[:200]
            nom_norm = normaliser(nom)
            if len(nom_norm) < 2:
                stats["ecarte_nom_vide"] += 1
                continue
            tel, est_mobile = telephones(t, pays)
            site = site_net(valeur(t, "website", "contact:website", "url"))
            mail = valeur(t, "email", "contact:email")
            mail = mail.split(";")[0].strip().lower() if mail else None
            if mail and not re.match(r"^[a-z0-9._%+\-]+@[a-z0-9\-]+(\.[a-z0-9\-]+)+$", mail):
                mail = None
            soc = {}
            fb = lien_social(valeur(t, "contact:facebook", "facebook"), "facebook")
            ig = lien_social(valeur(t, "contact:instagram", "instagram"), "instagram")
            if fb:
                soc["facebook"] = fb
            if ig:
                soc["instagram"] = ig
            stats["entreprises_nommees"] += 1
            avec_contact = bool(tel or site or mail or soc)
            if not avec_contact:
                stats["sans_aucun_contact"] += 1
            proche = proche_overture(grille, nom_norm, lon, lat) if grille else None
            if proche:
                stats["deja_dans_overture"] += 1
            gardes.append({
                "source_ref": ref, "nom": nom, "nom_normalise": nom_norm, "pays": pays,
                "ville": valeur(t, "addr:city", "addr:town", "addr:village"),
                "secteur": secteur(t), "sous_secteur": next((t[k] for k in ("amenity", "shop", "office", "craft", "tourism", "healthcare") if k in t), None),
                "site": site, "telephone": tel, "whatsapp_probable": bool(tel and est_mobile), "email": mail, "liens_sociaux": soc,
                "lon": round(lon, 6), "lat": round(lat, 6),
                "score_qualite": min(100, 35 + (14 if tel else 0) + (12 if site else 0) + (6 if mail else 0) + (6 if soc else 0) + (6 if t.get("addr:city") else 0)),
                "actif": True, "avec_contact": avec_contact, "proche_overture": proche,
            })

    with open(sortie / "osm_annuaire.jsonl", "w", encoding="utf-8", newline="\n") as f:
        for g in gardes:
            f.write(json.dumps(g, ensure_ascii=False) + "\n")

    nouveaux = [g for g in gardes if g["avec_contact"] and not g["proche_overture"]]
    rapport = {
        "entreprises_nommees_osm": len(gardes),
        "par_pays": dict(Counter(g["pays"] for g in gardes)),
        "avec_contact": sum(1 for g in gardes if g["avec_contact"]),
        "avec_telephone": sum(1 for g in gardes if g["telephone"]),
        "avec_site": sum(1 for g in gardes if g["site"]),
        "deja_dans_overture_a_150m": sum(1 for g in gardes if g["proche_overture"]),
        "nouveaux_avec_contact_a_charger": len(nouveaux),
        "nouveaux_par_pays": dict(Counter(g["pays"] for g in nouveaux)),
        "par_secteur": dict(Counter(g["secteur"] for g in gardes).most_common(12)),
        "ecarts": dict(stats),
    }
    (sortie / "osm_rapport.json").write_text(json.dumps(rapport, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(rapport, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
