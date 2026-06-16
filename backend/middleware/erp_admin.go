package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// RequireERPAdminRole ensures only users with role_id = 2 (Admin) or role_id = 1 (Super Admin) can access the route
func RequireERPAdminRole(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := GetUserID(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Query the database to check if user has role_id = 2 (Admin) or role_id = 1 (Super Admin)
		var roleID int64
		err := db.Get(&roleID, `
			SELECT role_id 
			FROM user_roles 
			WHERE user_id = $1 AND role_id IN (1, 2)
			LIMIT 1
		`, userID)
		
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. ERP Admin or Super Admin role required."})
			c.Abort()
			return
		}

		c.Next()
	}
}
