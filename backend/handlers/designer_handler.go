package handlers

import (
	"backend/middleware"
	"backend/models"
	"backend/services"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DesignerHandler struct {
	designerService *services.DesignerService
}

func NewDesignerHandler(designerService *services.DesignerService) *DesignerHandler {
	return &DesignerHandler{
		designerService: designerService,
	}
}

// ==================== MODULE HANDLERS ====================

func (h *DesignerHandler) CreateModule(c *gin.Context) {
	var req models.ModuleCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	module, err := h.designerService.CreateModule(req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, module)
}

func (h *DesignerHandler) GetModule(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	module, err := h.designerService.GetModule(moduleKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	c.JSON(http.StatusOK, module)
}

func (h *DesignerHandler) GetAllModules(c *gin.Context) {
	modules, err := h.designerService.GetAllModules()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, modules)
}

func (h *DesignerHandler) UpdateModule(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	var req models.ModuleUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	module, err := h.designerService.UpdateModule(moduleKey, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, module)
}

func (h *DesignerHandler) DeleteModule(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	err := h.designerService.DeleteModule(moduleKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Module deleted successfully"})
}

func (h *DesignerHandler) GetModuleWithFields(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	module, err := h.designerService.GetModuleWithFields(moduleKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	c.JSON(http.StatusOK, module)
}

// ==================== FIELD HANDLERS ====================

func (h *DesignerHandler) CreateField(c *gin.Context) {
	var req models.FieldCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	field, err := h.designerService.CreateField(req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, field)
}

func (h *DesignerHandler) GetField(c *gin.Context) {
	fieldID := c.Param("fieldId")
	var fieldIDInt int64
	if _, err := fmt.Sscanf(fieldID, "%d", &fieldIDInt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid field ID"})
		return
	}

	field, err := h.designerService.GetFieldByID(fieldIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Field not found"})
		return
	}

	c.JSON(http.StatusOK, field)
}

func (h *DesignerHandler) GetFieldsByModule(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	fields, err := h.designerService.GetFieldsByModule(moduleKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, fields)
}

func (h *DesignerHandler) UpdateField(c *gin.Context) {
	fieldID := c.Param("fieldId")
	var fieldIDInt int64
	if _, err := fmt.Sscanf(fieldID, "%d", &fieldIDInt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid field ID"})
		return
	}

	var req models.FieldUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	field, err := h.designerService.UpdateField(fieldIDInt, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, field)
}

func (h *DesignerHandler) DeleteField(c *gin.Context) {
	fieldID := c.Param("fieldId")
	var fieldIDInt int64
	if _, err := fmt.Sscanf(fieldID, "%d", &fieldIDInt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid field ID"})
		return
	}

	err := h.designerService.DeleteField(fieldIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Field deleted successfully"})
}

func (h *DesignerHandler) UpdateFieldOrder(c *gin.Context) {
	fieldID := c.Param("fieldId")
	var fieldIDInt int64
	if _, err := fmt.Sscanf(fieldID, "%d", &fieldIDInt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid field ID"})
		return
	}

	var req struct {
		SortOrder int16 `json:"sort_order" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.designerService.UpdateFieldOrder(fieldIDInt, req.SortOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Field order updated successfully"})
}

// ==================== RECORD HANDLERS ====================

func (h *DesignerHandler) CreateRecord(c *gin.Context) {
	var req models.RecordCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	record, err := h.designerService.CreateRecord(req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, record)
}

func (h *DesignerHandler) GetRecord(c *gin.Context) {
	recordID := c.Param("recordId")
	record, err := h.designerService.GetRecord(recordID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, record)
}

func (h *DesignerHandler) GetRecordsByModule(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	search := c.Query("search")

	var records []models.Record
	var err error

	if search != "" {
		records, err = h.designerService.SearchRecords(moduleKey, search)
	} else {
		records, err = h.designerService.GetRecordsByModule(moduleKey)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, records)
}

func (h *DesignerHandler) UpdateRecord(c *gin.Context) {
	recordID := c.Param("recordId")
	var req models.RecordUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record, err := h.designerService.UpdateRecord(recordID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

func (h *DesignerHandler) DeleteRecord(c *gin.Context) {
	recordID := c.Param("recordId")
	err := h.designerService.DeleteRecord(recordID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Record deleted successfully"})
}

// ==================== FORM LAYOUT HANDLERS ====================

func (h *DesignerHandler) GetFormLayout(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	layout, err := h.designerService.GetFormLayout(moduleKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, layout)
}

// ==================== MODULE COLUMN HANDLERS ====================

func (h *DesignerHandler) CreateModuleColumn(c *gin.Context) {
	var req models.ModuleColumnCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	column, err := h.designerService.CreateModuleColumn(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, column)
}

func (h *DesignerHandler) GetModuleColumn(c *gin.Context) {
	columnID := c.Param("columnId")
	var columnIDInt int64
	if _, err := fmt.Sscanf(columnID, "%d", &columnIDInt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid column ID"})
		return
	}

	column, err := h.designerService.GetModuleColumnByID(columnIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Column not found"})
		return
	}

	c.JSON(http.StatusOK, column)
}

func (h *DesignerHandler) GetModuleColumnsByModule(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	// First get the module to find its ID
	module, err := h.designerService.GetModule(moduleKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}
	columns, err := h.designerService.GetModuleColumnsByModule(module.ModuleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, columns)
}

func (h *DesignerHandler) UpdateModuleColumn(c *gin.Context) {
	columnID := c.Param("columnId")
	var columnIDInt int64
	if _, err := fmt.Sscanf(columnID, "%d", &columnIDInt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid column ID"})
		return
	}

	var req models.ModuleColumnUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	column, err := h.designerService.UpdateModuleColumn(columnIDInt, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, column)
}

func (h *DesignerHandler) DeleteModuleColumn(c *gin.Context) {
	columnID := c.Param("columnId")
	var columnIDInt int64
	if _, err := fmt.Sscanf(columnID, "%d", &columnIDInt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid column ID"})
		return
	}

	err := h.designerService.DeleteModuleColumn(columnIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Column deleted successfully"})
}
