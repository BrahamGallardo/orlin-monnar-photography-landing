# Orlin Monnar Photography — Landing

Sitio público de fotografía: home, about, galería, paquetes, agendado de citas y contacto.

Sitio **estático puro** (sin build) basado en el template Halen, con **Alpine.js** para el estado y el consumo de la API. Se sirve en la raíz (`/`) del mismo dominio que la API (`/api`) y el panel (`/admin`).

---

## Stack

| Componente | Versión | Origen |
|---|---|---|
| jQuery | 1.12.4 | template |
| Bootstrap | 4.0.0 | template |
| Owl Carousel | 2.2.1 | template |
| Magnific Popup, Isotope, WOW.js, gijgo | — | template |
| Alpine.js | 3.15.12 | `js/vendor/` |
| SweetAlert2 | 11.26.25 | `js/vendor/` |

> Alpine y SweetAlert2 se sirven **locales, nunca por CDN**, para fijar la versión. Se obtuvieron con `npm install alpinejs@3 sweetalert2` y se copiaron a `js/vendor/`; no hay `package.json` en el proyecto porque no se requiere build.

---

## Estructura

```
Orlin Monnar Photography Landing/
├── index.html  about.html  gallery.html  gallery-detail.html
├── investment.html  booking.html  contact.html
├── css/
│   ├── style.css               del template — NO se edita
│   └── omp-custom.css          único CSS propio
├── img/
│   ├── logo-omp.png            logo del cliente
│   └── provisional/            derivados WebP de las fotos temporales
├── scss/                       fuente de style.css — no se usa, no se borra
└── js/
    ├── main.js                 del template — NO se edita
    ├── vendor/                 jQuery, Modernizr, Alpine, SweetAlert2
    └── app/                    capa propia
        ├── config.js           NO versionado (claves y URLs locales)
        ├── config.example.js   plantilla versionada
        ├── apiService.js       cliente HTTP genérico
        ├── captchaService.js   reCAPTCHA v3
        ├── alertService.js     avisos con SweetAlert2
        ├── mediaHelpers.js     resolución de rutas y srcset
        ├── domHelpers.js       escape de HTML
        ├── pluginBridge.js     puente con los plugins jQuery
        ├── content.js          todos los textos del sitio
        ├── placeholderPhotos.js  fallback mientras la galería esté vacía
        ├── galleryService.js  packageService.js
        ├── bookingService.js  contactService.js
        └── pages/              un módulo Alpine por página
```

---

## Configuración

`js/app/config.js` **no se versiona**. Copia `config.example.js` y completa:

| Clave | Desarrollo | Producción |
|---|---|---|
| `API_CONFIG.baseUrl` | `http://localhost:5081` | `''` (mismo origen) |
| `API_CONFIG.timeout` | 30000 ms | igual |
| `RECAPTCHA_SITE_KEY` | clave de pruebas | clave del dominio |

La `baseUrl` vacía en producción hace que todas las rutas resuelvan contra el mismo origen, que es como se despliega (`/`, `/api`, `/admin` bajo un solo dominio).

---

## Ejecución

Cualquier servidor estático. Con Live Server de VS Code:

```
http://127.0.0.1:5500
```

La API debe correr en el **perfil `http` de Kestrel** (`dotnet run --project omp-api` → `localhost:5081`). Con el perfil "IIS Express" la API queda en otro puerto y hay que ajustar `baseUrl`.

El origen del dev server debe estar en `Cors:AllowedOrigins` de `appsettings.Development.json`. Ya están `localhost` y `127.0.0.1` en los puertos 5000 y 5500.

> Abrir los `.html` con doble clic (`file://`) **no funciona**: `fetch` contra la API queda bloqueado por CORS.

---

## Convenciones

Estas reglas salieron de romper cosas y no son opcionales.

**No se toca el template.** `css/style.css`, `css/theme-default.css` y `js/main.js` quedan intactos. Los estilos propios van en `omp-custom.css`, cargado después; el JavaScript propio, en `js/app/`. Así el template puede reemplazarse sin rehacer el trabajo.

**Un módulo Alpine por página.** Vive en `js/app/pages/<pagina>Page.js`, se registra dentro de `alpine:init` con `Alpine.data('<pagina>Page', ...)` y se monta con `x-data` + `x-init="init()"`. Los módulos **no hacen `fetch`**: llaman a los servicios de `js/app/`.

