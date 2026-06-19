package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// RequireUniversityAdminRole ensures only users with Super Admin or University Admin roles can access
func RequireUniversityAdminRole(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := GetUserID(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Query the database to check if user has university-level admin roles
		// role_id 1 = Super Admin, role_id 2 = University Admin (based on seed order)
		var roleID int64
		err := db.Get(&roleID, `
			SELECT role_id
			FROM user_roles
			WHERE user_id = $1 AND role_id IN (1, 2)
			LIMIT 1
		`, userID)

		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. University Admin or Super Admin role required."})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireCollegeAdminRole ensures only users with College Admin role can access
// and sets college_id in context for scoped operations
func RequireCollegeAdminRole(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := GetUserID(c)
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Query the database to check if user has college admin role
		// Also retrieve the college_id for this admin
		var collegeID string
		err := db.Get(&collegeID, `
			SELECT u.college_id
			FROM users u
			INNER JOIN user_roles ur ON u.user_id = ur.user_id
			INNER JOIN roles r ON ur.role_id = r.role_id
			WHERE u.user_id = $1
			  AND LOWER(r.role_name) = 'college admin'
			  AND u.college_id IS NOT NULL
			LIMIT 1
		`, userID)

		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. College Admin role with assigned college required."})
			c.Abort()
			return
		}

		// Set college_id in context for handlers to use
		c.Set("college_id", collegeID)
		c.Next()
	}
}

// GetUserCollegeID retrieves the college_id associated with a College Admin user
func GetUserCollegeID(db *sqlx.DB, userID int64) (string, error) {
	var collegeID string
	err := db.Get(&collegeID, `
		SELECT college_id
		FROM users
		WHERE user_id = $1
	`, userID)
	return collegeID, err
}
