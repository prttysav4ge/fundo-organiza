-- Corrección 1 (para quien ya ejecutó la instalación).
-- 1) Permite que el público lea actividades, anuncios y ajustes (el proyecto no lo da por defecto).
grant select on settings, activities, announcements to anon, authenticated;
-- 2) Horarios de las bases: almuerzo 2:00 – 3:00 p. m. y música con DJ desde la 1:00 p. m. hasta el cierre.
update activities set data = jsonb_set(data, '{end}', '"15:00"') where id = 'almuerzo';
update activities set data = data || '{"end":"17:00","note":"La música sigue hasta el cierre del evento."}'::jsonb where id = 'dj';
