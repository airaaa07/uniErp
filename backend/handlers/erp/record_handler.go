package erp

import (
	"backend/middleware"
	"backend/models"
	"backend/services/erp"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RecordHandler struct {
	recordService *erp.RecordService
}

func NewRecordHandler(recordService *erp.RecordService) *RecordHandler {
	return &RecordHandler{
		recordService: recordService,
	}
}

func (h *RecordHandler) CreateRecord(c *gin.Context) {
	var req models.RecordCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	record, err := h.recordService.CreateRecord(req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, record)
}

func (h *RecordHandler) GetRecord(c *gin.Context) {
	recordID := c.Param("recordId")
	record, err := h.recordService.GetRecord(recordID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, record)
}

func (h *RecordHandler) GetRecordsByModule(c *gin.Context) {
	moduleKey := c.Param("moduleKey")
	search := c.Query("search")

	var records []models.Record
	var err error

	if search != "" {
		records, err = h.recordService.SearchRecords(moduleKey, search)
	} else {
		records, err = h.recordService.GetRecordsByModule(moduleKey)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, records)
}

func (h *RecordHandler) UpdateRecord(c *gin.Context) {
	recordID := c.Param("recordId")
	var req models.RecordUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record, err := h.recordService.UpdateRecord(recordID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, record)
}

func (h *RecordHandler) DeleteRecord(c *gin.Context) {
	recordID := c.Param("recordId")
	err := h.recordService.DeleteRecord(recordID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Record deleted successfully"})
}
