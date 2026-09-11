export const productName = 'VendeYa'

export const title =
  'VendeYa — Prelanzamiento: del grupo de WhatsApp a un negocio automatizado'

export const description =
  'VendeYa está en prelanzamiento. Déjanos tu interés si quieres ser de los primeros clientes: conectamos proveedores, gestores de venta y compradores con catálogo vivo, órdenes y comisiones automatizadas.'

export const siteUrl =
  typeof import.meta.env.PUBLIC_SITE_URL === 'string' && import.meta.env.PUBLIC_SITE_URL
    ? import.meta.env.PUBLIC_SITE_URL.replace(/\/$/, '')
    : 'https://vendeya.app'

export const email = 'aprezcuba24@gmail.com'
export const phone = '53024637'
export const whatsappPhoneDisplay = `+53 ${phone}`

export const whatsappHref = `https://wa.me/53${phone}?text=${encodeURIComponent(
  'Hola, me interesa VendeYa (prelanzamiento). Quiero enterarme cuando esté disponible.',
)}`

export const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(
  'Interés en VendeYa (prelanzamiento)',
)}&body=${encodeURIComponent(
  'Nombre:\nEmpresa:\nEmail:\nTeléfono (opcional):\n\nMe interesa VendeYa y quiero enterarme del lanzamiento.\n',
)}`

export const registerHref = '/registro'

export const ogImage = '/screenshots/01-backoffice-dashboard.png'

/** Google Forms embed URL */
export const formEmbedUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSfWpl0cj9rPYozcoPnUUF2A_lmArgpdWCm0FFxws4L1XmhJng/viewform?embedded=true'

export const registerTitle = 'Interés en VendeYa (prelanzamiento)'
export const registerDescription =
  'VendeYa aún no está a la venta: estamos captando futuros clientes interesados. Cuéntanos sobre ti y tu negocio; te contactaremos cuando haya novedades del lanzamiento.'

// ── Cómo funciona hoy (proceso manual) ──────────────────────────────
export const todaySteps = [
  {
    title: 'Publicas en grupos de WhatsApp',
    text: 'Fotos, precios y disponibilidad, reenviados grupo por grupo.',
    pain: 'Precios desactualizados',
  },
  {
    title: 'Los gestores promocionan',
    text: 'Cogen tus productos y los mueven por redes, sitios y canales.',
    pain: 'Sin control del catálogo',
  },
  {
    title: 'Un comprador contacta',
    text: 'El gestor cierra la venta por chat y toma los datos a mano.',
    pain: 'Datos con errores',
  },
  {
    title: 'Te pasan los datos por chat',
    text: 'Nombre, teléfono, dirección… copiados mensaje a mensaje.',
    pain: 'Ventas sin registro',
  },
  {
    title: 'Entregas y cobras',
    text: 'Llevas el producto al comprador y cobras en la entrega.',
    pain: null as string | null,
  },
  {
    title: 'Al final del día: la libreta',
    text: 'Cuadrar cada venta y calcular la comisión de cada gestor, a mano.',
    pain: 'Horas cuadrando comisiones',
  },
]

// ── Con VendeYa (flujo automatizado) ────────────────────────────────
export const brokerFlow = [
  { title: 'Publicas tu catálogo', text: 'Una sola vez, siempre al día.' },
  { title: 'Los gestores lo promocionan', text: 'Donde quieran: redes, sitios, canales.' },
  {
    title: 'Cada venta queda registrada',
    text: 'La orden entra sola, con los datos del comprador.',
  },
  {
    title: 'Las comisiones se calculan solas',
    text: 'Sabes cuánto pagar a cada gestor, al instante.',
  },
]

export const comparison = [
  {
    label: 'Catálogo',
    before: 'Fotos reenviadas mil veces en grupos',
    after: 'Un catálogo vivo, siempre actualizado',
  },
  {
    label: 'Registro de ventas',
    before: 'Libreta, Excel y memoria',
    after: 'Cada orden registrada automáticamente',
  },
  {
    label: 'Comisiones',
    before: 'Calculadora al final del día',
    after: 'Calculadas al instante, sin discusiones',
  },
  {
    label: 'Stock',
    before: '“¿Te queda alguno?” por chat',
    after: 'Disponibilidad en tiempo real',
  },
  {
    label: 'Datos del comprador',
    before: 'Dictados y copiados a mano',
    after: 'Capturados en la orden, sin errores',
  },
]

// ── Actores ─────────────────────────────────────────────────────────
export const actors = [
  {
    name: 'Proveedor',
    role: 'El que vende los productos',
    points: [
      'Publica su catálogo una sola vez',
      'Entrega y cobra como siempre',
      'Paga comisiones exactas, sin cuadrar libretas',
    ],
    accent: 'emerald' as const,
  },
  {
    name: 'Gestor de venta',
    role: 'Promociona y cierra ventas',
    points: [
      'Promociona donde quiera',
      'Registra la venta en segundos',
      'Cobra su comisión sin reclamos',
    ],
    accent: 'cyan' as const,
  },
  {
    name: 'Comprador',
    role: 'Recibe el producto',
    points: [
      'Sus datos viajan sin errores',
      'Recibe el producto en su puerta',
      'Paga en la entrega, como siempre',
    ],
    accent: 'amber' as const,
  },
]

// ── Beneficios ──────────────────────────────────────────────────────
export const providerBenefits = [
  {
    title: 'Registro automático',
    text: 'Cada venta queda guardada: quién vendió, qué, a quién y por cuánto.',
    icon: 'ledger' as const,
  },
  {
    title: 'Comisiones exactas',
    text: 'El sistema calcula lo que le toca a cada gestor. Tú solo pagas.',
    icon: 'commission' as const,
  },
  {
    title: 'API para tu sistema',
    text: 'Conecta tu ERP o inventario y actualiza productos automáticamente.',
    icon: 'api' as const,
  },
  {
    title: 'Webhooks en cada venta',
    text: 'Tu sistema recibe una notificación al instante cuando algo se vende.',
    icon: 'webhook' as const,
  },
]

export const sellerBenefits = [
  {
    title: 'Publica donde quieras',
    text: 'Redes sociales, sitios web, canales de difusión. Tú eliges.',
    icon: 'megaphone' as const,
  },
  {
    title: 'Stock en tiempo real',
    text: 'Si al proveedor se le agota un producto, lo sabes al momento.',
    icon: 'realtime' as const,
  },
  {
    title: 'Tu sitio con VendeYa de backend',
    text: 'Monta tu web y saca los productos directamente de VendeYa.',
    icon: 'website' as const,
  },
  {
    title: 'Difusión en un clic',
    text: 'Herramientas para publicar productos en redes sin esfuerzo.',
    icon: 'share' as const,
  },
]

// ── Capturas ────────────────────────────────────────────────────────
export const providerScreens = [
  {
    src: '/screenshots/01-backoffice-dashboard.png',
    title: 'Dashboard',
    text: 'Ventas, comisiones y actividad de un vistazo.',
  },
  {
    src: '/screenshots/02-backoffice-products.png',
    title: 'Productos',
    text: 'Precio, comisión y disponibilidad de cada producto.',
  },
  {
    src: '/screenshots/03-backoffice-orders.png',
    title: 'Órdenes',
    text: 'Cada venta de tus gestores, registrada sola.',
  },
]

export const sellerScreens = [
  {
    src: '/screenshots/04-seller-products.png',
    title: 'Catálogo del gestor',
    text: 'Los gestores ven tu catálogo con su comisión clara.',
  },
  {
    src: '/screenshots/05-seller-cart.png',
    title: 'Registro de la venta',
    text: 'Arman la orden con los datos del comprador y listo.',
  },
]
