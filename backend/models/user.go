package models

import "time"

type User struct {
	UserID              int64      `db:"user_id" json:"user_id"`
	Username            string     `db:"username" json:"username"`
	Email               string     `db:"email" json:"email"`
	PasswordHash        string     `db:"password_hash" json:"-"`
	FirstName           string     `db:"first_name" json:"first_name"`
	LastName            string     `db:"last_name" json:"last_name"`
	CollegeID           *string    `db:"college_id" json:"college_id"`
	IsActive            bool       `db:"is_active" json:"is_active"`
	ForcePasswordChange bool       `db:"force_password_change" json:"force_password_change"`
	CreatedAt           time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt           time.Time  `db:"updated_at" json:"updated_at"`
}

type UserCreate struct {
	Username  string  `json:"username" binding:"required"`
	Email     string  `json:"email" binding:"required,email"`
	Password  string  `json:"password" binding:"required,min=6"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	CollegeID *string `json:"college_id"`
	RoleID    int64   `json:"role_id"`
}

type UserUpdate struct {
	Username  *string `json:"username"`
	Email     *string `json:"email"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	IsActive  *bool   `json:"is_active"`
	RoleID    *int64  `json:"role_id"` // pointer to int64
}

type UserResponse struct {
	UserID              int64     `json:"user_id"`
	Username            string    `json:"username"`
	Email               string    `json:"email"`
	FirstName           string    `json:"first_name"`
	LastName            string    `json:"last_name"`
	CollegeID           *string   `json:"college_id,omitempty"`
	IsActive            bool      `json:"is_active"`
	ForcePasswordChange bool      `json:"force_password_change"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	Roles               []string  `json:"roles,omitempty"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}
