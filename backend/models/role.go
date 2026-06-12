package models



type Role struct {
	RoleID   int64  `db:"role_id" json:"role_id"`
	RoleName string `db:"role_name" json:"role_name"`
}

type RoleCreate struct {
	RoleName string `json:"role_name" binding:"required"`
}

type RoleUpdate struct {
	RoleName string `json:"role_name" binding:"required"`
}

type RoleResponse struct {
	RoleID       int64    `json:"role_id"`
	RoleName     string   `json:"role_name"`
	Permissions  []string `json:"permissions,omitempty"`
	UserCount    int      `json:"user_count,omitempty"`
}
