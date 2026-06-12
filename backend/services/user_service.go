package services

import (
	"backend/models"
	"backend/utils"

	"time"

	"github.com/jmoiron/sqlx"
)

type UserService struct {
	db *sqlx.DB
}

func NewUserService(db *sqlx.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) CreateUser(req models.UserCreate) (*models.UserResponse, error) {
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	var userID int64
	err = s.db.QueryRow(
		`INSERT INTO users (username, email, password_hash, first_name, last_name) 
		 VALUES ($1, $2, $3, $4, $5) RETURNING user_id`,
		req.Username, req.Email, hashedPassword, req.FirstName, req.LastName,
	).Scan(&userID)
	if err != nil {
		return nil, err
	}

	return s.GetUserByID(userID)
}

func (s *UserService) GetUserByID(userID int64) (*models.UserResponse, error) {
	var user models.User
	err := s.db.Get(&user, "SELECT * FROM users WHERE user_id = $1", userID)
	if err != nil {
		return nil, err
	}

	roles, err := s.GetUserRoles(userID)
	if err != nil {
		return nil, err
	}

	return &models.UserResponse{
		UserID:    user.UserID,
		Username:  user.Username,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
		Roles:     roles,
	}, nil
}

func (s *UserService) GetAllUsers(search string) ([]models.UserResponse, error) {
	var users []models.User
	var err error

	if search != "" {
		searchPattern := "%" + search + "%"
		err = s.db.Select(&users, 
			"SELECT * FROM users WHERE username ILIKE $1 OR email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 ORDER BY created_at DESC",
			searchPattern)
	} else {
		err = s.db.Select(&users, "SELECT * FROM users ORDER BY created_at DESC")
	}

	if err != nil {
		return nil, err
	}

	var responses []models.UserResponse
	for _, user := range users {
		roles, err := s.GetUserRoles(user.UserID)
		if err != nil {
			return nil, err
		}

		responses = append(responses, models.UserResponse{
			UserID:    user.UserID,
			Username:  user.Username,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			IsActive:  user.IsActive,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Roles:     roles,
		})
	}

	return responses, nil
}

func (s *UserService) UpdateUser(userID int64, req models.UserUpdate) (*models.UserResponse, error) {
	query := "UPDATE users SET updated_at = $1"
	args := []interface{}{time.Now()}
	argCount := 2

	if req.Email != nil {
		query += ", email = $" + string(rune('0'+argCount))
		args = append(args, *req.Email)
		argCount++
	}

	if req.FirstName != nil {
		query += ", first_name = $" + string(rune('0'+argCount))
		args = append(args, *req.FirstName)
		argCount++
	}

	if req.LastName != nil {
		query += ", last_name = $" + string(rune('0'+argCount))
		args = append(args, *req.LastName)
		argCount++
	}

	if req.IsActive != nil {
		query += ", is_active = $" + string(rune('0'+argCount))
		args = append(args, *req.IsActive)
		argCount++
	}

	query += " WHERE user_id = $" + string(rune('0'+argCount))
	args = append(args, userID)

	_, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	return s.GetUserByID(userID)
}

func (s *UserService) DisableUser(userID int64) error {
	_, err := s.db.Exec("UPDATE users SET is_active = false, updated_at = $1 WHERE user_id = $2", time.Now(), userID)
	return err
}

func (s *UserService) DeleteUser(userID int64) error {
	_, err := s.db.Exec("DELETE FROM users WHERE user_id = $1", userID)
	return err
}

func (s *UserService) AssignRole(userID int64, roleID int64) error {
	_, err := s.db.Exec("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", userID, roleID)
	return err
}

func (s *UserService) RemoveRole(userID int64, roleID int64) error {
	_, err := s.db.Exec("DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2", userID, roleID)
	return err
}

func (s *UserService) GetUserRoles(userID int64) ([]string, error) {
	var roles []string
	err := s.db.Select(&roles, `
		SELECT r.role_name 
		FROM roles r
		INNER JOIN user_roles ur ON r.role_id = ur.role_id
		WHERE ur.user_id = $1
	`, userID)
	return roles, err
}
