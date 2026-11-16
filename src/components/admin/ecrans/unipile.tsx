import { Carte, EtatVide, Etiquette, Ligne, Sourdine, Tableau, Titrine, TitrePage, classeBouton, dateCourte, fcfa, heure, nombre } from "@/components/app/kit";
import { Champ, inputClass } from "@/components/form";
import { coutUnipileEuros, coutUnipileFcfa } from "@/lib/admin/unipile";
import { debrancherLesComptesExpires, declarerLesWebhooks, envoyerTestUnipile, synchroniserLesComptes } from "@/lib/admin/actions";
import { masquer } from "@/lib/canaux/regles";
import type { AdminUnipileVue } from "@/lib/admin/vues";

const NOM_STATUT: Record<string, { texte: string; ton: "ok" | "feu" | "neutre" }> = {
  OK: { texte: "Bon", ton: "ok" },
  CONNECTING: { texte: "Connexion…", ton: "neutre" },
  CREDENTIALS: { texte: "À rebrancher", ton: "feu" },
  PERMISSIONS: { texte: "Autorisations", ton: "feu" },
  ERROR: { texte: "Erreur", ton: "feu" },
  STOPPED: { texte: "Arrêté", ton: "feu" },
};

function Variable({ nom, ok }: { nom: string; ok: boolean }) {
  return (
    <Ligne>
      <code className="text-sm">{nom}</code>
      <Etiquette ton={ok ? "ok" : "feu"}>{ok ? "posée" : "manquante"}</Etiquette>
    </Ligne>
  );
}

