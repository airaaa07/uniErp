package erp

import (
	"backend/models"
	"backend/utils"
	"fmt"
	"strconv"

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
		`INSERT INTO users (
			username,
			email,
			password_hash,
			first_name,
			last_name,
			college_id
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING user_id`,
		req.Username,
		req.Email,
		hashedPassword,
		req.FirstName,
		req.LastName,
		req.CollegeID,
	).Scan(&userID)

	if err != nil {
		return nil, err
	}

	// Assign selected role
	if req.RoleID > 0 {
		err = s.AssignRole(userID, req.RoleID)
		if err != nil {
			return nil, err
		}
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
		UserID:              user.UserID,
		Username:            user.Username,
		Email:               user.Email,
		FirstName:           user.FirstName,
		LastName:            user.LastName,
		CollegeID:           user.CollegeID,
		IsActive:            user.IsActive,
		ForcePasswordChange: user.ForcePasswordChange,
		CreatedAt:           user.CreatedAt,
		UpdatedAt:           user.UpdatedAt,
		Roles:               roles,
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
			UserID:              user.UserID,
			Username:            user.Username,
			Email:               user.Email,
			FirstName:           user.FirstName,
			LastName:            user.LastName,
			CollegeID:           user.CollegeID,
			IsActive:            user.IsActive,
			ForcePasswordChange: user.ForcePasswordChange,
			CreatedAt:           user.CreatedAt,
			UpdatedAt:           user.UpdatedAt,
			Roles:               roles,
		})
	}

	return responses, nil
}

func (s *UserService) UpdateUser(userID int64, req models.UserUpdate) (*models.UserResponse, error) {
	query := "UPDATE users SET updated_at = $1"
	args := []interface{}{time.Now()}
	argCount := 2

	if req.Username != nil {
		query += ", username = $" + strconv.Itoa(argCount)
		args = append(args, *req.Username)
		argCount++
	}

	if req.Email != nil {
		query += ", email = $" + strconv.Itoa(argCount)
		args = append(args, *req.Email)
		argCount++
	}

	if req.FirstName != nil {
		query += ", first_name = $" + strconv.Itoa(argCount)
		args = append(args, *req.FirstName)
		argCount++
	}

	if req.LastName != nil {
		query += ", last_name = $" + strconv.Itoa(argCount)
		args = append(args, *req.LastName)
		argCount++
	}

	if req.IsActive != nil {
		query += ", is_active = $" + strconv.Itoa(argCount)
		args = append(args, *req.IsActive)
		argCount++
	}

	query += " WHERE user_id = $" + strconv.Itoa(argCount)
	args = append(args, userID)

	// 1️⃣ Update user profile fields
	result, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return nil, fmt.Errorf("no user updated")
	}

	// 2️⃣ Update role in mapping table (user_roles)
	if req.RoleID != nil {
		// update role
		_, err := s.db.Exec("DELETE FROM user_roles WHERE user_id = $1", userID)
		if err != nil {
			return nil, err
		}

		_, err = s.db.Exec("INSERT INTO user_roles(user_id, role_id) VALUES($1, $2)", userID, *req.RoleID)
		if err != nil {
			return nil, err
		}
	}
	return s.GetUserByID(userID)
}

func (s *UserService) ToggleUserStatus(userID int64) error {
	_, err := s.db.Exec(`
        UPDATE users
        SET is_active = NOT is_active,
            updated_at = $1
        WHERE user_id = $2
    `, time.Now(), userID)
	return err
}

func (s *UserService) DeleteUser(userID int64) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// 1️⃣ Remove user_roles
	_, err = tx.Exec("DELETE FROM user_roles WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	// 2️⃣ Remove sessions
	_, err = tx.Exec("DELETE FROM sessions WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	// 3️⃣ Optional: remove audit_logs
	_, err = tx.Exec("DELETE FROM audit_logs WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	// 4️⃣ Delete user
	_, err = tx.Exec("DELETE FROM users WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	// 5️⃣ Commit transaction
	return tx.Commit()
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

// College-scoped methods for College Admin

func (s *UserService) GetUsersByCollege(collegeID string, search string) ([]models.UserResponse, error) {
	var users []models.User
	var err error

	if search != "" {
		searchPattern := "%" + search + "%"
		err = s.db.Select(&users,
			`SELECT * FROM users
			 WHERE college_id = $1
			 AND (username ILIKE $2 OR email ILIKE $2 OR first_name ILIKE $2 OR last_name ILIKE $2)
			 ORDER BY created_at DESC`,
			collegeID, searchPattern)
	} else {
		err = s.db.Select(&users,
			`SELECT * FROM users WHERE college_id = $1 ORDER BY created_at DESC`,
			collegeID)
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
			UserID:              user.UserID,
			Username:            user.Username,
			Email:               user.Email,
			FirstName:           user.FirstName,
			LastName:            user.LastName,
			CollegeID:           user.CollegeID,
			IsActive:            user.IsActive,
			ForcePasswordChange: user.ForcePasswordChange,
			CreatedAt:           user.CreatedAt,
			UpdatedAt:           user.UpdatedAt,
			Roles:               roles,
		})
	}

	return responses, nil
}

func (s *UserService) GetUserByIDAndCollege(userID int64, collegeID string) (*models.UserResponse, error) {
	var user models.User
	err := s.db.Get(&user,
		`SELECT * FROM users WHERE user_id = $1 AND college_id = $2`,
		userID, collegeID)
	if err != nil {
		return nil, err
	}

	roles, err := s.GetUserRoles(userID)
	if err != nil {
		return nil, err
	}

	return &models.UserResponse{
			UserID:              user.UserID,
			Username:            user.Username,
			Email:               user.Email,
			FirstName:           user.FirstName,
			LastName:            user.LastName,
			CollegeID:           user.CollegeID,
			IsActive:            user.IsActive,
			ForcePasswordChange: user.ForcePasswordChange,
			CreatedAt:           user.CreatedAt,
			UpdatedAt:           user.UpdatedAt,
			Roles:               roles,
		}, nil
}

func (s *UserService) UpdateUserByCollege(userID int64, collegeID string, req models.UserUpdate) (*models.UserResponse, error) {
	// First verify user belongs to the college
	var exists bool
	err := s.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1 AND college_id = $2)`,
		userID, collegeID,
	).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("user not found in your college")
	}

	return s.UpdateUser(userID, req)
}

func (s *UserService) ToggleUserStatusByCollege(userID int64, collegeID string) error {
	result, err := s.db.Exec(`
		UPDATE users
		SET is_active = NOT is_active,
		    updated_at = $1
		WHERE user_id = $2 AND college_id = $3
	`, time.Now(), userID, collegeID)

	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found in your college")
	}

	return nil
}
