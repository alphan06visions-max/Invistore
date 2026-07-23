package internal

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SendMessage(c *gin.Context) {
	fromID := c.GetString("user_id")
	var body struct {
		To      string `json:"to" binding:"required"`
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "to and content required"})
		return
	}

	var toID string
	err := Pool.QueryRow(context.Background(), `SELECT id FROM users WHERE id=$1`, body.To).Scan(&toID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	id := "m-" + uuid.New().String()[:12]
	now := time.Now()
	_, err = Pool.Exec(context.Background(),
		`INSERT INTO messages (id, from_user, to_user, content, created_at) VALUES ($1,$2,$3,$4,$5)`,
		id, fromID, toID, body.Content, now,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not send message"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "created_at": now})
}

func GetThread(c *gin.Context) {
	userID := c.GetString("user_id")
	otherID := c.Param("userId")

	rows, err := Pool.Query(context.Background(), `
		SELECT id, from_user, to_user, content, created_at, read_at
		FROM messages
		WHERE (from_user=$1 AND to_user=$2) OR (from_user=$2 AND to_user=$1)
		ORDER BY created_at ASC
		LIMIT 100
	`, userID, otherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	msgs := []Message{}
	for rows.Next() {
		var m Message
		rows.Scan(&m.ID, &m.FromUser, &m.ToUser, &m.Content, &m.CreatedAt, &m.ReadAt)
		msgs = append(msgs, m)
	}
	if msgs == nil {
		msgs = []Message{}
	}
	c.JSON(http.StatusOK, msgs)
}

func GetConversations(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := Pool.Query(context.Background(), `
		SELECT
			CASE WHEN m.from_user=$1 THEN m.to_user ELSE m.from_user END as other_id,
			u.username,
			COALESCE(u.avatar,''),
			(SELECT content FROM messages
			 WHERE ((from_user=$1 AND to_user=other_id) OR (from_user=other_id AND to_user=$1))
			 ORDER BY created_at DESC LIMIT 1) as last_msg,
			(SELECT COUNT(*) FROM messages
			 WHERE from_user=other_id AND to_user=$1 AND read_at IS NULL) as unread,
			(SELECT created_at FROM messages
			 WHERE ((from_user=$1 AND to_user=other_id) OR (from_user=other_id AND to_user=$1))
			 ORDER BY created_at DESC LIMIT 1) as updated
		FROM messages m
		JOIN users u ON u.id = CASE WHEN m.from_user=$1 THEN m.to_user ELSE m.from_user END
		WHERE m.from_user=$1 OR m.to_user=$1
		GROUP BY other_id, u.username, u.avatar
		ORDER BY updated DESC
		LIMIT 30
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	convs := []Conversation{}
	for rows.Next() {
		var cv Conversation
		var lastMsg, updated *string
		rows.Scan(&cv.UserID, &cv.Username, &cv.Avatar, &lastMsg, &cv.Unread, &updated)
		if lastMsg != nil {
			cv.LastMessage = *lastMsg
		}
		cv.UpdatedAt = time.Now()
		convs = append(convs, cv)
	}
	if convs == nil {
		convs = []Conversation{}
	}
	c.JSON(http.StatusOK, convs)
}

func MarkRead(c *gin.Context) {
	userID := c.GetString("user_id")
	fromID := c.Param("userId")

	Pool.Exec(context.Background(),
		`UPDATE messages SET read_at=NOW() WHERE from_user=$1 AND to_user=$2 AND read_at IS NULL`,
		fromID, userID,
	)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
