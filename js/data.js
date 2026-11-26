// Todo lo que cambia de un comercio a otro vive acá. Lo marcado PENDIENTE CLIENTE hay que confirmarlo.
const CONFIG = {
  negocio: {
    nombre: "Pisada", // PENDIENTE CLIENTE (nombre de la marca)
    rubro: "Ojotas",
    localidad: "Buenos Aires",
    eslogan: "Ojotas con el escudo de tu club",
  },

  colores: { acento: "#f2b01e" },

  contacto: {
    whatsapp: "5491128074105", // PENDIENTE CLIENTE
    mensajeWhatsapp: "¡Hola! Vi su web y quería consultar por las ojotas.",
    instagram: "https://instagram.com/", // PENDIENTE CLIENTE
    direccion: "", // PENDIENTE CLIENTE (si hay local para retirar)
    mapsEmbed: "", // src del iframe de Google Maps; si está vacío no se muestra el mapa
    mapsLink: "",
  },

  // Escudos que rotan en la ojota 3D, uno por vuelta.
  // Para sumar un escudo: PNG con fondo transparente en img/escudos/ y completar "img".
  escudos: [
    { id: "cadg", nombre: "Defensores de Glew", color: "#f2b01e", dibujo: "cadg" },
    { id: "escudo-2", nombre: "Escudo 2", color: "#2f6df6", img: "img/escudos/escudo-2.png" }, // PENDIENTE CLIENTE
    { id: "escudo-3", nombre: "Escudo 3", color: "#e5252a", img: "img/escudos/escudo-3.png" }, // PENDIENTE CLIENTE
  ],

  talles: ["38", "39", "40", "41", "42", "43", "44", "45"],

  // Precios de ejemplo. PENDIENTE CLIENTE
  productos: [
    { id: "faraon-verde", nombre: "Faraon Pro Verde", descripcion: "Plantilla texturada que masajea y banda ancha ajustable. Para todos los días.", precio: 22900, foto: "img/faraon-verde.webp", etiqueta: "Más pedida" },
    { id: "faraon-azul", nombre: "Faraon Pro Azul", descripcion: "Suela gruesa que amortigua y detalle azul eléctrico en la banda.", precio: 22900, foto: "img/faraon-azul.webp", etiqueta: "" },
    { id: "airness-marino", nombre: "Airness Marino", descripcion: "Banda con abrojo que se ajusta al pie. Liviana y cómoda para el verano.", precio: 19900, foto: "img/airness-azul.webp", etiqueta: "" },
    { id: "personalizada", nombre: "Ojota con tu escudo", descripcion: "Negra lisa con el escudo del club que elijas en relieve sobre la banda.", precio: 27900, foto: "img/ojota-escudo.webp", etiqueta: "A tu medida" },
  ],

  envios: {
    texto: "Enviamos a todo el país por correo y entregamos en mano en la zona.", // PENDIENTE CLIENTE
    pago: ["Efectivo", "Transferencia", "Mercado Pago"],
  },

  seo: {
    titulo: "Ojotas con escudo de tu club | Pisada",
    descripcion: "Ojotas cómodas con el escudo de tu club en relieve. Mirá los modelos, elegí tu talle y pedí por WhatsApp. Envíos a todo el país y entrega en mano en la zona.",
    url: "", // PENDIENTE CLIENTE (dominio final)
  },
};
