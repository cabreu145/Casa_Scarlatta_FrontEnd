const media = (type, url, alt = '') => ({
  type,
  url,
  secureUrl: url,
  resourceType: type === 'video' ? 'video' : 'image',
  alt,
})

const link = (label, to) => ({ label, to })

export function createDefaultSuetConfig() {
  return {
    hero: {
      overline: 'Casa Scarlatta — Alta Intensidad',
      tagline: 'Stronger Every Stryde',
      title: 'STRYDE X',
      subtitle:
        'Entrenamiento de alto rendimiento que fusiona cardio y fuerza en bloques de alta intensidad con música envolvente.',
      slogan: 'Mejora tu resistencia. Tonifica tu cuerpo. Eleva tu disciplina.',
      subtext: '',
      image: media(
        'image',
        'https://res.cloudinary.com/dtj8woibw/image/upload/v1781473009/gym_banner_stryde_fwjvb8.jpg',
        'Sala Stryde'
      ),
      logo: media(
        'image',
        'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/STRYDE_X_T_bsgwov.png',
        'Stryde'
      ),
      imageAlt: 'Sala Stryde',
      logoAlt: 'Stryde',
      ctas: [
        { label: 'Reservar clase', to: '/clases?tipo=Stride', variant: 'primary' },
      ],
    },
    stats: [
      { value: '15', label: 'Cupo máximo' },
      { value: '50', label: 'Minutos' },
    ],
    sections: [
      {
        id: 'concept',
        title: 'Concepto',
        heading: 'La fuerza no se encuentra.\nSe construye.',
        body:
          'STRYDE X es más que una clase.\nEs disciplina en movimiento.\nEs el compromiso que transforma tu cuerpo y tu mente.',
        media: media(
          'image',
          'https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/stride-hero_zdajlh.jpg',
          ''
        ),
      },
      {
        id: 'experience',
        title: 'Experiencia',
        items: [
          { title: 'Música envolvente', description: 'Que marca el ritmo de cada repetición.' },
          { title: 'Ambiente energético', description: 'Luz, sonido y diseño que te impulsan.' },
          { title: 'Enfoque total', description: 'Un espacio creado para superar tus límites.' },
        ],
      },
      {
        id: 'quote',
        quote: 'Cada bloque te acerca a tu mejor versión.',
        media: media(
          'image',
          'https://res.cloudinary.com/dtj8woibw/image/upload/v1781473009/gym_banner_stryde_fwjvb8.jpg',
          ''
        ),
      },
      {
        id: 'methodology',
        title: 'Metodología',
        subtitle: 'Entrenamiento en bloques de alta intensidad',
        steps: [
          {
            title: 'Cardio',
            description:
              'Intervalos de alta intensidad que elevan tu capacidad cardiovascular.',
          },
          {
            title: 'Fuerza',
            description:
              'Movimientos funcionales que desarrollan fuerza, potencia y tonicidad muscular.',
          },
          {
            title: 'Resistencia',
            description:
              'Secuencias continuas para mejorar tu rendimiento y llevarte al siguiente nivel.',
          },
        ],
        conclusion: 'Todo en una sesión. Máximo rendimiento.',
      },
      {
        id: 'benefits',
        title: 'Beneficios',
        items: [
          { title: 'Aumento de fuerza y tonificación' },
          { title: 'Mejora de resistencia física' },
          { title: 'Alto gasto calórico' },
          { title: 'Mayor disciplina y enfoque mental' },
        ],
      },
      {
        id: 'ideal',
        title: 'Ideal para ti si…',
        items: [
          { title: 'Buscas resultados visibles.' },
          { title: 'Disfrutas los retos físicos.' },
          { title: 'Quieres estructura y progreso.' },
          { title: 'Valoras la estética y la experiencia.' },
        ],
      },
    ],
  }
}

