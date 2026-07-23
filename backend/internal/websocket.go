package internal

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSClient struct {
	Conn     *websocket.Conn
	UserID   string
	Username string
	Send     chan []byte
}

type WSHub struct {
	clients    map[string]*WSClient // userID -> client
	mu         sync.RWMutex
	register   chan *WSClient
	unregister chan *WSClient
}

var Hub = &WSHub{
	clients:    make(map[string]*WSClient),
	register:   make(chan *WSClient),
	unregister: make(chan *WSClient),
}

func (h *WSHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("ws: %s connected", client.Username)
		case client := <-h.unregister:
			h.mu.Lock()
			if c, ok := h.clients[client.UserID]; ok && c == client {
				delete(h.clients, client.UserID)
			}
			h.mu.Unlock()
			close(client.Send)
			log.Printf("ws: %s disconnected", client.Username)
		}
	}
}

func (h *WSHub) SendToUser(userID string, msg any) {
	h.mu.RLock()
	client, ok := h.clients[userID]
	h.mu.RUnlock()
	if !ok {
		return
	}
	data, _ := json.Marshal(msg)
	select {
	case client.Send <- data:
	default:
		h.mu.Lock()
		delete(h.clients, userID)
		h.mu.Unlock()
	}
}

func HandleWS(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	userID := c.GetString("user_id")
	username := c.GetString("username")

	client := &WSClient{
		Conn:     conn,
		UserID:   userID,
		Username: username,
		Send:     make(chan []byte, 64),
	}

	Hub.register <- client

	// write pump
	go func() {
		defer conn.Close()
		for msg := range client.Send {
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}()

	// read pump
	go func() {
		defer func() {
			Hub.unregister <- client
			conn.Close()
		}()
		for {
			_, raw, err := conn.ReadMessage()
			if err != nil {
				return
			}
			var msg WSMessage
			if err := json.Unmarshal(raw, &msg); err != nil {
				continue
			}
			msg.From = userID

			switch msg.Type {
			case "message":
				// persist + forward
				SendMessageWS(userID, msg.To, msg.Content)
				Hub.SendToUser(msg.To, gin.H{
					"type":    "message",
					"from":    userID,
					"content": msg.Content,
					"to":      msg.To,
				})
				// confirm back to sender
				Hub.SendToUser(userID, gin.H{
					"type":    "message_sent",
					"to":      msg.To,
					"content": msg.Content,
				})
			case "typing":
				Hub.SendToUser(msg.To, gin.H{
					"type": "typing",
					"from": userID,
				})
			case "read":
				Hub.SendToUser(msg.To, gin.H{
					"type": "read",
					"from": userID,
				})
				MarkReadDB(userID, msg.To)

			// Agora call signaling
			case "call_invite":
				// Forward the invite to the callee with channel name
				Hub.SendToUser(msg.To, gin.H{
					"type":    "call_invite",
					"from":    userID,
					"channel": msg.Channel,
					"caller":  username,
				})
			case "call_answer":
				Hub.SendToUser(msg.To, gin.H{
					"type":    "call_answer",
					"from":    userID,
					"channel": msg.Channel,
				})
			case "call_end":
				Hub.SendToUser(msg.To, gin.H{
					"type": "call_end",
					"from": userID,
				})
			case "call_missed":
				Hub.SendToUser(msg.To, gin.H{
					"type": "call_missed",
					"from": userID,
				})
			}
		}
	}()
}

func SendMessageWS(from, to, content string) {
	_, err := Pool.Exec(context.Background(),
		`INSERT INTO messages (id, from_user, to_user, content) VALUES ($1,$2,$3,$4)`,
		"m-"+from[:4]+to[:4], from, to, content,
	)
	if err != nil {
		log.Printf("ws: failed to persist message: %v", err)
	}
}

func MarkReadDB(from, to string) {
	Pool.Exec(context.Background(),
		`UPDATE messages SET read_at=NOW() WHERE from_user=$1 AND to_user=$2 AND read_at IS NULL`,
		from, to,
	)
}
