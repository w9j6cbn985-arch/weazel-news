-- Einmalig im Supabase SQL Editor ausfuehren (nach supabase.sql): uebernimmt den bisherigen internen Text.
-- Der Text steht danach NICHT mehr in der oeffentlichen HTML-Datei.
insert into public.site_state (id, data)
values (1, jsonb_build_object('int', $seed$# Pressegesetz des Staates San Andreas
https://docs.google.com/document/d/1-MyFVg57MVaZ96-8Q6fJSdyrmQBx9nJUrnbVYzW1p-4/edit?tab=t.0

# DVO
https://docs.google.com/document/d/1a_PBNv25MMX1Zfzc6BCyWpWp4YpLaiJXbHibZos5M44/edit?usp=sharing 

# Rechtschreibprüfung
https://www.zerogpt.com/grammar-checker

# Kleidung
Die Marke finden sie unter Weste 106/6
bitte professionnel/ business casual/ Seriös Outfit$seed$::text))
on conflict (id) do update set data = public.site_state.data || excluded.data, updated_at = now();