export function createDefaultFlowConfig() {
  return {
    hero: {
      overline: 'Casa Scarlatta — Movimiento Consciente',
      tagline: 'Movement · Breath · Presence',
      title: 'SLOW',
      subtitle:
        'Movimiento consciente que combina fuerza, respiración y energía para alinear cuerpo, mente y espíritu.',
      slogan: 'Fluye. Respira. Conecta contigo.',
      subtext: '',
      image: media(
        'image',
        'https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/yoga_studio_d8ptjd.jpg',
        ''
      ),
      logo: media(
        'image',
        'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/LOGO_SLOW_rvm3cv.png',
        'Slow'
      ),
      imageAlt: 'Sala Slow',
      logoAlt: 'Slow',
      ctas: [
        { label: 'Reservar clase', to: '/clases?tipo=Slow', variant: 'primary' },
      ],
    },
    stats: [
      { value: '9', label: 'Cupo máximo' },
      { value: '45', label: 'Minutos' },
    ],
    sections: [
      {
        id: 'concept',
        title: 'Concepto',
        heading: 'El movimiento\nque restaura.\nLa calma\nque transforma.',
        body:
          'SLOW es la práctica que devuelve el equilibrio.\nCada clase es un espacio seguro para escuchar tu cuerpo y reconectar con tu centro.',
        media: media(
          'image',
          'https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/yoga_women_ywoota.jpg',
          ''
        ),
      },
      {
        id: 'philosophy',
        title: 'Filosofía',
        items: [
          {
            title: 'Respiración consciente',
            description:
              'La respiración guía cada movimiento. Es el hilo que conecta cuerpo y mente.',
          },
          {
            title: 'Movimiento con intención',
            description:
              'Cada secuencia tiene propósito. Nada es casual, todo suma a tu bienestar.',
          },
          {
            title: 'Presencia total',
            description:
              'Un espacio para desconectar del ruido y volver a ti, clase a clase.',
          },
        ],
      },
      {
        id: 'quote',
        quote: 'Cada respiración es un paso hacia ti.',
        media: media(
          'image',
          'https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/yoga_studio_d8ptjd.jpg',
          ''
        ),
      },
      {
        id: 'methodology',
        title: 'Metodología',
        subtitle: 'Tres momentos que transforman tu práctica',
        steps: [
          {
            title: 'Pilates Mat',
            description:
              'Fortalece el core desde adentro. Trabajo profundo y conciencia corporal.',
          },
          {
            title: 'Movimiento Consciente',
            description:
              'Cada movimiento tiene intención. Conectamos mente y cuerpo en cada secuencia.',
          },
          {
            title: 'Meditación + Stretch',
            description:
              'Cerramos el ciclo. Liberamos tensión y creamos espacio para el bienestar emocional.',
          },
        ],
        conclusion: 'Un ciclo completo. Cuerpo y mente en equilibrio.',
      },
      {
        id: 'benefits',
        title: 'Beneficios',
        items: [
          { title: 'Mayor flexibilidad y movilidad' },
          { title: 'Gestión del estrés y ansiedad' },
          { title: 'Core fortalecido y postura mejorada' },
          { title: 'Equilibrio cuerpo, mente y emoción' },
        ],
      },
      {
        id: 'ideal',
        title: 'Ideal para ti si…',
        items: [
          { title: 'Buscas calma y bienestar real.' },
          { title: 'Quieres fortalecer tu core.' },
          { title: 'Valoras el movimiento consciente.' },
          { title: 'Necesitas desconectar y reconectar.' },
        ],
      },
    ],
  }
}

