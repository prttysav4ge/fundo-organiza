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
  /** Video de YouTube (id) cuando no tenemos el archivo. */
  youtube?: string
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
    url: 'https://frontendtrujilloinformado.vercel.app/',
    summary: 'Permite a los ciudadanos reportar problemas ambientales de Trujillo con fotos y ubicación, y seguirlos hasta su solución.',
    description:
      'Los reportes se ven en un mapa y llegan a un panel de supervisión donde se filtran, se revisa su historial y se exportan en PDF, con notificaciones para darles seguimiento.',
    problem: 'No existe un sistema centralizado y eficiente para reportar y dar seguimiento a los problemas ambientales de la ciudad.',
    members: ['Anghelo Pintado', 'Cindy Montoya'],
    groupIds: ['c8'],
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
    video: '/concurso/rutacredito.mp4',
    poster: '/concurso/rutacredito.jpg',
    name: 'RutaCredito',
    url: 'https://rutacredito.vercel.app/',
    summary: 'Ayuda a los estudiantes de ICSI e ISIA a planificar su matrícula: convalida cursos entre mallas y proyecta los próximos ciclos según prerrequisitos y créditos.',
    description:
      'Importa tu reporte de notas en PDF, Excel o CSV para reconocer los cursos aprobados, aplicar las equivalencias entre la malla ICSI 2022 e ISIA 2025 y comparar escenarios de matrícula. Funciona en el navegador, sin registro y sin enviar tus datos a ningún servidor.',
    problem: 'Con el cambio de malla, saber qué cursos se convalidan y qué prerrequisitos faltan obliga a cruzar a mano reportes, PDF y tablas, con riesgo de errores al matricularse.',
    members: ['Jeancarlo Morales', 'Eduardo Mamani'],
    groupIds: ['c8'],
  },
  {
    id: 'cursa-ai',
    image: '/concurso/cursa-ai.jpg',
    name: 'Cursa AI',
    url: 'https://plataforma-estudio-ai.vercel.app',
    summary: 'Sube tu material en texto o PDF y la inteligencia artificial lo convierte en resúmenes, mapas conceptuales y preguntas para practicar.',
    description:
      'Ingresas con tu cuenta de Google, subes un tema y obtienes resúmenes, mapas conceptuales descargables, preguntas de práctica y pruebas cronometradas. Sigue tu progreso y ajusta la dificultad según tu rendimiento.',
    problem: 'Los estudiantes usan herramientas separadas para resumir, hacer esquemas y autoevaluarse, pierden tiempo y no reciben retroalimentación según su nivel.',
    members: ['Esthefany Alcantara', 'Mathias Castillo', 'Karina Aguilar', 'Diego Chávez', 'Valentino Paredes', 'María Poémape', 'Lucas Muñoz'],
    groupIds: ['c6'],
    test: { fields: [{ label: 'Acceso', value: 'Inicia sesión con tu cuenta de Google' }] },
  },
  {
    id: 'nexora',
    video: '/concurso/nexora.mp4',
    poster: '/concurso/nexora.jpg',
    name: 'Nexora',
    url: 'https://nexora-web-sage-one.vercel.app/',
    summary: 'Simula con inteligencia artificial las consecuencias de tus decisiones de negocio antes de arriesgar dinero real.',
    description:
      'Identifica problemas de un negocio, propone soluciones con IA y simula cada estrategia en un árbol de escenarios a corto, mediano y largo plazo. Un chatbot explica los resultados, los riesgos y las oportunidades.',
    problem: 'Emprendedores y pequeños empresarios deciden sobre precios, marketing o inversiones sin herramientas accesibles para prever sus consecuencias.',
    members: ['Gerardo Gonzalez', 'Beatriz Gonzalez'],
    groupIds: ['c6', 'ce'],
  },
  {
    id: 'deo',
    video: '/concurso/deo.mp4',
    poster: '/concurso/deo.jpg',
    name: 'DEO',
    url: 'https://justmenae.github.io/creacion-tecnologica/',
    summary: 'Diagnostica la estructura de startups y mypes que crecen rápido para detectar a tiempo cuellos de botella y cruces de mando.',
    description:
      'Arma el organigrama de tu empresa y obtén un índice de salud organizacional con alertas, arquetipos y un plan de acción basado en Mintzberg, Daft y Galbraith. Genera un reporte ejecutivo descargable.',
    problem: 'Cuando una empresa pequeña crece sin adaptar su organización, las decisiones se centralizan, los equipos se saturan y la operación se atasca.',
    members: ['Danae de la Cruz', 'Pedro Jeanpool'],
    groupIds: ['c2'],
  },
  {
    id: 'aquacheck',
    video: '/concurso/aquacheck.mp4',
    poster: '/concurso/aquacheck.jpg',
    name: 'AquaCheck',
    url: 'https://aquacheck-26.vercel.app',
    summary: 'Ayuda a las familias de Trujillo a prepararse ante un corte de agua: calcula cuántos días les alcanza y les recuerda el mantenimiento del tanque.',
    description:
      'Desde el celular, sin cuenta: indicas cuántos son y cuánta agua guardan, y muestra los días que alcanza, un semáforo de mantenimiento y los pasos para antes, durante y después del corte, con contactos oficiales. Funciona sin internet y tiene un panel para el equipo del programa.',
    problem: 'Muchas familias, sobre todo en Moche, no saben cuánto les dura el agua guardada, olvidan limpiar el tanque y no tienen a mano los contactos oficiales.',
    members: ['Juan Carranza'],
    groupIds: ['c10'],
    test: {
      note: 'El uso normal no pide cuenta. Esta es solo para el panel de Administración (botón «Administrador», arriba a la derecha)',
      fields: [
        { label: 'Usuario', value: 'aquacheck.prueba@gmail.com' },
        { label: 'Contraseña', value: 'aquacheckprueba2026' },
      ],
    },
  },
]
