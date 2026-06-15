package main

import (
	"log"
	"os"

	"backend/config"
	"backend/database"
	"backend/handlers"
	"backend/middleware"
	"backend/services"

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
	// rbacMiddleware := middleware.NewRBACMiddleware()

	authService := services.NewAuthService(db, jwtSecret)
	userService := services.NewUserService(db)
	roleService := services.NewRoleService(db)
	auditService := services.NewAuditService(db)
	settingsService := services.NewSettingsService(db)
	designerService := services.NewDesignerService(db)

	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	roleHandler := handlers.NewRoleHandler(roleService)
	auditHandler := handlers.NewAuditHandler(auditService)
	settingsHandler := handlers.NewSettingsHandler(settingsService)
	designerHandler := handlers.NewDesignerHandler(designerService)

	r := gin.Default()

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	auth := r.Group("/api/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/register", userHandler.CreateUser)
	}

	protected := r.Group("/api/auth")
	protected.Use(authMiddleware.AuthRequired())
	{
		protected.GET("/me", authHandler.GetCurrentUser)
		protected.POST("/change-password", authHandler.ChangePassword)
	}

	users := r.Group("/api/users")
	users.Use(authMiddleware.AuthRequired())
	{
		users.POST("", userHandler.CreateUser)
		users.GET("", userHandler.GetAllUsers)
		users.GET("/:id", userHandler.GetUser)
		users.PUT("/:id", userHandler.UpdateUser)
		users.DELETE("/:id", userHandler.DeleteUser)
		users.PATCH("/:id/disable", userHandler.ToggleUserStatus)
		users.POST("/:id/roles", userHandler.AssignRole)
		users.DELETE("/:id/roles", userHandler.RemoveRole)
	}

	roles := r.Group("/api/roles")
	roles.Use(authMiddleware.AuthRequired())
	{
		roles.POST("", roleHandler.CreateRole)
		roles.GET("", roleHandler.GetAllRoles)
		roles.GET("/:id", roleHandler.GetRole)
		roles.PUT("/:id", roleHandler.UpdateRole)
		roles.DELETE("/:id", roleHandler.DeleteRole)
		roles.POST("/:id/permissions", roleHandler.AssignPermission)
		roles.DELETE("/:id/permissions", roleHandler.RemovePermission)
	}

	audit := r.Group("/api/audit")
	audit.Use(authMiddleware.AuthRequired())
	{
		audit.GET("", auditHandler.GetAllLogs)
		audit.GET("/entity", auditHandler.GetLogsByEntity)
		audit.GET("/my-logs", auditHandler.GetLogsByUser)
	}

	settings := r.Group("/api/settings")
	settings.Use(authMiddleware.AuthRequired())
	{
		settings.POST("", settingsHandler.CreateSetting)
		settings.GET("", settingsHandler.GetAllSettings)
		settings.GET("/:id", settingsHandler.GetSetting)
		settings.GET("/key/:key", settingsHandler.GetSettingByKey)
		settings.PUT("/:id", settingsHandler.UpdateSetting)
		settings.PUT("/key/:key", settingsHandler.UpdateSettingByKey)
		settings.DELETE("/:id", settingsHandler.DeleteSetting)
	}

	// Designer Studio Routes - Only accessible by role_id = 4
	designer := r.Group("/api/designer")
	designer.Use(authMiddleware.AuthRequired())
	designer.Use(middleware.RequireDesignerRole(db))
	{
		// Module Routes
		designer.POST("/modules", designerHandler.CreateModule)
		designer.GET("/modules", designerHandler.GetAllModules)
		designer.GET("/modules/:moduleKey", designerHandler.GetModule)
		designer.PUT("/modules/:moduleKey", designerHandler.UpdateModule)
		designer.DELETE("/modules/:moduleKey", designerHandler.DeleteModule)
		designer.GET("/modules/:moduleKey/with-fields", designerHandler.GetModuleWithFields)

		// Field Routes
		designer.POST("/fields", designerHandler.CreateField)
		designer.GET("/fields/:fieldId", designerHandler.GetField)
		designer.GET("/modules/:moduleKey/fields", designerHandler.GetFieldsByModule)
		designer.PUT("/fields/:fieldId", designerHandler.UpdateField)
		designer.DELETE("/fields/:fieldId", designerHandler.DeleteField)
		designer.PUT("/fields/:fieldId/order", designerHandler.UpdateFieldOrder)

		// Record Routes
		designer.POST("/records", designerHandler.CreateRecord)
		designer.GET("/records/:recordId", designerHandler.GetRecord)
		designer.GET("/modules/:moduleKey/records", designerHandler.GetRecordsByModule)
		designer.PUT("/records/:recordId", designerHandler.UpdateRecord)
		designer.DELETE("/records/:recordId", designerHandler.DeleteRecord)

		// Form Layout Routes
		designer.GET("/modules/:moduleKey/layout", designerHandler.GetFormLayout)

		// Module Column Routes
		designer.POST("/module-columns", designerHandler.CreateModuleColumn)
		designer.GET(
			"/modules/:moduleKey/reference-columns",
			designerHandler.GetReferenceColumns,
		)
		designer.GET("/module-columns/:columnId", designerHandler.GetModuleColumn)
		designer.GET("/modules/:moduleKey/columns", designerHandler.GetModuleColumnsByModule)
		designer.PUT("/module-columns/:columnId", designerHandler.UpdateModuleColumn)
		designer.DELETE("/module-columns/:columnId", designerHandler.DeleteModuleColumn)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server started on :%s", port)
	r.Run(":" + port)
}
