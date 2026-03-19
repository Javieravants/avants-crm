// === Avants Suite — Icon Set SVG ===
// Línea fina 1.6px · Esquinas redondeadas · Estilo propio
// Tamaños: 16px sidebar, 20px botones, 24px cards, 28px display

const Icons = {
  // Genera SVG con tamaño y color dinámicos
  svg(paths, size = 16, color = 'currentColor') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  },

  // === NAVEGACIÓN Y MÓDULOS ===
  dashboard(s=16,c='currentColor') {
    return this.svg('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="4" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/>', s, c);
  },
  contactos(s=16,c='currentColor') {
    return this.svg('<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="18" cy="9" r="2.5"/><path d="M15 20c0-2.5 1.3-4 3-4"/>', s, c);
  },
  pipeline(s=16,c='currentColor') {
    return this.svg('<rect x="3" y="4" width="4" height="16" rx="1.5"/><rect x="10" y="4" width="4" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="14" rx="1.5"/>', s, c);
  },
  agenda(s=16,c='currentColor') {
    return this.svg('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><circle cx="8" cy="15" r="1" fill="'+c+'"/><circle cx="12" cy="15" r="1" fill="'+c+'"/><circle cx="16" cy="15" r="1" fill="'+c+'"/>', s, c);
  },
  tickets(s=16,c='currentColor') {
    return this.svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 12h6M9 15h4"/><circle cx="17" cy="17" r="3" fill="white" stroke="'+c+'"/><path d="M17 15.5v1.5l1 1"/>', s, c);
  },
  polizas(s=16,c='currentColor') {
    return this.svg('<path d="M12 3L4 7v6c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7z"/><path d="M9 12l2 2 4-4"/>', s, c);
  },
  impagos(s=16,c='currentColor') {
    return this.svg('<rect x="2" y="6" width="20" height="13" rx="2.5"/><path d="M2 10h20"/><circle cx="7" cy="15" r="1.5" fill="'+c+'"/><path d="M12 13h5M12 16h3"/><path d="M17 3l2 3M7 3l-2 3"/>', s, c);
  },
  fichate(s=16,c='currentColor') {
    return this.svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/><circle cx="12" cy="12" r="1" fill="'+c+'"/>', s, c);
  },
  informes(s=16,c='currentColor') {
    return this.svg('<path d="M4 20h16"/><path d="M4 20V14a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6"/><path d="M10 20V9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v11"/><path d="M16 20V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v15"/>', s, c);
  },
  settings(s=16,c='currentColor') {
    return this.svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"/>', s, c);
  },
  llamada(s=16,c='currentColor') {
    return this.svg('<path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/>', s, c);
  },
  calculadora(s=16,c='currentColor') {
    return this.svg('<rect x="4" y="3" width="16" height="18" rx="2.5"/><rect x="7" y="6" width="10" height="4" rx="1.5"/><circle cx="8" cy="14" r="1" fill="'+c+'"/><circle cx="12" cy="14" r="1" fill="'+c+'"/><circle cx="16" cy="14" r="1" fill="'+c+'"/><circle cx="8" cy="18" r="1" fill="'+c+'"/><circle cx="12" cy="18" r="1" fill="'+c+'"/>', s, c);
  },
  grabaciones(s=16,c='currentColor') {
    return this.svg('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>', s, c);
  },
  importar(s=16,c='currentColor') {
    return this.svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', s, c);
  },
  asistente(s=16,c='currentColor') {
    return this.svg('<path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="6" r="1" fill="'+c+'"/>', s, c);
  },
  usuarios(s=16,c='currentColor') {
    return this.svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', s, c);
  },

  // === ACCIONES ===
  add(s=16,c='currentColor') {
    return this.svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>', s, c);
  },
  buscar(s=16,c='currentColor') {
    return this.svg('<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>', s, c);
  },
  filtrar(s=16,c='currentColor') {
    return this.svg('<path d="M3 5h18"/><path d="M6 10h12"/><path d="M9 15h6"/><path d="M11 20h2"/>', s, c);
  },
  editar(s=16,c='currentColor') {
    return this.svg('<path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>', s, c);
  },
  guardar(s=16,c='currentColor') {
    return this.svg('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>', s, c);
  },
  whatsapp(s=16,c='currentColor') {
    return this.svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>', s, c);
  },
  email(s=16,c='currentColor') {
    return this.svg('<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 8l10 7 10-7"/>', s, c);
  },
  notificacion(s=16,c='currentColor') {
    return this.svg('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', s, c);
  },
  descargar(s=16,c='currentColor') {
    return this.svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', s, c);
  },
};
