package main

import (
	"log"
	"nexus-backend/internal"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var cfg *internal.Config

func main() {
	cfg = internal.LoadConfig()
	if err := internal.InitDB(cfg.DatabaseURL); err != nil { log.Fatalf("db: %v", err) }
	log.Println("db: connected")
	if err := internal.InitRedis(cfg.RedisURL); err != nil { log.Printf("redis: %v (running without redis)", err) } else { log.Println("redis: connected") }
	go internal.Hub.Run()
	r := gin.Default()
	r.Use(cors.New(cors.Config{AllowOrigins: []string{"*"}, AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, AllowHeaders: []string{"Authorization", "Content-Type"}, AllowCredentials: true}))
	internal.AuthCfg = func() *internal.Config { return cfg }
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	r.POST("/api/auth/register", internal.Register)
	r.POST("/api/auth/login", internal.Login)
	api := r.Group("/api")
	api.Use(internal.AuthMiddleware(cfg))
	api.POST("/posts", internal.CreatePost)
	api.GET("/posts", internal.GetFeed)
	api.GET("/posts/:id", internal.GetPost)
	api.POST("/posts/:id/like", internal.ToggleLike)
	api.GET("/posts/:id/comments", internal.GetComments)
	api.POST("/posts/:id/comments", internal.AddComment)
	api.POST("/stories", internal.CreateStory)
	api.GET("/stories", internal.GetStories)
	api.GET("/users/search", internal.SearchUsers)
	api.GET("/users/:username", internal.GetProfile)
	api.GET("/users/:username/posts", internal.GetUserPosts)
	api.POST("/users/:username/follow", internal.ToggleFollow)
	api.PUT("/users/me", internal.UpdateProfile)
	api.POST("/messages", internal.SendMessage)
	api.GET("/messages/:userId", internal.GetThread)
	api.GET("/conversations", internal.GetConversations)
	api.POST("/messages/:userId/read", internal.MarkRead)
	api.GET("/notifications", internal.GetNotifications)
	api.POST("/upload", internal.UploadImage)
	api.POST("/call/token", internal.GenerateAgoraToken)
	r.GET("/ws", func(c *gin.Context) { internal.AuthMiddleware(cfg)(c); if !c.IsAborted() { internal.HandleWS(c) } })
	log.Printf("nexus listening on :%s", cfg.Port)
	r.Run(":" + cfg.Port)
}
