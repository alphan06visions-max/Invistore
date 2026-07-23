package internal

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func InitDB(databaseURL string) error {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return err
	}
	config.MaxConns = 20
	config.MinConns = 2

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	Pool, err = pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return err
	}

	if err := Pool.Ping(ctx); err != nil {
		return err
	}

	return migrate(ctx)
}

func migrate(ctx context.Context) error {
	ddl := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		bio TEXT DEFAULT '',
		avatar TEXT DEFAULT '',
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS follows (
		follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		PRIMARY KEY (follower_id, following_id)
	);

	CREATE TABLE IF NOT EXISTS posts (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		image_url TEXT NOT NULL,
		caption TEXT DEFAULT '',
		location TEXT DEFAULT '',
		created_at TIMESTAMPTZ DEFAULT NOW()
	);
	CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
	CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

	CREATE TABLE IF NOT EXISTS likes (
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		PRIMARY KEY (user_id, post_id)
	);

	CREATE TABLE IF NOT EXISTS comments (
		id TEXT PRIMARY KEY,
		post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		content TEXT NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);
	CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

	CREATE TABLE IF NOT EXISTS stories (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		media_url TEXT NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		expires_at TIMESTAMPTZ NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(expires_at) WHERE expires_at > NOW();

	CREATE TABLE IF NOT EXISTS messages (
		id TEXT PRIMARY KEY,
		from_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		to_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		content TEXT NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		read_at TIMESTAMPTZ
	);
	CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(from_user, to_user, created_at);

	CREATE TABLE IF NOT EXISTS notifications (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		type TEXT NOT NULL,
		reference_id TEXT DEFAULT '',
		created_at TIMESTAMPTZ DEFAULT NOW(),
		read BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
	`

	_, err := Pool.Exec(ctx, ddl)
	return err
}
