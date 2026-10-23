# SonUp — Proyecto Integrador (Grupo 2)
> Plataforma de seguimiento pedagógico, desarrollo formativo y gestión de talleres comunitarios para la **Fundación ASISCO** (*Asociación de Interés Social Comunitario*).

---

## 📋 Descripción del Proyecto

**SonUp** es una aplicación web interactiva diseñada para acompañar, registrar y potenciar el proceso formativo de jóvenes con diversas capacidades y sus familias dentro de los programas comunitarios de la Fundación ASISCO (talleres de **Música**, **Artes** y **Panadería**).

La plataforma proporciona experiencias especializadas y accesibles adaptadas a tres roles principales:
1. **Jóvenes participantes:** Interfaz accesible, visual, lúdica y con retroalimentación intuitiva para consultar clases, celebrar logros, ver material audiovisual y descargar certificados.
2. **Acudientes:** Panel de acompañamiento familiar con calendario sincronizado a la zona horaria de Colombia, registro de asistencias, metas por actividad e informes semestrales descargables.
3. **Talleristas:** Entorno integral de gestión docente para el registro de participantes, bitácora de habilidades, control de evidencias y generación de informes institucionales.

---

## 🎨 Sistema de Diseño y Paleta Institucional

El diseño visual está fundamentado en la identidad corporativa de **ASISCO**, optimizado mediante técnicas de diseño responsivo fluido con **`clamp()`** para asegurar consistencia en computadores, tablets y teléfonos móviles sin depender de frameworks rígidos de CSS.

| Elemento / Rol | Código Hex | Muestra |
| :--- | :--- | :--- |
| **Teal Principal** | `#176D65` | Cabeceras, botones primarios, marcas activas |
| **Teal Oscuro** | `#10574F` | Estados hover, gradientes y contrastes profundos |
| **Teal Claro / Menta** | `#E2F2EF` | Fondos de insignias, píldoras y avatares |
| **Naranja Institucional** | `#F49A18` | Destacados, insignias de logros y logotipo |
| **Naranja Claro / Crema** | `#FFF0D8` | Tarjetas de fecha y módulos de progreso |
| **Azul Secundario** | `#3477A9` | Certificados de procesos musicales |
| **Texto Principal** | `#173632` | Títulos y tipografía de alta legibilidad |
| **Texto Secundario** | `#687974` | Subtítulos, metadatos y etiquetas |
| **Fondo General** | `#F0F1EF` | Fondo unificado de la aplicación |
| **Blanco Puro** | `#FFFFFF` | Tarjetas contenedoras y componentes elevados |
| **Bordes** | `#DFE5E2` | Delimitadores de cards, botones e inputs |

---

## 🚀 Módulos y Arquitectura del Sistema

### 1. Autenticación y Acceso Multi-Rol (`/login`)
* Selección de perfil con tarjetas de rol interactivas: **Joven**, **Acudiente** y **Tallerista**.
* Autenticación con credenciales y soporte para acceso mediante Google OAuth (`@react-oauth/google`).

### 2. Módulo Joven (`/dashboard`)
* **Inicio lúdico:** Saludo personalizado, tarjeta destacada con la próxima clase y botón de retroalimentación de audio.
* **Mis clases (`/joven/mis-clases`):** Calendario mensual con badges naranjas de fecha, estados de asistencia confirmada y tarjeta hero de la clase vigente.
* **Lo que logré (`/joven/lo-que-logre`):** Navegación por pestañas (*Música*, *Artes*, *Panadería*) con listas diferenciadas de metas conseguidas (verde azulado) y habilidades en aprendizaje (naranja).
* **Mis videos y fotos (`/joven/mis-videos`):**
  * Pestaña *Videos* con tarjetas por taller y reproductor destacado interactivo con opción de cierre `(X)`.
  * Pestaña *Fotos* con galería comunitaria y visor ampliado.
