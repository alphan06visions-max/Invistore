package internal

import (
	"context"
	"io"
	"net/http"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gin-gonic/gin"
)

func UploadImage(c *gin.Context) {
	cldURL := os.Getenv("CLOUDINARY_URL")
	if cldURL == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cloudinary not configured"})
		return
	}

	cld, err := cloudinary.NewFromURL(cldURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cloudinary init failed"})
		return
	}

	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "read failed"})
		return
	}

	// Write to temp file for cloudinary SDK
	tmp, _ := os.CreateTemp("", "nexus-upload-*")
	defer os.Remove(tmp.Name())
	tmp.Write(data)
	tmp.Close()

	result, err := cld.Upload.Upload(context.Background(), tmp.Name(), uploader.UploadParams{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": result.SecureURL})
}
