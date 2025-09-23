export const opcionesSociodemograficas = {
  sexo: [
    { valor: "Masculino", texto: "Masculino" },
    { valor: "Femenino", texto: "Femenino" },
    { valor: "Prefiero no responder", texto: "Prefiero no responder" },
  ],
  nivelEducativo: [
    { valor: "Sin escolaridad", texto: "Sin escolaridad" },
    { valor: "Primaria incompleta", texto: "Primaria incompleta" },
    { valor: "Primaria completa", texto: "Primaria completa" },
    { valor: "Secundaria incompleta", texto: "Secundaria incompleta" },
    { valor: "Secundaria completa", texto: "Secundaria completa" },
    { valor: "Técnica/Tecnológica", texto: "Técnica/Tecnológica" },
    { valor: "Universitaria", texto: "Universitaria" },
    { valor: "Posgrado", texto: "Posgrado" },
  ],
  ocupacion: [
    { valor: "Empleado formal", texto: "Empleado formal" },
    { valor: "Trabajador independiente", texto: "Trabajador independiente" },
    { valor: "Desempleado", texto: "Desempleado" },
    { valor: "Agricultor", texto: "Agricultor" },
    { valor: "Ama de casa", texto: "Ama de casa" },
    { valor: "Otro", texto: "Otro" },
  ],
  miembrosHogar: [
    { valor: "2-3", texto: "2-3" },
    { valor: "4-5", texto: "4-5" },
    { valor: "6 o más", texto: "6 o más" },
  ],
  numeroHermanos: [
    { valor: "Ninguno", texto: "Ninguno" },
    { valor: "1", texto: "1" },
    { valor: "2-3", texto: "2-3" },
    { valor: "4 o más", texto: "4 o más" },
  ],
  condicionDiscapacidad: [
    { valor: "Ninguna", texto: "Ninguna" },
    { valor: "Física", texto: "Física" },
    { valor: "Visual", texto: "Visual" },
    { valor: "Auditiva", texto: "Auditiva" },
    { valor: "Cognitiva", texto: "Cognitiva" },
    { valor: "Otra", texto: "Otra" },
  ],
  grupoEtnico: [
    { valor: "Ninguno", texto: "Ninguno" },
    { valor: "Afrodescendiente", texto: "Afrodescendiente" },
    { valor: "Indígena", texto: "Indígena" },
    { valor: "Raizal / Palenquero", texto: "Raizal / Palenquero" },
    { valor: "Gitano (ROM)", texto: "Gitano (ROM)" },
    { valor: "Otro", texto: "Otro" },
  ],
  condicionVulnerabilidad: [
    { valor: "Ninguna", texto: "Ninguna" },
    { valor: "Migración interna (otra región de Colombia)", texto: "Migración interna (otra región de Colombia)" },
    { valor: "Migración internacional", texto: "Migración internacional" },
    { valor: "Víctima del conflicto armado", texto: "Víctima del conflicto armado" },
  ],
  trabajaActualmente: [
    { valor: "Sí, tiempo parcial", texto: "Sí, tiempo parcial" },
    { valor: "Sí, tiempo completo", texto: "Sí, tiempo completo" },
    { valor: "No", texto: "No" },
  ],
}

export const preguntasInteligencias = [
  {
    id: "pregunta_1",
    texto: "1.- Prefiero hacer un mapa que explicarle a alguien como tiene que llegar a un lugar determinado.",
  },
  { id: "pregunta_2", texto: "2.- Si estoy enojado o contento generalmente sé la razón exacta de por qué es así." },
  { id: "pregunta_3", texto: "3.- Sé tocar, o antes sabía, un instrumento musical." },
  { id: "pregunta_4", texto: "4.- Asocio la música con mis estados de ánimo." },
  { id: "pregunta_5", texto: "5.- Puedo sumar o multiplicar mentalmente con mucha rapidez." },
  {
    id: "pregunta_6",
    texto:
      "6.- Puedo ayudar a un amigo(a) a manejar y controlar sus sentimientos, porque yo lo pude hacer antes en relación a sentimientos parecidos.",
  },
  { id: "pregunta_7", texto: "7.- Me gusta trabajar con calculadora y computadoras." },
  { id: "pregunta_8", texto: "8.- Aprendo rápidamente a bailar un baile nuevo." },
  { id: "pregunta_9", texto: "9.- No me es difícil decir lo que pienso durante una discusión o debate." },
  { id: "pregunta_10", texto: "10.- ¿Disfruto de una buena charla, prédica o sermón?" },
  { id: "pregunta_11", texto: "11.- Siempre distingo el Norte del Sur, esté donde esté." },
  { id: "pregunta_12", texto: "12.- Me gusta reunir grupos de personas en una fiesta o evento especial." },
  { id: "pregunta_13", texto: "13.- Realmente la vida me parece vacía sin música." },
  {
    id: "pregunta_14",
    texto: "14.- Siempre entiendo los gráficos que vienen en las instrucciones de equipos o instrumentos.",
  },
  { id: "pregunta_15", texto: "15.- Me gusta resolver puzzles y entretenerme con juegos electrónicos." },
  { id: "pregunta_16", texto: "16.- Me fue fácil aprender a andar en bicicleta o patines." },
  {
    id: "pregunta_17",
    texto: "17.- Me enojo cuando escucho una discusión o una afirmación que me parece ilógica o absurda.",
  },
  { id: "pregunta_18", texto: "18.- Soy capaz de convencer a otros que sigan mis planes o ideas." },
  { id: "pregunta_19", texto: "19.- Tengo buen sentido del equilibrio y de coordinación." },
  {
    id: "pregunta_20",
    texto:
      "20.- A menudo puedo captar relaciones entre números con mayor rapidez y facilidad que algunos de mis compañeros.",
  },
  { id: "pregunta_21", texto: "21.- Me gusta construir modelos, maquetas o hacer esculturas." },
  { id: "pregunta_22", texto: "22.- Soy bueno para encontrar el significado preciso de las palabras." },
  {
    id: "pregunta_23",
    texto: "23.- Puedo mirar un objeto de una manera y con la misma facilidad verlo dado vuelta o al revés.",
  },
  {
    id: "pregunta_24",
    texto:
      "24.- Con frecuencia establezco la relación que puede haber entre una música o canción y algo que haya ocurrido en mi vida.",
  },
  { id: "pregunta_25", texto: "25.- Me gusta trabajar con números y figuras." },
  {
    id: "pregunta_26",
    texto: "26.- Me gusta sentarme muy callado y pensar, reflexionar sobre mis sentimientos más íntimos.",
  },
  {
    id: "pregunta_27",
    texto: "27.- Solamente con mirar las formas de las construcciones y estructuras me siento a gusto.",
  },
  {
    id: "pregunta_28",
    texto: "28.- Cuando estoy en la ducha, o cuando estoy solo me gusta tararear, cantar o silbar.",
  },
  { id: "pregunta_29", texto: "29.- Soy bueno para el atletismo." },
  { id: "pregunta_30", texto: "30.- Me gusta escribir cartas largas a mis amigos." },
  { id: "pregunta_31", texto: "31.- Generalmente me doy cuenta de la expresión o gestos que tengo en la cara." },
  {
    id: "pregunta_32",
    texto: "32.- Muchas veces me doy cuenta de las expresiones o gestos en la cara de las otras personas.",
  },
  { id: "pregunta_33", texto: "33.- Reconozco mis estados de ánimo, no me cuesta identificarlos." },
  { id: "pregunta_34", texto: "34.- Me doy cuenta de los estados de ánimo de las personas con quienes me encuentro." },
  { id: "pregunta_35", texto: "35.- Me doy cuenta bastante bien de lo que los otros piensan de mí." },
  // El cuestionario oficial tiene 35 preguntas
]

