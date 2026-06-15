package designer

import (
	"backend/models"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type DesignerService struct {
	db *sqlx.DB
}

func NewDesignerService(db *sqlx.DB) *DesignerService {
	return &DesignerService{db: db}
}

// ==================== MODULE OPERATIONS ====================

func (s *DesignerService) CreateModule(req models.ModuleCreate, createdBy int64) (*models.Module, error) {
	moduleID := uuid.New().String()

	var module models.Module
	err := s.db.QueryRow(
		`INSERT INTO modules (
			module_id,
			module_key,
			module_name,
			description
		)
		VALUES ($1, $2, $3, $4)
		RETURNING
			module_id,
			module_key,
			module_name,
			description,
			is_active,
			created_at`,
		moduleID,
		req.ModuleKey,
		req.ModuleName,
		req.Description,
	).Scan(
		&module.ModuleID,
		&module.ModuleKey,
		&module.ModuleName,
		&module.Description,
		&module.IsActive,
		&module.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &module, nil
}
func (s *DesignerService) GetModule(moduleKey string) (*models.Module, error) {
	var module models.Module
	err := s.db.Get(&module, "SELECT * FROM modules WHERE module_key = $1", moduleKey)
	if err != nil {
		return nil, err
	}
	return &module, nil
}

func (s *DesignerService) GetAllModules() ([]models.Module, error) {
	var modules []models.Module
	err := s.db.Select(&modules, "SELECT * FROM modules ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	return modules, nil
}
func (s *DesignerService) UpdateModule(moduleKey string, req models.ModuleUpdate) (*models.Module, error) {
	query := "UPDATE modules SET "
	args := []interface{}{}
	argCount := 1
	first := true

	if req.ModuleName != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("module_name = $%d", argCount)
		args = append(args, *req.ModuleName)
		argCount++
		first = false
	}

	if req.Description != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("description = $%d", argCount)
		args = append(args, *req.Description)
		argCount++
		first = false
	}

	if req.IsActive != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("is_active = $%d", argCount)
		args = append(args, *req.IsActive)
		argCount++
		first = false
	}

	query += fmt.Sprintf(" WHERE module_key = $%d", argCount)
	args = append(args, moduleKey)

	_, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	return s.GetModule(moduleKey)
}

func (s *DesignerService) DeleteModule(moduleKey string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Delete fields (cascade will handle this, but being explicit)
	_, err = tx.Exec("DELETE FROM fields WHERE module_key = $1", moduleKey)
	if err != nil {
		return err
	}

	// Delete records (cascade will handle this, but being explicit)
	_, err = tx.Exec("DELETE FROM records WHERE module_key = $1", moduleKey)
	if err != nil {
		return err
	}

	// Delete module
	_, err = tx.Exec("DELETE FROM modules WHERE module_key = $1", moduleKey)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *DesignerService) GetModuleWithFields(moduleKey string) (*models.ModuleWithFields, error) {
	module, err := s.GetModule(moduleKey)
	if err != nil {
		return nil, err
	}

	fields, err := s.GetFieldsByModule(moduleKey)
	if err != nil {
		return nil, err
	}

	return &models.ModuleWithFields{
		Module: *module,
		Fields: fields,
	}, nil
}

// ==================== FIELD OPERATIONS ====================

func (s *DesignerService) CreateField(req models.FieldCreate, createdBy int64) (*models.Field, error) {
	var fieldID int64

	err := s.db.QueryRow(
		`INSERT INTO fields (
			module_key, label, field_key, field_type, field_group_name, placeholder, help_tooltip, default_value,
			min_value, max_value, system_field,
			is_visible, is_mandatory, is_pii, is_audited, is_searchable, is_exportable,
			sort_order, created_by
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
		RETURNING field_id`,
		req.ModuleKey, req.Label, req.FieldKey, req.FieldType, req.FieldGroupName, req.Placeholder, req.HelpTooltip, req.DefaultValue,
		req.MinValue, req.MaxValue, req.SystemField,
		req.IsVisible, req.IsMandatory, req.IsPii, req.IsAudited, req.IsSearchable, req.IsExportable,
		req.SortOrder, createdBy,
	).Scan(&fieldID)

	if err != nil {
		return nil, err
	}

	return s.GetFieldByID(fieldID)
}

