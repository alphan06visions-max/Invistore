package internal

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CreatePost(c *gin.Context) {
	userID := c.GetString("user_id")
	imageURL := c.PostForm("image_url")
	caption := c.PostForm("caption")
	location := c.PostForm("location")

	if imageURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image_url required"})
		return
	}

	id := "p-" + uuid.New().String()[:12]
	_, err := Pool.Exec(context.Background(),
		`INSERT INTO posts (id, user_id, image_url, caption, location) VALUES ($1,$2,$3,$4,$5)`,
		id, userID, imageURL, caption, location,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create post"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "status": "ok"})
}

func GetFeed(c *gin.Context) {
	userID, _ := c.Get("user_id")

	rows, err := Pool.Query(context.Background(), `
		SELECT p.id, p.user_id, u.username, COALESCE(u.avatar,''), p.image_url, p.caption, COALESCE(p.location,''),
		       (SELECT COUNT(*) FROM likes WHERE post_id=p.id) as likes,
		       (SELECT COUNT(*) FROM comments WHERE post_id=p.id) as comments,
		       EXISTS(SELECT 1 FROM likes WHERE post_id=p.id AND user_id=$1) as liked,
		       p.created_at
		FROM posts p
		JOIN users u ON u.id = p.user_id
		WHERE $1 = '' OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id=$1)
		   OR p.id IN (SELECT id FROM posts ORDER BY random() LIMIT 5)
		ORDER BY p.created_at DESC
		LIMIT 30
	`, userID)
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
	c.JSON(http.StatusOK, posts)
}

func GetPost(c *gin.Context) {
	postID := c.Param("id")
	userID, _ := c.Get("user_id")

	var p Post
	err := Pool.QueryRow(context.Background(), `
		SELECT p.id, p.user_id, u.username, COALESCE(u.avatar,''), p.image_url, p.caption, COALESCE(p.location,''),
		       (SELECT COUNT(*) FROM likes WHERE post_id=p.id) as likes,
		       (SELECT COUNT(*) FROM comments WHERE post_id=p.id) as comments,
		       EXISTS(SELECT 1 FROM likes WHERE post_id=p.id AND user_id=$2) as liked,
		       p.created_at
		FROM posts p JOIN users u ON u.id=p.user_id WHERE p.id=$1
	`, postID, userID).Scan(&p.ID, &p.UserID, &p.Username, &p.Avatar, &p.ImageURL, &p.Caption, &p.Location, &p.Likes, &p.Comments, &p.Liked, &p.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func ToggleLike(c *gin.Context) {
	userID := c.GetString("user_id")
	postID := c.Param("id")

	tag, err := Pool.Exec(context.Background(),
		`DELETE FROM likes WHERE user_id=$1 AND post_id=$2`, userID, postID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error"})
		return
	}
	if tag.RowsAffected() == 0 {
		_, err = Pool.Exec(context.Background(),
			`INSERT INTO likes (user_id, post_id) VALUES ($1,$2)`, userID, postID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error"})
			return
		}

		// notifier le propriétaire du post
		var ownerID string
		Pool.QueryRow(context.Background(), `SELECT user_id FROM posts WHERE id=$1`, postID).Scan(&ownerID)
		if ownerID != "" && ownerID != userID {
			notify(ownerID, userID, "like", postID)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func GetComments(c *gin.Context) {
	postID := c.Param("id")
	rows, err := Pool.Query(context.Background(), `
		SELECT c.id, c.post_id, c.user_id, u.username, COALESCE(u.avatar,''), c.content, c.created_at
		FROM comments c JOIN users u ON u.id=c.user_id
		WHERE c.post_id=$1 ORDER BY c.created_at ASC
	`, postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	comments := []Comment{}
	for rows.Next() {
		var cc Comment
		rows.Scan(&cc.ID, &cc.PostID, &cc.UserID, &cc.Username, &cc.Avatar, &cc.Content, &cc.CreatedAt)
		comments = append(comments, cc)
	}
	c.JSON(http.StatusOK, comments)
}

func AddComment(c *gin.Context) {
	userID := c.GetString("user_id")
	postID := c.Param("id")
	var body struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content required"})
		return
	}

	id := "c-" + uuid.New().String()[:12]
	_, err := Pool.Exec(context.Background(),
		`INSERT INTO comments (id, post_id, user_id, content) VALUES ($1,$2,$3,$4)`,
		id, postID, userID, body.Content,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error"})
		return
	}

	var ownerID string
	Pool.QueryRow(context.Background(), `SELECT user_id FROM posts WHERE id=$1`, postID).Scan(&ownerID)
	if ownerID != "" && ownerID != userID {
		notify(ownerID, userID, "comment", postID)
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "status": "ok"})
}