export function AdminUnipile({ v, ok, erreur, info }: { v: AdminUnipileVue; ok?: boolean; erreur?: string; info?: string }) {
  const nbComptes = v.comptes?.ok ? v.comptes.liste.length : 0;
  const testables = v.comptes?.ok ? v.comptes.liste.filter((c) => c.canal === "whatsapp" || c.canal === "email") : [];
  const prete = v.variables.dsn && v.variables.cle && v.variables.secret && v.variables.site;
  return (
    <div className="flex flex-col gap-4">
      <TitrePage titre="Unipile" droite={<Etiquette ton={prete ? "ok" : "feu"}>{prete ? "Prêt" : "À configurer"}</Etiquette>} />
      {erreur && <p role="alert" className="rounded-lg bg-[#fdeee4] px-3 py-2 text-sm text-[#b4410e]">{erreur}</p>}
      {ok && info && <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-600">{info}</p>}

      <Carte>
        <Titrine>Variables (serveur)</Titrine>
        <Variable nom="UNIPILE_DSN" ok={v.variables.dsn} />
        <Variable nom="UNIPILE_API_KEY" ok={v.variables.cle} />
        <Variable nom="UNIPILE_WEBHOOK_SECRET" ok={v.variables.secret} />
        <Variable nom="APP_URL" ok={v.variables.site} />
        <Sourdine>Seule la présence est affichée : les valeurs ne sortent jamais du serveur. Si une variable vient d&apos;être ajoutée dans Vercel, il faut redéployer le site.</Sourdine>
      </Carte>

      {v.comptes === null ? (
        <EtatVide titre="Connexion non testée" texte="Posez UNIPILE_DSN et UNIPILE_API_KEY (fichier .env.local et Vercel), puis redéployez." />
      ) : !v.comptes.ok ? (
        <Carte ton="vif">
          <Titrine>La connexion à Unipile échoue</Titrine>
          <p className="!my-0 text-sm !text-foreground">{v.comptes.erreur}</p>
          <Sourdine>Vérifiez l&apos;adresse (UNIPILE_DSN, de la forme api8.unipile.com:13xxx) et la clé d&apos;accès dans votre tableau de bord Unipile.</Sourdine>
        </Carte>
      ) : (
        <Carte>
          <Titrine>Comptes connectés chez Unipile (facturés)</Titrine>
          <Ligne><span>Comptes</span><b className="tabular-nums">{nbComptes}</b></Ligne>
          <Ligne><span>Coût estimé par mois</span><b className="tabular-nums">{nombre(coutUnipileEuros(nbComptes))} € · {fcfa(coutUnipileFcfa(nbComptes))}</b></Ligne>
          <Ligne><span>Chez nous : bons / à rebrancher / suspendus</span><b className="tabular-nums">{v.locaux.actifs} / {v.locaux.a_rebrancher} / {v.locaux.suspendus}</b></Ligne>
          <Sourdine>Unipile facture le plus grand nombre de comptes connectés en même temps dans le mois, nos comptes de test compris.</Sourdine>
          {nbComptes === 0 ? (
            <Sourdine>Aucun compte pour l&apos;instant. Connectez-en un depuis l&apos;espace client (Comptes), avec un forfait payant.</Sourdine>
          ) : (
            <Tableau
              legende="Comptes chez Unipile"
              colonnes={["Type", "Compte", "Identifiant", "État", "Depuis"]}
              lignes={v.comptes.liste.map((c) => [
                <b key="t">{c.type}</b>,
                <code key="i" className="text-xs">{masquer(c.id)}</code>,
                <span key="n" className="break-all">{c.identifiant}</span>,
                <Etiquette key="e" ton={(NOM_STATUT[c.statut] ?? { ton: "neutre" }).ton}>{(NOM_STATUT[c.statut] ?? { texte: c.statut }).texte}</Etiquette>,
                <span key="d" className="text-muted-foreground">{c.cree_le ? dateCourte(c.cree_le) : "-"}</span>,
              ])}
            />
          )}
          <form action={synchroniserLesComptes}>
            <button type="submit" className={classeBouton("cadre", true)}>Synchroniser maintenant</button>
          </form>
        </Carte>
      )}

      <Carte>
        <Titrine>Messages automatiques (webhooks)</Titrine>
        {v.adresseWebhook && <Sourdine className="break-all">Adresse : {v.adresseWebhook}</Sourdine>}
        {v.webhooks === null ? null : !v.webhooks.ok ? (
          <p className="!my-0 text-sm text-[#b4410e]">{v.webhooks.erreur}</p>
        ) : v.webhooks.liste.length === 0 ? (
          <p className="!my-0 text-sm">Aucun webhook déclaré chez Unipile : les réponses et les déconnexions ne nous parviennent pas.</p>
        ) : (
          v.webhooks.liste.map((w) => (
            <Ligne key={w.id || w.url + w.source}>
              <span className="break-all text-sm">{w.source}</span>
              <Etiquette ton={v.adresseWebhook && w.url === v.adresseWebhook ? "ok" : "neutre"}>{v.adresseWebhook && w.url === v.adresseWebhook ? "à nous" : "autre"}</Etiquette>
            </Ligne>
          ))
        )}
        <form action={declarerLesWebhooks}>
          <button type="submit" disabled={!prete} className={classeBouton("sombre", true)}>Déclarer les webhooks chez Unipile</button>
        </form>
        <Sourdine>Deux webhooks : « messaging » (réponses reçues) et « account_status » (compte à rebrancher ou suspendu). Chaque appel d&apos;Unipile porte l&apos;en-tête secret ; sans lui, il est refusé.</Sourdine>
      </Carte>

      <Carte>
        <Titrine>Test d&apos;envoi à vous-même</Titrine>
        {testables.length === 0 ? (
          <Sourdine>Connectez d&apos;abord un compte WhatsApp ou email : il apparaîtra ici.</Sourdine>
        ) : (
          <form action={envoyerTestUnipile} className="flex flex-col gap-3">
            <Champ id="compte" label="Depuis le compte">
              <select id="compte" name="compte" required className={inputClass}>
                {testables.map((c) => (
                  <option key={c.id} value={c.id}>{c.type} · {c.identifiant}</option>
                ))}
              </select>
            </Champ>
            <Champ id="destinataire" label="À (votre propre numéro ou adresse)" aide="WhatsApp : avec l'indicatif, par exemple +229… Email : une adresse qui est à vous.">
              <input id="destinataire" name="destinataire" required className={inputClass} />
            </Champ>
            <Champ id="texte" label="Message">
              <input id="texte" name="texte" required minLength={3} maxLength={300} defaultValue="Test leed : ce message est un essai." className={inputClass} />
            </Champ>
            <button type="submit" className={classeBouton("action", true)}>Envoyer le test</button>
            <Sourdine>Réservé aux essais. Jamais à un prospect : 10 tests par heure au plus, chacun inscrit au journal d&apos;audit.</Sourdine>
          </form>
        )}
      </Carte>

      <Carte>
        <Titrine>Événements récents (chez nous)</Titrine>
        {v.evenements.length === 0 ? (
          <Sourdine>Rien pour l&apos;instant. Quand vous répondrez à un message de test, « réponse reçue » doit apparaître ici : c&apos;est la preuve que les webhooks arrivent.</Sourdine>
        ) : (
          <Tableau
            legende="Événements des comptes"
            colonnes={["Quand", "Compte", "Événement"]}
            lignes={v.evenements.map((x) => [
              <span key="q" className="whitespace-nowrap text-muted-foreground">{dateCourte(x.quand)} {heure(x.quand)}</span>,
              <span key="c" className="break-all">{x.canal ?? "-"}{x.identifiant ? ` · ${x.identifiant}` : ""}</span>,
              <span key="e"><Etiquette ton={x.gravite >= 2 ? "feu" : "neutre"}>{x.type}</Etiquette> <span className="text-muted-foreground">{x.detail}</span></span>,
            ])}
          />
        )}
      </Carte>

      <Carte>
        <Titrine>Fin de forfait</Titrine>
        <Sourdine>Débranche chez Unipile les comptes des entreprises qui n&apos;ont plus de forfait payant en cours (même en grâce). Un compte débranché ne coûte plus rien. Rejouable sans danger.</Sourdine>
        <form action={debrancherLesComptesExpires}>
          <button type="submit" className={classeBouton("cadre", true)}>Débrancher les comptes sans forfait</button>
        </form>
      </Carte>
    </div>
  );
}
