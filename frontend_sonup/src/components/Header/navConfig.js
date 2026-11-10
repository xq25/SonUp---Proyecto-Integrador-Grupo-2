import { ROLES } from '../../context/AuthContext'

/**
 * Vistas del sidebar según el ROL ACTIVO («Mis vistas» del header).
 *
 * Es solo comodidad: la seguridad la aplica el backend (403). `icon` es la clave del
 * icono en `components/Sidebar/icons.jsx`. `match`: 'exact' (la ruta tal cual) o
 * 'prefix' (la ruta y todo lo que cuelgue de ella, p. ej. /tallerista/participante/12).
 */
const staffMenu = (base, extra = []) => [
  { id: 'inicio',        label: 'Inicio',               icon: 'home',         to: `${base}/inicio`,        match: 'exact'  },
  { id: 'participantes', label: 'Participantes',        icon: 'users',        to: `${base}/participante`,  match: 'prefix' },
  { id: 'planeacion',    label: 'Planeación',           icon: 'clipboard',    to: `${base}/planeacion`,    match: 'prefix' },
  { id: 'sesiones',      label: 'Sesiones',             icon: 'play',         to: `${base}/talleres`,      match: 'prefix' },
  { id: 'habilidades',   label: 'Habilidades y juegos', icon: 'sparkles',     to: `${base}/habilidades`,   match: 'prefix' },
  { id: 'arbol',         label: 'Árbol de habilidades', icon: 'tree',         to: `${base}/arbol-habilidades`, match: 'prefix' },
  { id: 'informes',      label: 'Informes',             icon: 'file',         to: `${base}/informes`,      match: 'prefix' },
  { id: 'certificados',  label: 'Certificados',         icon: 'medal',        to: `${base}/certificados`,  match: 'prefix' },
  { id: 'evidencias',    label: 'Evidencias',           icon: 'image',        to: `${base}/evidencias`,    match: 'prefix' },
  ...extra,
  { id: 'perfil',        label: 'Mi perfil',            icon: 'user',         to: `${base}/perfil`,        match: 'prefix' },
]

export const MENU_BY_ROLE = {
  [ROLES.admin]: staffMenu('/administrador', [
    { id: 'acudientes', label: 'Acudientes', icon: 'family', to: '/administrador/acudientes', match: 'prefix' },
    { id: 'personal',   label: 'Personal',   icon: 'badge',  to: '/administrador/personal',   match: 'prefix' },
  ]),
  [ROLES.tallerista]: staffMenu('/tallerista'),
  [ROLES.estudiante]: [
    { id: 'inicio',       label: 'Inicio',             icon: 'home',     to: '/dashboard',               match: 'exact'  },
    { id: 'disponibles',  label: 'Talleres disponibles', icon: 'list',   to: '/joven/talleres',          match: 'prefix' },
    { id: 'clases',       label: 'Mis clases',         icon: 'calendar', to: '/joven/mis-clases',        match: 'prefix' },
    { id: 'logros',       label: 'Lo que logré',       icon: 'star',     to: '/joven/lo-que-logre',      match: 'prefix' },
    { id: 'evidencias',   label: 'Mis fotos y videos', icon: 'image',    to: '/joven/mis-videos',        match: 'prefix' },
    { id: 'certificados', label: 'Mis certificados',   icon: 'medal',    to: '/joven/mis-certificados',  match: 'prefix' },
    { id: 'perfil',       label: 'Mis datos',          icon: 'user',     to: '/joven/perfil',            match: 'prefix' },
  ],
  [ROLES.acudiente]: [
    { id: 'inicio',       label: 'Inicio',             icon: 'home',     to: '/acudiente',               match: 'exact'  },
    { id: 'disponibles',  label: 'Talleres disponibles', icon: 'list',   to: '/acudiente/talleres',      match: 'prefix' },
    { id: 'clases',       label: 'Historial',          icon: 'calendar', to: '/acudiente/clases',        match: 'prefix' },
    { id: 'logros',       label: 'Habilidades y avance', icon: 'star',   to: '/acudiente/logros',        match: 'prefix' },
    { id: 'informe',      label: 'Informe',            icon: 'file',     to: '/acudiente/informe',       match: 'prefix' },
    { id: 'evidencias',   label: 'Fotos y videos',     icon: 'image',    to: '/acudiente/evidencias',    match: 'prefix' },
    { id: 'certificados', label: 'Certificados',       icon: 'medal',    to: '/acudiente/certificados',  match: 'prefix' },
    { id: 'perfil',       label: 'Mis datos',          icon: 'user',     to: '/acudiente/perfil',        match: 'prefix' },
  ],
  // DONANTE aún no tiene vistas en este módulo (todo responde 403).
  [ROLES.donante]: [],
}

/** Etiqueta del rol en las «pastillas» de Mis vistas. */
export const ROLE_PILL = {
  [ROLES.admin]:      'Admin',
  [ROLES.tallerista]: 'Tallerista',
  [ROLES.acudiente]:  'Acudiente',
  [ROLES.estudiante]: 'Estudiante',
  [ROLES.donante]:    'Donante',
}

/** Etiqueta larga (tarjeta de usuario). */
export const ROLE_LABEL = {
  [ROLES.admin]:      'Administrador',
  [ROLES.tallerista]: 'Tallerista',
  [ROLES.estudiante]: 'Estudiante',
  [ROLES.acudiente]:  'Acudiente',
  [ROLES.donante]:    'Donante',
}

export const menuForRole = (role) => MENU_BY_ROLE[role] ?? []

export const isItemActive = (item, pathname) =>
  item.match === 'prefix'
    ? pathname === item.to || pathname.startsWith(`${item.to}/`)
    : pathname === item.to
