"""
Charge l'annuaire dans Supabase (base leed-dev). À LANCER PAR VOUS, sur votre ordinateur.

  python scripts/annuaire/charger_annuaire.py --source overture --essai       (compte, n'écrit rien)
  python scripts/annuaire/charger_annuaire.py --source overture
  python scripts/annuaire/charger_annuaire.py --source osm
  python scripts/annuaire/charger_annuaire.py --retirer-exemples              (supprime les 60 fausses entreprises d'exemple)

Lit D:\\leed\\.env.local : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY. N'affiche JAMAIS la clé.
Lit les fichiers préparés par preparer_overture.py / preparer_osm.py dans D:\\leed-donnees\\_prepare.
Sans danger si on le relance : une entreprise déjà chargée est mise à jour, jamais dupliquée (clé : source + référence).
Pour OpenStreetMap, on ne charge que les entreprises avec un contact et qui ne sont pas déjà dans Overture (à 150 m, nom proche).
"""
import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
PREPARE = Path(r"D:\leed-donnees\_prepare")
LOT = 500


def lire_env():
    env = {}
    fichier = RACINE / ".env.local"
    if not fichier.exists():
        sys.exit(f"Fichier introuvable : {fichier}")
    for ligne in fichier.read_text(encoding="utf-8").splitlines():
        ligne = ligne.strip()
        if not ligne or ligne.startswith("#") or "=" not in ligne:
            continue
        cle, _, valeur = ligne.partition("=")
        env[cle.strip()] = valeur.strip().strip('"').strip("'")
    return env


def appeler(url, cle, fonction, corps):
    req = urllib.request.Request(
        f"{url.rstrip('/')}/rest/v1/rpc/{fonction}",
        data=json.dumps(corps).encode("utf-8"),
        headers={"apikey": cle, "Authorization": f"Bearer {cle}", "Content-Type": "application/json"},
        method="POST",
    )
    for essai in range(1, 5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read().decode("utf-8") or "null")
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "ignore")[:300]
            if e.code in (401, 403):
                sys.exit(f"La base refuse la clé de service (HTTP {e.code}). Vérifiez SUPABASE_SERVICE_ROLE_KEY dans .env.local.")
            if essai == 4 or e.code < 500:
                sys.exit(f"Erreur de la base (HTTP {e.code}) : {detail}")
        except (urllib.error.URLError, TimeoutError) as e:
            if essai == 4:
                sys.exit(f"Réseau indisponible : {e}")
        time.sleep(2 * essai)


def lignes(source):
    fichier = PREPARE / f"{source}_annuaire.jsonl"
    if not fichier.exists():
        sys.exit(f"Fichier introuvable : {fichier}. Lancez d'abord preparer_{source}.py")
    with open(fichier, encoding="utf-8") as f:
        for l in f:
            g = json.loads(l)
            if source == "osm" and (not g.get("avec_contact") or g.get("proche_overture")):
                continue
            yield {
                "source_ref": g["source_ref"], "nom": g["nom"], "nom_normalise": g["nom_normalise"], "pays": g["pays"],
                "ville": g.get("ville"), "secteur": g.get("secteur"), "sous_secteur": g.get("sous_secteur"),
                "site": g.get("site"), "telephone": g.get("telephone"),
                "whatsapp": g.get("telephone") if g.get("whatsapp_probable") else None,
                "email": g.get("email"), "liens_sociaux": g.get("liens_sociaux") or {},
                "lon": g.get("lon"), "lat": g.get("lat"), "score_qualite": g.get("score_qualite"), "actif": g.get("actif", True),
            }


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("--source", choices=["overture", "osm"])
    p.add_argument("--essai", action="store_true", help="compte seulement, n'écrit rien")
    p.add_argument("--retirer-exemples", action="store_true", help="supprime les entreprises d'exemple (fausses)")
    a = p.parse_args()
    if not a.source and not a.retirer_exemples:
        p.error("donnez --source overture|osm, ou --retirer-exemples")

    if a.source and a.essai:
        n = sum(1 for _ in lignes(a.source))
        print(f"{n} entreprises seraient chargées depuis {a.source}. Rien n'a été écrit.")
        return

    env = lire_env()
    url, cle = env.get("NEXT_PUBLIC_SUPABASE_URL"), env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not cle:
        sys.exit("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manque dans .env.local")

    if a.source:
        total = {"inseres": 0, "mis_a_jour": 0}
        lot, lus = [], 0
        debut = time.time()

        def envoyer():
            r = appeler(url, cle, "charger_annuaire", {"p_source": a.source, "p_lignes": lot})
            total["inseres"] += r["inseres"]
            total["mis_a_jour"] += r["mis_a_jour"]

        for g in lignes(a.source):
            lot.append(g)
            lus += 1
            if len(lot) >= LOT:
                envoyer()
                lot = []
                print(f"  {lus} lignes envoyées...", flush=True)
        if lot:
            envoyer()
        print(f"Terminé en {round(time.time() - debut)} s : {total['inseres']} ajoutées, {total['mis_a_jour']} mises à jour (source {a.source}).")

    if a.retirer_exemples:
        n = appeler(url, cle, "retirer_source_annuaire", {"p_source": "exemple"})
        print(f"{n} entreprises d'exemple supprimées.")


if __name__ == "__main__":
    main()
