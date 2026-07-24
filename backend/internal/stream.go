package internal

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func GenerateStreamToken(c *gin.Context) {
	apiKey := os.Getenv("STREAM_API_KEY")
	apiSecret := os.Getenv("STREAM_API_SECRET")
	if apiKey == "" || apiSecret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Stream Chat not configured"})
		return
	}
	userID := c.GetString("user_id")
	username := c.GetString("username")
	c.JSON(http.StatusOK, gin.H{"token": "stream-jwt-" + userID, "apiKey": apiKey, "userId": userID, "user": gin.H{"id": userID, "name": username}})
}
