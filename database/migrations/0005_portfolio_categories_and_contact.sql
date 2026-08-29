alter table public.projects alter column year drop not null;

alter table public.projects drop constraint if exists projects_project_type_check;
update public.projects
set project_type = case
  when project_type = 'residential' then 'interior'
  when project_type = 'renovation' then 'interior'
  else project_type
end
where project_type in ('residential', 'renovation');

alter table public.projects
  add constraint projects_project_type_check
  check (project_type is null or project_type in ('kitchen', 'bathroom', 'interior', 'exterior', 'commercial', 'custom', 'other'));

update public.projects
set project_type = case slug
  when 'toyota-dealership-tile' then 'commercial'
  when 'homer-glen-steam-shower' then 'bathroom'
  when 'oak-lawn-bathroom' then 'bathroom'
  when 'chicago-south-side-kitchen' then 'kitchen'
  when 'crestwood-bathroom' then 'bathroom'
  when 'wisconsin-kitchen' then 'kitchen'
  when 'chicago-north-side-apartment' then 'interior'
  when 'lake-geneva-balcony' then 'exterior'
  when 'hidden-basement-door' then 'custom'
  when 'coffee-station' then 'custom'
  else project_type
end
where slug in (
  'toyota-dealership-tile',
  'homer-glen-steam-shower',
  'oak-lawn-bathroom',
  'chicago-south-side-kitchen',
  'crestwood-bathroom',
  'wisconsin-kitchen',
  'chicago-north-side-apartment',
  'lake-geneva-balcony',
  'hidden-basement-door',
  'coffee-station'
);

update public.projects
set featured = slug in (
  'toyota-dealership-tile',
  'homer-glen-steam-shower',
  'chicago-south-side-kitchen',
  'chicago-north-side-apartment',
  'lake-geneva-balcony',
  'hidden-basement-door'
)
where slug in (
  'toyota-dealership-tile',
  'homer-glen-steam-shower',
  'oak-lawn-bathroom',
  'chicago-south-side-kitchen',
  'crestwood-bathroom',
  'wisconsin-kitchen',
  'chicago-north-side-apartment',
  'lake-geneva-balcony',
  'hidden-basement-door',
  'coffee-station'
);

create index if not exists projects_public_category_idx
  on public.projects (published, project_type, display_order);
create index if not exists projects_cover_image_id_idx
  on public.projects (cover_image_id)
  where cover_image_id is not null;
create index if not exists site_settings_hero_image_id_idx
  on public.site_settings (hero_image_id)
  where hero_image_id is not null;
create index if not exists site_settings_about_image_id_idx
  on public.site_settings (about_image_id)
  where about_image_id is not null;

update public.site_settings
set
  hero_image_id = (
    select cover_image_id
    from public.projects
    where slug = 'chicago-south-side-kitchen'
    limit 1
  ),
  contact_copy = 'Call or text for the fastest answer. You can also email us or send the project details here.',
  contact_copy_es = 'Llame o mande texto para una respuesta más rápida. También puede enviar correo o los detalles del proyecto aquí.'
where id = 1;
