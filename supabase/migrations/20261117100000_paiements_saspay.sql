-- Chantier 10 : paiement Mobile Money avec SasPay.
--  • `moyen` n'est plus limité à quatre valeurs : on y range le code du réseau SasPay (mtn_bj, moov_bj, wave_sn…) ;
--  • `details` garde ce que SasPay a répondu à la vérification (montant débité, frais) pour comprendre un litige ;
--  • `ajouter_cout_client` enregistre nos frais de paiement du mois (écran « Coûts et marges » de l'équipe).

alter table public.paiements drop constraint if exists paiements_moyen_check;
alter table public.paiements add column if not exists details jsonb not null default '{}'::jsonb;

create or replace function public.ajouter_cout_client(p_entreprise uuid, p_poste text, p_montant integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_montant is null or p_montant <= 0 then return; end if;
  insert into public.couts_par_client (entreprise_id, mois, poste, montant_fcfa)
  values (p_entreprise, date_trunc('month', now())::date, p_poste, p_montant)
  on conflict (entreprise_id, mois, poste)
  do update set montant_fcfa = public.couts_par_client.montant_fcfa + excluded.montant_fcfa;
end;
$$;
revoke execute on function public.ajouter_cout_client(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.ajouter_cout_client(uuid, text, integer) to service_role;
