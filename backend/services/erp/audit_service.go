package erp

import (
	"backend/models"

	"github.com/jmoiron/sqlx"
)

type AuditService struct {
	db *sqlx.DB
}

func NewAuditService(db *sqlx.DB) *AuditService {
	return &AuditService{db: db}
}

func (s *AuditService) CreateLog(userID *int64, actionType, entityName, recordID string, oldValue, newValue interface{}, ipAddress string) error {
	_, err := s.db.Exec(
		`INSERT INTO audit_logs (user_id, action_type, entity_name, record_id, old_value, new_value, ip_address) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		userID, actionType, entityName, recordID, oldValue, newValue, ipAddress,
	)
	return err
}

func (s *AuditService) GetAllLogs(limit, offset int) ([]models.AuditLogResponse, error) {
	var logs []models.AuditLog
	err := s.db.Select(&logs, `
		SELECT * FROM audit_logs 
		ORDER BY created_at DESC 
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}

	var responses []models.AuditLogResponse
	for _, log := range logs {
		username := ""
		if log.UserID != nil {
			var user models.User
			err := s.db.Get(&user, "SELECT username FROM users WHERE user_id = $1", *log.UserID)
			if err == nil {
				username = user.Username
			}
		}

		responses = append(responses, models.AuditLogResponse{
			AuditID:    log.AuditID,
			UserID:     log.UserID,
			Username:   username,
			ActionType: log.ActionType,
			EntityName: log.EntityName,
			RecordID:   log.RecordID,
			OldValue:   log.OldValue,
			NewValue:   log.NewValue,
			IPAddress:  log.IPAddress,
			CreatedAt:  log.CreatedAt,
		})
	}

	return responses, nil
}

func (s *AuditService) GetLogsByEntity(entityName string, limit, offset int) ([]models.AuditLogResponse, error) {
	var logs []models.AuditLog
	err := s.db.Select(&logs, `
		SELECT * FROM audit_logs 
		WHERE entity_name = $1
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3
	`, entityName, limit, offset)
	if err != nil {
		return nil, err
	}

	var responses []models.AuditLogResponse
	for _, log := range logs {
		username := ""
		if log.UserID != nil {
			var user models.User
			err := s.db.Get(&user, "SELECT username FROM users WHERE user_id = $1", *log.UserID)
			if err == nil {
				username = user.Username
			}
		}

		responses = append(responses, models.AuditLogResponse{
			AuditID:    log.AuditID,
			UserID:     log.UserID,
			Username:   username,
			ActionType: log.ActionType,
			EntityName: log.EntityName,
			RecordID:   log.RecordID,
			OldValue:   log.OldValue,
			NewValue:   log.NewValue,
			IPAddress:  log.IPAddress,
			CreatedAt:  log.CreatedAt,
		})
	}

	return responses, nil
}

func (s *AuditService) GetLogsByUser(userID int64, limit, offset int) ([]models.AuditLogResponse, error) {
	var logs []models.AuditLog
	err := s.db.Select(&logs, `
		SELECT * FROM audit_logs 
		WHERE user_id = $1
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, err
	}

	var responses []models.AuditLogResponse
	for _, log := range logs {
		username := ""
		if log.UserID != nil {
			var user models.User
			err := s.db.Get(&user, "SELECT username FROM users WHERE user_id = $1", *log.UserID)
			if err == nil {
				username = user.Username
			}
		}

		responses = append(responses, models.AuditLogResponse{
			AuditID:    log.AuditID,
			UserID:     log.UserID,
			Username:   username,
			ActionType: log.ActionType,
			EntityName: log.EntityName,
			RecordID:   log.RecordID,
			OldValue:   log.OldValue,
			NewValue:   log.NewValue,
			IPAddress:  log.IPAddress,
			CreatedAt:  log.CreatedAt,
		})
	}

	return responses, nil
}
