package erp

import (
	"backend/models"
	"backend/services/erp"
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	settingsService *erp.SettingsService
}

func NewSettingsHandler(settingsService *erp.SettingsService) *SettingsHandler {
	return &SettingsHandler{
		settingsService: settingsService,
	}
}

func (h *SettingsHandler) CreateSetting(c *gin.Context) {
	var req models.AppSettingCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting, err := h.settingsService.CreateSetting(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, setting)
}

func (h *SettingsHandler) GetSetting(c *gin.Context) {
	settingID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid setting ID"})
		return
	}

	setting, err := h.settingsService.GetSettingByID(settingID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, setting)
}

func (h *SettingsHandler) GetSettingByKey(c *gin.Context) {
	settingKey := c.Param("key")
	if settingKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Setting key is required"})
		return
	}

	setting, err := h.settingsService.GetSettingByKey(settingKey)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, setting)
}

func (h *SettingsHandler) GetAllSettings(c *gin.Context) {
	settings, err := h.settingsService.GetAllSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func (h *SettingsHandler) UpdateSetting(c *gin.Context) {
	settingID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid setting ID"})
		return
	}

	var req models.AppSettingUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting, err := h.settingsService.UpdateSetting(settingID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, setting)
}

func (h *SettingsHandler) UpdateSettingByKey(c *gin.Context) {
	settingKey := c.Param("key")
	if settingKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Setting key is required"})
		return
	}

	var req models.AppSettingUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting, err := h.settingsService.UpdateSettingByKey(settingKey, req)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, setting)
}

func (h *SettingsHandler) DeleteSetting(c *gin.Context) {
	settingID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid setting ID"})
		return
	}

	err = h.settingsService.DeleteSetting(settingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Setting deleted successfully"})
}
