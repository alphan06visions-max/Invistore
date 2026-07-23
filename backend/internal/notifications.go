package internal

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func notify(toUserID, fromUserID, typ, refID string) {
	id := "n-" + uuid.New().String()[:12]
	Pool.Exec(context.Background(),
		`INSERT INTO notifications (id, user_id, from_user_id, type, reference_id) VALUES ($1,$2,$3,$4,$5)`,
		id, toUserID, fromUserID, typ, refID,
	)
	// broadcast via Redis pub/sub so the WS hub picks it up
	Rdb.Publish(context.Background(), "notifications:"+toUserID, typ)
}

func GetNotifications(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := Pool.Query(context.Background(), `
		SELECT n.id, n.user_id, n.from_user_id, u.username, COALESCE(u.avatar,''),
		       n.type, COALESCE(n.reference_id,''), n.created_at, n.read
		FROM notifications n JOIN users u ON u.id=n.from_user_id
		WHERE n.user_id=$1
		ORDER BY n.created_at DESC
		LIMIT 50
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := []Notification{}
	for rows.Next() {
		var n Notification
		rows.Scan(&n.ID, &n.UserID, &n.FromUserID, &n.FromUsername, &n.FromAvatar, &n.Type, &n.ReferenceID, &n.CreatedAt, &n.Read)
		items = append(items, n)
	}
	if items == nil {
		items = []Notification{}
	}

	// mark all as read after ~2s in background
	go func() {
		time.Sleep(2 * time.Second)
		Pool.Exec(context.Background(), `UPDATE notifications SET read=true WHERE user_id=$1 AND read=false`, userID)
	}()

	c.JSON(http.StatusOK, items)
}
