package erp

import (
	"backend/middleware"
	"backend/services/erp"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AuditHandler struct {
	auditService *erp.AuditService
}

func NewAuditHandler(auditService *erp.AuditService) *AuditHandler {
	return &AuditHandler{
		auditService: auditService,
	}
}

func (h *AuditHandler) GetAllLogs(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	logs, err := h.auditService.GetAllLogs(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

func (h *AuditHandler) GetLogsByEntity(c *gin.Context) {
	entityName := c.Query("entity")
	if entityName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "entity parameter is required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	logs, err := h.auditService.GetLogsByEntity(entityName, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

func (h *AuditHandler) GetLogsByUser(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	logs, err := h.auditService.GetLogsByUser(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}
