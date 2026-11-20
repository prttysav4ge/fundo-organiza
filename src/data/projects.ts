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
    description: "HuaicoScan te dice en 10 segundos si el huaico puede llegar a tu casa en Trujillo. Abre el enlace en tu celular o PC, usa tu GPS o toca tu casa en el mapa: verás tu nivel de riesgo (alto, medio o bajo) según la distancia a los cauces de las quebradas San Ildefonso, El León, San Carlos y Río Seco y las zonas inundadas en 2017. Te muestra el punto seguro más cercano y la ruta a pie. Incluye modo emergencia, un plan familiar que armas en un minuto y compartes por WhatsApp, y una mochila de emergencia adaptada a tu familia. Funciona sin internet después de abrirla una vez. Gratis, sin registro y sin descargar nada.",
    problem: "El ENFEN mantiene la alerta de El Niño Costero y prevé lluvias sobre lo normal, de moderada a fuerte intensidad, en la costa norte hasta el verano 2027 (Comunicado oficial N.° 19-2026). En 2017, los huaicos de las quebradas San Ildefonso y El León inundaron El Porvenir, Florencia de Mora, Trujillo, Víctor Larco, Huanchaco y El Milagro (INGEMMET). La información oficial existe, pero es técnica, nacional y pensada para autoridades: un vecino no sabe si el agua puede llegar a su calle, a dónde ir ni qué hacer. HuaicoScan traduce esos datos abiertos a una respuesta personal y a acciones concretas para que las familias trujillanas se preparen antes de que llueva.",
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
    description: "MentorIA es una plataforma de mentoría académica con inteligencia artificial que acompaña a los estudiantes universitarios mientras escriben su proyecto de tesis. Un equipo de agentes de IA especializados trabaja de forma coordinada: uno investiga, otro audita, otro revisa la metodología y otro ayuda a redactar. Juntos le dan al estudiante retroalimentación inmediata, personalizada y disponible a cualquier hora.",
    problem: "En las universidades, cada asesor tiene muchos tesistas y poco tiempo para revisar a fondo sus avances. Por eso los estudiantes pasan semanas esperando correcciones, repiten los mismos errores de estructura y argumentación, y sus tesis se retrasan o se abandonan. MentorIA reduce esa espera y mejora la calidad metodológica desde el primer borrador. El asesor puede dedicarse a orientar el fondo de la investigación y deja de corregir errores de forma.",
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
    description: "HuacaScan Field es un sistema de visión computacional que apoya la detección preventiva de posibles hallazgos arqueológicos durante obras de construcción. Un trabajador de campo fotografía un objeto o área sospechosa desde la app móvil; el sistema analiza la imagen y genera una alerta con un nivel de confianza, junto con la ubicación georreferenciada. El reporte llega a un panel web donde el arqueólogo colegiado revisa la evidencia, el mapa de incidencias y el historial de la obra, y decide si corresponde una evaluación adicional, la decisión final siempre es del especialista, no del sistema,. Así, HuacaScan Field busca reducir las paralizaciones imprevistas de obra por hallazgos arqueológicos no anticipados, dando a jefes de obra y arqueólogos un indicador temprano de riesgo antes de excavar.",
    problem: "Durante excavaciones, el personal de obra puede ser el primero en ver un posible hallazgo arqueológico, pero no sabe reconocerlo ni cómo reportarlo rápido, y hoy la única alternativa es asumir el riesgo hasta que ocurre una paralización imprevista. HuacaScan Field da a jefes de obra, supervisores y arqueólogos colegiados, sobre todo de constructoras medianas en Trujillo y La Libertad, una alerta preventiva temprana que agiliza la comunicación y la evaluación especializada antes de que la obra se detenga sin aviso.",
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
    description: "Core Tools Lab es una plataforma digital creada para apoyar a estudiantes universitarios en la gestión de su vida académica. A través de herramientas especializadas, los estudiantes pueden calcular sus notas, organizar sus horarios y hacer seguimiento a su rendimiento académico de manera sencilla y confiable.",
    problem: "Los estudiantes universitarios enfrentan dificultades para gestionar eficientemente su vida académica debido a la falta de herramientas centralizadas que les permitan organizar sus horarios, calcular sus calificaciones, controlar su asistencia y realizar un seguimiento de su rendimiento académico. Esto genera pérdida de tiempo, procesos manuales y dificultades para tomar decisiones oportunas sobre su desempeño y planificación académica.",
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
    description: "Trujillo Informado es una aplicación web orientada a fortalecer la gestión ambiental y la participación ciudadana mediante el registro y seguimiento de incidencias en la ciudad. La plataforma permite a los ciudadanos generar reportes, adjuntar fotografías, registrar la ubicación de cada problema mediante georreferenciación y visualizar los puntos reportados en mapas integrados con Leaflet y Mapbox. Además, cuenta con un panel de supervisión que centraliza la información almacenada en la base de datos, permite consultar reportes, aplicar filtros, revisar historiales y exportar información en formato PDF. El sistema integra frontend y backend mediante APIs, garantizando la comunicación entre sus distintos módulos y el manejo estructurado de los datos. También incorpora mecanismos de notificación y automatización para apoyar el seguimiento de las incidencias. Su desarrollo consideró aspectos de usabilidad, estabilidad, seguridad, precisión geográfica y rendimiento, con el objetivo de facilitar una gestión más eficiente, organizada y transparente de los reportes ciudadanos.",
    problem: "la falta de un sistema centralizado y eficiente para reportar y dar seguimiento a problemas ambientales",
    members: ['Anghelo Pintado', 'Cindy Montoya'],
    groupIds: ['c8'],
  },
  {
    id: 'axis',
    image: '/concurso/axis.jpg',
    name: 'AXIS',
    url: 'https://d2dzf09y8gvbq6.cloudfront.net',
    summary: 'Convierte los errores de obras públicas pasadas en revisiones automáticas para que los expedientes técnicos nuevos no los repitan.',
    description: "Axis convierte los errores de obras públicas pasadas en pruebas automáticas y las aplica a cada expediente técnico nuevo antes de aprobarlo. El evaluador sube el expediente en PDF. Axis oculta los datos personales en el navegador, extrae lo necesario y lo compara con el terreno real donde se construirá la obra. Luego ejecuta verificaciones que nacieron de errores que ya le costaron dinero al Estado. Cada alerta indica qué falló, en qué página y en qué obra anterior ocurrió ese mismo error. La decisión final sigue siendo del evaluador. Además, Axis consulta adjudicaciones y proveedores en registros públicos de SEACE para revisar los antecedentes de los ganadores. Cuando aparece un error nuevo durante la ejecución, el supervisor lo registra, un curador lo valida y se convierte en una prueba más. Hoy lo que se aprende en una obra se queda en esa obra. Con Axis, cada error se paga una sola vez.",
    problem: "En el Perú se aprueban expedientes técnicos de obra que repiten fallas ya conocidas. Esas fallas se terminan pagando como adicionales, ampliaciones de plazo, sobrecostos y obras paralizadas. A junio de 2026 había 2,262 obras paralizadas en el país, 92 de ellas en La Libertad.\nEsto ocurre por cinco causas:\n- La memoria se pierde. Lo aprendido en una obra queda disperso en resoluciones, informes y cuadernos, o se va con el personal que rota.\n- Las lecciones aprendidas son solo texto. Nadie las relee cuando tiene 50 expedientes encima.\n- La revisión depende de acordarse. Si el evaluador olvida que en esa zona la napa es alta, no lo verifica.\n- El terreno no se cruza con el expediente. Nadie contrasta sistemáticamente el suelo, la napa, las redes y los postes con lo que dice el documento.\n- No hay retroalimentación. Cuando una deficiencia genera un adicional, esa causa no vuelve a corregir el siguiente expediente.\nAdemás, el evaluador responde con su nombre: en el GRLL ya hubo procesos disciplinarios por dar conformidad a expedientes deficientes.\nAxis convierte cada error documentado en una verificación automática para que no se repita.",
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
    description: "Una experiencia creada para los fans de Grand Theft Auto VI que quieren seguir de cerca su esperado lanzamiento. Consulta la cuenta regresiva, descubre la hora de estreno en 40 países y diferentes regiones, explora el mapa y encuentra fácilmente tu ubicación. Guarda tus preferencias y mantente al tanto de cuánto falta para uno de los lanzamientos más esperados de los videojuegos.",
    problem: "Los fans de GTA VI no siempre tienen claro a qué hora estará disponible el juego en su país debido a las diferencias horarias y al lanzamiento regional. Esta landing centraliza los horarios de estreno de distintos países y regiones en un solo lugar, permitiendo consultar cuánto falta para el lanzamiento sin tener que realizar conversiones de horario o buscar información en diferentes fuentes.",
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
    description: "RutaCréditos es una aplicación web gratuita que facilita la planificación académica de estudiantes de Ingeniería de Sistemas e Inteligencia Artificial e Ingeniería de Computación y Sistemas de la UPAO. Permite importar reportes de notas en PDF, Excel o CSV para reconocer cursos aprobados, gestionar equivalencias entre mallas curriculares ICSI 2022 e ISIA 2025 y visualizar el avance académico. Además, genera planes de estudio para los próximos ciclos considerando prerrequisitos y límites de créditos, permite comparar escenarios de matrícula y explica cada requisito con referencias a fuentes oficiales. Funciona directamente en el navegador, sin registro ni envío de información académica a servidores externos.",
    problem: "Los estudiantes de UPAO, especialmente quienes atraviesan la transición de la malla curricular ICSI 2022 a ISIA 2025, tienen dificultades para identificar qué asignaturas deben convalidar, cuáles tienen aprobadas y qué prerrequisitos necesitan cumplir para avanzar. La información se encuentra dispersa en reportes de notas, documentos PDF y tablas de equivalencias, lo que obliga a realizar cruces manuales y planificar los siguientes ciclos mediante hojas de cálculo. Esto genera confusión, pérdida de tiempo y riesgo de cometer errores al organizar la matrícula, como repetir cursos ya aprobados, omitir asignaturas necesarias o exceder el límite de créditos permitido.",
    members: ['Jeancarlo Morales', 'Eduardo Mamani'],
    groupIds: ['c8'],
  },
  {
    id: 'cursa-ai',
    image: '/concurso/cursa-ai.jpg',
    name: 'Cursa AI',
    url: 'https://plataforma-estudio-ai.vercel.app',
    summary: 'Sube tu material en texto o PDF y la inteligencia artificial lo convierte en resúmenes, mapas conceptuales y preguntas para practicar.',
    description: "Cursa AI es una plataforma web de estudio asistido por inteligencia artificial. El estudiante ingresa con su cuenta de Google y sube un tema en texto o PDF. A partir de ese material, la IA genera resúmenes (general y esencial) y mapas conceptuales descargables. Además, ofrece preguntas de práctica y pruebas cronometradas con resultados, y un seguimiento de progreso que adapta la dificultad según el rendimiento.",
    problem: "Los estudiantes universitarios se enfrentan a mucho material extenso, como PDFs, apuntes y lecturas. Les cuesta identificar las ideas clave, organizarlas y comprobar si de verdad dominan el tema. Suelen usar herramientas separadas para resumir, hacer esquemas y autoevaluarse, y pierden tiempo en ello. Tampoco reciben retroalimentación que se ajuste a su nivel.\n\nCursa AI reúne estas tareas en un solo lugar. Convierte el material en resúmenes y mapas conceptuales, permite practicar y evaluarse, y muestra el avance. Así reduce el tiempo de preparación y ayuda a estudiar de forma más organizada y personalizada.",
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
    description: "NEXORA es una plataforma web que integra inteligencia artificial y simulación empresarial para ayudar a emprendedores, pequeños empresarios y estudiantes a tomar mejores decisiones. Permite identificar problemas en un negocio y obtener posibles soluciones generadas por IA. A partir de las estrategias seleccionadas, realiza simulaciones interactivas que muestran sus posibles consecuencias a corto, mediano y largo plazo mediante un árbol de escenarios. Además, incorpora un chatbot inteligente que explica los resultados, responde consultas y ayuda a identificar riesgos y oportunidades. De esta manera, NEXORA ofrece un entorno de experimentación donde los usuarios pueden evaluar alternativas, comparar escenarios y aprender de sus decisiones sin arriesgar los recursos de un negocio real.",
    problem: "Los emprendedores y pequeños empresarios suelen tomar decisiones importantes sobre marketing, precios, inversiones o gestión sin contar con herramientas accesibles que les permitan evaluar sus posibles consecuencias antes de aplicarlas. Esto puede generar pérdidas económicas y dificultar la identificación de estrategias adecuadas. NEXORA busca resolver esta problemática ofreciendo un entorno de simulación donde los usuarios pueden explorar distintas alternativas, visualizar sus posibles efectos y comprender los riesgos y oportunidades de cada decisión mediante inteligencia artificial.",
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
    description: "Nuestra plataforma es una herramienta web Micro SaaS B2B de diagnóstico organizacional diseñada para ayudar a startups y mypes en expansión a detectar cuellos de botella, cruces de mando y riesgos de escalabilidad. Guiándonos por The Micro SaaS Handbook de Rick Blyth, enfocamos la solución en un micro-nicho específico con presupuesto para herramientas —empresas pequeñas que crecen rápido y necesitan estructurarse antes de colapsar— resolviendo un problema doloroso y recurrente mediante un MVP funcional, ágil y de bajo costo. Además, incorporamos la generación de un reporte ejecutivo descargable como momento de valor compartible para validar demanda real y sentar las bases de un modelo de ingresos recurrentes sin inversión externa.",
    problem: "Resuelve el problema recurrente de desorden estructural que enfrentan startups, mypes y agencias cuando crecen en equipo o ventas sin adaptar su organización, generando decisiones centralizadas en la dirección, tramos de control saturados, cruces de mando y falta de coordinación. En lugar de depender de análisis lentos o planillas manuales, ofrece un diagnóstico visual e inmediato para detectar estos puntos de fricción a tiempo y priorizar acciones concretas antes de que la operación se atasque.",
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
    description: "AquaCheck es una aplicación web gratuita para prepararse ante un corte de agua. Se abre desde el celular, sin cuenta ni contraseña. La familia indica cuántas personas son y cuánta agua guarda, y la app calcula cuántos días le alcanza. Muestra un semáforo con las tareas de mantenimiento (limpieza del tanque, cambio de cartuchos y del filtro), con plazos que se pueden cambiar, y las pasa al calendario del celular. Incluye pasos para antes, durante y después del corte y lleva a las fuentes oficiales: SEDALIB, INDECI, SENAMHI y la municipalidad de cada distrito. Funciona sin internet. Las familias del programa se unen con un QR o desde «Agregar mi casa», y el equipo monitorea los hogares en un panel con reportes en Excel, Word, PDF y CSV.",
    problem: "Ayuda a las familias de Trujillo, y en especial de Moche, que viven cortes de agua y enfrentan el riesgo del Fenómeno El Niño. Muchas no saben cuántos días les alcanza el agua que guardan, olvidan limpiar el tanque o dar mantenimiento al filtro, y no tienen a mano los contactos oficiales cuando el servicio se interrumpe. AquaCheck les da un plan claro y simple en su celular, sin costo y sin instalar nada. También ayuda al equipo del proyecto a ver, de un vistazo, qué hogares están al día, cuáles necesitan atención y qué fallas reportan las familias.",
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
