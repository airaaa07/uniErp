package models

import "time"

// Module represents a metadata module definition
type Module struct {
	ModuleID    string    `db:"module_id" json:"module_id"`
	ModuleKey   string    `db:"module_key" json:"module_key"`
	ModuleName  string    `db:"module_name" json:"module_name"`
	Description string    `db:"description" json:"description"`
	IsActive    bool      `db:"is_active" json:"is_active"`
	IsSystem    bool      `db:"is_system" json:"is_system"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
}

// ModuleCreate represents the request to create a new module
type ModuleCreate struct {
	ModuleKey   string `json:"module_key" binding:"required"`
	ModuleName  string `json:"module_name" binding:"required"`
	Description string `json:"description"`
}

// ModuleUpdate represents the request to update a module
type ModuleUpdate struct {
	ModuleName  *string `json:"module_name"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}

// Field represents a metadata field definition
type Field struct {
	FieldID        int64     `db:"field_id" json:"field_id"`
	ModuleKey      string    `db:"module_key" json:"module_key"`
	Label          string    `db:"label" json:"label"`
	FieldKey       string    `db:"field_key" json:"field_key"`
	FieldType      string    `db:"field_type" json:"field_type"`
	FieldGroupID   *int      `db:"field_group_id" json:"field_group_id"`
	FieldGroupName string    `db:"field_group_name" json:"field_group_name"`
	Placeholder    *string    `db:"placeholder" json:"placeholder"`
	HelpTooltip    *string    `db:"help_tooltip" json:"help_tooltip"`
	DefaultValue   *string    `db:"default_value" json:"default_value"`
	MinValue       *string    `db:"min_value" json:"min_value"`
	MaxValue       *string    `db:"max_value" json:"max_value"`
	SystemField    bool      `db:"system_field" json:"system_field"`
	IsVisible      bool      `db:"is_visible" json:"is_visible"`
	IsMandatory    bool      `db:"is_mandatory" json:"is_mandatory"`
	IsPii          bool      `db:"is_pii" json:"is_pii"`
	IsAudited      bool      `db:"is_audited" json:"is_audited"`
	IsSearchable   bool      `db:"is_searchable" json:"is_searchable"`
	IsExportable   bool      `db:"is_exportable" json:"is_exportable"`
	SortOrder      int16     `db:"sort_order" json:"sort_order"`
	CreatedBy      *int64    `db:"created_by" json:"created_by"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at" json:"updated_at"`
}

// FieldCreate represents the request to create a new field
type FieldCreate struct {
	ModuleKey           string  `json:"module_key" binding:"required"`
	Label               string  `json:"label" binding:"required"`
	FieldKey            string  `json:"field_key" binding:"required"`
	FieldType           string  `json:"field_type" binding:"required"`
	// FieldGroupModuleKey: the module key of the table this field logically groups under (e.g. "course_master").
	// Backend auto-computes field_group_name = "<owning_module>__<this_key>" and locks it.
	FieldGroupModuleKey *string `json:"field_group_module_key"`
	// FieldGroupColumnID: column_id (from module_columns) of the PK/UNIQUE column used as the join key.
	FieldGroupColumnID  *int    `json:"field_group_column_id"`
	Placeholder         string  `json:"placeholder"`
	HelpTooltip         string  `json:"help_tooltip"`
	DefaultValue        string  `json:"default_value"`
	MinValue            string  `json:"min_value"`
	MaxValue            string  `json:"max_value"`
	SystemField         bool    `json:"system_field"`
	IsVisible           bool    `json:"is_visible"`
	IsMandatory         bool    `json:"is_mandatory"`
	IsPii               bool    `json:"is_pii"`
	IsAudited           bool    `json:"is_audited"`
	IsSearchable        bool    `json:"is_searchable"`
	IsExportable        bool    `json:"is_exportable"`
	SortOrder           int16   `json:"sort_order"`
}

// FieldUpdate represents the request to update a field
type FieldUpdate struct {
	Label               *string `json:"label"`
	FieldKey            *string `json:"field_key"`
	FieldType           *string `json:"field_type"`
	// FieldGroupModuleKey: pass to change which module this field groups under.
	// Backend recomputes field_group_name automatically.
	FieldGroupModuleKey *string `json:"field_group_module_key"`
	FieldGroupColumnID  *int    `json:"field_group_column_id"`
	Placeholder         *string `json:"placeholder"`
	HelpTooltip         *string `json:"help_tooltip"`
	DefaultValue        *string `json:"default_value"`
	MinValue            *string `json:"min_value"`
	MaxValue            *string `json:"max_value"`
	SystemField         *bool   `json:"system_field"`
	IsVisible           *bool   `json:"is_visible"`
	IsMandatory         *bool   `json:"is_mandatory"`
	IsPii               *bool   `json:"is_pii"`
	IsAudited           *bool   `json:"is_audited"`
	IsSearchable        *bool   `json:"is_searchable"`
	IsExportable        *bool   `json:"is_exportable"`
	SortOrder           *int16  `json:"sort_order"`
}

