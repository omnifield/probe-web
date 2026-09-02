// Package handlers provides HTTP handlers for the REST API v1 endpoints.
package handlers

import (
	"net/http"
	"time"

	"windshift/internal/database"
	"windshift/internal/logger"
	"windshift/internal/models"
	"windshift/internal/repository"
	"windshift/internal/restapi"
	"windshift/internal/sanitize"
	"windshift/internal/services"
)

// ========================================
// Item Types Handler
// ========================================

type ItemTypeHandler struct {
	BaseHandler
	configSvc *services.ConfigReadService
}

func NewItemTypeHandler(db database.Database, permissionService *services.PermissionService) *ItemTypeHandler {
	return &ItemTypeHandler{
		BaseHandler: NewBaseHandler(db, permissionService),
		configSvc:   services.NewConfigReadService(db),
	}
}

type ItemTypeResponse struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	Description    string `json:"description,omitempty"`
	Icon           string `json:"icon,omitempty"`
	Color          string `json:"color,omitempty"`
	HierarchyLevel int    `json:"hierarchy_level"`
	SortOrder      int    `json:"sort_order"`
	IsDefault      bool   `json:"is_default"`
}

// List handles GET /rest/api/v1/item-types
//
// @Summary      List item types
// @Tags         item-types
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   handlers.ItemTypeResponse
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse  "Token lacks the item-types:read scope"
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /item-types [get]
func (h *ItemTypeHandler) List(w http.ResponseWriter, r *http.Request) {
	_, ok := h.RequireAuth(w, r)
	if !ok {
		return
	}

	results, err := h.configSvc.ListItemTypes()
	if err != nil {
		h.RespondInternalError(w, r)
		return
	}

	var types []ItemTypeResponse
	for _, t := range results {
		types = append(types, ItemTypeResponse{
			ID:             t.ID,
			Name:           t.Name,
			Description:    t.Description,
			Icon:           t.Icon,
			Color:          t.Color,
			HierarchyLevel: t.HierarchyLevel,
			SortOrder:      t.SortOrder,
			IsDefault:      t.IsDefault,
		})
	}

	if types == nil {
		types = []ItemTypeResponse{}
	}

	h.RespondOK(w, types)
}

// Get handles GET /rest/api/v1/item-types/{id}
//
// @Summary      Get an item type by ID
// @Tags         item-types
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Item type ID"
// @Success      200  {object}  handlers.ItemTypeResponse
// @Failure      400  {object}  handlers.ErrorResponse  "Invalid item type ID"
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse  "Token lacks the item-types:read scope"
// @Failure      404  {object}  handlers.ErrorResponse  "Item type not found"
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /item-types/{id} [get]
func (h *ItemTypeHandler) Get(w http.ResponseWriter, r *http.Request) {
	_, ok := h.RequireAuth(w, r)
	if !ok {
		return
	}

	id, ok := h.ParsePathID(w, r, "id", "item type ID")
	if !ok {
		return
	}

	t, err := h.configSvc.GetItemType(id)
	if err != nil {
		h.RespondNotFound(w, r)
		return
	}

	h.RespondOK(w, ItemTypeResponse{
		ID:             t.ID,
		Name:           t.Name,
		Description:    t.Description,
		Icon:           t.Icon,
		Color:          t.Color,
		HierarchyLevel: t.HierarchyLevel,
		SortOrder:      t.SortOrder,
		IsDefault:      t.IsDefault,
	})
}

type itemTypeCreateRequest struct {
	Name           string `json:"name"`
	Description    string `json:"description,omitempty"`
	Icon           string `json:"icon,omitempty"`
	Color          string `json:"color,omitempty"`
	HierarchyLevel int    `json:"hierarchy_level,omitempty"`
	SortOrder      int    `json:"sort_order,omitempty"`
}

