// Datos del Anteprograma CSI 1* 2026. Es el único archivo que hay que tocar para actualizar el PDF.
// - Los textos van tal como se muestran (montos "$ 10.000.000", alturas "1,30").
// - **texto** se muestra en negrita.
// - Lo marcado con REVISAR quedó como en el original y está pendiente de confirmación.
// Exportar (desde remate-videos/):
//   node herramientas/exportar-pdf.mjs pdf/00-00-HA-AnteprogramaCSI/index.html salida/pdf/01-HA-AnteprogramaCSI.pdf
// Si al actualizar algo el texto no entra en la hoja, la exportación falla y dice qué página desborda.

window.ANTEPROGRAMA = {
  titulo: "Anteprograma CSI 1*",

  // ── Página 3: información general ──
  vestimenta: [
    "**Uniforme:** Equipo Reglamentario (Art. 232). **Pista y antepista:** Arena.",
    "Circular F.E.A. N.° 15/07: durante los concursos de salto es obligatorio el uso de casco de 3 puntos de fijación para todo jinete montado en la jurisdicción del concurso.",
  ],

  veterinaria: [
    "**Ingreso de caballos:** con el Pasaporte Nacional F.E.A. completo, con las vacunas y análisis al día (A.I.E. no mayor a 60 días e Influenza no mayor a 90 días). Vacuna de Encefalomielitis mayor a 15 días y menor a 1 año.",
  ],

  // [cargo, nombre]
  autoridades: [
    ["Honorary President", "Marcelo Brandolino"],
    ["President of the Event", "Román H. Giani"],
    ["Event Director", "Román Giani Jr."],
    ["Manager", "Ligia Tiburzio"],
    ["Press Officer", "Débora López / Daniela Nakielski"],
    ["Show / Stable Manager", "Juan Manuel Vargas"],
    ["President of the Ground Jury", "Pedro Hurtado"],
    ["Scorer", "Graciela Valente"],
    ["Announcer", "Adriana Portiglia"],
    ["Ground Jury Member", "María José Fernández Ares / Natalia Ugarte"],
    ["Course Designer", "Javier Ibarra"],
    ["Technical Delegate", "Julio Orma Carrasco"],
    ["Chief Steward", "Laura Rossetti"],
    ["Stewards", "Héctor Torres, Víctor Almada, Esteban Cáceres, Pablo García"],
    ["Vet", "Marta Moya"],
    ["Vet de Tratamiento", "Eugenia Duarte"],
    ["Timekeeper", "ElectroTime - Pablo Rubio"],
    ["Medical Service", "EMP / Centro Médico Lezama"],
    ["Farrier", "Sr. Pablo Javier Brito, +54 9 221 309-2797"],
  ],

  // pruebas · detalle (líneas) · bolsa, o escala: [[categoría, [puestos]]]. destacada = serie internacional.
  // reparto: [[puesto, monto]] se muestra en la misma línea que el detalle.
  premios: [
    { pruebas: "Pruebas 1 y 4", detalle: ["Campeonato Cab. jóvenes 4 años"], reparto: [["Campeón", "$ 5.000.000"], ["Subcampeón", "$ 3.000.000"], ["3.°", "$ 2.000.000"]], bolsa: "$ 10.000.000" },
    { pruebas: "Pruebas 2 y 5", detalle: ["Campeonato Cab. jóvenes 5 años"], reparto: [["Campeón", "$ 5.000.000"], ["Subcampeón", "$ 3.000.000"], ["3.°", "$ 2.000.000"]], bolsa: "$ 10.000.000" },
    { pruebas: "Pruebas 3 y 6", detalle: ["Campeonato Cab. jóvenes 6 años"], reparto: [["Campeón", "$ 5.000.000"], ["Subcampeón", "$ 3.000.000"], ["3.°", "$ 2.000.000"]], bolsa: "$ 10.000.000" },
    { pruebas: "Prueba 7", detalle: ["1,40 m · Serie Internacional"], bolsa: "$ 15.000.000", destacada: true },
    // Prueba 8 a 1,05 m y prueba 11 a 1,10 m
    { pruebas: "Pruebas 8 y 11", detalle: ["1,05 / 1,10 m · 3.ª Mayor/Menor - Amateur · Talabartería y cucarda"] },
    { pruebas: "Pruebas 9 y 12", detalle: ["1,20 m · 1.ª: doble de la inscripción a cada clasificado", "2.ª - 3.ª Mayor/Menor - Amateur: talabartería y cucarda"] },
    {
      pruebas: "Prueba 10", detalle: ["1,30 m"],
      escala: [
        ["1.ª", ["$ 2.500.000", "$ 1.500.000", "$ 1.200.000", "$ 800.000", "$ 600.000"]],
        ["2.ª", ["$ 1.000.000", "$ 800.000", "$ 700.000", "$ 600.000"]],
        ["Amateur", "Talabartería y cucarda"],
      ],
    },
    {
      pruebas: "Prueba 13", detalle: ["1,30 m"],
      escala: [
        ["1.ª", ["$ 2.500.000", "$ 1.500.000", "$ 1.200.000", "$ 800.000", "$ 600.000"]],
        ["2.ª", ["$ 1.000.000", "$ 800.000", "$ 700.000", "$ 600.000"]],
        ["Amateur", "Talabartería y cucarda"],
      ],
    },
    { pruebas: "Prueba 14", detalle: ["1,40 m · Serie Internacional Gran Premio Ruiz Díaz"], bolsa: "$ 15.000.000", destacada: true },
  ],
  campeonatosPremio: "**Campeonatos:** Campeón y Subcampeón · Bandas y trofeos",
  notaPremios: "Bolsa de premios de las pruebas 7 y 14: la distribución será según Prize Money Distribution, FEI 8.2/2.",

  alojamiento: {
    intro: "Se adjunta un listado de hoteles sugeridos para su comodidad y organización.",
    hoteles: [
      { nombre: "Howard Johnson", nota: "Hotel del concurso", tel: "+54 9 2241 67-1450", web: "www.hjchascomus.com.ar" },
      { nombre: "Hotel Roble Blanco", tel: "+54 9 11 5333-6006", web: "www.robleblanco.com.ar" },
      { nombre: "Hotel La Botica 1852", tel: "+54 9 11 3765-7518", web: "www.laboticadel852.bed-booking.com" },
      { nombre: "Estancia La Alameda", tel: "+54 9 11 5713-3534", web: "www.estancialaalameda.com" },
      { nombre: "Hotel Casa Kaufman", tel: "+54 9 2233 40-3107", web: "Instagram @casakaufman" },
    ],
    aviso: "Se informa a los jinetes que Haras Abril no dispone de alojamiento dentro del establecimiento para peones y acompañantes.",
  },

  ubicacion: { direccion: "RP 2, km 153, Lezama, Provincia de Buenos Aires", maps: "https://maps.app.goo.gl/hAyarKDRatb4F6jq7" },

  // ── Página 2 ──
  estabulacion: [
    "La reserva de box se tomará junto con la inscripción. Los boxes disponibles se asignarán por orden de llegada del mail, con el pago correspondiente.",
    "**Valor de la pensión diaria: $ 90.000 (incluye solo box y viruta).**",
    "**Para la compra diaria de pasto y avena, tendrán a disposición un proveedor en el Haras.**",
    "**Los binomios participantes de la Serie Internacional tienen el costo de la pensión diaria (box y viruta) incluido en la inscripción; solo deberán comprar pasto y avena.**",
    "Deberán proveerse de baldes para el agua.",
  ],

  aviso: "El comité organizador se reserva el derecho de introducir modificaciones sin previo aviso.",

  jovenes: {
    titulo: "Campeonato Final de Caballos Jóvenes 4, 5 y 6 años",
    texto: [
      "(*) Este Campeonato Nacional F.E.A. es para caballos nuevos con edades establecidas por la AAFE. No existirán restricciones respecto al origen de los caballos, pero deberán contar con el Pasaporte Nacional F.E.A., donde conste fehacientemente su fecha de nacimiento. El valor de la inscripción es por el campeonato y no incluye estabulación. Campeonatos: Cab. Jóvenes 4 años: pruebas 1 y 4 · Cab. Jóvenes 5 años: pruebas 2 y 5 · Cab. Jóvenes 6 años: pruebas 3 y 6.",
      "**Campeonato de caballos jóvenes de 4, 5 y 6 años:** se define por la suma de las faltas de las dos pruebas. En caso de empate, se definirá por la mejor colocación en la segunda prueba. Premios: Campeón, Subcampeón y Tercero: bandas y trofeos.",
    ],
    edadesTitulo: "Edades de los caballos jóvenes FEA 2026 · Circular 81/2026, tanto nacionales como importados",
    edades: [
      ["Cab. Jóvenes 4 años", "1.° de julio de 2021", "30 de junio de 2022"],
      ["Cab. Jóvenes 5 años", "1.° de julio de 2020", "30 de junio de 2021"],
      ["Cab. Jóvenes 6 años", "1.° de julio de 2019", "30 de junio de 2020"],
    ],
  },

  serie: {
    titulo: "Serie Internacional",
    texto: [
      "(**) Los binomios participantes de la Serie Internacional tienen el costo de la pensión diaria (box y viruta) incluido en la inscripción; solo deberán comprar pasto y avena.",
      "**Hospedaje jinetes Serie Internacional:** **los primeros 25 binomios** que envíen su inscripción junto con el comprobante de transferencia del pago de la inscripción a la Serie Internacional (harasabrilinscripciones@gmail.com) recibirán como beneficio la bonificación de una habitación doble con desayuno en el Hotel Howard Johnson para las noches del viernes 27 y sábado 28 de noviembre. Una vez recibido el pago de la inscripción, se enviará la reserva correspondiente.",
      "**Parque cerrado:** los caballos de la Serie Internacional deberán ingresar el viernes 27 de noviembre antes de las 9:00 h.",
      "**Doping FEI:** incluido en el precio de la inscripción de los jinetes inscriptos.",
      "**Inspección veterinaria:** viernes 27 de noviembre, 11:00 h.",
      "**Reinspección veterinaria:** 13:00 h.",
    ],
    vinetas: [
      "Para poder saltar la prueba 14 (Gran Premio) es obligatorio que el binomio haya saltado y terminado el recorrido de la prueba 7, primera prueba internacional.",
      "Prueba 7: máximo de 3 caballos por jinete.",
      "Prueba 14: máximo de 2 caballos por jinete. En la definición de la prueba 14 pasarán al segundo recorrido los mejores 13 binomios o todos los que finalicen sin faltas.",
    ],
    importante: "**Importante:** dar cumplimiento a la Circular 08/2022 · **Control de temperatura:** 3 días antes de la inspección veterinaria se debe tomar la temperatura a los equinos participantes 2 veces por día, y mantener la modalidad durante el evento. Los jinetes deberán cargar estos datos en la FEI HorseApp durante la semana. El incumplimiento provocará multas y sanciones de la FEI.",
  },

  campeonatos: {
    titulo: "Campeonatos",
    texto: "(***) Campeonatos por altura, siempre que se anoten 5 o más binomios de cada categoría. Sistema +/-1, con coeficiente 1,5 en la segunda prueba del campeonato. El valor de cada campeonato no incluye estabulación.",
    // [letra, altura, copa, pruebas, categorías]
    lista: [
      ["A", "1,05 / 1,10 m", "Copa Howard Johnson", "8 y 11", "3.ª Mayor y Menor - Amateur"],
      ["B", "1,20 m", "Copa In Vitro", "9 y 12", "2.ª - 3.ª Mayor y Menor - Amateur"],
      ["C", "1,30 m", "Copa Synergy Cloning", "10 y 13", "1.ª - 2.ª - Amateur"],
    ],
  },

  observaciones: [
    "Los caballos que asistan al concurso solo podrán participar como máximo en dos pruebas por día.",
    "**Cierre de inscripciones: lunes 16 de noviembre.**",
    "**Inscripciones al mail harasabrilinscripciones@gmail.com**",
    "Los pagos se realizarán por transferencia a la cuenta N.° 0001179-0-371-6 · **Micro Center S.A.** · CBU 0070371820000001179066",
  ],

  // Datos sueltos para la versión de IG (ig/00-00-HA-AnteprogramaCSI); el PDF no los usa
  inscripciones: { cierre: "Lunes 16.11.2026", mail: "harasabrilinscripciones@gmail.com", estabulacion: "$ 90.000 por día" },

  // ── Página 1: programa ──
  // def y art como en el original. destacada = serie internacional. hito = línea con hora debajo de la tabla del día (destacado: true la resalta). copa: true = la observación es una copa y se muestra destacada.
  dias: [
    {
      fecha: "Viernes 27 de noviembre 2026",
      pruebas: [
        { n: 1, categoria: "Campeonato Final F.E.A. Caballos Jóvenes 4 años", altura: "1,00", def: "TO", art: "220.2.1.1", inscripcion: "$ 500.000", premio: "$ 10.000.000", obs: "*" },
        { n: 2, categoria: "Campeonato Final F.E.A. Caballos Jóvenes 5 años", altura: "1,15", def: "TD", art: "220.2.1.1", inscripcion: "$ 500.000", premio: "$ 10.000.000", obs: "*" },
        { n: 3, categoria: "Campeonato Final F.E.A. Caballos Jóvenes 6 años", altura: "1,25", def: "TD", art: "220.2.1.1", inscripcion: "$ 500.000", premio: "$ 10.000.000", obs: "*" },
        { n: 4, categoria: "Campeonato Final F.E.A. Caballos Jóvenes 4 años", altura: "1,10", def: "TO", art: "220.2.1.1", inscripcion: "-", premio: "-", obs: "Copa Haras Cooper", copa: true },
        { n: 5, categoria: "Campeonato Final F.E.A. Caballos Jóvenes 5 años", altura: "1,20", def: "2FEsp", art: "222.2.3", inscripcion: "-", premio: "-", obs: "Copa Haras La Lucrecia", copa: true },
        { n: 6, categoria: "Campeonato Final F.E.A. Caballos Jóvenes 6 años", altura: "1,30", def: "2FEsp", art: "222.2.3", inscripcion: "-", premio: "-", obs: "Copa Haras Tres Jagüeles", copa: true },
        { n: 7, categoria: "Serie Internacional", altura: "1,40", def: "TD", art: "220.2.1.1", inscripcion: "$ 1.300.000", premio: "$ 15.000.000", obs: "**", destacada: true },
      ],
      hito: { hora: "16:30 h", texto: "Prueba internacional" },
    },
    {
      fecha: "Sábado 28 de noviembre 2026",
      pruebas: [
        { n: 8, categoria: "3.ª Mayor/Menor - Amateur", altura: "1,05", def: "2F", art: "222.1", inscripcion: "$ 200.000", premio: "-", obs: "*** Campeonato \"A\"" },
        { n: 9, categoria: "1.ª - 2.ª - 3.ª Mayor/Menor - Amateur", altura: "1,20", def: "2F", art: "222.1", inscripcion: "$ 200.000", premio: "-", obs: "*** Campeonato \"B\"" },
        // Premio "-" pero en Premios tiene escala: a confirmar con el cliente
        { n: 10, categoria: "1.ª - 2.ª - Amateur", altura: "1,30", def: "2F", art: "222.1", inscripcion: "$ 300.000", premio: "-", obs: "*** Campeonato \"C\"" },
      ],
      hito: { hora: "17:30 h", texto: "Remate", destacado: true },
    },
    {
      fecha: "Domingo 29 de noviembre 2026",
      pruebas: [
        { n: 11, categoria: "3.ª Mayor/Menor - Amateur", altura: "1,10", def: "1D", art: "220.2.1.2", inscripcion: "$ 200.000", premio: "-", obs: "Campeonato \"A\"" },
        { n: 12, categoria: "1.ª - 2.ª - 3.ª Mayor/Menor - Amateur", altura: "1,20", def: "1D", art: "220.2.1.2", inscripcion: "$ 200.000", premio: "-", obs: "*** Campeonato \"B\"" },
        { n: 13, categoria: "1.ª - 2.ª - Amateur", altura: "1,30", def: "1D", art: "220.2.1.2", inscripcion: "$ 300.000", premio: "-", obs: "*** Campeonato \"C\"" },
        { n: 14, categoria: "Serie Internacional Gran Premio Ruiz Díaz", altura: "1,40", def: "DR", art: "221.2.2.2b 4.3", inscripcion: "-", premio: "$ 15.000.000", obs: "Copa Ciudad de Lezama **", destacada: true },
      ],
      hito: { hora: "16:30 h", texto: "Prueba internacional" },
    },
  ],
  piePrograma: "**Campeonatos:** Campeón y Subcampeón · Bandas y trofeos",
};
