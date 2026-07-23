package internal

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GenerateAgoraToken builds an Agora RTC token (vendor key style, compatible with SDK 4.x)
func GenerateAgoraToken(c *gin.Context) {
	userID := c.GetString("user_id") // from JWT middleware
	username := c.GetString("username")

	var req struct {
		ChannelName string `json:"channelName" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "channelName required"})
		return
	}

	appID := os.Getenv("AGORA_APP_ID")
	appCert := os.Getenv("AGORA_APP_CERTIFICATE")
	if appID == "" || appCert == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Agora not configured"})
		return
	}

	// Simple deterministic UID from userID string
	uid := hashAgoraUID(userID)

	// Build Agora token (app-certificate style)
	token, err := buildAgoraToken(appID, appCert, req.ChannelName, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"appId":       appID,
		"channel":     req.ChannelName,
		"token":       token,
		"uid":         uid,
		"callerName":  username,
	})
}

// hashAgoraUID converts a string userID to uint32 deterministic uid
func hashAgoraUID(s string) uint32 {
	h := uint32(0)
	for _, c := range s {
		h = h*31 + uint32(c)
	}
	if h == 0 {
		h = 1
	}
	return h
}

// buildAgoraToken builds a raw Agora token string.
// Format for Agora SDK 4.x: "006<appID><hash><salt><ts>+<expire>"
// This is the simplified app-certificate token.
func buildAgoraToken(appID, appCert, channelName string, uid uint32) (string, error) {
	now := time.Now().Unix()
	salt := uint32(now%0xFFFFFFFF)
	ts := uint32(now)
	expire := ts + 86400 // 24h

	uidStr := strconv.FormatUint(uint64(uid), 10)

	// Sign = HMAC-SHA256(appCert, raw = AppID||ChannelName||UID||Salt||TS||Expire)
	raw := fmt.Sprintf("%s%s%s%d%d%d", appID, channelName, uidStr, salt, ts, expire)
	mac := hmac.New(sha256.New, []byte(appCert))
	mac.Write([]byte(raw))
	sign := hex.EncodeToString(mac.Sum(nil))

	// Format: 006<AppID><Sign><Salt><TS><Expire>
	token := fmt.Sprintf(
		"006%s%s%08x%08x%08x",
		appID,
		sign,
		salt, ts, expire,
	)

	return token, nil
}
