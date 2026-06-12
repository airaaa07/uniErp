package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type RBACMiddleware struct {
}

func NewRBACMiddleware() *RBACMiddleware {
	return &RBACMiddleware{}
}

func (rbac *RBACMiddleware) RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := GetUserID(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func (rbac *RBACMiddleware) RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := GetUserID(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		c.Next()
	}
}