func (s *DesignerService) GetFieldByID(fieldID int64) (*models.Field, error) {
	var field models.Field
	err := s.db.Get(&field, "SELECT * FROM fields WHERE field_id = $1", fieldID)
	if err != nil {
		return nil, err
	}
	return &field, nil
}

func (s *DesignerService) GetFieldByKey(fieldKey string) (*models.Field, error) {
	var field models.Field
	err := s.db.Get(&field, "SELECT * FROM fields WHERE field_key = $1", fieldKey)
	if err != nil {
		return nil, err
	}
	return &field, nil
}

func (s *DesignerService) GetFieldsByModule(moduleKey string) ([]models.Field, error) {
	var fields []models.Field
	err := s.db.Select(&fields, "SELECT * FROM fields WHERE module_key = $1 ORDER BY sort_order ASC, field_id ASC", moduleKey)
	if err != nil {
		return nil, err
	}
	return fields, nil
}
func (s *DesignerService) UpdateField(fieldID int64, req models.FieldUpdate) (*models.Field, error) {
	query := "UPDATE fields SET updated_at = NOW()"
	args := []interface{}{}

	// === ADD THIS BLOCK ===
	if req.FieldKey != nil {
		query += fmt.Sprintf(", field_key = $%d", len(args)+1)
		args = append(args, *req.FieldKey)
	}

	if req.Label != nil {
		query += fmt.Sprintf(", label = $%d", len(args)+1)
		args = append(args, *req.Label)
	}

	if req.FieldType != nil {
		query += fmt.Sprintf(", field_type = $%d", len(args)+1)
		args = append(args, *req.FieldType)
	}

	if req.FieldGroupName != nil {
		query += fmt.Sprintf(", field_group_name = $%d", len(args)+1)
		args = append(args, *req.FieldGroupName)
	}

	if req.Placeholder != nil {
		query += fmt.Sprintf(", placeholder = $%d", len(args)+1)
		args = append(args, *req.Placeholder)
	}

	if req.HelpTooltip != nil {
		query += fmt.Sprintf(", help_tooltip = $%d", len(args)+1)
		args = append(args, *req.HelpTooltip)
	}

	if req.DefaultValue != nil {
		query += fmt.Sprintf(", default_value = $%d", len(args)+1)
		args = append(args, *req.DefaultValue)
	}

	if req.MinValue != nil {
		query += fmt.Sprintf(", min_value = $%d", len(args)+1)
		args = append(args, *req.MinValue)
	}

	if req.MaxValue != nil {
		query += fmt.Sprintf(", max_value = $%d", len(args)+1)
		args = append(args, *req.MaxValue)
	}

	if req.SystemField != nil {
		query += fmt.Sprintf(", system_field = $%d", len(args)+1)
		args = append(args, *req.SystemField)
	}

	if req.IsMandatory != nil {
		query += fmt.Sprintf(", is_mandatory = $%d", len(args)+1)
		args = append(args, *req.IsMandatory)
	}

	if req.IsVisible != nil {
		query += fmt.Sprintf(", is_visible = $%d", len(args)+1)
		args = append(args, *req.IsVisible)
	}

	if req.IsSearchable != nil {
		query += fmt.Sprintf(", is_searchable = $%d", len(args)+1)
		args = append(args, *req.IsSearchable)
	}

	if req.IsExportable != nil {
		query += fmt.Sprintf(", is_exportable = $%d", len(args)+1)
		args = append(args, *req.IsExportable)
	}

	if req.IsPii != nil {
		query += fmt.Sprintf(", is_pii = $%d", len(args)+1)
		args = append(args, *req.IsPii)
	}

	if req.IsAudited != nil {
		query += fmt.Sprintf(", is_audited = $%d", len(args)+1)
		args = append(args, *req.IsAudited)
	}

	if req.SortOrder != nil {
		query += fmt.Sprintf(", sort_order = $%d", len(args)+1)
		args = append(args, *req.SortOrder)
	}

	// Nothing to update
	if len(args) == 0 {
		return s.GetFieldByID(fieldID)
	}

	query += fmt.Sprintf(" WHERE field_id = $%d", len(args)+1)
	args = append(args, fieldID)

	// Debug logging
	log.Printf("QUERY: %s", query)
	log.Printf("ARGS: %#v", args)

	_, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("update field failed: %w", err)
	}

	return s.GetFieldByID(fieldID)
}

