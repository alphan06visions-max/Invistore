# NEXUS Mobile — React Native (Expo)

App sociale cinématique — flux, stories, likes, commentaires, follow, messages temps réel (WebSocket).

## Prérequis
- Node.js 18+
- Compte Expo (gratuit) : https://expo.dev/signup
- Backend NEXUS déployé

## Configuration
```bash
cp .env.example .env
# Édite .env avec l'URL de ton backend
npm install
```

## Lancer en dev (Expo Go)
```bash
npx expo start
```
Scanne le QR code avec Expo Go (App Store / Play Store).

## Build APK Android via EAS Build (cloud gratuit)
```bash
npm install -g eas-cli
eas login
eas init
eas build --platform android --profile preview
```
→ URL de téléchargement APK en ~15 min.

## Structure
```
mobile/
├── src/
│   ├── App.tsx         # Root navigation + providers
│   ├── api/client.ts   # REST client + tokens
│   ├── context/        # AuthContext, SocketContext (WebSocket)
│   ├── theme/          # Lumen design system
│   ├── components/     # StoryRing, icons, utils
│   └── screens/        # Auth, Feed, Explore, Compose, Profile,
│                        PostDetail, Notifications, Conversations,
│                        ChatThread, StoryViewer
└── assets/
```

## Fonctionnalités
- ✅ Inscription + login (JWT 30j)
- ✅ Feed personnalisé
- ✅ Posts avec upload image Cloudinary
- ✅ Stories 24h
- ✅ Likes / Commentaires optimistes
- ✅ Follow / Unfollow
- ✅ Messages temps réel (WebSocket)
- ✅ "typing…" + accusés de lecture
- ✅ Notifications en direct
- ✅ Design Lumen (obsidian + ember)
