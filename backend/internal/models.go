package internal

import "time"

// ── Users ──
type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Bio       string    `json:"bio"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
}

type UserProfile struct {
	ID              string `json:"id"`
	Username        string `json:"username"`
	Bio             string `json:"bio"`
	Avatar          string `json:"avatar"`
	PostsCount      int    `json:"posts_count"`
	FollowersCount  int    `json:"followers_count"`
	FollowingCount  int    `json:"following_count"`
	IsFollowing     bool   `json:"is_following"`
}

// ── Posts ──
type Post struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Username  string    `json:"username"`
	Avatar    string    `json:"avatar"`
	ImageURL  string    `json:"image_url"`
	Caption   string    `json:"caption"`
	Location  string    `json:"location"`
	Likes     int       `json:"likes"`
	Comments  int       `json:"comments"`
	Liked     bool      `json:"liked"`
	CreatedAt time.Time `json:"created_at"`
}

// ── Stories ──
type Story struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Username  string    `json:"username"`
	Avatar    string    `json:"avatar"`
	MediaURL  string    `json:"media_url"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

// ── Comments ──
type Comment struct {
	ID        string    `json:"id"`
	PostID    string    `json:"post_id"`
	UserID    string    `json:"user_id"`
	Username  string    `json:"username"`
	Avatar    string    `json:"avatar"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// ── Messages ──
type Message struct {
	ID        string     `json:"id"`
	FromUser  string     `json:"from_user"`
	ToUser    string     `json:"to_user"`
	Content   string     `json:"content"`
	CreatedAt time.Time  `json:"created_at"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
}

type Conversation struct {
	UserID      string    `json:"user_id"`
	Username    string    `json:"username"`
	Avatar      string    `json:"avatar"`
	LastMessage string    `json:"last_message"`
	Unread      int       `json:"unread"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ── Notifications ──
type Notification struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	FromUserID   string    `json:"from_user_id"`
	FromUsername string    `json:"from_username"`
	FromAvatar   string    `json:"from_avatar"`
	Type         string    `json:"type"`
	ReferenceID  string    `json:"reference_id,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	Read         bool      `json:"read"`
}

// ── Auth ──
type AuthRequest struct {
	Email    string `json:"email" binding:"required"`
	Username string `json:"username"`
	Password string `json:"password" binding:"required,min=6"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// ── WS ──
type WSMessage struct {
	Type    string `json:"type"`
	From    string `json:"from,omitempty"`
	To      string `json:"to,omitempty"`
	Content string `json:"content,omitempty"`
	ID      string `json:"id,omitempty"`
	Channel string `json:"channel,omitempty"` // Agora channel name
}
