package models

type Permission struct {
	PermissionID   int64  `db:"permission_id" json:"permission_id"`
	PermissionName string `db:"permission_name" json:"permission_name"`
	Description    string `db:"description" json:"description"`
}

type PermissionCreate struct {
	PermissionName string `json:"permission_name" binding:"required"`
	Description    string `json:"description"`
}

type PermissionUpdate struct {
	PermissionName string `json:"permission_name" binding:"required"`
	Description    string `json:"description"`
}
