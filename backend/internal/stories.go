package internal

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CreateStory(c *gin.Context) {
	userID := c.GetString("user_id")
	mediaURL := c.PostForm("media_url")
	if mediaURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "media_url required"})
		return
	}

	id := "s-" + uuid.New().String()[:12]
	expires := time.Now().Add(24 * time.Hour)
	_, err := Pool.Exec(context.Background(),
		`INSERT INTO stories (id, user_id, media_url, expires_at) VALUES ($1,$2,$3,$4)`,
		id, userID, mediaURL, expires,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create story"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "status": "ok"})
}

func GetStories(c *gin.Context) {
	userID, _ := c.Get("user_id")
	rows, err := Pool.Query(context.Background(), `
		SELECT s.id, s.user_id, u.username, COALESCE(u.avatar,''), s.media_url, s.created_at, s.expires_at
		FROM stories s JOIN users u ON u.id=s.user_id
		WHERE s.expires_at > NOW()
		AND ($1='' OR s.user_id IN (SELECT following_id FROM follows WHERE follower_id=$1) OR s.user_id=$1)
		ORDER BY s.created_at DESC
		LIMIT 50
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	stories := []Story{}
	for rows.Next() {
		var s Story
		rows.Scan(&s.ID, &s.UserID, &s.Username, &s.Avatar, &s.MediaURL, &s.CreatedAt, &s.ExpiresAt)
		stories = append(stories, s)
	}
	c.JSON(http.StatusOK, stories)
}