**Orden de carga.** Al final del `<body>`, después de `main.js`: SweetAlert2 → `config` → `content` → `alertService` → `apiService` → `mediaHelpers` → `domHelpers` → `pluginBridge` → servicios de la página → módulo de la página → `alpine.min.js` con `defer`. Todo lo propio es síncrono y Alpine va con `defer`: garantiza que cada `Alpine.data()` esté registrado antes de que Alpine arranque.

**Plugins jQuery y contenido dinámico.** `main.js` los inicializa sobre el DOM inicial y no indexa nada posterior. Por eso todo contenido que llegue de la API se registra desde `pluginBridge`, dentro de un `$nextTick`. Y hay que distinguir según lo que el plugin haga con sus nodos:

- **Owl Carousel los clona** (con `loop`) y los elimina al destruirse. Su contenedor lleva `x-ignore` y se puebla como HTML plano (ver `renderHeroSlides` en `homePage.js`). Si Alpine gestionara ese subárbol, los clones perderían el scope de `x-for` y cada binding fallaría con `photo is not defined`.
- **Isotope y Magnific Popup no clonan.** Ahí `x-for` es seguro; Magnific se registra con `delegate` sobre un contenedor que sí existe desde la carga.

El HTML que se arma a mano se escapa con `escapeHtml` de `domHelpers.js`.

**Scripts de formulario del template retirados.** `ajax-form.js`, `contact.js`, `mail-script.js`, `jquery.form.js` y `jquery.validate.min.js` apuntaban a `contact_process.php` / `mail.php` y competirían con los formularios de Alpine. **`jquery.ajaxchimp.min.js` se queda en todas las páginas**: `main.js` llama `ajaxChimp()` sin guarda y su ausencia lanza un `TypeError` que mata todo lo que sigue en ese scope.

**Rutas de media.** `resolveMediaUrl` antepone la `baseUrl` de la API **solo a las rutas absolutas** (`/media/...`, las que entrega el backend). Las relativas —imágenes provisionales servidas por la propia landing— se devuelven sin tocar.

**Imágenes.** Siempre `srcset` con los tres derivados + `loading="lazy"`: `thumb` en grids y carruseles, `medium` en galería, `large` solo en lightbox y en el hero por encima de 1600 px. Las fotografías se encuadran con `object-fit: cover` sobre un marco 4:3; el logo y los iconos quedan fuera de esa regla.

**Textos.** Todos en `js/app/content.js`, en inglés. Lo marcado como `PENDING` debe reemplazarse antes de publicar.

---

## API consumida

Todos anónimos. Los formularios exigen `captchaToken` **como propiedad plana del mismo objeto**, no en un sobre aparte.

| Método | Ruta | Usado en |
|---|---|---|
| GET | `/api/gallery/featured?take=n` | Home |
| GET | `/api/gallery/categories` | Gallery |
| GET | `/api/gallery/categories/{slug}` | Gallery detail |
| GET | `/api/packages` | Investment, Booking |
| POST | `/api/booking` | Booking |
| POST | `/api/contact` | Contact |

`apiService` normaliza la respuesta a `{ success, status, data, error, validationErrors }`: interpreta `ProblemDetails` (`detail`/`title`), aplana los `errors` de `ValidationProblemDetails` y traduce el `429` del rate limiting. Nunca lanza excepciones.

---

## Imágenes provisionales

Mientras la galería esté vacía, las páginas caen en `js/app/placeholderPhotos.js`, que tiene **exactamente la forma de `PhotoDto`** (con ids negativos para no chocar con registros reales). Los 45 archivos de `img/provisional/` se generaron replicando el pipeline de la API: sRGB, sin EXIF, tres derivados WebP, sin escalar hacia arriba.

Cuando se carguen las fotos definitivas desde el panel, se borran `img/provisional/`, `placeholderPhotos.js` y su `<script>`.

---

## Estado

| Tarea | Estado |
|---|---|
| L1 — Base Alpine.js | Completo |
| L2 — Home | Completo (falta contenido del cliente) |
| L3 — About | Pendiente |
| L4 — Contact | Pendiente |
| L5 — Gallery | Pendiente |
| L6 — Investment | Pendiente |
| L7 — Agendar cita | Pendiente |

Pendientes transversales: textos e imágenes finales, enlaces de redes sociales (`href="#"`), favicon con la marca y la ubicación real del iframe de Google Maps (hoy apunta al DFW metroplex, tomado de sisu-luxury-events).

Referencia completa: `Plan de Arquitectura y Roadmap Técnico - Orlin Monnar Photography.docx` (v1.2).
