package models

import "time"

type AuditLog struct {
	AuditID    int64      `db:"audit_id" json:"audit_id"`
	UserID     *int64     `db:"user_id" json:"user_id,omitempty"`
	ActionType string     `db:"action_type" json:"action_type"`
	EntityName string     `db:"entity_name" json:"entity_name"`
	RecordID   string     `db:"record_id" json:"record_id,omitempty"`
	OldValue   interface{} `db:"old_value" json:"old_value,omitempty"`
	NewValue   interface{} `db:"new_value" json:"new_value,omitempty"`
	IPAddress  string     `db:"ip_address" json:"ip_address,omitempty"`
	CreatedAt  time.Time  `db:"created_at" json:"created_at"`
}

type AuditLogResponse struct {
	AuditID    int64       `json:"audit_id"`
	UserID     *int64      `json:"user_id,omitempty"`
	Username   string      `json:"username,omitempty"`
	ActionType string      `json:"action_type"`
	EntityName string      `json:"entity_name"`
	RecordID   string      `json:"record_id,omitempty"`
	OldValue   interface{} `json:"old_value,omitempty"`
	NewValue   interface{} `json:"new_value,omitempty"`
	IPAddress  string      `json:"ip_address,omitempty"`
	CreatedAt  time.Time   `json:"created_at"`
}
