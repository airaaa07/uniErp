package models

import "time"

type AppSetting struct {
	SettingID    int64     `db:"setting_id" json:"setting_id"`
	SettingKey   string    `db:"setting_key" json:"setting_key"`
	SettingValue string    `db:"setting_value" json:"setting_value"`
	Description  string    `db:"description" json:"description"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type AppSettingCreate struct {
	SettingKey   string `json:"setting_key" binding:"required"`
	SettingValue string `json:"setting_value"`
	Description  string `json:"description"`
}

type AppSettingUpdate struct {
	SettingValue *string `json:"setting_value"`
	Description  *string `json:"description"`
}
