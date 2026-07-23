package internal

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthCfgProvider func() *Config

var AuthCfg AuthCfgProvider

func Register(c *gin.Context) {
	cfg := AuthCfg()
	var req AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email, username and password (min 6) required"})
		return
	}
	if req.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username required"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	id := "u-" + uuid.New().String()[:12]
	_, err = Pool.Exec(context.Background(),
		`INSERT INTO users (id, username, email, password, avatar) VALUES ($1, $2, $3, $4, $5)`,
		id, req.Username, req.Email, string(hash), "",
	)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "username or email already taken"})
		return
	}

	token, err := GenerateJWT(id, req.Username, cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  User{ID: id, Username: req.Username, Email: req.Email},
	})
}

func Login(c *gin.Context) {
	cfg := AuthCfg()
	var req AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email and password required"})
		return
	}

	var u User
	err := Pool.QueryRow(context.Background(),
		`SELECT id, username, email, password, COALESCE(bio,''), COALESCE(avatar,''), created_at FROM users WHERE email=$1`,
		req.Email,
	).Scan(&u.ID, &u.Username, &u.Email, &u.Password, &u.Bio, &u.Avatar, &u.CreatedAt)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := GenerateJWT(u.ID, u.Username, cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{Token: token, User: u})
}
