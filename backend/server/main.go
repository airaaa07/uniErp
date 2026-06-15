package main

import (
	"log"
	"os"

	"backend/config"
	"backend/database"
	"backend/handlers/designer"
	"backend/handlers/erp"
	"backend/middleware"
	designerservices "backend/services/designer"
	erpservices "backend/services/erp"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Seed database with default data
	if os.Getenv("SEED_DB") == "true" {
		log.Println("Seeding database...")
		if err := database.SeedData(db); err != nil {
			log.Fatal("Error seeding database:", err)
		}
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key-change-in-production"
	}

	authMiddleware := middleware.NewAuthMiddleware(jwtSecret)

	// ERP Services
	erpAuthService := erpservices.NewAuthService(db, jwtSecret)
	userService := erpservices.NewUserService(db)
	roleService := erpservices.NewRoleService(db)
	auditService := erpservices.NewAuditService(db)
	settingsService := erpservices.NewSettingsService(db)
	recordService := erpservices.NewRecordService(db)

	// Designer Services
	designerAuthService := designerservices.NewAuthService(db, jwtSecret)
	designerService := designerservices.NewDesignerService(db)

	// ERP Handlers
	erpAuthHandler := erp.NewAuthHandler(erpAuthService)
	userHandler := erp.NewUserHandler(userService)
	roleHandler := erp.NewRoleHandler(roleService)
	auditHandler := erp.NewAuditHandler(auditService)
	settingsHandler := erp.NewSettingsHandler(settingsService)
	erpRecordHandler := erp.NewRecordHandler(recordService)

	// Designer Handlers
	designerAuthHandler := designer.NewAuthHandler(designerAuthService)
	designerHandler := designer.NewDesignerHandler(designerService)

	r := gin.Default()

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// ==================== ERP AUTH ROUTES ====================
	erpAuth := r.Group("/api/erp/auth")
	{
		erpAuth.POST("/login", erpAuthHandler.Login)
		erpAuth.POST("/logout", erpAuthHandler.Logout)
		erpAuth.POST("/refresh", erpAuthHandler.Refresh)
		erpAuth.POST("/register", userHandler.CreateUser)
	}

	// ==================== DESIGNER AUTH ROUTES ====================
	designerAuth := r.Group("/api/designer/auth")
	{
		designerAuth.POST("/login", designerAuthHandler.Login)
		designerAuth.POST("/logout", designerAuthHandler.Logout)
		designerAuth.POST("/refresh", designerAuthHandler.Refresh)
	}

	// ==================== ERP PROTECTED ROUTES ====================
	erpGroup := r.Group("/api/erp")
	erpGroup.Use(authMiddleware.AuthRequired())
	{
		erpGroup.GET("/auth/me", erpAuthHandler.GetCurrentUser)
		erpGroup.POST("/auth/change-password", erpAuthHandler.ChangePassword)

		// Record Routes (Open to ERP authenticated users)
		erpGroup.POST("/records", erpRecordHandler.CreateRecord)
		erpGroup.GET("/records/:recordId", erpRecordHandler.GetRecord)
		erpGroup.GET("/modules/:moduleKey/records", erpRecordHandler.GetRecordsByModule)
		erpGroup.PUT("/records/:recordId", erpRecordHandler.UpdateRecord)
		erpGroup.DELETE("/records/:recordId", erpRecordHandler.DeleteRecord)

		// Module structures (Read-only for form rendering)
		erpGroup.GET("/modules/:moduleKey/layout", designerHandler.GetFormLayout)
		erpGroup.GET("/modules/:moduleKey/with-fields", designerHandler.GetModuleWithFields)
		erpGroup.GET("/modules/:moduleKey/fields", designerHandler.GetFieldsByModule)
	}

	// ==================== DESIGNER PROTECTED ROUTES ====================
	designerGroup := r.Group("/api/designer")
	designerGroup.Use(authMiddleware.AuthRequired())
	designerGroup.Use(middleware.RequireDesignerRole(db))
	{
		designerGroup.GET("/auth/me", designerAuthHandler.GetCurrentUser)
		designerGroup.POST("/auth/change-password", designerAuthHandler.ChangePassword)

		// Users
		designerGroup.POST("/users", userHandler.CreateUser)
		designerGroup.GET("/users", userHandler.GetAllUsers)
		designerGroup.GET("/users/:id", userHandler.GetUser)
		designerGroup.PUT("/users/:id", userHandler.UpdateUser)
		designerGroup.DELETE("/users/:id", userHandler.DeleteUser)
		designerGroup.PATCH("/users/:id/disable", userHandler.ToggleUserStatus)
		designerGroup.POST("/users/:id/roles", userHandler.AssignRole)
		designerGroup.DELETE("/users/:id/roles", userHandler.RemoveRole)

		// Records
		designerGroup.POST("/records", erpRecordHandler.CreateRecord)
		designerGroup.GET("/records/:recordId", erpRecordHandler.GetRecord)
		designerGroup.GET("/modules/:moduleKey/records", erpRecordHandler.GetRecordsByModule)
		designerGroup.PUT("/records/:recordId", erpRecordHandler.UpdateRecord)
		designerGroup.DELETE("/records/:recordId", erpRecordHandler.DeleteRecord)

		// Roles
		designerGroup.POST("/roles", roleHandler.CreateRole)
		designerGroup.GET("/roles", roleHandler.GetAllRoles)
		designerGroup.GET("/roles/:id", roleHandler.GetRole)
		designerGroup.PUT("/roles/:id", roleHandler.UpdateRole)
		designerGroup.DELETE("/roles/:id", roleHandler.DeleteRole)
		designerGroup.POST("/roles/:id/permissions", roleHandler.AssignPermission)
		designerGroup.DELETE("/roles/:id/permissions", roleHandler.RemovePermission)

		// Audit Logs
		designerGroup.GET("/audit", auditHandler.GetAllLogs)
		designerGroup.GET("/audit/entity", auditHandler.GetLogsByEntity)
		designerGroup.GET("/audit/my-logs", auditHandler.GetLogsByUser)

		// Settings
		designerGroup.POST("/settings", settingsHandler.CreateSetting)
		designerGroup.GET("/settings", settingsHandler.GetAllSettings)
		designerGroup.GET("/settings/:id", settingsHandler.GetSetting)
		designerGroup.GET("/settings/key/:key", settingsHandler.GetSettingByKey)
		designerGroup.PUT("/settings/:id", settingsHandler.UpdateSetting)
		designerGroup.PUT("/settings/key/:key", settingsHandler.UpdateSettingByKey)
		designerGroup.DELETE("/settings/:id", settingsHandler.DeleteSetting)

		// Module Routes
		designerGroup.POST("/modules", designerHandler.CreateModule)
		designerGroup.GET("/modules", designerHandler.GetAllModules)
		designerGroup.GET("/modules/:moduleKey", designerHandler.GetModule)
		designerGroup.PUT("/modules/:moduleKey", designerHandler.UpdateModule)
		designerGroup.DELETE("/modules/:moduleKey", designerHandler.DeleteModule)
		designerGroup.GET("/modules/:moduleKey/with-fields", designerHandler.GetModuleWithFields)

		// Field Routes
		designerGroup.POST("/fields", designerHandler.CreateField)
		designerGroup.GET("/fields/:fieldId", designerHandler.GetField)
		designerGroup.GET("/modules/:moduleKey/fields", designerHandler.GetFieldsByModule)
		designerGroup.PUT("/fields/:fieldId", designerHandler.UpdateField)
		designerGroup.DELETE("/fields/:fieldId", designerHandler.DeleteField)
		designerGroup.PUT("/fields/:fieldId/order", designerHandler.UpdateFieldOrder)

		// Form Layout Routes
		designerGroup.GET("/modules/:moduleKey/layout", designerHandler.GetFormLayout)

		// Module Column Routes
		designerGroup.POST("/module-columns", designerHandler.CreateModuleColumn)
		designerGroup.GET("/modules/:moduleKey/reference-columns", designerHandler.GetReferenceColumns)
		designerGroup.GET("/module-columns/:columnId", designerHandler.GetModuleColumn)
		designerGroup.GET("/modules/:moduleKey/columns", designerHandler.GetModuleColumnsByModule)
		designerGroup.PUT("/module-columns/:columnId", designerHandler.UpdateModuleColumn)
		designerGroup.DELETE("/module-columns/:columnId", designerHandler.DeleteModuleColumn)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server started on :%s", port)
	r.Run(":" + port)
}
