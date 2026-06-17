package erp

import (
	"backend/models"
	"backend/utils"
	"encoding/json"
	"fmt"
	"strings"
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

// publicWriteProtected lists fields that the public cannot set on any module.
// The backend enforces these regardless of what the HTTP body contains.
var publicWriteProtected = map[string]string{
	// field_key → forced value for inquiry_master public submissions
	"inquiry_status": "Open",
}

// PublicCreateRecord is the server-enforced variant used by the public /records route.
// It strips any write-protected fields from the client payload and injects the
// correct server-side defaults so that no HTTP client can bypass them.
func (s *RecordService) PublicCreateRecord(req models.RecordCreate) (*models.Record, error) {
	// Ensure data map is initialised
	if req.Data == nil {
		req.Data = make(map[string]interface{})
	}

	// Force server-controlled values — client input is discarded for these keys.
	if req.ModuleKey == "inquiry_master" {
		for field, forcedValue := range publicWriteProtected {
			req.Data[field] = forcedValue
		}
	}

	var createdByID int64 = 0

	if req.ModuleKey == "inquiry_master" {
		var firstName, lastName, mobileNo, dobStr string
		if val, ok := req.Data["inq_fname"]; ok {
			firstName, _ = val.(string)
		}
		if val, ok := req.Data["inq_lname"]; ok {
			lastName, _ = val.(string)
		}
		if val, ok := req.Data["mobile_no"]; ok {
			mobileNo, _ = val.(string)
		}
		if val, ok := req.Data["dob"]; ok {
			dobStr, _ = val.(string)
		}

		// Clean mobile number to use as username
		username := mobileNo
		if username == "" {
			username = firstName + "_" + fmt.Sprintf("%d", time.Now().Unix())
		}
		email := username + "@university.edu"

		// Parse YYYY-MM-DD to DDMMYYYY
		password := "student123"
		if len(dobStr) == 10 {
			parts := strings.Split(dobStr, "-")
			if len(parts) == 3 {
				password = parts[2] + parts[1] + parts[0] // DDMMYYYY
			}
		}

		// Check if user already exists
		var existingID int64
		err := s.db.QueryRow("SELECT user_id FROM users WHERE username = $1", username).Scan(&existingID)
		if err == nil {
			createdByID = existingID
		} else {
			// Hash password
			hashedPassword, err := utils.HashPassword(password)
			if err != nil {
				return nil, err
			}

			// Insert user with force_password_change = true
			err = s.db.QueryRow(
				`INSERT INTO users (username, email, password_hash, first_name, last_name, force_password_change)
				 VALUES ($1, $2, $3, $4, $5, TRUE)
				 RETURNING user_id`,
				username, email, hashedPassword, firstName, lastName,
			).Scan(&createdByID)
			if err != nil {
				return nil, err
			}

			// Assign Student role (ID 8)
			var roleID int64
			err = s.db.QueryRow("SELECT role_id FROM roles WHERE role_name = 'Student'").Scan(&roleID)
			if err == nil && roleID > 0 {
				_, _ = s.db.Exec("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", createdByID, roleID)
			}
		}

		// Inject back to Data so that frontend can see them
		req.Data["generated_username"] = username
		req.Data["generated_password_format"] = "Your Date of Birth in DDMMYYYY format"
	}

	// Delegate to the normal create path
	return s.CreateRecord(req, createdByID)
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
	type recordRow struct {
		RecordID  string    `db:"record_id"`
		ModuleKey string    `db:"module_key"`
		Data      []byte    `db:"data"`
		CreatedBy *int64    `db:"created_by"`
		CreatedAt time.Time `db:"created_at"`
	}

	var row recordRow
	err := s.db.Get(&row, "SELECT * FROM records WHERE record_id = $1", recordID)
	if err != nil {
		return nil, err
	}

	var data map[string]interface{}
	if len(row.Data) > 0 {
		if err := json.Unmarshal(row.Data, &data); err != nil {
			return nil, err
		}
	}

	return &models.Record{
		RecordID:  row.RecordID,
		ModuleKey: row.ModuleKey,
		Data:      data,
		CreatedBy: row.CreatedBy,
		CreatedAt: row.CreatedAt,
	}, nil
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