// Record represents a metadata record (form submission)
type Record struct {
	RecordID  string                 `db:"record_id" json:"record_id"`
	ModuleKey string                 `db:"module_key" json:"module_key"`
	Data      map[string]interface{} `db:"data" json:"data"` // JSONB as string
	CreatedBy *int64                 `db:"created_by" json:"created_by"`
	CreatedAt time.Time              `db:"created_at" json:"created_at"`
	// UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// RecordCreate represents the request to create a new record
type RecordCreate struct {
	ModuleKey string                 `json:"module_key" binding:"required"`
	Data      map[string]interface{} `json:"data" binding:"required"`
}

// RecordUpdate represents the request to update a record
type RecordUpdate struct {
	Data map[string]interface{} `json:"data" binding:"required"`
}

// ModuleWithFields represents a module with its associated fields
type ModuleWithFields struct {
	Module
	Fields []Field `json:"fields"`
}

// Section represents a form section with its fields
type Section struct {
	Name   string  `json:"name"`
	Fields []Field `json:"fields"`
}

// FormLayout represents the complete form layout with sections
type FormLayout struct {
	ModuleKey  string    `json:"module_key"`
	ModuleName string    `json:"module_name"`
	Sections   []Section `json:"sections"`
}

// DropdownOption represents a dropdown option
type DropdownOption struct {
	Label        string `json:"label"`
	Value        string `json:"value"`
	DisplayOrder int    `json:"display_order"`
}

// ModuleColumn represents a column definition for a module table
type ModuleColumn struct {
	ColumnID          int64     `db:"column_id" json:"column_id"`
	ModuleID          string    `db:"module_id" json:"module_id"`
	ColumnName        string    `db:"column_name" json:"column_name"`
	DbDataType        string    `db:"db_data_type" json:"db_data_type"`
	DbLength          *int      `db:"db_length" json:"db_length"`
	DbPrecision       *int      `db:"db_precision" json:"db_precision"`
	DbScale           *int      `db:"db_scale" json:"db_scale"`
	IsNullable        bool      `db:"is_nullable" json:"is_nullable"`
	IsUnique          bool      `db:"is_unique" json:"is_unique"`
	IsPrimaryKey      bool      `db:"is_primary_key" json:"is_primary_key"`
	IsAutoIncrement   bool      `db:"is_auto_increment" json:"is_auto_increment"`
	DefaultValue      *string   `db:"default_value" json:"default_value"`
	CheckConstraint   *string   `db:"check_constraint" json:"check_constraint"`
	ForeignModuleID   *string   `db:"foreign_module_id" json:"foreign_module_id"`
	ForeignColumnName *string   `db:"foreign_column_name" json:"foreign_column_name"`
	CreatedAt         time.Time `db:"created_at" json:"created_at"`
}

// ModuleColumnCreate represents the request to create a new module column
type ModuleColumnCreate struct {
	ModuleID          string  `json:"module_id" binding:"required"`
	ColumnName        string  `json:"column_name" binding:"required"`
	DbDataType        string  `json:"db_data_type" binding:"required"`
	DbLength          *int    `json:"db_length"`
	DbPrecision       *int    `json:"db_precision"`
	DbScale           *int    `json:"db_scale"`
	IsNullable        bool    `json:"is_nullable"`
	IsUnique          bool    `json:"is_unique"`
	IsPrimaryKey      bool    `json:"is_primary_key"`
	IsAutoIncrement   bool    `json:"is_auto_increment"`
	DefaultValue      *string `json:"default_value"`
	CheckConstraint   *string `json:"check_constraint"`
	ForeignModuleID   *string `json:"foreign_module_id"`
	ForeignColumnName *string `json:"foreign_column_name"`
}

// ModuleColumnUpdate represents the request to update a module column
type ModuleColumnUpdate struct {
	ColumnName        *string `json:"column_name"`
	DbDataType        *string `json:"db_data_type"`
	DbLength          *int    `json:"db_length"`
	DbPrecision       *int    `json:"db_precision"`
	DbScale           *int    `json:"db_scale"`
	IsNullable        *bool   `json:"is_nullable"`
	IsUnique          *bool   `json:"is_unique"`
	IsPrimaryKey      *bool   `json:"is_primary_key"`
	IsAutoIncrement   *bool   `json:"is_auto_increment"`
	DefaultValue      *string `json:"default_value"`
	CheckConstraint   *string `json:"check_constraint"`
	ForeignModuleID   *string `json:"foreign_module_id"`
	ForeignColumnName *string `json:"foreign_column_name"`
}
