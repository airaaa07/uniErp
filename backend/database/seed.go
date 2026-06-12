package database

import (
	"backend/utils"
	"database/sql"
	"log"

	"github.com/jmoiron/sqlx"
)

func SeedData(db *sqlx.DB) error {
	// Seed Permissions
	permissions := []struct {
		name        string
		description string
	}{
		{"user.create", "Create new users"},
		{"user.read", "View users"},
		{"user.update", "Update users"},
		{"user.delete", "Delete users"},
		{"user.disable", "Disable users"},
		{"role.create", "Create new roles"},
		{"role.read", "View roles"},
		{"role.update", "Update roles"},
		{"role.delete", "Delete roles"},
		{"role.assign", "Assign roles to users"},
		{"audit.read", "View audit logs"},
		{"settings.read", "View system settings"},
		{"settings.update", "Update system settings"},
		{"settings.create", "Create system settings"},
		{"settings.delete", "Delete system settings"},
	}

	permissionIDs := make(map[string]int64)
	for _, perm := range permissions {
		var id int64
		err := db.QueryRow(
			`INSERT INTO permissions (permission_name, description) 
			 VALUES ($1, $2) 
			 ON CONFLICT (permission_name) DO UPDATE SET description = EXCLUDED.description
			 RETURNING permission_id`,
			perm.name, perm.description,
		).Scan(&id)
		
		if err != nil && err != sql.ErrNoRows {
			// If insert failed due to conflict, get the existing ID
			err = db.QueryRow(
				"SELECT permission_id FROM permissions WHERE permission_name = $1",
				perm.name,
			).Scan(&id)
			if err != nil {
				log.Printf("Warning: Could not get permission ID for %s: %v", perm.name, err)
				continue
			}
		}
		permissionIDs[perm.name] = id
	}

	// Seed Roles
	roles := []struct {
		name string
	}{
		{"Super Admin"},
		{"Admin"},
		{"Counsellor"},
		{"Admission Officer"},
		{"Registrar"},
	}

	roleIDs := make(map[string]int64)
	for _, role := range roles {
		var id int64
		err := db.QueryRow(
			`INSERT INTO roles (role_name) 
			 VALUES ($1) 
			 ON CONFLICT (role_name) DO UPDATE SET role_name = EXCLUDED.role_name
			 RETURNING role_id`,
			role.name,
		).Scan(&id)
		
		if err != nil && err != sql.ErrNoRows {
			// If insert failed due to conflict, get the existing ID
			err = db.QueryRow(
				"SELECT role_id FROM roles WHERE role_name = $1",
				role.name,
			).Scan(&id)
			if err != nil {
				log.Printf("Warning: Could not get role ID for %s: %v", role.name, err)
				continue
			}
		}
		roleIDs[role.name] = id
	}

	// Assign permissions to roles
	rolePermissions := map[string][]string{
		"Super Admin": {
			"user.create", "user.read", "user.update", "user.delete", "user.disable",
			"role.create", "role.read", "role.update", "role.delete", "role.assign",
			"audit.read",
			"settings.read", "settings.update", "settings.create", "settings.delete",
		},
		"Admin": {
			"user.create", "user.read", "user.update", "user.disable",
			"role.read", "role.assign",
			"audit.read",
			"settings.read",
		},
		"Counsellor": {
			"user.read",
			"audit.read",
		},
		"Admission Officer": {
			"user.read", "user.update",
			"audit.read",
		},
		"Registrar": {
			"user.read", "user.update",
			"audit.read",
			"settings.read",
		},
	}

	for roleName, perms := range rolePermissions {
		roleID, ok := roleIDs[roleName]
		if !ok {
			log.Printf("Warning: Role ID not found for %s", roleName)
			continue
		}
		
		for _, permName := range perms {
			permID, ok := permissionIDs[permName]
			if !ok {
				log.Printf("Warning: Permission ID not found for %s", permName)
				continue
			}
			
			_, err := db.Exec(
				`INSERT INTO role_permissions (role_id, permission_id) 
				 VALUES ($1, $2) 
				 ON CONFLICT (role_id, permission_id) DO NOTHING`,
				roleID, permID,
			)
			if err != nil {
				log.Printf("Error assigning permission %s to role %s: %v", permName, roleName, err)
			}
		}
	}

	// Create default admin user
	passwordHash, err := utils.HashPassword("admin123")
	if err != nil {
		return err
	}

	var adminUserID int64
	err = db.QueryRow(
		`INSERT INTO users (username, email, password_hash, first_name, last_name) 
		 VALUES ($1, $2, $3, $4, $5) 
		 ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
		 RETURNING user_id`,
		"admin", "admin@university.edu", passwordHash, "System", "Administrator",
	).Scan(&adminUserID)

	if err != nil && err != sql.ErrNoRows {
		// If insert failed due to conflict, get the existing ID
		err = db.QueryRow(
			"SELECT user_id FROM users WHERE username = $1",
			"admin",
		).Scan(&adminUserID)
		if err != nil {
			log.Printf("Warning: Could not get admin user ID: %v", err)
			adminUserID = 0
		}
	}

	// Assign Super Admin role to admin user (only if user was created or found)
	if adminUserID > 0 {
		superAdminRoleID, ok := roleIDs["Super Admin"]
		if !ok {
			log.Printf("Warning: Super Admin role ID not found")
		} else {
			_, err = db.Exec(
				`INSERT INTO user_roles (user_id, role_id) 
				 VALUES ($1, $2) 
				 ON CONFLICT (user_id, role_id) DO NOTHING`,
				adminUserID, superAdminRoleID,
			)
			if err != nil {
				log.Printf("Error assigning Super Admin role to admin user: %v", err)
			}
		}
	}

	log.Println("Database seeded successfully!")
	log.Println("Default admin user created:")
	log.Println("Username: admin")
	log.Println("Password: admin123")
	log.Println("Please change this password after first login!")

	return nil
}
