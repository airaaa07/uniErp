package erp

import (
	"backend/models"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type RecordService struct {
	db *sqlx.DB
}

func NewRecordService(db *sqlx.DB) *RecordService {
	return &RecordService{db: db}
}

func (s *RecordService) CreateRecord(req models.RecordCreate, createdBy int64) (*models.Record, error) {
	recordID := uuid.New().String()

	dataJSON, err := json.Marshal(req.Data)
	if err != nil {
		return nil, err
	}

	var record models.Record
	var rawData []byte

	err = s.db.QueryRow(
		`INSERT INTO records (
			record_id,
			module_key,
			data,
			created_by
		)
		VALUES ($1, $2, $3::jsonb, $4)
		RETURNING
			record_id,
			module_key,
			data,
			created_by,
			created_at`,
		recordID,
		req.ModuleKey,
		dataJSON,
		createdBy,
	).Scan(
		&record.RecordID,
		&record.ModuleKey,
		&rawData,
		&record.CreatedBy,
		&record.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	if len(rawData) > 0 {
		if err := json.Unmarshal(rawData, &record.Data); err != nil {
			return nil, err
		}
	}

	return &record, nil
}

func (s *RecordService) GetRecord(recordID string) (*models.Record, error) {
	var record models.Record
	err := s.db.Get(&record, "SELECT * FROM records WHERE record_id = $1", recordID)
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func (s *RecordService) GetRecordsByModule(moduleKey string) ([]models.Record, error) {
	type recordRow struct {
		RecordID  string    `db:"record_id"`
		ModuleKey string    `db:"module_key"`
		Data      []byte    `db:"data"`
		CreatedBy *int64    `db:"created_by"`
		CreatedAt time.Time `db:"created_at"`
	}

	var rows []recordRow

	err := s.db.Select(
		&rows,
		`SELECT record_id,
		        module_key,
		        data,
		        created_by,
		        created_at
		   FROM records
		  WHERE module_key = $1
		  ORDER BY created_at DESC`,
		moduleKey,
	)
	if err != nil {
		return nil, err
	}

	records := make([]models.Record, 0, len(rows))

	for _, row := range rows {
		var data map[string]interface{}

		if len(row.Data) > 0 {
			if err := json.Unmarshal(row.Data, &data); err != nil {
				return nil, err
			}
		}

		records = append(records, models.Record{
			RecordID:  row.RecordID,
			ModuleKey: row.ModuleKey,
			Data:      data,
			CreatedBy: row.CreatedBy,
			CreatedAt: row.CreatedAt,
		})
	}

	return records, nil
}

func (s *RecordService) UpdateRecord(recordID string, req models.RecordUpdate) (*models.Record, error) {
	dataJSON, err := json.Marshal(req.Data)
	if err != nil {
		return nil, err
	}

	_, err = s.db.Exec(
		"UPDATE records SET data = $1 WHERE record_id = $2",
		string(dataJSON), recordID,
	)
	if err != nil {
		return nil, err
	}

	return s.GetRecord(recordID)
}

func (s *RecordService) DeleteRecord(recordID string) error {
	_, err := s.db.Exec("DELETE FROM records WHERE record_id = $1", recordID)
	return err
}

func (s *RecordService) SearchRecords(moduleKey string, searchTerm string) ([]models.Record, error) {
	type recordRow struct {
		RecordID  string    `db:"record_id"`
		ModuleKey string    `db:"module_key"`
		Data      []byte    `db:"data"`
		CreatedBy *int64    `db:"created_by"`
		CreatedAt time.Time `db:"created_at"`
	}
	var rows []recordRow
	var err error

	if searchTerm != "" {
		searchPattern := "%" + searchTerm + "%"
		err = s.db.Select(&rows,
			"SELECT record_id, module_key, data, created_by, created_at FROM records WHERE module_key = $1 AND data::text ILIKE $2 ORDER BY created_at DESC",
			moduleKey, searchPattern)
	} else {
		err = s.db.Select(&rows, "SELECT record_id, module_key, data, created_by, created_at FROM records WHERE module_key = $1 ORDER BY created_at DESC", moduleKey)
	}

	if err != nil {
		return nil, err
	}

	records := make([]models.Record, 0, len(rows))
	for _, row := range rows {
		var data map[string]interface{}
		if len(row.Data) > 0 {
			if err := json.Unmarshal(row.Data, &data); err != nil {
				return nil, err
			}
		}
		records = append(records, models.Record{
			RecordID:  row.RecordID,
			ModuleKey: row.ModuleKey,
			Data:      data,
			CreatedBy: row.CreatedBy,
			CreatedAt: row.CreatedAt,
		})
	}
	return records, nil
}
