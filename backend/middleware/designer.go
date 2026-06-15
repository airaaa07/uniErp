package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// RequireDesignerRole ensures only users with role_id = 4 or role_id = 1 can access the route
func RequireDesignerRole(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := GetUserID(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Query the database to check if user has role_id = 4 (Designer) or role_id = 1 (Super Admin)
		var roleID int64
		err := db.Get(&roleID, `
			SELECT role_id 
			FROM user_roles 
			WHERE user_id = $1 AND role_id IN (1, 4)
			LIMIT 1
		`, userID)
		
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. Designer or Super Admin role required."})
			c.Abort()
			return
		}

		c.Next()
	}
}