func (s *DesignerService) DeleteField(fieldID int64) error {
	_, err := s.db.Exec("DELETE FROM fields WHERE field_id = $1", fieldID)
	return err
}

func (s *DesignerService) UpdateFieldOrder(fieldID int64, newOrder int16) error {
	_, err := s.db.Exec("UPDATE fields SET sort_order = $1, updated_at = NOW() WHERE field_id = $2", newOrder, fieldID)
	return err
}

// ==================== FORM LAYOUT OPERATIONS ====================

func (s *DesignerService) GetFormLayout(moduleKey string) (*models.FormLayout, error) {
	fields, err := s.GetFieldsByModule(moduleKey)
	if err != nil {
		return nil, err
	}

	// Group fields by section
	sectionsMap := make(map[string][]models.Field)
	for _, field := range fields {
		sectionName := field.FieldGroupName
		if sectionName == "" {
			sectionName = "General"
		}
		sectionsMap[sectionName] = append(sectionsMap[sectionName], field)
	}

	// Convert to sections array
	var sections []models.Section
	for name, fields := range sectionsMap {
		sections = append(sections, models.Section{
			Name:   name,
			Fields: fields,
		})
	}

	return &models.FormLayout{
		ModuleKey: moduleKey,
		Sections:  sections,
	}, nil
}

// Helper function
func boolPtr(b bool) *bool {
	return &b
}

// ==================== MODULE COLUMN OPERATIONS ====================

func (s *DesignerService) CreateModuleColumn(
	req models.ModuleColumnCreate,
) (*models.ModuleColumn, error) {

	// Validate foreign key mapping
	if req.ForeignModuleID != nil {

		var referencedColumn models.ModuleColumn

		err := s.db.Get(
			&referencedColumn,
			`
			SELECT *
			FROM module_columns
			WHERE module_id=$1
			AND column_name=$2
			LIMIT 1
			`,
			req.ForeignModuleID,
			req.ForeignColumnName,
		)

		if err != nil {
			return nil, fmt.Errorf(
				"referenced column not found",
			)
		}

		// Only PK or UNIQUE allowed
		if !referencedColumn.IsPrimaryKey &&
			!referencedColumn.IsUnique {

			return nil,
				fmt.Errorf(
					"foreign key must reference PK or UNIQUE column",
				)
		}

		// Datatype validation
		if referencedColumn.DbDataType !=
			req.DbDataType {

			return nil,
				fmt.Errorf(
					"datatype mismatch: %s -> %s",
					req.DbDataType,
					referencedColumn.DbDataType,
				)
		}
	}

	var columnID int64

	err := s.db.QueryRow(
		`
		INSERT INTO module_columns (

			module_id,
			column_name,
			db_data_type,

			db_length,
			db_precision,
			db_scale,

			is_nullable,
			is_unique,

			is_primary_key,
			is_auto_increment,

			default_value,
			check_constraint,

			foreign_module_id,
			foreign_column_name

		)

		VALUES (

			$1,$2,$3,

			$4,$5,$6,

			$7,$8,

			$9,$10,

			$11,$12,

			$13,$14
		)

		RETURNING column_id
		`,

		req.ModuleID,
		req.ColumnName,
		req.DbDataType,

		req.DbLength,
		req.DbPrecision,
		req.DbScale,

		req.IsNullable,
		req.IsUnique,

		req.IsPrimaryKey,
		req.IsAutoIncrement,

		req.DefaultValue,
		req.CheckConstraint,

		req.ForeignModuleID,
		req.ForeignColumnName,
	).Scan(&columnID)

	if err != nil {
		return nil, err
	}

	return s.GetModuleColumnByID(columnID)
}

