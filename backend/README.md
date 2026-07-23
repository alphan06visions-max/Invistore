# Backend NEXUS — Go API
# ============================

## Prérequis
- Go 1.22+
- PostgreSQL 15+ (local ou Neon)
- Redis (local ou Upstash)
- Cloudinary (gratuit) pour les uploads d'images

## Configuration (variables d'env)
Crée un `.env` à côté :

```env
PORT=8080
DATABASE_URL=postgres://user:pass@host:5432/nexus?sslmode=require
REDIS_URL=redis://user:pass@host:6379
JWT_SECRET=super-secret-change-me
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

## Lancer en local

```bash
# Avec docker-compose (recommandé)
docker-compose up -d

# Ou sans Docker
go run ./cmd
```

## Déployer sur Fly.io (gratuit)

```bash
flyctl launch --name nexus-backend
flyctl secrets set DATABASE_URL=... REDIS_URL=... JWT_SECRET=... CLOUDINARY_URL=...
flyctl deploy
```

L'API sera disponible sur `https://nexus-backend.fly.dev`.

## Endpoints API

### Auth
- `POST /api/auth/register` — { email, username, password }
- `POST /api/auth/login` — { email, password }

### Posts
- `POST /api/posts` — form: image_url, caption, location
- `GET /api/posts` — feed
- `GET /api/posts/:id` — post détail
- `POST /api/posts/:id/like` — toggle like
- `GET /api/posts/:id/comments` — commentaires
- `POST /api/posts/:id/comments` — { content }

### Stories
- `POST /api/stories` — form: media_url
- `GET /api/stories` — stories actives

### Users
- `GET /api/users/search?q=...` — recherche
- `GET /api/users/:username` — profil
- `GET /api/users/:username/posts` — posts d'un user
- `POST /api/users/:username/follow` — toggle follow
- `PUT /api/users/me` — { bio, avatar }

### Messages
- `POST /api/messages` — { to, content }
- `GET /api/messages/:userId` — thread
- `GET /api/conversations` — liste conversations
- `POST /api/messages/:userId/read` — mark read

### Notifications
- `GET /api/notifications`

### Upload
- `POST /api/upload` — multipart: file

### WebSocket
- `GET /ws` — connexion WebSocket (JWT required)
