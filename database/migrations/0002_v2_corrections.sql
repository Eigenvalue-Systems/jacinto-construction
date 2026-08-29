alter table public.projects add column if not exists project_value numeric(14, 2);
alter table public.projects add column if not exists location_es text;
alter table public.projects alter column project_type drop not null;
alter table public.projects alter column project_type drop default;
alter table public.projects drop constraint if exists projects_project_type_check;
alter table public.projects
  add constraint projects_project_type_check
  check (project_type is null or project_type in ('residential', 'commercial', 'renovation', 'other'));
alter table public.projects drop constraint if exists projects_project_value_check;
alter table public.projects
  add constraint projects_project_value_check
  check (project_value is null or project_value >= 0);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins read admin list" on public.admin_users;
create policy "admins read admin list"
  on public.admin_users for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects"
  on public.projects for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage images" on public.project_images;
create policy "admins manage images"
  on public.project_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage settings" on public.site_settings;
create policy "admins manage settings"
  on public.site_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins read messages" on public.contact_messages;
create policy "admins read messages"
  on public.contact_messages for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins delete messages" on public.contact_messages;
create policy "admins delete messages"
  on public.contact_messages for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "admins upload project images" on storage.objects;
create policy "admins upload project images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-images' and public.is_admin());

drop policy if exists "admins update project images" on storage.objects;
create policy "admins update project images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-images' and public.is_admin());

drop policy if exists "admins delete project images" on storage.objects;
create policy "admins delete project images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-images' and public.is_admin());

update public.site_settings set
  owner_name = '',
  service_area = 'The Chicago area',
  service_area_es = 'El área de Chicago',
  homepage_headline = 'Built with care. Made to last.',
  homepage_headline_es = 'Construido con cuidado. Hecho para durar.',
  homepage_intro = 'Jacinto Construction handles interior and exterior construction work in the Chicago area, coordinating each project from the work on site through the subcontractors needed to complete it.',
  homepage_intro_es = 'Jacinto Construction realiza trabajos de construcción interior y exterior en el área de Chicago, coordinando cada proyecto desde el trabajo en obra hasta los subcontratistas necesarios para terminarlo.',
  about_intro = 'Jacinto Construction takes on interior and exterior construction work in the Chicago area and coordinates the trades needed to finish each project properly.',
  about_intro_es = 'Jacinto Construction realiza trabajos de construcción interior y exterior en el área de Chicago y coordina los oficios necesarios para terminar cada proyecto como se debe.',
  about_copy = E'Jacinto Construction is a Chicago area construction company. The work covers interior and exterior construction, renovations and improvements, and the coordination of projects that bring in subcontractors for specialized trades.\n\nEach project runs on one schedule. The work on site, the subcontractors and the details in between are managed so the client deals with one company from start to finish.\n\nQuotes are plain. Timelines are realistic. Questions get answered.',
  about_copy_es = E'Jacinto Construction es una empresa de construcción del área de Chicago. El trabajo abarca construcción interior y exterior, remodelaciones y mejoras, y la coordinación de proyectos que requieren subcontratistas para oficios especializados.\n\nCada proyecto se maneja en un solo calendario. El trabajo en obra, los subcontratistas y los detalles intermedios se administran para que el cliente trate con una sola empresa de principio a fin.\n\nLas cotizaciones son claras. Los plazos son realistas. Las preguntas se responden.',
  services_list = E'Interior work\nExterior work\nRenovation and improvements\nProject coordination\nSubcontractor management',
  services_list_es = E'Trabajo interior\nTrabajo exterior\nRemodelación y mejoras\nCoordinación de proyectos\nAdministración de subcontratistas',
  contact_copy = 'Call for the fastest answer. Messages sent from this page go straight to Jacinto Construction''s email.',
  contact_copy_es = 'Llame para una respuesta más rápida. Los mensajes enviados desde esta página llegan directo al correo de Jacinto Construction.',
  default_meta_description = 'Jacinto Construction is a Chicago area construction company for interior and exterior work, renovations and improvements, with project coordination and subcontractor management. Call (773) 574-1060.',
  default_meta_description_es = 'Jacinto Construction es una empresa de construcción del área de Chicago para trabajo interior y exterior, remodelaciones y mejoras, con coordinación de proyectos y administración de subcontratistas. Llame al (773) 574-1060.'
where id = 1
  and about_intro like 'Luis Jacinto learned construction two ways%';