func (s *DesignerService) GetModuleColumnByID(columnID int64) (*models.ModuleColumn, error) {
	var column models.ModuleColumn
	err := s.db.Get(&column, "SELECT * FROM module_columns WHERE column_id = $1", columnID)
	if err != nil {
		return nil, err
	}
	return &column, nil
}

func (s *DesignerService) GetModuleColumnsByModule(moduleID string) ([]models.ModuleColumn, error) {
	var columns []models.ModuleColumn
	err := s.db.Select(&columns, "SELECT * FROM module_columns WHERE module_id = $1 ORDER BY column_id ASC", moduleID)
	if err != nil {
		return nil, err
	}
	return columns, nil
}

func (s *DesignerService) UpdateModuleColumn(columnID int64, req models.ModuleColumnUpdate) (*models.ModuleColumn, error) {
	query := "UPDATE module_columns SET "
	args := []interface{}{}
	argCount := 1
	first := true

	if req.ColumnName != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("column_name = $%d", argCount)
		args = append(args, *req.ColumnName)
		argCount++
		first = false
	}

	if req.DbDataType != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("db_data_type = $%d", argCount)
		args = append(args, *req.DbDataType)
		argCount++
		first = false
	}

	if req.DbLength != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("db_length = $%d", argCount)
		args = append(args, *req.DbLength)
		argCount++
		first = false
	}

	if req.DbPrecision != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("db_precision = $%d", argCount)
		args = append(args, *req.DbPrecision)
		argCount++
		first = false
	}

	if req.DbScale != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("db_scale = $%d", argCount)
		args = append(args, *req.DbScale)
		argCount++
		first = false
	}

	if req.IsNullable != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("is_nullable = $%d", argCount)
		args = append(args, *req.IsNullable)
		argCount++
		first = false
	}

	if req.IsUnique != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("is_unique = $%d", argCount)
		args = append(args, *req.IsUnique)
		argCount++
		first = false
	}

	if req.IsPrimaryKey != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("is_primary_key = $%d", argCount)
		args = append(args, *req.IsPrimaryKey)
		argCount++
		first = false
	}

	if req.IsAutoIncrement != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("is_auto_increment = $%d", argCount)
		args = append(args, *req.IsAutoIncrement)
		argCount++
		first = false
	}

	if req.DefaultValue != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("default_value = $%d", argCount)
		args = append(args, *req.DefaultValue)
		argCount++
		first = false
	}

	if req.CheckConstraint != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("check_constraint = $%d", argCount)
		args = append(args, *req.CheckConstraint)
		argCount++
		first = false
	}

	if req.ForeignModuleID != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("foreign_module_id = $%d", argCount)
		args = append(args, *req.ForeignModuleID)
		argCount++
		first = false
	}

	if req.ForeignColumnName != nil {
		if !first {
			query += ", "
		}
		query += fmt.Sprintf("foreign_column_name = $%d", argCount)
		args = append(args, *req.ForeignColumnName)
		argCount++
		first = false
	}

	query += fmt.Sprintf(" WHERE column_id = $%d", argCount)
	args = append(args, columnID)

	_, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	return s.GetModuleColumnByID(columnID)
}

func (s *DesignerService) DeleteModuleColumn(columnID int64) error {
	_, err := s.db.Exec("DELETE FROM module_columns WHERE column_id = $1", columnID)
	return err
}