// Create handles POST /rest/api/v1/item-types. Gated by the admin:item-types:write
// scope AND the system-admin role (see the adminV1 router group) — item types are
// a global catalog shared by every workspace, matching the cookie surface's
// system-admin-only /admin/item-types.
//
// @Summary      Create an item type
// @Tags         item-types
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      handlers.itemTypeCreateRequest  true  "Item type to create"
// @Success      201  {object}  handlers.ItemTypeResponse
// @Failure      400  {object}  handlers.ErrorResponse
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse  "Token lacks the admin:item-types:write scope, or caller is not a system admin"
// @Failure      409  {object}  handlers.ErrorResponse  "An item type with this name already exists"
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /item-types [post]
func (h *ItemTypeHandler) Create(w http.ResponseWriter, r *http.Request) {
	user, ok := h.RequireAuth(w, r)
	if !ok {
		return
	}

	var req itemTypeCreateRequest
	if !h.DecodeBodyOrRespond(w, r, &req) {
		return
	}
	name := sanitize.PlainTextField.Sanitize(req.Name)
	if !h.ValidateRequiredString(w, r, name, "name") {
		return
	}

	svc := services.NewEnumService(h.DB, services.NewItemTypeConfig())
	created, err := svc.Create(&models.ItemType{
		Name:           name,
		Description:    sanitize.PlainTextField.Sanitize(req.Description),
		Icon:           req.Icon,
		Color:          req.Color,
		HierarchyLevel: req.HierarchyLevel,
		SortOrder:      req.SortOrder,
	}, r)
	if err != nil {
		respondEnumServiceError(h.BaseHandler, w, r, err)
		return
	}

	it, ok := created.(*models.ItemType)
	if !ok {
		h.RespondInternalError(w, r)
		return
	}
	h.Auditor.Log(r, user, logger.ActionItemTypeCreate, logger.ResourceItemType, &it.ID, it.Name)
	h.RespondCreated(w, ItemTypeResponse{
		ID:             it.ID,
		Name:           it.Name,
		Description:    it.Description,
		Icon:           it.Icon,
		Color:          it.Color,
		HierarchyLevel: it.HierarchyLevel,
		SortOrder:      it.SortOrder,
		IsDefault:      it.IsDefault,
	})
}

// respondEnumServiceError maps a *services.ServiceError (see EnumService) to an
// HTTP response; anything else is an internal error.
func respondEnumServiceError(h BaseHandler, w http.ResponseWriter, r *http.Request, err error) {
	se, ok := err.(*services.ServiceError)
	if !ok {
		h.RespondInternalError(w, r)
		return
	}
	h.RespondError(w, r, restapi.NewAPIError(se.StatusCode, restapi.ErrCodeValidationFailed, se.Message))
}

// ========================================
// Priorities Handler
// ========================================

type PriorityHandler struct {
	BaseHandler
	configSvc *services.ConfigReadService
}

func NewPriorityHandler(db database.Database, permissionService *services.PermissionService) *PriorityHandler {
	return &PriorityHandler{
		BaseHandler: NewBaseHandler(db, permissionService),
		configSvc:   services.NewConfigReadService(db),
	}
}

type PriorityResponse struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Icon        string `json:"icon,omitempty"`
	Color       string `json:"color,omitempty"`
	SortOrder   int    `json:"sort_order"`
	IsDefault   bool   `json:"is_default"`
}

// List handles GET /rest/api/v1/priorities
//
// @Summary      List priorities
// @Tags         priorities
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   handlers.PriorityResponse
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse  "Token lacks the priorities:read scope"
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /priorities [get]
func (h *PriorityHandler) List(w http.ResponseWriter, r *http.Request) {
	_, ok := h.RequireAuth(w, r)
	if !ok {
		return
	}

	results, err := h.configSvc.ListPriorities()
	if err != nil {
		h.RespondInternalError(w, r)
		return
	}

	var priorities []PriorityResponse
	for _, p := range results {
		priorities = append(priorities, PriorityResponse{
			ID:          p.ID,
			Name:        p.Name,
			Description: p.Description,
			Icon:        p.Icon,
			Color:       p.Color,
			SortOrder:   p.SortOrder,
			IsDefault:   p.IsDefault,
		})
	}

	if priorities == nil {
		priorities = []PriorityResponse{}
	}

	h.RespondOK(w, priorities)
}

