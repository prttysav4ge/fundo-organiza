// Proyectos postulados al Premio a la Excelencia en Creación Tecnológica Estudiantil.
// Se cargan a mano desde las respuestas del formulario. Por privacidad solo se
// publica lo que los postulantes autorizaron: nombre del proyecto, enlace,
// resumen, video y un nombre y un apellido por integrante (sin ID ni correos).

export interface TestAccess {
  label: string
  value: string
}

export interface ContestProject {
  /** Identificador; también nombra el video: public/concurso/<id>.mp4 */
  id: string
  name: string
  url: string
  /** Una oración que resume el proyecto. */
  summary: string
  /** Detalle breve para «Ver más». */
  description: string
  problem: string
  members: string[]
  /** Ciclo de los integrantes (id de grupo). */
  groupIds: string[]
  /** Datos para probar el sistema, si los dieron. */
  test?: { note?: string; fields: TestAccess[] }
  /** Imagen del proyecto cuando no hay video. */
  image?: string
  /** Video promocional (archivo en public/concurso) y su miniatura. */
  video?: string
  poster?: string
}

export const PROJECTS: ContestProject[] = [
  {
    id: 'huaicoscan',
    video: '/concurso/huaicoscan.mp4',
    poster: '/concurso/huaicoscan.jpg',
    name: 'HuaicoScan',
    url: 'https://huaicoscan.vercel.app/',
    summary: 'Te dice en segundos si un huaico podría llegar a tu casa en Trujillo y qué hacer para prepararte.',
    description:
      'Usa tu GPS o toca tu casa en el mapa para ver tu nivel de riesgo según la cercanía a las quebradas y las zonas inundadas en 2017. Te muestra el punto seguro más cercano, la ruta a pie, un plan familiar para compartir por WhatsApp y funciona sin internet.',
    problem: 'Con la alerta de El Niño Costero, la información oficial existe pero es técnica: un vecino no sabe si el agua puede llegar a su calle ni a dónde ir.',
    members: ['Anthony Lezcano'],
    groupIds: ['c10'],
  },
  {
    id: 'mentoria',
    video: '/concurso/mentoria.mp4',
    poster: '/concurso/mentoria.jpg',
    name: 'MentorIA',
    url: 'https://mentoria-992830166095.us-central1.run.app/',
    summary: 'Un equipo de agentes de inteligencia artificial que acompaña a los estudiantes mientras escriben su proyecto de tesis.',
    description:
      'Varios agentes especializados trabajan juntos: uno investiga, otro audita, otro revisa la metodología y otro ayuda a redactar, para dar retroalimentación inmediata y personalizada a cualquier hora.',
    problem: 'Los asesores tienen muchos tesistas y poco tiempo, así que los estudiantes esperan semanas por correcciones y sus tesis se retrasan o se abandonan.',
    members: ['Clever Aguilar', 'Alessia Aguilar'],
    groupIds: ['c10'],
    test: {
      fields: [
        { label: 'Correo', value: 'pruebas@gmail.com' },
        { label: 'Contraseña', value: 'pruebas' },
      ],
    },
  },
  {
    id: 'huacascan-field',
    video: '/concurso/huacascan-field.mp4',
    poster: '/concurso/huacascan-field.jpg',
    name: 'HuacaScan Field',
    url: 'https://huacascan-field.vercel.app/',
    summary: 'Con una foto, ayuda a los trabajadores de obra a detectar y reportar a tiempo posibles hallazgos arqueológicos durante una excavación.',
    description:
      'La app analiza la imagen con visión computacional y envía una alerta con nivel de confianza y ubicación a un panel web, donde un arqueólogo colegiado revisa la evidencia y decide. La decisión final siempre es del especialista.',
    problem: 'El personal de obra suele ser el primero en ver un posible hallazgo, pero no sabe reconocerlo ni reportarlo rápido, y la obra termina paralizada sin aviso.',
    members: ['Sebastian Yengle'],
    groupIds: ['c6'],
    test: { fields: [{ label: 'Código de equipo', value: 'DescubreUpao' }] },
  },
  {
    id: 'core-tools-lab',
    video: '/concurso/core-tools-lab.mp4',
    poster: '/concurso/core-tools-lab.jpg',
    name: 'Core Tools Lab',
    url: 'https://coretoolslab.com/',
    summary: 'Reúne en un solo lugar las herramientas para que los universitarios calculen sus notas, organicen su horario y sigan su rendimiento.',
    description: 'Una plataforma con herramientas para calcular notas, organizar horarios, controlar la asistencia y hacer seguimiento al rendimiento académico de forma sencilla.',
    problem: 'Sin herramientas centralizadas, los estudiantes hacen todo a mano, pierden tiempo y les cuesta tomar decisiones a tiempo sobre su desempeño.',
    members: ['Leandro Mauricci', 'Emilio Alfaro'],
    groupIds: ['c9'],
  },
  {
    id: 'trujillo-informado',
    video: '/concurso/trujillo-informado.mp4',
    poster: '/concurso/trujillo-informado.jpg',
    name: 'Trujillo Informado',
    url: 'https://www.trujilloinformado.app/login.html',
    summary: 'Permite a los ciudadanos reportar problemas ambientales de Trujillo con fotos y ubicación, y seguirlos hasta su solución.',
    description:
      'Los reportes se ven en un mapa y llegan a un panel de supervisión donde se filtran, se revisa su historial y se exportan en PDF, con notificaciones para darles seguimiento.',
    problem: 'No existe un sistema centralizado y eficiente para reportar y dar seguimiento a los problemas ambientales de la ciudad.',
    members: ['Anghelo Pintado', 'Cindy Montoya'],
    groupIds: ['c8'],
    test: {
      note: 'Cuenta de supervisor',
      fields: [
        { label: 'Correo', value: 'supervisorzona6tarde@gmail.com' },
        { label: 'Contraseña', value: 'supervisorzona6tarde' },
      ],
    },
  },
  {
    id: 'axis',
    image: '/concurso/axis.jpg',
    name: 'AXIS',
    url: 'https://d2dzf09y8gvbq6.cloudfront.net',
    summary: 'Convierte los errores de obras públicas pasadas en revisiones automáticas para que los expedientes técnicos nuevos no los repitan.',
    description:
      'El evaluador sube el expediente en PDF; AXIS oculta los datos personales, lo compara con el terreno real y avisa qué falló, en qué página y en qué obra anterior pasó lo mismo. También revisa los antecedentes de los ganadores en el SEACE. La decisión final es del evaluador.',
    problem: 'En el Perú se aprueban expedientes que repiten fallas ya conocidas, que terminan en sobrecostos y obras paralizadas (2,262 a junio de 2026, 92 en La Libertad).',
    members: ['Nicolás Romero', 'Johel Vargas', 'Hrid Sigüeñas'],
    groupIds: ['c6'],
  },
  {
    id: 'gta-vi-launch-tracker',
    video: '/concurso/gta-vi-launch-tracker.mp4',
    poster: '/concurso/gta-vi-launch-tracker.jpg',
    name: 'GTA VI Launch Tracker',
    url: 'https://gta-vi-launch-five.vercel.app/',
    summary: 'Una cuenta regresiva para los fans de GTA VI que muestra a qué hora sale el juego en 40 países, sin hacer conversiones de horario.',
    description:
      'Consulta la cuenta regresiva, la hora de estreno en distintos países y regiones, explora el mapa y encuentra tu ubicación. Guarda tus preferencias para seguir cuánto falta.',
    problem: 'Por las diferencias horarias y el lanzamiento regional, los fans no tienen claro a qué hora estará disponible el juego en su país.',
    members: ['Grezia Merino'],
    groupIds: ['c8'],
  },
  {
    id: 'rutacredito',
    name: 'RutaCredito',
    url: 'https://rutacredito.vercel.app/',
    summary: 'Ayuda a los estudiantes de ICSI e ISIA a planificar su matrícula: convalida cursos entre mallas y proyecta los próximos ciclos según prerrequisitos y créditos.',
    description:
      'Importa tu reporte de notas en PDF, Excel o CSV para reconocer los cursos aprobados, aplicar las equivalencias entre la malla ICSI 2022 e ISIA 2025 y comparar escenarios de matrícula. Funciona en el navegador, sin registro y sin enviar tus datos a ningún servidor.',
    problem: 'Con el cambio de malla, saber qué cursos se convalidan y qué prerrequisitos faltan obliga a cruzar a mano reportes, PDF y tablas, con riesgo de errores al matricularse.',
    members: ['Jeancarlo Morales', 'Eduardo Mamani'],
    groupIds: ['c8'],
  },
]
