create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_es text,
  slug text not null unique,
  year integer not null check (year between 1900 and 2100),
  location text not null default '',
  neighborhood text,
  project_type text not null default 'residential' check (project_type in ('residential', 'commercial', 'renovation', 'other')),
  short_description text not null default '',
  short_description_es text,
  full_description text not null default '',
  full_description_es text,
  details text not null default '',
  details_es text,
  completion_date date,
  featured boolean not null default false,
  published boolean not null default false,
  display_order integer not null default 0,
  cover_image_id uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  storage_key text not null,
  storage_key_medium text,
  storage_key_thumb text,
  alt_text text not null default '',
  caption text not null default '',
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  image_group text not null default 'gallery' check (image_group in ('gallery', 'before', 'after')),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.projects
  drop constraint if exists projects_cover_image_id_fkey;
alter table public.projects
  add constraint projects_cover_image_id_fkey
  foreign key (cover_image_id) references public.project_images (id) on delete set null;

create index if not exists projects_published_idx on public.projects (published, display_order, year desc);
create index if not exists projects_featured_idx on public.projects (featured) where featured;
create index if not exists project_images_project_idx on public.project_images (project_id, display_order);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  company_name text not null default 'Jacinto Construction',
  owner_name text not null default '',
  phone text not null default '',
  email text not null default '',
  location text not null default '',
  service_area text not null default '',
  service_area_es text,
  homepage_headline text not null default '',
  homepage_headline_es text,
  homepage_intro text not null default '',
  homepage_intro_es text,
  about_intro text not null default '',
  about_intro_es text,
  about_copy text not null default '',
  about_copy_es text,
  services_list text not null default '',
  services_list_es text,
  contact_copy text not null default '',
  contact_copy_es text,
  default_meta_description text not null default '',
  default_meta_description_es text,
  social_links jsonb not null default '[]'::jsonb,
  hero_image_id uuid references public.project_images (id) on delete set null,
  about_image_id uuid references public.project_images (id) on delete set null,
  logo_key text,
  favicon_key text,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  contact text not null check (char_length(contact) between 1 and 160),
  message text not null check (char_length(message) between 1 and 4000),
  locale text not null default 'en' check (locale in ('en', 'es')),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "public reads published projects" on public.projects;
create policy "public reads published projects"
  on public.projects for select
  to anon
  using (published);

drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects"
  on public.projects for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "public reads images of published projects" on public.project_images;
create policy "public reads images of published projects"
  on public.project_images for select
  to anon
  using (
    project_id is null
    or exists (select 1 from public.projects p where p.id = project_images.project_id and p.published)
  );

drop policy if exists "admins manage images" on public.project_images;
create policy "admins manage images"
  on public.project_images for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings"
  on public.site_settings for select
  to anon
  using (true);

drop policy if exists "admins manage settings" on public.site_settings;
create policy "admins manage settings"
  on public.site_settings for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "anyone can send a message" on public.contact_messages;
create policy "anyone can send a message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admins read messages" on public.contact_messages;
create policy "admins read messages"
  on public.contact_messages for select
  to authenticated
  using (true);

drop policy if exists "admins delete messages" on public.contact_messages;
create policy "admins delete messages"
  on public.contact_messages for delete
  to authenticated
  using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set public = true;

drop policy if exists "public reads project images" on storage.objects;
create policy "public reads project images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'project-images');

drop policy if exists "admins upload project images" on storage.objects;
create policy "admins upload project images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-images');

drop policy if exists "admins update project images" on storage.objects;
create policy "admins update project images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-images');

drop policy if exists "admins delete project images" on storage.objects;
create policy "admins delete project images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-images');

insert into public.site_settings (
  id, company_name, owner_name, phone, email, location, service_area, service_area_es,
  homepage_headline, homepage_headline_es, homepage_intro, homepage_intro_es,
  about_intro, about_intro_es, about_copy, about_copy_es, services_list, services_list_es,
  contact_copy, contact_copy_es, default_meta_description, default_meta_description_es
) values (
  1,
  'Jacinto Construction',
  '',
  '(773) 574-1060',
  'luisjacinto1107@gmail.com',
  'South Chicago, Illinois',
  'The Chicago area',
  'El área de Chicago',
  'Built with care. Made to last.',
  'Construido con cuidado. Hecho para durar.',
  'Jacinto Construction handles interior and exterior construction work in the Chicago area, coordinating each project from the work on site through the subcontractors needed to complete it.',
  'Jacinto Construction realiza trabajos de construcción interior y exterior en el área de Chicago, coordinando cada proyecto desde el trabajo en obra hasta los subcontratistas necesarios para terminarlo.',
  'Jacinto Construction takes on interior and exterior construction work in the Chicago area and coordinates the trades needed to finish each project properly.',
  'Jacinto Construction realiza trabajos de construcción interior y exterior en el área de Chicago y coordina los oficios necesarios para terminar cada proyecto como se debe.',
  E'Jacinto Construction is a Chicago area construction company. The work covers interior and exterior construction, renovations and improvements, and the coordination of projects that bring in subcontractors for specialized trades.\n\nEach project runs on one schedule. The work on site, the subcontractors and the details in between are managed so the client deals with one company from start to finish.\n\nQuotes are plain. Timelines are realistic. Questions get answered.',
  E'Jacinto Construction es una empresa de construcción del área de Chicago. El trabajo abarca construcción interior y exterior, remodelaciones y mejoras, y la coordinación de proyectos que requieren subcontratistas para oficios especializados.\n\nCada proyecto se maneja en un solo calendario. El trabajo en obra, los subcontratistas y los detalles intermedios se administran para que el cliente trate con una sola empresa de principio a fin.\n\nLas cotizaciones son claras. Los plazos son realistas. Las preguntas se responden.',
  E'Interior work\nExterior work\nRenovation and improvements\nProject coordination\nSubcontractor management',
  E'Trabajo interior\nTrabajo exterior\nRemodelación y mejoras\nCoordinación de proyectos\nAdministración de subcontratistas',
  'Call for the fastest answer. Messages sent from this page go straight to Jacinto Construction''s email.',
  'Llame para una respuesta más rápida. Los mensajes enviados desde esta página llegan directo al correo de Jacinto Construction.',
  'Jacinto Construction is a Chicago area construction company for interior and exterior work, renovations and improvements, with project coordination and subcontractor management. Call (773) 574-1060.',
  'Jacinto Construction es una empresa de construcción del área de Chicago para trabajo interior y exterior, remodelaciones y mejoras, con coordinación de proyectos y administración de subcontratistas. Llame al (773) 574-1060.'
)
on conflict (id) do nothing;
