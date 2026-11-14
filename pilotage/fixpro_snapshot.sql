select jsonb_build_object(
'paiements',(select coalesce(jsonb_agg(jsonb_build_object('date',coalesce(p.paid_at,p.created_at),'plan',p.plan,'periode',p.period,'montant',p.amount,'moyen',p.method,'expire',s.end_date,'tech',coalesce(nullif(u.full_name,''),'Technicien')) order by coalesce(p.paid_at,p.created_at)::text desc),'[]') from abo_payments p left join users u on u.id::text=p.technician_id::text left join abo_subscriptions s on s.id::text=p.subscription_id::text where p.status='paid' and coalesce(p.provider_ref,'') not ilike 'test%'),
'actifs',(select count(distinct s.technician_id::text) from abo_subscriptions s join abo_payments p on p.reference=s.payment_ref and p.status='paid' and coalesce(p.provider_ref,'') not ilike 'test%' where s.end_date::timestamptz > now()),
'paiements_test',(select count(*) from abo_payments where status='paid' and coalesce(provider_ref,'') ilike 'test%'),
'relancer',(select coalesce(jsonb_agg(jsonb_build_object('nom',coalesce(nullif(u.full_name,''),'Technicien'),'tel',u.phone,'plan',s.plan,'expire',s.end_date,'montant',s.amount) order by s.end_date desc),'[]') from (select distinct on (technician_id::text) * from abo_subscriptions order by technician_id::text, end_date::text desc) s join users u on u.id::text=s.technician_id::text join abo_payments p on p.reference=s.payment_ref and coalesce(p.provider_ref,'') not ilike 'test%' where s.end_date::timestamptz < now()),
'comptes',(select coalesce(jsonb_agg(jsonb_build_object('mois',m,'n',n) order by m),'[]') from (select left(created_at::text,7) m,count(*) n from users where role<>'admin' group by 1) c),
'total_comptes',(select count(*) from users where role<>'admin'),
'villes',(select coalesce(jsonb_agg(jsonb_build_object('v',v,'n',n)),'[]') from (select split_part(coalesce(nullif(quartier,''),city),',',1) v,count(*) n from users where role<>'admin' and coalesce(nullif(quartier,''),city,'')<>'' group by 1 order by 2 desc limit 6) c),
'visites_jour',(select coalesce(jsonb_agg(jsonb_build_object('jour',j,'n',n) order by j),'[]') from (select jour::date j,count(distinct visiteur) n from visites where jour::date>current_date-90 group by 1) c),
'profils_30j',(select coalesce(jsonb_object_agg(profil,n),'{}') from (select profil,count(distinct visiteur) n from visites where jour::date>current_date-30 group by 1) c),
'visiteurs_30j',(select count(distinct visiteur) from visites where jour::date>current_date-30),
'pages_30j',(select coalesce(sum(pages),0) from visites where jour::date>current_date-30),
'demandes',(select jsonb_build_object('total',count(*),'j30',count(*) filter (where created_at::timestamptz>now()-interval '30 days')) from requests)
) as d