// Get handles GET /rest/api/v1/priorities/{id}
//
// @Summary      Get a priority by ID
// @Tags         priorities
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Priority ID"
// @Success      200  {object}  handlers.PriorityResponse
// @Failure      400  {object}  handlers.ErrorResponse  "Invalid priority ID"
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse  "Token lacks the priorities:read scope"
// @Failure      404  {object}  handlers.ErrorResponse  "Priority not found"
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /priorities/{id} [get]
func (h *PriorityHandler) Get(w http.ResponseWriter, r *http.Request) {
	_, ok := h.RequireAuth(w, r)
	if !ok {
		return
	}

	id, ok := h.ParsePathID(w, r, "id", "priority ID")
	if !ok {
		return
	}

	p, err := h.configSvc.GetPriority(id)
	if err != nil {
		h.RespondNotFound(w, r)
		return
	}

	h.RespondOK(w, PriorityResponse{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		Icon:        p.Icon,
		Color:       p.Color,
		SortOrder:   p.SortOrder,
		IsDefault:   p.IsDefault,
	})
}

// ========================================
// Custom Fields Handler
// ========================================

type CustomFieldHandler struct {
	BaseHandler
	configSvc *services.ConfigReadService
}

func NewCustomFieldHandler(db database.Database, permissionService *services.PermissionService) *CustomFieldHandler {
	return &CustomFieldHandler{
		BaseHandler: NewBaseHandler(db, permissionService),
		configSvc:   services.NewConfigReadService(db),
	}
}

type CustomFieldResponse struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	FieldType    string `json:"field_type"`
	Description  string `json:"description,omitempty"`
	Options      string `json:"options,omitempty"` // JSON string
	Required     bool   `json:"required"`
	DisplayOrder int    `json:"display_order"`
}

// List handles GET /rest/api/v1/custom-fields
//
// @Summary      List custom fields
// @Tags         custom-fields
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   handlers.CustomFieldResponse
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse  "Token lacks the custom-fields:read scope"
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /custom-fields [get]
func (h *CustomFieldHandler) List(w http.ResponseWriter, r *http.Request) {
	_, ok := h.RequireAuth(w, r)
	if !ok {
		return
	}

	results, err := h.configSvc.ListCustomFields()
	if err != nil {
		h.RespondInternalError(w, r)
		return
	}

	var fields []CustomFieldResponse
	for _, f := range results {
		fields = append(fields, CustomFieldResponse{
			ID:           f.ID,
			Name:         f.Name,
			FieldType:    f.FieldType,
			Description:  f.Description,
			Options:      f.Options,
			Required:     f.Required,
			DisplayOrder: f.DisplayOrder,
		})
	}

	if fields == nil {
		fields = []CustomFieldResponse{}
	}

	h.RespondOK(w, fields)
}

// Get handles GET /rest/api/v1/custom-fields/{id}
//
// @Summary      Get a custom field by ID
// @Tags         custom-fields
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Custom field ID"
// @Success      200  {object}  handlers.CustomFieldResponse
// @Failure      400  {object}  handlers.ErrorResponse  "Invalid custom field ID"
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse  "Token lacks the custom-fields:read scope"
// @Failure      404  {object}  handlers.ErrorResponse  "Custom field not found"
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /custom-fields/{id} [get]
func (h *CustomFieldHandler) Get(w http.ResponseWriter, r *http.Request) {
	_, ok := h.RequireAuth(w, r)
	if !ok {
		return
	}

	id, ok := h.ParsePathID(w, r, "id", "custom field ID")
	if !ok {
		return
	}

	f, err := h.configSvc.GetCustomField(id)
	if err != nil {
		h.RespondNotFound(w, r)
		return
	}

	h.RespondOK(w, CustomFieldResponse{
		ID:           f.ID,
		Name:         f.Name,
		FieldType:    f.FieldType,
		Description:  f.Description,
		Options:      f.Options,
		Required:     f.Required,
		DisplayOrder: f.DisplayOrder,
	})
}

type customFieldCreateRequest struct {
	Name         string `json:"name"`
	FieldType    string `json:"field_type"`
	Description  string `json:"description,omitempty"`
	Required     bool   `json:"required,omitempty"`
	Options      string `json:"options,omitempty"` // JSON string; select/multiselect only
	DisplayOrder int    `json:"display_order,omitempty"`
}

