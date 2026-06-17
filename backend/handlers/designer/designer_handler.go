package designer

import (
	"backend/middleware"
	"backend/models"
	"backend/services/designer"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DesignerHandler struct {
	designerService *designer.DesignerService
}

func NewDesignerHandler(designerService *designer.DesignerService) *DesignerHandler {
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

// GetDesignerModules returns only designer-created modules (is_system = false).
// System-seeded tables are hidden so they cannot be accidentally modified.
func (h *DesignerHandler) GetDesignerModules(c *gin.Context) {
	modules, err := h.designerService.GetDesignerModules()
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
func (h *DesignerHandler) GetReferenceColumns(c *gin.Context) {

	moduleKey := c.Param("moduleKey")

	module, err :=
		h.designerService.GetModule(
			moduleKey,
		)

	if err != nil {
		c.JSON(
			404,
			gin.H{
				"error": "module not found",
			},
		)
		return
	}

	columns,
		err :=
		h.designerService.
			GetModuleColumnsByModule(
				module.ModuleID,
			)

	if err != nil {

		c.JSON(
			500,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	var allowed []models.ModuleColumn

	for _, c := range columns {

		if c.IsPrimaryKey ||
			c.IsUnique {

			allowed =
				append(
					allowed,
					c,
				)
		}
	}

	c.JSON(
		200,
		allowed,
	)
}

// GetFieldGroupModules returns system-seeded modules excluding the current one.
// Used in the Field Designer field_group picker — only shows real data-model tables.
func (h *DesignerHandler) GetFieldGroupModules(c *gin.Context) {
	exclude := c.Query("exclude")
	modules, err := h.designerService.GetFieldGroupModules(exclude)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, modules)
}

// GetFieldGroupColumns returns PK/UNIQUE columns of a module — candidates for the join key.
func (h *DesignerHandler) GetFieldGroupColumns(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	columns, err := h.designerService.GetFieldGroupColumns(moduleKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "module not found or has no key columns"})
		return
	}
	c.JSON(http.StatusOK, columns)
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
