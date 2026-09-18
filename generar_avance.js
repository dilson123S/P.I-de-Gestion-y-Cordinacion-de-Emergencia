const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, VerticalAlign,
  Footer, PageNumber, BorderStyle,
} = require("docx");

const TABLE_WIDTH = 9026; // usable width in DXA (A4, 1in margins)

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}
function h3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 } });
}
function p(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: 276 },
    children: [new TextRun({ text })],
  });
}
// Paragraph with a bold inline label, e.g. "Proceso actual: <texto>"
function labeledP(label, text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label} `, bold: true }),
      new TextRun({ text }),
    ],
  });
}
function note(text) {
  return new Paragraph({
    spacing: { after: 240 },
    shading: { type: ShadingType.CLEAR, fill: "FDEBD0" },
    children: [new TextRun({ text, italics: true, size: 20 })],
  });
}
function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text })] });
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.header ? { type: ShadingType.CLEAR, fill: "2C3E50" } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: !!opts.header, italics: !!opts.italic, color: opts.header ? "FFFFFF" : undefined, size: opts.size || 20 })],
      }),
    ],
  });
}

function table(colWidths, headerRow, rows) {
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headerRow.map((t, i) => cell(t, { width: colWidths[i], header: true })),
      }),
      ...rows.map(
        (r) => new TableRow({ children: r.map((t, i) => cell(t, { width: colWidths[i] })) })
      ),
    ],
  });
}

const children = [];

// Title
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: "Avance de Proyecto de Aula", bold: true, size: 32 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: "Ingeniería de Requerimientos y Validación del Modelado", size: 24 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: "Plataforma de Gestión de Emergencias", italics: true, size: 22 })],
  })
);

// Methodological note
children.push(h1("Nota metodológica"));
children.push(p(
  "Este avance separa dos tipos de contenido. Primero, el análisis del problema, los interesados, los requerimientos candidatos, su priorización y el plan de gestión del proyecto, que ya se desarrollan por completo en este documento a partir del problema y del modelado UML de la entrega anterior. Segundo, la evidencia de campo (entrevistas, encuesta y la validación del modelo frente a hallazgos reales), que el enunciado pide explícitamente como evidencia genuina de un proceso de elicitación y que, por integridad del ejercicio, debe completarse con datos reales del equipo."
));
children.push(p(
  "Los instrumentos para recoger esa evidencia (guiones de entrevista por actor y encuesta) ya están listos — ver el artefacto \"Instrumentos de elicitación\" compartido antes. Las secciones 3, 4 y 7 de este documento incluyen la estructura exacta que exige la rúbrica; a la fecha de este avance ya se aplicaron las cinco entrevistas (una por actor interno y una de ciudadano) y sus hallazgos están incorporados. La encuesta a ciudadanos sigue pendiente de aplicar."
));

// 1. Problem
children.push(h1("1. Descripción del problema"));
children.push(p(
  "En muchas ciudades, el reporte y la atención de emergencias ciudadanas dependen de canales telefónicos y de radio que no ofrecen visibilidad del estado de un caso una vez reportado, ni una asignación ágil de las unidades disponibles. El ciudadano debe describir verbalmente su ubicación y la naturaleza del evento, lo que introduce errores y demoras; el operador y el despachador dependen de herramientas manuales o poco integradas para clasificar reportes y decidir qué unidad enviar. Esta desconexión entre el reporte inicial, la clasificación, la asignación y el seguimiento en campo alarga los tiempos de respuesta y deja al ciudadano sin información sobre el estado de su solicitud."
));
children.push(p(
  "La Plataforma de Gestión de Emergencias busca atender esta necesidad con un canal digital unificado: el ciudadano reporta con evidencia y ubicación precisa, el operador valida y clasifica con datos estructurados, y el despachador asigna unidades con visibilidad en tiempo real de su disponibilidad. Los beneficiarios directos son los ciudadanos que reportan, el personal operativo de la central y las unidades de respuesta; el objetivo general es reducir el tiempo entre el reporte y la llegada de la ayuda, y dar trazabilidad completa del caso a todos los actores involucrados."
));

// 2. Stakeholders
children.push(h1("2. Identificación de interesados"));
children.push(p("Los interesados corresponden a los actores ya definidos en el modelado UML, más dos interesados adicionales identificados al analizar el contexto del problema."));
children.push(table(
  [2200, 3200, 3626],
  ["Interesado", "Relación con el proyecto", "Necesidades / expectativas"],
  [
    ["Ciudadano / usuario reportante", "Interesado primario; usa la app para reportar y hacer seguimiento a su caso", "Reportar rápido, con evidencia, y conocer el estado de su solicitud"],
    ["Operador de central", "Usuario interno; valida y clasifica los reportes entrantes", "Información completa y confiable para decidir rápido; reducir reportes duplicados o falsos"],
    ["Despachador", "Usuario interno; asigna unidades de respuesta", "Visibilidad en tiempo real de unidades disponibles y su ubicación"],
    ["Personal de unidad de respuesta", "Usuario interno en campo; atiende el caso asignado", "Recibir información clara de la asignación; poder actualizar el estado con conectividad limitada"],
    ["Administrador del sistema", "Usuario interno; gestiona usuarios, catálogos y configuración", "Control sobre permisos, catálogo de tipos de emergencia y unidades"],
    ["Supervisor / coordinador institucional", "Interesado de gestión; monitorea indicadores", "Métricas confiables de tiempos de respuesta y volumen de casos"],
    ["Entidad de socorro asociada (bomberos, policía, Cruz Roja)", "Interesado externo; provee las unidades de respuesta reales", "Información precisa y oportuna para poder actuar"],
    ["Docente / evaluador del proyecto de aula", "Interesado académico", "Evidencia clara de un proceso de elicitación riguroso y un modelo coherente y actualizado"],
  ]
));

// 3. Elicitation techniques
children.push(h1("3. Técnicas de elicitación aplicadas"));
children.push(p(
  "Se seleccionaron entrevistas semiestructuradas (una variante por cada actor interno y el ciudadano) y una encuesta cerrada para llegar a más ciudadanos en menos tiempo. Los guiones completos están en el anexo de instrumentos. La siguiente tabla resume el plan; las cinco entrevistas ya se aplicaron el 17 de septiembre de 2026 y sus hallazgos se detallan en la sección 4."
));
children.push(table(
  [1400, 2200, 1800, 1400, 2226],
  ["Técnica", "Objetivo", "Participantes (perfil)", "Herramienta", "Periodo previsto / hallazgos"],
  [
    ["Entrevista — Ciudadano", "Entender cómo reporta hoy una emergencia y qué esperaría de una app", "1-2 personas, cualquier adulto", "Guion A.1 (presencial o videollamada)", "Aplicada (17 sep. 2026) — 1 ciudadano. Hallazgos en sección 4"],
    ["Entrevista — Operador de central", "Entender el proceso de recepción y validación de reportes", "1 persona en el rol, o rol análogo (call center, vigilancia)", "Guion A.2", "Aplicada (17 sep. 2026) — 1 operador. Hallazgos en sección 4"],
    ["Entrevista — Despachador", "Entender cómo se decide qué unidad enviar", "1 persona en el rol o análogo", "Guion A.3", "Aplicada (17 sep. 2026) — 1 despachador. Hallazgos en sección 4"],
    ["Entrevista — Personal de unidad", "Entender el flujo de atención y condiciones en campo", "1 persona en el rol o análogo", "Guion A.4", "Aplicada (17 sep. 2026) — 1 persona de unidad. Hallazgos en sección 4"],
    ["Entrevista — Administrador/Supervisor", "Entender necesidades de gestión e indicadores", "1 persona en un rol de coordinación", "Guion A.5", "Aplicada (17 sep. 2026) — 1 administrador/supervisor. Hallazgos en sección 4"],
    ["Encuesta cerrada — Ciudadanos", "Contrastar con una muestra más amplia las funciones deseadas y hábitos de reporte", "15-30 personas", "Formulario B.1 (Google Forms)", "Pendiente — aún no se ha distribuido el formulario"],
  ]
));

// 4. Evidence samples
children.push(h1("4. Muestras de las herramientas utilizadas"));
children.push(p(
  "El guion completo de cada entrevista y el cuestionario de la encuesta se encuentran en el anexo \"Instrumentos de elicitación — Plataforma de Gestión de Emergencias\" (compartido junto con este documento). Una vez aplicados, agreguen aquí:"
));
children.push(
  bullet("Notas o transcripción breve de cada entrevista, identificando al participante solo por su rol."),
  bullet("Captura del formulario de encuesta y de los resultados agregados (gráficas de Google Forms)."),
  bullet("Si hicieron un taller o lluvia de ideas, una foto del tablero o del documento colaborativo usado.")
);

children.push(h3("Notas de entrevistas (17 de septiembre de 2026)"));
children.push(p(
  "A continuación, resumen de las cinco entrevistas aplicadas. Se identifica a cada participante solo por su rol, según lo pide la rúbrica."
));

children.push(h3("Ciudadano 1"));
children.push(labeledP(
  "Experiencia previa:",
  "Reportó por teléfono (línea 123) un accidente de tránsito que presenció; le pidieron ubicación y una descripción de lo ocurrido. La llamada fue rápida, pero después no tuvo información sobre qué había pasado ni cuánto tardaría en llegar la ayuda."
));
children.push(labeledP(
  "Funcionalidad esperada:",
  "Le gustaría reportar rápido, enviar su ubicación exacta y, si es posible, adjuntar fotos o video. También valora poder confirmar que el reporte ya fue recibido."
));
children.push(labeledP(
  "Sobre el tiempo estimado de llegada:",
  "Considera muy importante saber si la ayuda ya viene o cuánto falta, aunque reconoce que dar un tiempo exacto puede ser difícil."
));

children.push(h3("Operador de central"));
children.push(labeledP(
  "Proceso actual:",
  "Contesta la llamada, identifica qué está pasando y dónde, toma los datos del ciudadano y pasa el reporte al área correspondiente según el tipo de emergencia."
));
children.push(labeledP(
  "Validación:",
  "Revisa que la ubicación, el tipo de emergencia y los datos aportados tengan sentido, y registra el reporte en el sistema que usan actualmente."
));
children.push(labeledP(
  "Lo que más tiempo le hace perder:",
  "Reportes con ubicación o datos incompletos, el sistema lento y, sobre todo, tener que registrar la misma información en más de un lugar."
));

children.push(h3("Despachador"));
children.push(labeledP(
  "Decisión de unidad:",
  "Revisa el tipo de emergencia y qué unidad se necesita, y envía la que pueda llegar más rápido entre las disponibles."
));
children.push(labeledP(
  "Disponibilidad y ubicación:",
  "Consulta el sistema, pero la información no siempre está actualizada de inmediato, así que a veces confirma directamente con la unidad."
));
children.push(labeledP(
  "Cuando no hay unidad cercana:",
  "Si no hay ninguna cerca, busca otra unidad disponible aunque esté más lejos, y en algunos casos coordina apoyo con otra central."
));

children.push(h3("Personal de unidad"));
children.push(labeledP(
  "Asignación:",
  "Recibe la información del caso, revisa ubicación y tipo, y se dirige al lugar manteniendo comunicación con la central durante el trayecto."
));
children.push(labeledP(
  "Problemas de campo:",
  "Pérdida de señal en ciertas zonas y batería limitada cuando el turno es largo."
));
children.push(labeledP(
  "Cierre del caso:",
  "Informa a la central que terminó y da los detalles de lo ocurrido; el resultado del caso queda registrado."
));

children.push(h3("Administrador / supervisor"));
children.push(labeledP(
  "Información que revisa:",
  "Cantidad de reportes recibidos, tiempo de atención, unidades disponibles y casos cerrados."
));
children.push(labeledP(
  "Problemas detectados:",
  "La información a veces no está actualizada o queda registrada de formas distintas según el sistema; es difícil tener una vista general en tiempo real."
));
children.push(labeledP(
  "Requisitos de seguridad:",
  "La información de ciudadanos y emergencias debe estar bien protegida, con acceso restringido por rol y registro de quién consulta o modifica información importante."
));
children.push(labeledP(
  "Nota de alcance:",
  "Encuesta a ciudadanos: aún no se ha distribuido el formulario; queda pendiente para ampliar la muestra más allá de este ciudadano entrevistado."
));

children.push(note(
  "Pendiente: aplicar la encuesta a una muestra más amplia de ciudadanos (15-30 respuestas) y, si el tiempo lo permite, sumar una o dos entrevistas de ciudadano adicionales antes de la entrega final."
));

// 5. Requirements
children.push(h1("5. Requerimientos identificados"));
children.push(p(
  "La siguiente lista incluye los requerimientos candidatos derivados del análisis del problema y del modelo UML de la entrega anterior, ya contrastados con los hallazgos de las cinco entrevistas aplicadas. La columna \"Fuente\" indica el origen de cada uno; los marcados con una entrevista específica surgieron o se confirmaron con la evidencia de campo."
));

children.push(h2("5.1 Requerimientos funcionales"));
children.push(table(
  [700, 1400, 2600, 1400, 700, 2226],
  ["ID", "Nombre", "Descripción", "Fuente", "Prior.", "Criterio de aceptación"],
  [
    ["RF-01", "Registrar reporte", "El ciudadano crea un reporte con tipo, descripción, ubicación y evidencia (foto/audio)", "Análisis del problema", "Alta", "El sistema genera un número de caso y lo confirma en menos de 5 s"],
    ["RF-02", "Consultar estado del reporte", "El ciudadano ve el estado actual de su caso", "Análisis del problema", "Alta", "El estado mostrado refleja el último cambio registrado por operador o unidad"],
    ["RF-03", "Validar y clasificar reporte", "El operador marca el reporte como válido/inválido y le asigna tipo y prioridad", "Caso de uso UML", "Alta", "Un reporte no avanza a asignación sin haber sido clasificado"],
    ["RF-04", "Consultar disponibilidad de unidades", "El despachador ve unidades disponibles y su ubicación en un mapa", "Caso de uso UML", "Alta", "La lista se actualiza con la posición más reciente reportada por cada unidad"],
    ["RF-05", "Asignar unidad de respuesta", "El despachador asigna una unidad a un caso ya clasificado", "Caso de uso UML", "Alta", "La asignación queda registrada con fecha y hora, y notifica a la unidad"],
    ["RF-06", "Notificar asignación", "El sistema notifica a la unidad asignada y, opcionalmente, al ciudadano", "Análisis del problema", "Alta", "La notificación se envía en menos de 10 s desde la asignación"],
    ["RF-07", "Actualizar ubicación y estado en campo", "El personal de unidad actualiza su ubicación y el estado del caso desde una app móvil", "Caso de uso UML", "Alta", "El estado del caso cambia en el sistema al momento de la actualización"],
    ["RF-08", "Cerrar caso", "El personal de unidad o el despachador cierra el caso con un informe breve", "Caso de uso UML", "Media", "El caso cerrado queda con fecha de cierre y registro en la bitácora"],
    ["RF-09", "Gestionar catálogos y usuarios", "El administrador gestiona tipos de emergencia, unidades, estaciones y usuarios", "Caso de uso UML", "Media", "Los cambios en el catálogo se reflejan de inmediato en los formularios de clasificación"],
    ["RF-10", "Generar reportes estadísticos", "El supervisor genera reportes de tiempos de respuesta y volumen de casos por periodo", "Caso de uso UML", "Media", "El reporte se genera para cualquier rango de fechas seleccionado"],
    ["RF-11", "Registro único de información", "El sistema evita que el operador deba volver a digitar los mismos datos de un reporte en más de una pantalla o sistema", "Entrevista — Operador de central; Entrevista — Administrador/supervisor", "Alta", "Un reporte validado se refleja automáticamente en todas las pantallas y módulos relacionados sin doble digitación"],
    ["RF-12", "Solicitar apoyo externo", "El despachador puede registrar una solicitud de apoyo a otra central o entidad cuando no hay unidad propia disponible cerca del caso", "Entrevista — Despachador", "Media", "Cuando no hay unidad propia disponible en un radio definido, el despachador puede registrar la solicitud con fecha, hora y entidad contactada"],
  ]
));

children.push(h2("5.2 Requerimientos no funcionales"));
children.push(table(
  [700, 1400, 2600, 1400, 700, 2226],
  ["ID", "Nombre", "Descripción", "Fuente", "Prior.", "Criterio de aceptación"],
  [
    ["RNF-01", "Disponibilidad", "El sistema debe estar disponible al menos el 99% del tiempo, dado su carácter crítico", "Análisis del problema", "Alta", "El tiempo de inactividad mensual no supera ~7 horas"],
    ["RNF-02", "Tiempo de respuesta", "Las operaciones críticas (registrar reporte, asignar unidad) deben completarse en menos de 3 s en condiciones normales de red", "Análisis del problema", "Alta", "El 95% de las peticiones críticas responde en menos de 3 s"],
    ["RNF-03", "Funcionamiento con conectividad limitada", "La app móvil debe capturar información básica sin conexión y sincronizar al recuperar señal", "Análisis del problema; confirmado por Entrevista — Personal de unidad", "Media", "Un reporte creado sin señal se envía automáticamente al recuperar conexión"],
    ["RNF-04", "Seguridad y privacidad de datos", "Los datos personales y de ubicación deben cifrarse en tránsito y reposo, con acceso basado en roles", "Análisis del problema", "Alta", "Ningún rol accede a datos fuera de sus permisos definidos"],
    ["RNF-05", "Usabilidad", "Un ciudadano debe poder completar un reporte sin capacitación previa", "Análisis del problema", "Alta", "Un usuario nuevo completa un reporte de prueba en menos de 2 minutos"],
    ["RNF-06", "Escalabilidad", "La plataforma debe soportar picos de reportes simultáneos sin degradar el tiempo de respuesta", "Análisis del problema", "Media", "El sistema mantiene el RNF-02 con al menos 5 veces la carga promedio"],
    ["RNF-07", "Trazabilidad de acceso a datos", "El sistema debe registrar qué usuario consulta o modifica información sensible de reportes y ciudadanos", "Entrevista — Administrador/supervisor", "Alta", "Toda consulta o modificación de datos sensibles queda registrada con usuario, fecha/hora y acción realizada"],
  ]
));

// 6. Prioritization
children.push(h1("6. Priorización de requerimientos"));
children.push(p(
  "Se utilizó el método MoSCoW. El criterio principal fue el impacto sobre el flujo central del sistema (reportar → clasificar → asignar → atender → cerrar): lo que sostiene ese flujo se marcó como Obligatorio; lo que mejora la operación sin ser indispensable para la primera versión funcional, como Importante; y lo que aporta valor de gestión pero puede esperar, como Deseable."
));
children.push(table(
  [1800, 1800, 5426],
  ["Requerimiento", "Categoría MoSCoW", "Justificación"],
  [
    ["RF-01 a RF-07, RF-11, RNF-01, RNF-02, RNF-04, RNF-05, RNF-07", "Obligatorio (Must have)", "Sin estos, el flujo central de reporte, clasificación, asignación y atención no funciona, y el sistema no sería seguro ni utilizable; RF-11 y RNF-07 surgieron de las entrevistas como bloqueos operativos y de seguridad igual de críticos"],
    ["RF-08, RF-09, RF-12, RNF-03, RNF-06", "Importante (Should have)", "Mejoran la operación (cierre formal de casos, gestión de catálogos, uso en campo con mala señal, picos de carga, apoyo externo cuando no hay unidad cercana) pero el sistema puede operar en una primera versión sin ellos"],
    ["RF-10", "Deseable (Could have)", "Aporta valor de gestión y reportería, pero no es indispensable para que el flujo operativo funcione"],
    ["Integración con redes sociales para reportar; panel de analítica predictiva", "No incluido por ahora (Won't have this time)", "Añaden complejidad significativa sin ser necesarios para validar la propuesta de valor central en esta primera versión"],
  ]
));
children.push(p("Los requerimientos marcados como Obligatorio son los que se considerarán para la primera versión funcional del proyecto."));

// 7. Validation
children.push(h1("7. Validación y ajuste del modelado previo"));
children.push(p(
  "El modelado UML de la entrega anterior (casos de uso, clases, tres secuencias, actividades, componentes y despliegue) se construyó sobre los supuestos descritos en ese documento: los seis actores, el proceso central de reporte–clasificación–asignación–atención–cierre, y la arquitectura de app móvil + app web + API + base de datos. Tras aplicar las cinco entrevistas, esos supuestos siguen siendo la base vigente del modelo, con los ajustes puntuales que se detallan a continuación."
));
children.push(p("La primera fila es un ejemplo de cómo se diligencia la tabla; las siguientes cuatro filas reflejan los hallazgos reales de esta ronda de entrevistas."));
children.push(table(
  [1600, 2200, 2600, 2626],
  ["Elemento revisado", "Concepción inicial", "Hallazgo de la elicitación", "Cambio realizado o justificación"],
  [
    ["[EJEMPLO] Actor", "Se asumió que solo el despachador decide la unidad a asignar", "El operador entrevistado indicó que en casos urgentes él mismo sugiere la unidad más cercana", "[Completar según corresponda: ajustar el caso de uso Asignar unidad para permitir una sugerencia del operador, o justificar por qué no aplica]"],
    ["Actor", "Seis actores: ciudadano, operador de central, despachador, personal de unidad, administrador del sistema y supervisor", "Las cinco entrevistas confirman a estos seis actores y sus responsabilidades tal como estaban modelados; no aparecieron roles adicionales ni actores que deban fusionarse o dividirse", "Sin cambios. Se mantiene el diagrama de casos de uso de la entrega anterior"],
    ["Funcionalidad", "El operador y el despachador registran y consultan la información de cada reporte dentro de sus propias pantallas", "El operador y el administrador señalaron, de forma independiente, que hoy deben registrar la misma información en más de un sistema; el administrador también pidió poder saber quién consulta o modifica cada reporte", "Se agregan RF-11 (registro único de información) y RNF-07 (trazabilidad de acceso) a los requerimientos de la sección 5; ambos se incorporarán al caso de uso Validar y clasificar reporte"],
    ["Proceso", "El despachador siempre asigna una unidad propia disponible al caso", "El despachador indicó que, cuando no hay ninguna unidad propia cerca, coordina apoyo con otra central o entidad", "Se agrega RF-12 (solicitar apoyo externo) como flujo alterno del proceso de asignación, sin reemplazar el flujo principal"],
    ["Diagrama", "El diagrama de actividades y la secuencia de \"Asignar unidad\" solo contemplan unidades propias", "El nuevo flujo de apoyo externo (RF-12) es una rama poco frecuente y no invalida el diagrama base, pero debe representarse como camino alterno", "Pendiente: agregar un camino alterno de \"sin unidad cercana → solicitar apoyo externo\" al diagrama de actividades antes de la entrega final"],
  ]
));
children.push(p(
  "En síntesis: los seis actores y el flujo central quedan confirmados sin cambios. El modelo se ajusta únicamente en funcionalidad, proceso y diagrama de actividades, según se detalla arriba."
));

// 8. Source control and project management
children.push(h1("8. Gestión del código fuente y del proyecto"));
children.push(p(
  "Se propone Kanban como metodología ágil de trabajo. El equipo es pequeño, los requerimientos se siguen refinando semana a semana con la retroalimentación del docente, y el proyecto se beneficia más de un flujo visible por estados (Por hacer / En progreso / En revisión / Hecho) que de sprints con fecha fija de cierre. Si el equipo prefiere entregas parciales con fecha fija, Scrum con sprints de una semana es una alternativa igualmente válida, usando el mismo backlog inicial que se presenta a continuación."
));
children.push(h2("8.1 Backlog inicial (para importar al tablero)"));
children.push(table(
  [4500, 1500, 3026],
  ["Historia / tarea", "Prioridad", "Estado sugerido"],
  [
    ["Configurar repositorio en GitHub y estructura base del proyecto", "Alta", "Por hacer"],
    ["RF-01 Registrar reporte de emergencia", "Alta", "Por hacer"],
    ["RF-02 Consultar estado del reporte", "Alta", "Por hacer"],
    ["RF-03 Validar y clasificar reporte", "Alta", "Por hacer"],
    ["RF-04 Consultar disponibilidad de unidades", "Alta", "Por hacer"],
    ["RF-05 Asignar unidad de respuesta", "Alta", "Por hacer"],
    ["RF-06 Notificar asignación", "Alta", "Por hacer"],
    ["RF-07 Actualizar ubicación y estado en campo", "Alta", "Por hacer"],
    ["RF-11 Registro único de información", "Alta", "Por hacer"],
    ["RNF-07 Trazabilidad de acceso a datos", "Alta", "Por hacer"],
    ["Aplicar encuesta de elicitación a ciudadanos", "Alta", "Por hacer"],
    ["Consolidar hallazgos y validar el modelado (sección 7)", "Alta", "Hecho"],
    ["RF-08 Cerrar caso", "Media", "Por hacer"],
    ["RF-09 Gestionar catálogos y usuarios", "Media", "Por hacer"],
    ["RF-12 Solicitar apoyo externo", "Media", "Por hacer"],
    ["RF-10 Generar reportes estadísticos", "Media", "Por hacer"],
  ]
));
children.push(h2("8.2 Evidencias pendientes"));
children.push(
  bullet("Enlace al repositorio de GitHub (con acceso habilitado para el docente si es privado)."),
  bullet("Capturas del historial de commits mostrando la participación de cada integrante."),
  bullet("Enlace o capturas del tablero (Trello/Jira/ClickUp) con las columnas y tarjetas del backlog anterior."),
  bullet("Breve evidencia de una reunión de seguimiento del equipo (acta o captura).")
);
children.push(note("Pendiente: reemplazar por los enlaces y capturas reales del equipo antes de la entrega."));

// ---- document ----
const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [
    {
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(path.join(__dirname, "Avance_Ingenieria_Requerimientos.docx"), buffer);
  console.log("done");
});
