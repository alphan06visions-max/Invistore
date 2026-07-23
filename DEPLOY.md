# 🚀 Déployer NEXUS — Guide pas à pas (30-45 min)

Ce guide te mène du zéro à une API en production + APK Android téléchargeable.  
**Coût total : 0 €/mois** (niveaux gratuits de tous les services).

---

## 📋 Ce dont tu as besoin

| Service | Gratuit ? | Sert à |
|---|---|---|
| [Neon](https://neon.tech) | ✅ 500 Mo | PostgreSQL dans le cloud |
| [Upstash](https://upstash.com) | ✅ 256 Mo | Redis dans le cloud |
| [Cloudinary](https://cloudinary.com) | ✅ 25 Go/mois | Stockage d'images |
| [Agora](https://agora.io) | ✅ 10K min/mois | Appels vidéo/audio |
| [Fly.io](https://fly.io) | ✅ 3 VMs partagées | Héberger l'API Go |
| [Expo](https://expo.dev) | ✅ Gratuit | Compiler l'APK Android |

---

## Étape 1 — Créer les comptes

### 1a. Neon (PostgreSQL)
1. Va sur https://neon.tech → "Sign Up" (GitHub login ok)
2. Crée un projet → nomme-le `nexus`
3. Tu obtiens un **DATABASE_URL** : `postgres://...`
   Copie-le dans un bloc-notes.

### 1b. Upstash (Redis)
1. Va sur https://upstash.com → "Console" → "Create Database"
2. Choisis **Redis**, région proche de toi, tier **Free**
3. Tu obtiens un **REDIS_URL** : `redis://...`
   Copie-le aussi.

### 1c. Cloudinary (Images)
1. Va sur https://cloudinary.com → "Sign Up"
2. Une fois inscrit, ton Dashboard affiche une **CLOUDINARY_URL** :
   `cloudinary://api_key:api_secret@cloud_name`
   Copie-la.

### 1d. Agora (Appels vidéo/audio)
1. Va sur https://console.agora.io → "Sign Up"
2. Crée un projet → nomme-le `nexus`
3. Dans "Project Management", récupère :
   - **App ID**
   - **App Certificate** (onglet "Primary Certificate")
4. Copie les deux.

---

## Étape 2 — Déployer l'API (Fly.io)

### 2a. Installer Fly CLI
```bash
# macOS / Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### 2b. Lancer l'API
```bash
cd backend
flyctl launch --name nexus-backend
# → réponds "yes" pour copier la config, "no" pour déployer maintenant

# Injecte les secrets (TOUS les secrets, y compris Agora)
flyctl secrets set \
  DATABASE_URL="postgres://..." \
  REDIS_URL="redis://..." \
  JWT_SECRET="$(openssl rand -hex 32)" \
  CLOUDINARY_URL="cloudinary://..." \
  AGORA_APP_ID="xxxxxxxxxx" \
  AGORA_APP_CERTIFICATE="xxxxxxxxxx"

# Déploie
flyctl deploy
```

✅ L'API est en ligne sur `https://nexus-backend.fly.dev/health`

---

## Étape 3 — Compiler l'APK (Expo)

### 3a. Configurer le mobile
```bash
cd mobile
npm install
cp .env.example .env
# Édite .env → remplace l'URL par la tienne si nécessaire
# Note: pas besoin de mettre AGORA_APP_ID ici, il est récupéré depuis le backend
```

### 3b. Build APK via EAS (cloud gratuit, ~15 min)
```bash
npm install -g eas-cli
eas login
eas init
eas build --platform android --profile preview
```

📱 Tu reçois une **URL de téléchargement** de l'APK.  
Installe-la sur n'importe quel Android (active "Sources inconnues").

---

## Alternative — Build APK via GitHub Actions
Si tu push sur GitHub, un workflow `.github/workflows/build-apk.yml` compile l'APK automatiquement :
1. Va dans l'onglet **Actions** de ton repo
2. Lance "Build Android APK"
3. Télécharge l'APK depuis l'artifact

---

## 📞 Comment fonctionnent les appels Agora

1. **Lancement** : Bouton 📞 (audio) ou 📹 (vidéo) dans une conversation
2. **Signalisation** : WebSocket envoie `call_invite` au destinataire
3. **Réception** : Écran plein écran "INCOMING CALL" avec vibration
4. **Connexion** : Les deux utilisateurs récupèrent un token via `POST /api/call/token`
5. **Streaming** : Agora Web SDK gère tout (P2P, relayé si nécessaire)
6. **Fin d'appel** : Raccrocher → `call_end` via WebSocket

### Sécurité Agora
- Les tokens sont générés côté serveur avec HMAC-SHA256
- Valides 24h
- UID déterministe basé sur le userID (pas de collision)
- Channel nommé `nexus:call:<hash>` — unique par paire d'utilisateurs

---

## 🔧 Dépannage

| Problème | Solution |
|---|---|
| "Network request failed" | Vérifier l'URL dans `.env`. Sur émulateur Android utiliser `10.0.2.2` au lieu de `localhost` |
| WS ne se connecte pas | Token JWT expiré → déconnecter/reconnecter |
| Upload image échoué | Vérifier `CLOUDINARY_URL` dans les secrets Fly |
| Appels qui ne marchent pas | Vérifier `AGORA_APP_ID` et `AGORA_APP_CERTIFICATE` dans `flyctl secrets` |
| Fly "no machines" | `flyctl scale count 1` |