* **Mis certificados (`/joven/mis-certificados`):**
  * Catálogo de diplomas por taller completado.
  * Vista formal de diploma con doble marco dorado, caligrafía destacada y funcionalidad de **Descargar PDF** lista para impresión.

### 3. Módulo Acudiente (`/acudiente`)
* **Próximas actividades:** Previsualización dinámica de fecha, hora, taller, objetivo pedagógico y materiales que debe llevar el estudiante.
* **Selector de fecha con Zona Horaria Colombia:** Menú desplegable en la cabecera sincronizado con la hora de Colombia (`America/Bogota` / UTC-5) y botón de acceso rápido *"Ver hoy"*.
* **Control de asistencia:** Cuadrícula del mes con indicadores visuales de asistencia (*vino* / *faltó*).
* **Informe del Semestre (`/acudiente/informe`):**
  * Vista oficial con logotipo institucional de ASISCO a gran formato.
  * Evaluación del proceso socioemocional y recomendaciones para el hogar.
  * Botón interactivo para **Descargar PDF** formal con membrete.
* **Notas de los profesores:** Bitácora de seguimiento con apuntes de los talleristas.

### 4. Módulo Tallerista (`/tallerista/*`)
* **Layout institucional:** Barra lateral unificada con enlaces de navegación a todas las áreas de gestión.
* **Inicio del tallerista:** Resumen de actividades, listado de participantes y accesos directos.
* **Submódulos:** Participantes, Informes pedagógicos, Talleres, Habilidades, Certificados y Evidencias fotográficas.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Enrutamiento:** [React Router DOM v7](https://reactrouter.com/)
* **Estilizado:** Vanilla CSS con CSS Variables y funciones `clamp()` (sin TailwindCSS, máxima personalización visual).
* **Autenticación Externa:** `@react-oauth/google`
* **Tipografías:** *Nunito* (legibilidad principal y accesibilidad) y *Fredoka* (marca ASISCO).

---

## 📁 Estructura del Proyecto

```text
SonUp---Proyecto-Integrador-Grupo-2/
├── README.md                          # Documentación general del repositorio
├── frontend_sonup/                    # Aplicación cliente React + Vite
│   ├── index.html                     # Entrada HTML con fuentes Google Fonts
│   ├── package.json                   # Dependencias y scripts de ejecución
│   ├── vite.config.js                 # Configuración de compilación Vite
│   ├── src/
│   │   ├── main.jsx                   # Punto de arranque de la aplicación
│   │   ├── App.jsx                    # Configuración de rutas y navegación
│   │   ├── App.css                    # Estilos globales y tokens base
│   │   ├── components/
│   │   │   ├── Logo/                  # Componente del logotipo ASISCO
│   │   │   └── RoleCard/              # Tarjetas de selección de rol en Login
│   │   ├── layouts/
│   │   │   └── TalleristaLayout/      # Sidebar y contenedor del rol tallerista
│   │   └── pages/
│   │       ├── Login/                 # Pantalla de inicio de sesión
│   │       ├── Dashboard/             # Módulo Joven (Clases, Logros, Videos, Certificados)
│   │       ├── Acudiente/             # Módulo Acudiente (Home e Informe Semestral)
│   │       └── Tallerista/            # Módulo Tallerista y submódulos de gestión
```

---

## 💻 Instalación y Puesta en Marcha

### Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
* [npm](https://www.npmjs.com/)

### Pasos de ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/SonUp---Proyecto-Integrador-Grupo-2.git
   cd SonUp---Proyecto-Integrador-Grupo-2
   ```

2. **Entrar al directorio del frontend e instalar dependencias:**
   ```bash
   cd frontend_sonup
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   La aplicación se ejecutará en: `http://localhost:5173/`

---

## 👥 Equipo de Desarrollo

* **Proyecto Integrador — Grupo 2**
* Desarrollado para la **Fundación ASISCO**
