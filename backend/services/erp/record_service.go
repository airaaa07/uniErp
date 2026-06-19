package erp

import (
	"backend/models"
	"backend/utils"
	"database/sql"
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

var ModuleRolePermissions = map[string][]string{
	"inquiry_master":         {"super admin", "university admin", "admin", "college admin", "counsellor", "student"},
	"counsellor_arrangement": {"super admin", "university admin", "admin"},
	"counsellor_master":      {"super admin", "university admin", "admin", "student"},
	"course_master":          {"super admin", "university admin", "admin", "college admin", "admission officer", "student"},
	"streams_master":         {"super admin", "university admin", "admin", "college admin", "admission officer", "student"},
	"subject_master":         {"super admin", "university admin", "admin", "college admin", "student"},
	"registration":           {"super admin", "university admin", "admin", "college admin", "finance controller", "admission officer", "registrar", "student"},
	"enrollment_master":      {"super admin", "university admin", "admin", "college admin", "registrar", "student"},
	"hostel_allotment":       {"super admin", "university admin", "admin", "college admin", "registrar"},
	"transport_allotment":    {"super admin", "university admin", "admin", "college admin", "registrar"},
	"fee_master":             {"super admin", "university admin", "admin", "college admin", "finance controller","student"},
	"registration_fee":       {"super admin", "university admin", "admin", "college admin", "finance controller"},
	"institute_master":       {"super admin", "university admin", "admin", "college admin", "counsellor", "student"},
}

func (s *RecordService) getUserRolesAndCollege(userID int64) ([]string, string, error) {
	if userID == 0 {
		return nil, "", nil
	}

	var roles []string
	err := s.db.Select(&roles, `
		SELECT LOWER(r.role_name)
		FROM roles r
		INNER JOIN user_roles ur ON r.role_id = ur.role_id
		WHERE ur.user_id = $1
	`, userID)
	if err != nil {
		return nil, "", err
	}

	var collegeID sql.NullString
	err = s.db.Get(&collegeID, "SELECT college_id FROM users WHERE user_id = $1", userID)
	if err != nil {
		return nil, "", err
	}

	var cID string = ""
	if collegeID.Valid {
		cID = collegeID.String
	}

	return roles, cID, nil
}

func (s *RecordService) checkModuleAccess(userID int64, moduleKey string) (bool, []string, string, error) {
	if userID == 0 {
		publicModules := map[string]bool{
			"inquiry_master":    true,
			"course_master":     true,
			"stream_master":     true,
			"streams_master":    true,
			"counsellor_master": true,
			"institute_master":  true,
			"fee_master":        true,
			"registration":      true,
			"enrollment":        true,
			"inquiry_status":    true,
		}
		if publicModules[moduleKey] {
			return true, nil, "", nil
		}
		return false, nil, "", fmt.Errorf("public access to module %s is denied", moduleKey)
	}

	roles, collegeID, err := s.getUserRolesAndCollege(userID)
	if err != nil {
		return false, nil, "", err
	}

	isAdmin := false
	for _, r := range roles {
		if r == "super admin" || r == "university admin" || r == "admin" || r == "designer" {
			isAdmin = true
			break
		}
	}

	if isAdmin {
		return true, roles, collegeID, nil
	}

	allowedRoles, exists := ModuleRolePermissions[moduleKey]
	if !exists {
		for _, r := range roles {
			if r == "college admin" {
				return true, roles, collegeID, nil
			}
		}
		return false, nil, "", fmt.Errorf("module %s is restricted", moduleKey)
	}

	hasRole := false
	for _, r := range roles {
		for _, ar := range allowedRoles {
			if r == ar {
				hasRole = true
				break
			}
		}
		if hasRole {
			break
		}
	}

	if !hasRole {
		return false, nil, "", fmt.Errorf("access denied to module %s for current roles", moduleKey)
	}

	return true, roles, collegeID, nil
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

	// Delegate to the normal create path with skipAccessCheck=true
	// (public endpoints don't need role-based access control since they're for unauthenticated users)
	return s.CreateRecordWithSkipAccess(req, createdByID)
}

func (s *RecordService) CreateRecordWithSkipAccess(req models.RecordCreate, createdBy int64) (*models.Record, error) {
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

func (s *RecordService) CreateRecord(req models.RecordCreate, createdBy int64) (*models.Record, error) {
	if createdBy > 0 {
		allowed, _, _, err := s.checkModuleAccess(createdBy, req.ModuleKey)
		if err != nil || !allowed {
			return nil, fmt.Errorf("forbidden: %v", err)
		}
	}

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

func (s *RecordService) getRawRecord(recordID string) (*models.Record, error) {
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

func (s *RecordService) GetRecord(recordID string, userID int64) (*models.Record, error) {
	record, err := s.getRawRecord(recordID)
	if err != nil {
		return nil, err
	}

	allowed, roles, collegeID, err := s.checkModuleAccess(userID, record.ModuleKey)
	if err != nil || !allowed {
		return nil, fmt.Errorf("forbidden: %v", err)
	}

	isCounsellorOnly := false
	isCollegeAdminOnly := false
	for _, r := range roles {
		if r == "counsellor" {
			isCounsellorOnly = true
		}
		if r == "college admin" {
			isCollegeAdminOnly = true
		}
	}
	for _, r := range roles {
		if r == "super admin" || r == "university admin" || r == "admin" {
			isCounsellorOnly = false
			isCollegeAdminOnly = false
			break
		}
	}

	if isCounsellorOnly && record.ModuleKey == "inquiry_master" {
		if fmt.Sprintf("%v", record.Data["counsellor_id"]) != fmt.Sprintf("%d", userID) {
			return nil, fmt.Errorf("forbidden: record does not belong to you")
		}
	} else if isCollegeAdminOnly && collegeID != "" {
		if record.ModuleKey == "registration" {
			instID := fmt.Sprintf("%v", record.Data["reg_institute_id"])
			if instID == "" || instID == "<nil>" {
				instID = fmt.Sprintf("%v", record.Data["institute_id"])
			}
			if instID != collegeID {
				return nil, fmt.Errorf("forbidden: record does not belong to your college")
			}
		} else if record.ModuleKey == "inquiry_master" {
			instID := fmt.Sprintf("%v", record.Data["institute_id"])
			if instID == "" || instID == "<nil>" {
				instID = fmt.Sprintf("%v", record.Data["reg_institute_id"])
			}
			if instID != collegeID {
				// Fallback check: check if a registration record exists matching this college
				var belongs bool
				err := s.db.Get(&belongs, `
					SELECT EXISTS(
						SELECT 1 FROM records 
						WHERE module_key = 'registration' 
						  AND data->>'reg_inquiry_student_id' = $1
						  AND (data->>'reg_institute_id' = $2 OR data->>'institute_id' = $2)
					)
				`, record.RecordID, collegeID)
				if err != nil || !belongs {
					return nil, fmt.Errorf("forbidden: record does not belong to your college")
				}
			}
		} else if record.ModuleKey == "enrollment_master" {
			regID := fmt.Sprintf("%v", record.Data["enroll_registration_id"])
			if regID == "" || regID == "<nil>" {
				regID = fmt.Sprintf("%v", record.Data["regn_id"])
			}
			var belongs bool
			err := s.db.Get(&belongs, `
				SELECT EXISTS(
					SELECT 1 FROM records 
					WHERE record_id = $1 AND module_key = 'registration' 
					  AND (data->>'reg_institute_id' = $2 OR data->>'institute_id' = $2)
				)
			`, regID, collegeID)
			if err != nil || !belongs {
				return nil, fmt.Errorf("forbidden: enrollment does not belong to your college")
			}
		} else if record.ModuleKey == "fee_master" || record.ModuleKey == "registration_fee" || record.ModuleKey == "hostel_master" || record.ModuleKey == "transport_master" {
			instID := fmt.Sprintf("%v", record.Data["institute_id"])
			if instID != collegeID {
				return nil, fmt.Errorf("forbidden: record does not belong to your college")
			}
		}
	}

	return record, nil
}

func (s *RecordService) GetRecordsByModule(moduleKey string, userID int64) ([]models.Record, error) {
	allowed, roles, collegeID, err := s.checkModuleAccess(userID, moduleKey)
	if err != nil || !allowed {
		return nil, fmt.Errorf("forbidden: %v", err)
	}

	type recordRow struct {
		RecordID  string    `db:"record_id"`
		ModuleKey string    `db:"module_key"`
		Data      []byte    `db:"data"`
		CreatedBy *int64    `db:"created_by"`
		CreatedAt time.Time `db:"created_at"`
	}

	var rows []recordRow

	isCounsellorOnly := false
	isCollegeAdminOnly := false

	for _, r := range roles {
		if r == "counsellor" {
			isCounsellorOnly = true
		}
		if r == "college admin" {
			isCollegeAdminOnly = true
		}
	}
	for _, r := range roles {
		if r == "super admin" || r == "university admin" || r == "admin" {
			isCounsellorOnly = false
			isCollegeAdminOnly = false
			break
		}
	}

	if isCounsellorOnly && moduleKey == "inquiry_master" {
		err = s.db.Select(
			&rows,
			`SELECT record_id, module_key, data, created_by, created_at
			   FROM records
			  WHERE module_key = $1 AND data->>'counsellor_id' = $2
			  ORDER BY created_at DESC`,
			moduleKey, fmt.Sprintf("%d", userID),
		)
	} else if isCollegeAdminOnly && collegeID != "" {
		if moduleKey == "registration" {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1 AND (data->>'reg_institute_id' = $2 OR data->>'institute_id' = $2)
				  ORDER BY created_at DESC`,
				moduleKey, collegeID,
			)
		} else if moduleKey == "inquiry_master" {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1 AND (
				    data->>'institute_id' = $2
				    OR data->>'reg_institute_id' = $2
				    OR record_id::text IN (
				      SELECT data->>'reg_inquiry_student_id' FROM records WHERE module_key = 'registration' AND (data->>'reg_institute_id' = $2 OR data->>'institute_id' = $2)
				    )
				  )
				  ORDER BY created_at DESC`,
				moduleKey, collegeID,
			)
		} else if moduleKey == "enrollment_master" {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1 AND data->>'enroll_registration_id' IN (
				  	SELECT record_id FROM records WHERE module_key = 'registration' AND (data->>'reg_institute_id' = $2 OR data->>'institute_id' = $2)
				  )
				  ORDER BY created_at DESC`,
				moduleKey, collegeID,
			)
		} else if moduleKey == "fee_master" || moduleKey == "registration_fee" || moduleKey == "hostel_master" || moduleKey == "transport_master" {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1 AND data->>'institute_id' = $2
				  ORDER BY created_at DESC`,
				moduleKey, collegeID,
			)
		} else {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1
				  ORDER BY created_at DESC`,
				moduleKey,
			)
		}
	} else {
		err = s.db.Select(
			&rows,
			`SELECT record_id, module_key, data, created_by, created_at
			   FROM records
			  WHERE module_key = $1
			  ORDER BY created_at DESC`,
			moduleKey,
		)
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

func (s *RecordService) UpdateRecord(recordID string, req models.RecordUpdate, userID int64) (*models.Record, error) {
	record, err := s.GetRecord(recordID, userID)
	if err != nil {
		return nil, err
	}

	_, roles, _, _ := s.checkModuleAccess(userID, record.ModuleKey)
	isCounsellorOnly := false
	for _, r := range roles {
		if r == "counsellor" {
			isCounsellorOnly = true
		}
	}
	for _, r := range roles {
		if r == "super admin" || r == "university admin" || r == "admin" {
			isCounsellorOnly = false
			break
		}
	}

	if isCounsellorOnly && record.ModuleKey == "inquiry_master" {
		req.Data["counsellor_id"] = record.Data["counsellor_id"]
	}

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

	return s.GetRecord(recordID, userID)
}

func (s *RecordService) DeleteRecord(recordID string, userID int64) error {
	record, err := s.GetRecord(recordID, userID)
	if err != nil {
		return err
	}

	_, roles, _, _ := s.checkModuleAccess(userID, record.ModuleKey)
	isAuthorizedToDelete := false
	for _, r := range roles {
		if r == "super admin" || r == "university admin" || r == "admin" || r == "college admin" || r == "designer" {
			isAuthorizedToDelete = true
			break
		}
	}

	if !isAuthorizedToDelete {
		return fmt.Errorf("forbidden: only administrators can delete records")
	}

	_, err = s.db.Exec("DELETE FROM records WHERE record_id = $1", recordID)
	return err
}

func (s *RecordService) SearchRecords(moduleKey string, searchTerm string, userID int64) ([]models.Record, error) {
	allowed, roles, collegeID, err := s.checkModuleAccess(userID, moduleKey)
	if err != nil || !allowed {
		return nil, fmt.Errorf("forbidden: %v", err)
	}

	type recordRow struct {
		RecordID  string    `db:"record_id"`
		ModuleKey string    `db:"module_key"`
		Data      []byte    `db:"data"`
		CreatedBy *int64    `db:"created_by"`
		CreatedAt time.Time `db:"created_at"`
	}
	var rows []recordRow
	searchPattern := "%" + searchTerm + "%"

	isCounsellorOnly := false
	isCollegeAdminOnly := false

	for _, r := range roles {
		if r == "counsellor" {
			isCounsellorOnly = true
		}
		if r == "college admin" {
			isCollegeAdminOnly = true
		}
	}
	for _, r := range roles {
		if r == "super admin" || r == "university admin" || r == "admin" {
			isCounsellorOnly = false
			isCollegeAdminOnly = false
			break
		}
	}

	if isCounsellorOnly && moduleKey == "inquiry_master" {
		err = s.db.Select(
			&rows,
			`SELECT record_id, module_key, data, created_by, created_at
			   FROM records
			  WHERE module_key = $1 AND data->>'counsellor_id' = $2 AND data::text ILIKE $3
			  ORDER BY created_at DESC`,
			moduleKey, fmt.Sprintf("%d", userID), searchPattern,
		)
	} else if isCollegeAdminOnly && collegeID != "" {
		if moduleKey == "registration" {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1 AND (data->>'reg_institute_id' = $2 OR data->>'institute_id' = $2) AND data::text ILIKE $3
				  ORDER BY created_at DESC`,
				moduleKey, collegeID, searchPattern,
			)
		} else if moduleKey == "inquiry_master" {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1 AND (
				    data->>'institute_id' = $2 
				    OR data->>'reg_institute_id' = $2
				    OR record_id IN (
				      SELECT data->>'reg_inquiry_student_id' FROM records WHERE module_key = 'registration' AND (data->>'reg_institute_id' = $2 OR data->>'institute_id' = $2)
				    )
				  ) AND data::text ILIKE $3
				  ORDER BY created_at DESC`,
				moduleKey, collegeID, searchPattern,
			)
		} else if moduleKey == "enrollment_master" {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1 AND data->>'enroll_registration_id' IN (
				  	SELECT record_id FROM records WHERE module_key = 'registration' AND (data->>'reg_institute_id' = $2 OR data->>'institute_id' = $2)
				  ) AND data::text ILIKE $3
				  ORDER BY created_at DESC`,
				moduleKey, collegeID, searchPattern,
			)
		} else if moduleKey == "fee_master" || moduleKey == "registration_fee" || moduleKey == "hostel_master" || moduleKey == "transport_master" {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1 AND data->>'institute_id' = $2 AND data::text ILIKE $3
				  ORDER BY created_at DESC`,
				moduleKey, collegeID, searchPattern,
			)
		} else {
			err = s.db.Select(
				&rows,
				`SELECT record_id, module_key, data, created_by, created_at
				   FROM records
				  WHERE module_key = $1 AND data::text ILIKE $2
				  ORDER BY created_at DESC`,
				moduleKey, searchPattern,
			)
		}
	} else {
		err = s.db.Select(
			&rows,
			`SELECT record_id, module_key, data, created_by, created_at
			   FROM records
			  WHERE module_key = $1 AND data::text ILIKE $2
			  ORDER BY created_at DESC`,
			moduleKey, searchPattern,
		)
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
