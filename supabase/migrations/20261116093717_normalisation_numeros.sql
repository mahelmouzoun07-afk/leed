-- Un numéro écrit « +229 01 23… » ou « 00229 01 23… » doit donner la même empreinte :
-- sinon un STOP pourrait être contourné par une autre façon d'écrire le numéro.
create or replace function public.normaliser_identifiant(p_canal public.canal, p_identifiant text)
returns text language sql immutable set search_path = public, extensions as $$
  select case
    when p_canal = 'whatsapp' then regexp_replace(regexp_replace(coalesce(p_identifiant, ''), '[^0-9]', '', 'g'), '^00', '')
    else lower(trim(coalesce(p_identifiant, '')))
  end;
$$;
