# Share — App de Música Compartida

App móvil construida con **React Native (Expo SDK 54)** + **JavaScript** + **CSS puro (StyleSheet)**.

## ✨ Características

- 📱 Compartir canciones y videos de **YouTube**, **Instagram**, **TikTok** y **Facebook**
- 🔗 **Share Intent nativo (Android/iOS)** — pulsa "Compartir" en cualquier app y elige "Share" para crear la publicación con la URL ya rellenada
- 🎯 Detección automática de plataforma con autocompletado de título/autor
- 🎨 UI moderna: toasts personalizados y diálogos de confirmación (sin alertas iOS feas)
- 👥 **Multicuenta local**: cada amigo crea su propia cuenta en su móvil. Varias cuentas pueden coexistir en el mismo dispositivo.
- ❤️ Sistema de likes, seguir/dejar de seguir, perfiles
- 📊 Feed estilo Discover (grid de 2 columnas)
- 📚 Stories horizontales de los amigos a los que sigues
- 💾 Todos los datos se guardan **localmente** en el dispositivo (AsyncStorage). No requiere internet ni servidor.

## 🚀 Cómo correr en VS Code (Mac)

### 1. Instalar dependencias

```bash
npm install
```

> Si npm se queja de peer dependencies, prueba: `npm install --legacy-peer-deps` (ya está activado en .npmrc).

### 2. Iniciar la app

```bash
npx expo start
```

### 3. Abrir en tu móvil o navegador

- **📱 Móvil con Expo Go**: Descarga **Expo Go** (App Store / Play Store) y escanea el QR.
- **🌐 Navegador**: Pulsa `w` en la terminal.
- **🍎 iOS Simulator**: Pulsa `i` (requiere Xcode instalado).
- **🤖 Android Emulator**: Pulsa `a` (requiere Android Studio).

> ⚠️ **Importante sobre el Share Intent**: aparecer en el menú "Compartir" nativo de Android/iOS **NO funciona en Expo Go** — necesita un build nativo real. Mira la sección siguiente.

## 🔗 Activar el "Share desde otras apps" (Android/iOS)

Para que **Share aparezca como destino al pulsar "Compartir" en Instagram, YouTube, TikTok, etc.**, hay que crear un build nativo (Expo Go no soporta share extensions).

### Opción A — Build local en Android (más rápido si tienes Android Studio)

```bash
# 1. Generar las carpetas nativas android/ e ios/
npx expo prebuild

# 2. Compilar e instalar en tu móvil o emulador
npx expo run:android
```

Después de instalar, cuando abras Instagram → pulses "Compartir" en un Reel → verás **Share** en la lista. Al pulsarlo se abrirá la app con la URL ya pegada.

### Opción B — Build local en iOS (Mac + Xcode)

```bash
npx expo prebuild
npx expo run:ios
```

### Opción C — EAS Build (sin necesidad de Xcode/Android Studio)

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

EAS te entrega un `.apk` que puedes instalar en cualquier móvil Android. Luego puedes seguir usando `npx expo start` para hot-reload contra ese build.

## 👥 Compartir con amigos

La app está pensada para que cada amigo se la instale en su móvil:

1. Compártele el ZIP, o mejor el **APK** generado por `expo run:android` / EAS.
2. Cada amigo abre la app y crea su cuenta desde "Bienvenido a Share".
3. Cada cuenta queda guardada **solo en su dispositivo**.
4. Se pueden crear varias cuentas en el mismo móvil — útil si lo compartes con familia.

> Nota: como es una app 100% frontend (sin backend), las cuentas no se sincronizan entre dispositivos. Cada amigo ve su propio feed con las canciones que él mismo comparte.

## 📁 Estructura

```
share-app/
├── app/                    # Pantallas (expo-router file-based routing)
│   ├── (tabs)/             # Tabs: home, discover, add, friends, profile
│   ├── song/[id].jsx       # Detalle de canción
│   ├── user/[id].jsx       # Perfil de usuario
│   ├── welcome.jsx         # Onboarding y multicuenta
│   └── _layout.jsx         # Layout raíz con providers + ShareIntentListener
├── components/
│   ├── Toast.jsx           # Toast moderno animado
│   ├── ConfirmDialog.jsx   # Diálogo confirm centrado
│   ├── SongTile.jsx        # Tarjeta de canción
│   └── ...
├── context/
│   ├── AppContext.js       # Usuarios, canciones, likes, multicuenta
│   └── UIContext.jsx       # Provider de toasts y diálogos
├── constants/colors.js
├── data/seed.js            # Plantilla de perfil (sin datos demo)
├── hooks/
└── utils/
    ├── media.js            # Validación de URLs
    └── shareIntent.js      # ⭐ Wrapper seguro de expo-share-intent
```

## 🎨 Paleta

- Fondo: `#0a0814` (morado oscuro)
- Primario: `#FFBA00` (amarillo)
- Acento: `#FF4FCB` (rosa)

## 📝 Notas técnicas

- 100% frontend. Datos guardados en AsyncStorage.
- JavaScript puro (no TypeScript), StyleSheet (no Tailwind).
- `expo-share-intent` v5.1.1 (compatible con Expo SDK 54). El wrapper `utils/shareIntent.js` detecta Expo Go y devuelve un hook no-op para evitar crasheos cuando el módulo nativo no está disponible.
- Probado en navegador, Expo Go iOS y Android. El Share Intent solo funciona en builds nativos (no en Expo Go).
- Sin datos de ejemplo: la app arranca limpia para tus amigos.
