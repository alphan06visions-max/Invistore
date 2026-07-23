# NEXUS 🌆
Un flux social au style cinématographique — filmé comme un film, ressenti comme la vie.

Application sociale complète : backend Go + PostgreSQL + Redis + WebSocket, app mobile React Native (APK Android), design Lumen (obsidien + ember).

## 📂 Structure
```
nexus/
├── DEPLOY.md               # ← COMMENCE ICI : guide de déploiement pas-à-pas
├── backend/                # API Go (Gin + pgx + go-redis + gorilla/websocket)
│   ├── cmd/main.go
│   ├── internal/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── fly.toml
│   └── README.md
├── mobile/                 # App React Native (Expo, TypeScript)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── screens/       # Auth, Feed, Explore, Compose, Profile,
│   │   │                  # PostDetail, Notifications, Conversations,
│   │   │                  # ChatThread, StoryViewer, CallScreen, IncomingCallScreen
│   │   ├── components/    # StoryRing, icons SVG, callUtils
│   │   ├── context/       # AuthContext, SocketContext, CallListener
│   │   ├── theme/         # Lumen (obsidian + ember)
│   │   └── api/           # REST + AsyncStorage tokens
│   └── README.md
└── README.md
```

## 🎯 Fonctionnalités

| Fonctionnalité | Statut |
|---|---|
| Inscription + connexion (bcrypt + JWT 30j) | ✅ |
| Feed cinématique | ✅ |
| Publier une publication (upload image via Cloudinary) | ✅ |
| Stories 24h + visionneuse plein écran | ✅ |
| Likes / Commentaires | ✅ |
| Follow / Unfollow | ✅ |
| Recherche d'utilisateurs | ✅ |
| Profil utilisateur (bio, avatar, grille de posts) | ✅ |
| Messages 1-1 en temps réel (WebSocket) | ✅ |
| Indicateur "typing…" + accusés de lecture | ✅ |
| Notifications en direct | ✅ |
| Reconnexion WebSocket automatique | ✅ |
| Appels vidéo/audio (Agora, gratuit 10K min/mois) | ✅ |

## 🚀 Pour démarrer
Lis **DEPLOY.md** — c'est le guide complet de déploiement (30-45 min du zéro à l'APK entre tes mains).

## 💰 Coût
0 €/mois sur les niveaux gratuits, largement suffisant pour lancer et tester avec 100-1000 utilisateurs.