export function createDefaultYogaConfig() {
  return {
    hero: {
      overline: 'Casa Scarlatta — Equilibrio Mente-Cuerpo',
      tagline: 'Movement · Breath · Balance',
      title: 'YOGA',
      subtitle:
        'Movimiento consciente, respiración y presencia para fortalecer el cuerpo, calmar la mente y cultivar bienestar desde el interior.',
      slogan: 'Respira profundo. Muévete con intención. Habita el presente.',
      subtext: '',
      image: media(
        'image',
        'https://res.cloudinary.com/dtj8woibw/image/upload/v1781473011/yoga_studio2_nqvmqf.png',
        ''
      ),
      logo: media(
        'image',
        'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/LOGO_YOGA_xbhcjh.png',
        'Yoga'
      ),
      imageAlt: 'Sala Yoga',
      logoAlt: 'Yoga',
      ctas: [
        { label: 'Reservar clase', to: '/clases?tipo=Slow', variant: 'primary' },
      ],
    },
    stats: [
      { value: '9', label: 'Cupo máximo' },
      { value: '45', label: 'Minutos' },
    ],
    sections: [
      {
        id: 'concept',
        title: 'Concepto',
        heading: 'El movimiento\nque restaura.\nLa calma\nque transforma.',
        body:
          'YOGA es un espacio para reconectar contigo, desarrollar fuerza consciente y encontrar calma en medio del movimiento.\nCada clase combina respiración, alineación y fluidez para crear una experiencia completa de bienestar físico y mental.',
        media: media(
          'image',
          'https://res.cloudinary.com/dtj8woibw/image/upload/v1781473011/yoga_position_ufcvce.png',
          ''
        ),
      },
      {
        id: 'philosophy',
        title: 'Filosofía',
        items: [
          {
            title: 'Respiración consciente',
            description:
              'La respiración guía cada movimiento y ayuda a mantener la atención en el presente.',
          },
          {
            title: 'Movimiento con propósito',
            description:
              'Cada postura tiene una intención: fortalecer, abrir, estabilizar o restaurar.',
          },
          {
            title: 'Presencia plena',
            description:
              'La práctica invita a reducir el ruido mental y conectar con el aquí y ahora.',
          },
        ],
      },
      {
        id: 'quote',
        quote: 'Cada respiración es una oportunidad para volver a ti.',
        media: media(
          'image',
          'https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/yoga_studio3_qihsve.png',
          ''
        ),
      },
      {
        id: 'methodology',
        title: 'Metodología',
        subtitle: 'Tres momentos que transforman tu práctica',
        steps: [
          {
            title: 'Centrado y Respiración',
            description:
              'Comenzamos conectando con la respiración para preparar cuerpo y mente.',
          },
          {
            title: 'Secuencia de Asanas',
            description:
              'Fluimos entre posturas que desarrollan fuerza, movilidad, equilibrio y estabilidad.',
          },
          {
            title: 'Relajación y Meditación',
            description:
              'Finalizamos con estiramientos suaves y una relajación guiada para integrar la práctica.',
          },
        ],
        conclusion: 'Un ciclo completo. Cuerpo y mente en equilibrio.',
      },
      {
        id: 'benefits',
        title: 'Beneficios',
        items: [
          { title: 'Mayor flexibilidad y movilidad' },
          { title: 'Gestión del estrés y ansiedad' },
          { title: 'Fuerza y estabilidad' },
          { title: 'Equilibrio cuerpo, mente y espíritu' },
        ],
      },
      {
        id: 'ideal',
        title: 'Ideal para ti si…',
        items: [
          { title: 'Buscas reducir el estrés diario.' },
          { title: 'Quieres mejorar tu flexibilidad.' },
          { title: 'Deseas fortalecer tu cuerpo de forma consciente.' },
          { title: 'Te interesa desarrollar equilibrio físico y mental.' },
        ],
      },
    ],
  }
}

export function createDefaultFooterConfig() {
  return {
    brand: {
      logo: media(
        'image',
        'https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/CASA_SCARLATTA_ISOTIPO_mz2cxr.png',
        'Casa Scarlatta'
      ),
      tagline: 'Estudio de movimiento enfocado en el bienestar integral.\nMind · Body · Flow',
    },
    links: {
      studio: [
        link('Stryde X', '/stryde-x'),
        link('Slow', '/slow'),
        link('Yoga', '/yoga'),
        link('Nosotros', '/nosotros'),
      ],
      visit: [
        link('Reservar clase', '/clases'),
        link('Contacto', '/contacto'),
      ],
    },
    social: {
      instagramUrl: 'https://www.instagram.com/casa.scarlatta/',
      facebookUrl: 'https://facebook.com',
      youtubeUrl: '',
    },
    contact: {
      address: 'Calle 00 #00, Col. Centro, Mérida, Yucatán',
      phone: '+52 (999) 000-0000',
      email: '',
    },
    scheduleRows: [
      { label: 'Lun — Vie', value: '07:00 am – 11:00 am | 17:00 pm – 20:00 pm' },
      { label: 'Sáb — Dom', value: '10:00 am – 12:00 pm' },
    ],
  }
}

export function createDefaultSiteConfiguration() {
  return {
    pages: {
      suet: createDefaultSuetConfig(),
      flow: createDefaultFlowConfig(),
      yoga: createDefaultYogaConfig(),
    },
    footer: createDefaultFooterConfig(),
  }
}

export function createDefaultSitePageConfig(pageKey) {
  return createDefaultSiteConfiguration().pages?.[pageKey] ?? null
}
