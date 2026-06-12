package services

import (
	"backend/models"
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"
)

type SettingsService struct {
	db *sqlx.DB
}

func NewSettingsService(db *sqlx.DB) *SettingsService {
	return &SettingsService{db: db}
}

func (s *SettingsService) CreateSetting(req models.AppSettingCreate) (*models.AppSetting, error) {
	var settingID int64
	err := s.db.QueryRow(
		`INSERT INTO app_settings (setting_key, setting_value, description) 
		 VALUES ($1, $2, $3) RETURNING setting_id`,
		req.SettingKey, req.SettingValue, req.Description,
	).Scan(&settingID)
	if err != nil {
		return nil, err
	}

	return s.GetSettingByID(settingID)
}

func (s *SettingsService) GetSettingByID(settingID int64) (*models.AppSetting, error) {
	var setting models.AppSetting
	err := s.db.Get(&setting, "SELECT * FROM app_settings WHERE setting_id = $1", settingID)
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

func (s *SettingsService) GetSettingByKey(settingKey string) (*models.AppSetting, error) {
	var setting models.AppSetting
	err := s.db.Get(&setting, "SELECT * FROM app_settings WHERE setting_key = $1", settingKey)
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

func (s *SettingsService) GetAllSettings() ([]models.AppSetting, error) {
	var settings []models.AppSetting
	err := s.db.Select(&settings, "SELECT * FROM app_settings ORDER BY setting_key")
	if err != nil {
		return nil, err
	}
	return settings, nil
}

func (s *SettingsService) UpdateSetting(settingID int64, req models.AppSettingUpdate) (*models.AppSetting, error) {
	query := "UPDATE app_settings SET updated_at = $1"
	args := []interface{}{time.Now()}
	argCount := 2

	if req.SettingValue != nil {
		query += ", setting_value = $" + string(rune('0'+argCount))
		args = append(args, *req.SettingValue)
		argCount++
	}

	if req.Description != nil {
		query += ", description = $" + string(rune('0'+argCount))
		args = append(args, *req.Description)
		argCount++
	}

	query += " WHERE setting_id = $" + string(rune('0'+argCount))
	args = append(args, settingID)

	_, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	return s.GetSettingByID(settingID)
}

func (s *SettingsService) UpdateSettingByKey(settingKey string, req models.AppSettingUpdate) (*models.AppSetting, error) {
	setting, err := s.GetSettingByKey(settingKey)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}

	return s.UpdateSetting(setting.SettingID, req)
}

func (s *SettingsService) DeleteSetting(settingID int64) error {
	_, err := s.db.Exec("DELETE FROM app_settings WHERE setting_id = $1", settingID)
	return err
}
