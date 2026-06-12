package models

import "time"

type Session struct {
	SessionID   int64     `db:"session_id" json:"session_id"`
	UserID      int64     `db:"user_id" json:"user_id"`
	RefreshToken string   `db:"refresh_token" json:"-"`
	IPAddress   string    `db:"ip_address" json:"ip_address"`
	UserAgent   string    `db:"user_agent" json:"user_agent"`
	ExpiresAt   time.Time `db:"expires_at" json:"expires_at"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	RevokedAt   *time.Time `db:"revoked_at" json:"revoked_at,omitempty"`
}
