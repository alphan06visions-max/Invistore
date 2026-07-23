package internal

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SearchUsers(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusOK, []User{})
		return
	}

	userID, _ := c.Get("user_id")
	rows, err := Pool.Query(context.Background(), `
		SELECT id, username, COALESCE(bio,''), COALESCE(avatar,''),
		       (SELECT COUNT(*) FROM posts WHERE user_id=u.id) as posts_count,
		       (SELECT COUNT(*) FROM follows WHERE following_id=u.id) as followers_count,
		       (SELECT COUNT(*) FROM follows WHERE follower_id=u.id) as following_count,
		       EXISTS(SELECT 1 FROM follows WHERE follower_id=$2 AND following_id=u.id) as is_following
		FROM users u
		WHERE (username ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
		AND id != $2
		ORDER BY username
		LIMIT 20
	`, q, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	users := []UserProfile{}
	for rows.Next() {
		var u UserProfile
		rows.Scan(&u.ID, &u.Username, &u.Bio, &u.Avatar, &u.PostsCount, &u.FollowersCount, &u.FollowingCount, &u.IsFollowing)
		users = append(users, u)
	}
	c.JSON(http.StatusOK, users)
}

func GetProfile(c *gin.Context) {
	username := c.Param("username")
	userID, _ := c.Get("user_id")

	var u UserProfile
	err := Pool.QueryRow(context.Background(), `
		SELECT id, username, COALESCE(bio,''), COALESCE(avatar,''),
		       (SELECT COUNT(*) FROM posts WHERE user_id=u.id) as posts_count,
		       (SELECT COUNT(*) FROM follows WHERE following_id=u.id) as followers_count,
		       (SELECT COUNT(*) FROM follows WHERE follower_id=u.id) as following_count,
		       EXISTS(SELECT 1 FROM follows WHERE follower_id=$2 AND following_id=u.id) as is_following
		FROM users u WHERE username=$1
	`, username, userID).Scan(&u.ID, &u.Username, &u.Bio, &u.Avatar, &u.PostsCount, &u.FollowersCount, &u.FollowingCount, &u.IsFollowing)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, u)
}

func GetUserPosts(c *gin.Context) {
	username := c.Param("username")
	userID, _ := c.Get("user_id")

	rows, err := Pool.Query(context.Background(), `
		SELECT p.id, p.user_id, u.username, COALESCE(u.avatar,''), p.image_url, p.caption, COALESCE(p.location,''),
		       (SELECT COUNT(*) FROM likes WHERE post_id=p.id) as likes,
		       (SELECT COUNT(*) FROM comments WHERE post_id=p.id) as comments,
		       EXISTS(SELECT 1 FROM likes WHERE post_id=p.id AND user_id=$2) as liked,
		       p.created_at
		FROM posts p JOIN users u ON u.id=p.user_id
		WHERE u.username=$1
		ORDER BY p.created_at DESC
		LIMIT 30
	`, username, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	posts := []Post{}
	for rows.Next() {
		var p Post
		rows.Scan(&p.ID, &p.UserID, &p.Username, &p.Avatar, &p.ImageURL, &p.Caption, &p.Location, &p.Likes, &p.Comments, &p.Liked, &p.CreatedAt)
		posts = append(posts, p)
	}
	if posts == nil {
		posts = []Post{}
	}
	c.JSON(http.StatusOK, posts)
}

func ToggleFollow(c *gin.Context) {
	userID := c.GetString("user_id")
	targetUsername := c.Param("username")

	var targetID string
	err := Pool.QueryRow(context.Background(), `SELECT id FROM users WHERE username=$1`, targetUsername).Scan(&targetID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if targetID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot follow yourself"})
		return
	}

	tag, _ := Pool.Exec(context.Background(),
		`DELETE FROM follows WHERE follower_id=$1 AND following_id=$2`, userID, targetID,
	)
	if tag.RowsAffected() == 0 {
		Pool.Exec(context.Background(),
			`INSERT INTO follows (follower_id, following_id) VALUES ($1,$2)`, userID, targetID,
		)
		notify(targetID, userID, "follow", "")
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	var body struct {
		Bio    string `json:"bio"`
		Avatar string `json:"avatar"`
	}
	c.ShouldBindJSON(&body)

	_, err := Pool.Exec(context.Background(),
		`UPDATE users SET bio=$1, avatar=$2 WHERE id=$3`, body.Bio, body.Avatar, userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