// Create handles POST /rest/api/v1/custom-fields. Gated by the
// admin:custom-fields:write scope AND the system-admin role (see the adminV1
// router group), matching the cookie surface's system-admin-only
// /admin/custom-fields. Only "simple" field types are accepted — see
// simpleCustomFieldTypes.
//
// @Summary      Create a custom field
// @Description  Accepts simple field types only (text, textarea, number, date, select, multiselect, boolean/checkbox). Relationship-shaped types (linking, asset, user, milestone, iteration, portal customer/organisation) require admin-UI setup.
// @Tags         custom-fields
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      handlers.customFieldCreateRequest  true  "Custom field to create"
// @Success      201  {object}  handlers.CustomFieldResponse
// @Failure      400  {object}  handlers.ErrorResponse
// @Failure      401  {object}  handlers.ErrorResponse
// @Failure      403  {object}  handlers.ErrorResponse  "Token lacks the admin:custom-fields:write scope, or caller is not a system admin"
// @Failure      500  {object}  handlers.ErrorResponse
// @Router       /custom-fields [post]
func (h *CustomFieldHandler) Create(w http.ResponseWriter, r *http.Request) {
	user, ok := h.RequireAuth(w, r)
	if !ok {
		return
	}

	var req customFieldCreateRequest
	if !h.DecodeBodyOrRespond(w, r, &req) {
		return
	}
	name := sanitize.ShortIdentifier.Sanitize(req.Name)
	if !h.ValidateRequiredString(w, r, name, "name") {
		return
	}

	fieldType := models.CanonicalCustomFieldType(req.FieldType)
	if !models.IsSimpleCustomFieldType(fieldType) {
		h.RespondError(w, r, restapi.NewAPIError(http.StatusBadRequest, restapi.ErrCodeValidationFailed,
			"unsupported field_type for this endpoint — set it up in Windshift's admin settings instead"))
		return
	}

	options := req.Options
	if models.IsBooleanCustomFieldType(fieldType) {
		options = ""
	} else if fieldType == "select" || fieldType == "multiselect" {
		opts, err := models.ParseSelectOptions(options)
		if err != nil {
			h.RespondError(w, r, restapi.NewAPIError(http.StatusBadRequest, restapi.ErrCodeValidationFailed, "invalid options format"))
			return
		}
		if len(opts.Items) == 0 {
			h.RespondError(w, r, restapi.NewAPIError(http.StatusBadRequest, restapi.ErrCodeValidationFailed, "select fields must have at least one option"))
			return
		}
		seen := make(map[string]bool, len(opts.Items))
		for _, item := range opts.Items {
			if seen[item.Label] {
				h.RespondError(w, r, restapi.NewAPIError(http.StatusBadRequest, restapi.ErrCodeValidationFailed, "duplicate option label: "+item.Label))
				return
			}
			seen[item.Label] = true
		}
		normalized, err := models.SerializeSelectOptions(opts)
		if err != nil {
			h.RespondInternalError(w, r)
			return
		}
		options = normalized
	}

	cf := &models.CustomFieldDefinition{
		Name:         name,
		FieldType:    fieldType,
		Description:  sanitize.Comment.Sanitize(req.Description),
		Required:     req.Required,
		Options:      options,
		DisplayOrder: req.DisplayOrder,
	}

	repo := repository.NewCustomFieldRepository(h.DB)
	id, err := repo.Create(cf, time.Now())
	if err != nil {
		h.RespondInternalError(w, r)
		return
	}

	created, err := repo.FindByID(int(id))
	if err != nil {
		h.RespondInternalError(w, r)
		return
	}

	h.Auditor.Log(r, user, logger.ActionCustomFieldCreate, logger.ResourceCustomField, &created.ID, created.Name)
	h.RespondCreated(w, CustomFieldResponse{
		ID:           created.ID,
		Name:         created.Name,
		FieldType:    created.FieldType,
		Description:  created.Description,
		Options:      created.Options,
		Required:     created.Required,
		DisplayOrder: created.DisplayOrder,
	})
}
