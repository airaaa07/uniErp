package services

import (
	"backend/models"


	"github.com/jmoiron/sqlx"
)

type RoleService struct {
	db *sqlx.DB
}

func NewRoleService(db *sqlx.DB) *RoleService {
	return &RoleService{db: db}
}

func (s *RoleService) CreateRole(req models.RoleCreate) (*models.RoleResponse, error) {
	var roleID int64
	err := s.db.QueryRow(
		"INSERT INTO roles (role_name) VALUES ($1) RETURNING role_id",
		req.RoleName,
	).Scan(&roleID)
	if err != nil {
		return nil, err
	}

	return s.GetRoleByID(roleID)
}

func (s *RoleService) GetRoleByID(roleID int64) (*models.RoleResponse, error) {
	var role models.Role
	err := s.db.Get(&role, "SELECT * FROM roles WHERE role_id = $1", roleID)
	if err != nil {
		return nil, err
	}

	permissions, err := s.GetRolePermissions(roleID)
	if err != nil {
		return nil, err
	}

	userCount, err := s.GetRoleUserCount(roleID)
	if err != nil {
		return nil, err
	}

	return &models.RoleResponse{
		RoleID:      role.RoleID,
		RoleName:    role.RoleName,
		Permissions: permissions,
		UserCount:   userCount,
	}, nil
}

func (s *RoleService) GetAllRoles() ([]models.RoleResponse, error) {
	var roles []models.Role
	err := s.db.Select(&roles, "SELECT * FROM roles ORDER BY role_name")
	if err != nil {
		return nil, err
	}

	var responses []models.RoleResponse
	for _, role := range roles {
		permissions, err := s.GetRolePermissions(role.RoleID)
		if err != nil {
			return nil, err
		}

		userCount, err := s.GetRoleUserCount(role.RoleID)
		if err != nil {
			return nil, err
		}

		responses = append(responses, models.RoleResponse{
			RoleID:      role.RoleID,
			RoleName:    role.RoleName,
			Permissions: permissions,
			UserCount:   userCount,
		})
	}

	return responses, nil
}

func (s *RoleService) UpdateRole(roleID int64, req models.RoleUpdate) (*models.RoleResponse, error) {
	_, err := s.db.Exec("UPDATE roles SET role_name = $1 WHERE role_id = $2", req.RoleName, roleID)
	if err != nil {
		return nil, err
	}

	return s.GetRoleByID(roleID)
}

func (s *RoleService) DeleteRole(roleID int64) error {
	_, err := s.db.Exec("DELETE FROM roles WHERE role_id = $1", roleID)
	return err
}

func (s *RoleService) AssignPermission(roleID int64, permissionID int64) error {
	_, err := s.db.Exec("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", roleID, permissionID)
	return err
}

func (s *RoleService) RemovePermission(roleID int64, permissionID int64) error {
	_, err := s.db.Exec("DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2", roleID, permissionID)
	return err
}

func (s *RoleService) GetRolePermissions(roleID int64) ([]string, error) {
	var permissions []string
	err := s.db.Select(&permissions, `
		SELECT p.permission_name 
		FROM permissions p
		INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
		WHERE rp.role_id = $1
	`, roleID)
	return permissions, err
}

func (s *RoleService) GetRoleUserCount(roleID int64) (int, error) {
	var count int
	err := s.db.Get(&count, "SELECT COUNT(*) FROM user_roles WHERE role_id = $1", roleID)
	return count, err
}