export const secciones = [
  {
    id: "sociodemografica",
    titulo: "Dimensión Sociodemográfica y Socioeconómica",
    preguntas: [
      { id: "fecha_nacimiento", texto: "Fecha de nacimiento", tipo: "date" },
      { id: "sexo", texto: "Sexo", tipo: "select", opciones: opcionesSociodemograficas.sexo },
      { id: "fecha_graduacion_bachillerato", texto: "Fecha de graduación de bachillerato", tipo: "date" },
      {
        id: "nivel_educativo_madre",
        texto: "Nivel educativo de la madre",
        tipo: "select",
        opciones: opcionesSociodemograficas.nivelEducativo,
      },
      {
        id: "nivel_educativo_padre",
        texto: "Nivel educativo del padre",
        tipo: "select",
        opciones: opcionesSociodemograficas.nivelEducativo,
      },
      {
        id: "ocupacion_padre",
        texto: "Ocupación principal del padre",
        tipo: "select",
        opciones: opcionesSociodemograficas.ocupacion,
      },
      {
        id: "ocupacion_madre",
        texto: "Ocupación principal de la madre",
        tipo: "select",
        opciones: opcionesSociodemograficas.ocupacion,
      },
      {
        id: "miembros_hogar",
        texto: "Número total de miembros en su hogar",
        tipo: "select",
        opciones: opcionesSociodemograficas.miembrosHogar,
      },
      {
        id: "numero_hermanos",
        texto: "Número de hermanos/as",
        tipo: "select",
        opciones: opcionesSociodemograficas.numeroHermanos,
      },
      {
        id: "condicion_discapacidad",
        texto: "¿Presenta alguna condición de discapacidad?",
        tipo: "select",
        opciones: opcionesSociodemograficas.condicionDiscapacidad,
      },
      {
        id: "grupo_etnico",
        texto: "¿Se reconoce como perteneciente a algún grupo étnico?",
        tipo: "select",
        opciones: opcionesSociodemograficas.grupoEtnico,
      },
      {
        id: "condicion_vulnerabilidad",
        texto: "¿Ha experimentado alguna de estas condiciones?",
        tipo: "select",
        opciones: opcionesSociodemograficas.condicionVulnerabilidad,
      },
      {
        id: "trabaja_actualmente",
        texto: "¿Actualmente trabajas?",
        tipo: "select",
        opciones: opcionesSociodemograficas.trabajaActualmente,
      },
      { id: "puntaje_global_saber11", texto: "Puntaje Global Saber 11 (0-500)", tipo: "number", min: 0, max: 500 },
      { id: "puntaje_lectura_critica", texto: "Puntaje Lectura Crítica (0-100)", tipo: "number", min: 0, max: 100 },
      { id: "puntaje_matematicas", texto: "Puntaje Matemáticas (0-100)", tipo: "number", min: 0, max: 100 },
      { id: "puntaje_ingles", texto: "Puntaje Inglés (0-100)", tipo: "number", min: 0, max: 100 },
      {
        id: "puntaje_sociales_ciudadanas",
        texto: "Puntaje Sociales y Ciudadanas (0-100)",
        tipo: "number",
        min: 0,
        max: 100,
      },
      {
        id: "puntaje_ciencias_naturales",
        texto: "Puntaje Ciencias Naturales (0-100)",
        tipo: "number",
        min: 0,
        max: 100,
      },
    ],
  },
  {
    id: "inteligencias_multiples",
    titulo: "Dimensiones Cognitivas (Test de Inteligencias Múltiples)",
    preguntas: preguntasInteligencias.map((p) => ({ ...p, tipo: "vf" })),
  },
]
