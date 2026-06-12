package services

import (
	"backend/middleware"
	"backend/models"
	"backend/utils"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type AuthService struct {
	db          *sqlx.DB
	authMiddleware *middleware.AuthMiddleware
}

func NewAuthService(db *sqlx.DB, jwtSecret string) *AuthService {
	return &AuthService{
		db:          db,
		authMiddleware: middleware.NewAuthMiddleware(jwtSecret),
	}
}

func (s *AuthService) Login(req models.LoginRequest, ipAddress, userAgent string) (*models.LoginResponse, error) {
	var user models.User
	err := s.db.Get(&user, "SELECT * FROM users WHERE username = $1", req.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, errors.New("user account is disabled")
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	accessToken, err := s.authMiddleware.GenerateToken(user.UserID, user.Username)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.authMiddleware.GenerateRefreshToken(user.UserID, user.Username)
	if err != nil {
		return nil, err
	}

	_, err = s.CreateSession(user.UserID, refreshToken, ipAddress, userAgent)
	if err != nil {
		return nil, err
	}

	roles, err := s.GetUserRoles(user.UserID)
	if err != nil {
		return nil, err
	}

	userResponse := models.UserResponse{
		UserID:    user.UserID,
		Username:  user.Username,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
		Roles:     roles,
	}

	return &models.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         userResponse,
	}, nil
}

func (s *AuthService) Logout(refreshToken string) error {
	now := time.Now()
	_, err := s.db.Exec("UPDATE sessions SET revoked_at = $1 WHERE refresh_token = $2", now, refreshToken)
	return err
}

func (s *AuthService) Refresh(refreshToken string) (*models.RefreshResponse, error) {
	claims, err := s.authMiddleware.ValidateToken(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	var session models.Session
	err = s.db.Get(&session, "SELECT * FROM sessions WHERE refresh_token = $1 AND revoked_at IS NULL", refreshToken)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("session not found or revoked")
		}
		return nil, err
	}

	if time.Now().After(session.ExpiresAt) {
		return nil, errors.New("refresh token expired")
	}

	newAccessToken, err := s.authMiddleware.GenerateToken(claims.UserID, claims.Username)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := s.authMiddleware.GenerateRefreshToken(claims.UserID, claims.Username)
	if err != nil {
		return nil, err
	}

	_, err = s.db.Exec("UPDATE sessions SET refresh_token = $1, expires_at = $2 WHERE session_id = $3", 
		newRefreshToken, time.Now().Add(7*24*time.Hour), session.SessionID)
	if err != nil {
		return nil, err
	}

	return &models.RefreshResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *AuthService) GetCurrentUser(userID int64) (*models.UserResponse, error) {
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

func (s *AuthService) ChangePassword(userID int64, req models.ChangePasswordRequest) error {
	var user models.User
	err := s.db.Get(&user, "SELECT * FROM users WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	if !utils.CheckPassword(req.OldPassword, user.PasswordHash) {
		return errors.New("current password is incorrect")
	}

	newPasswordHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	_, err = s.db.Exec("UPDATE users SET password_hash = $1, updated_at = $2 WHERE user_id = $3", 
		newPasswordHash, time.Now(), userID)
	return err
}

func (s *AuthService) CreateSession(userID int64, refreshToken, ipAddress, userAgent string) (int64, error) {
	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	var sessionID int64
	err := s.db.QueryRow(
		"INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING session_id",
		userID, refreshToken, ipAddress, userAgent, expiresAt,
	).Scan(&sessionID)
	return sessionID, err
}

func (s *AuthService) GetUserRoles(userID int64) ([]string, error) {
	var roles []string
	err := s.db.Select(&roles, `
		SELECT r.role_name 
		FROM roles r
		INNER JOIN user_roles ur ON r.role_id = ur.role_id
		WHERE ur.user_id = $1
	`, userID)
	return roles, err
}

func (s *AuthService) ResetPassword(username string) (string, error) {
	var user models.User
	err := s.db.Get(&user, "SELECT * FROM users WHERE username = $1", username)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", errors.New("user not found")
		}
		return "", err
	}

	tempPassword := uuid.New().String()[:8]
	hashedPassword, err := utils.HashPassword(tempPassword)
	if err != nil {
		return "", err
	}

	_, err = s.db.Exec("UPDATE users SET password_hash = $1, updated_at = $2 WHERE user_id = $3", 
		hashedPassword, time.Now(), user.UserID)
	if err != nil {
		return "", err
	}

	return tempPassword, nil
}
