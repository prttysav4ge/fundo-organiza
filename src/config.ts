// Conexión a Supabase. La clave "anon" es pública por diseño: la base de datos
// solo permite leer lo público y toda escritura pasa por funciones que exigen
// una sesión válida (ver supabase/schema.sql). Nunca pongas aquí la clave
// service_role ni la contraseña de la base de datos.
export const SUPABASE = {
  url: 'https://przhtmegkagemmzyespd.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByemh0bWVna2FnZW1tenllc3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3MTY3NzUsImV4cCI6MjExMDI5Mjc3NX0.eO-Qpr-BQkLt8RiKZxJMmGGEScZt104TL8ldEF7hbME',
}

/** VITE_LOCAL=1 compila una versión de demostración que guarda todo en el navegador. */
export const LOCAL_ONLY = import.meta.env.VITE_LOCAL === '1'
