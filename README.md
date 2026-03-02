# 🦅 Ministerio Profético La Roca - Plataforma de Difusión

Una Aplicación Web Progresiva (PWA) full-stack diseñada para la distribución, reproducción y gestión de prédicas en audio. Permite a los usuarios escuchar los mensajes desde cualquier dispositivo con una experiencia de usuario similar a una app nativa, mientras que los administradores pueden gestionar el contenido mediante un panel de control seguro.

## ✨ Características Principales

* **Aplicación Web Progresiva (PWA):** Instalable en dispositivos móviles y de escritorio, con tiempos de carga optimizados y soporte para visualización offline básica gracias a Service Workers.
* **Notificaciones Push:** Sistema de alertas integrado (`web-push`) para notificar a los usuarios suscritos sobre nuevos mensajes y enviar recordatorios automatizados.
* **Reproductor de Audio Personalizado:** Streaming directo de archivos alojados en Google Drive, con persistencia de estado (guarda el progreso de reproducción localmente).
* **Panel de Administración Protegido:** Rutas privadas (`wouter`) protegidas por contraseña para editar metadatos de las prédicas, forzar sincronizaciones y disparar notificaciones de prueba.
* **Sincronización Automatizada:** Tareas programadas en el servidor (`node-cron`) que sincronizan la base de datos con Google Drive de forma periódica.
* **Filtros y Búsqueda Dinámica:** Filtrado en tiempo real por predicador, fecha y título.

## 🛠️ Stack Tecnológico

**Frontend:**
* [React](https://reactjs.org/) (con Vite)
* Enrutamiento con `wouter`
* Íconos con `lucide-react`
* CSS Nativo con variables de diseño (Modo Claro/Oscuro)

**Backend:**
* [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
* Autenticación y manejo de webhooks
* `web-push` para el envío de notificaciones
* `node-cron` para tareas programadas

**Base de Datos & Almacenamiento:**
* **MySQL** (Aiven) para la gestión de metadatos y suscripciones push.
* **Google Drive API** para el almacenamiento y consumo de archivos de audio.
