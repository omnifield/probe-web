package aitools

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"windshift/internal/auth"
	"windshift/internal/models"
	"windshift/internal/repository"
	"windshift/internal/services"
)

// --- arg types ---

type createChannelArgs struct {
	Name         string `json:"name" jsonschema:"Channel name"`
	Type         string `json:"type" jsonschema:"One of: smtp, webhook, email, portal, form, widget, imap"`
	Direction    string `json:"direction" jsonschema:"inbound or outbound (must match the type's required direction)"`
	Description  string `json:"description,omitempty" jsonschema:"Optional description"`
	Slug         string `json:"slug,omitempty" jsonschema:"Public slug for portal/form channels, 3-64 chars: lowercase letters, digits, hyphens"`
	WorkspaceIDs []int  `json:"workspace_ids,omitempty" jsonschema:"Workspaces this portal/form channel routes submissions into. Can also be set later."`
	CategoryID   *int   `json:"category_id,omitempty" jsonschema:"Optional channel category ID"`
}

type setChannelStatusArgs struct {
	ChannelID int    `json:"channel_id" jsonschema:"Channel to enable or disable"`
	Status    string `json:"status" jsonschema:"enabled or disabled"`
}

type requestTypeFieldArg struct {
	Identifier          string  `json:"identifier" jsonschema:"Field identifier: 'title', 'description', a custom field ID (as string), or a virtual field key"`
	Type                string  `json:"type" jsonschema:"One of: default, custom, virtual"`
	Required            bool    `json:"required,omitempty" jsonschema:"Whether the submitter must fill this field"`
	Order               int     `json:"order,omitempty" jsonschema:"Display order in the form"`
	DisplayName         *string `json:"display_name,omitempty" jsonschema:"Override label shown in the portal form"`
	Description         *string `json:"description,omitempty" jsonschema:"Help text shown below the field"`
	VirtualFieldType    *string `json:"virtual_field_type,omitempty" jsonschema:"virtual fields only: text, textarea, checkbox, or select"`
	VirtualFieldOptions *string `json:"virtual_field_options,omitempty" jsonschema:"virtual select fields only: JSON array of {value,label} options"`
}

type updateRequestTypeFieldsArgs struct {
	RequestTypeID int                   `json:"request_type_id" jsonschema:"Request type whose form fields to replace"`
	Fields        []requestTypeFieldArg `json:"fields" jsonschema:"Full replacement list of form fields, in display order. Empty list hides every field, which breaks submission unless title_template is set."`
}

type createRequestTypeArgs struct {
	ChannelID     int    `json:"channel_id" jsonschema:"Channel (portal/form, inbound) this request type belongs to"`
	Name          string `json:"name" jsonschema:"Request type name, shown to submitters"`
	Description   string `json:"description,omitempty" jsonschema:"Optional description"`
	ItemTypeID    int    `json:"item_type_id" jsonschema:"Item type created when a submission comes in"`
	Icon          string `json:"icon,omitempty" jsonschema:"Lucide icon name (default: FileText)"`
	Color         string `json:"color,omitempty" jsonschema:"Hex color (default: #3b82f6)"`
	WorkspaceID   *int   `json:"workspace_id,omitempty" jsonschema:"Pin to one of the channel's served workspaces; defaults to the channel's first served workspace"`
	TitleTemplate string `json:"title_template,omitempty" jsonschema:"Item title template used when the title field is hidden from the form. Supports {{var}} placeholders."`
}

// channelSlugRegex mirrors internal/handlers/channels.go's unexported
// slugFormatOK check byte for byte: 3-64 chars, lowercase letters/digits,
// hyphens only internally.
var channelSlugRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$`)

func slugFormatOK(s string) bool {
	return channelSlugRegex.MatchString(s)
}

// --- registration ---

// create_channel and create_request_type mirror the cookie-session admin
// UI's POST /channels and POST /channels/{id}/request-types (see
// internal/handlers/channels.go CreateChannel and
// internal/handlers/request_types.go RequestTypeHandler.Create) by calling
// the same service/repository layer directly. Both endpoints are gated by
// admin(...)/channelMgmt(...) cookie-session middleware and are not reachable
// over a bearer token, so agents need this MCP-native path instead — same gap
// class already closed for item types and custom fields.
func init() {
	Register(Default, Tool[createChannelArgs]{
		Name:   "create_channel",
		Group:  CapabilityIssueManagement,
		Access: AccessAdmin,
		Risk:   RiskHigh,
		Description: "Create a channel (inbound portal/form intake, or webhook/smtp/imap). Portal/form channels can carry Request Types " +
			"(see create_request_type) that turn a submitted form into an item in a target workspace. Requires system admin role and the " +
			"admin:channels:write scope.",
		Scopes: []string{auth.ScopeAdminChannelsWrite},
		Run: func(ctx context.Context, env *Env, args createChannelArgs) (any, error) {
			name := strings.TrimSpace(args.Name)
			if name == "" {
				return map[string]string{"error": "name is required"}, nil
			}
			if !services.ValidChannelTypes[args.Type] {
				return map[string]string{"error": "invalid type — use smtp, webhook, email, portal, form, widget, or imap"}, nil
			}
			if !services.ValidChannelDirections[args.Direction] {
				return map[string]string{"error": "invalid direction — use inbound or outbound"}, nil
			}

			channelRepo := repository.NewChannelRepository(env.DB)
			config := map[string]any{}
			slug := strings.TrimSpace(args.Slug)
			if (args.Type == "portal" || args.Type == "form") && slug != "" {
				if !slugFormatOK(slug) {
					return map[string]string{"error": "slug must be 3-64 chars: lowercase letters, digits, or hyphens (no leading/trailing hyphen)"}, nil
				}
				inUse, err := channelRepo.SlugInUse(ctx, args.Type, slug, 0)
				if err != nil {
					return nil, err
				}
				if inUse {
					return map[string]string{"error": fmt.Sprintf("slug %q is already in use by another %s channel", slug, args.Type)}, nil
				}
				if args.Type == "portal" {
					config["portal_slug"] = slug
					config["portal_title"] = name
				} else {
					config["form_slug"] = slug
				}
			}
			configJSON, err := json.Marshal(config)
			if err != nil {
				return nil, err
			}

			channelService := services.NewChannelService(env.DB, env.PermService)
			channel, err := channelService.Create(ctx, services.ChannelCreateRequest{
				Name:        name,
				Type:        args.Type,
				Direction:   args.Direction,
				Description: args.Description,
				Config:      string(configJSON),
				CategoryID:  args.CategoryID,
			})
			if err != nil {
				if errors.Is(err, repository.ErrChannelSlugConflict) {
					return map[string]string{"error": "that public channel slug was claimed by another request; choose a different slug"}, nil
				}
				if errors.Is(err, services.ErrInvalidChannelField) {
					return map[string]string{"error": err.Error()}, nil
				}
				return nil, err
			}

			if len(args.WorkspaceIDs) > 0 && (args.Type == "portal" || args.Type == "form") {
				field := "portal_workspace_ids"
				if args.Type == "form" {
					field = "form_workspace_ids"
				}
				configUpdate := services.NewChannelConfigUpdateService(channelService, env.PermService)
				ids := make([]any, len(args.WorkspaceIDs))
				for i, id := range args.WorkspaceIDs {
					ids[i] = id
				}
				if _, err := configUpdate.Update(ctx, env.UserID, channel.ID, map[string]any{field: ids}); err != nil {
					return map[string]any{
						"channel": channel,
						"warning": fmt.Sprintf("channel created, but connecting workspaces failed: %s", err.Error()),
					}, nil
				}
				refreshed, err := channelService.GetByID(ctx, channel.ID)
				if err == nil {
					channel = refreshed
				}
			}

			return map[string]any{"channel": channel}, nil
		},
	})

	Register(Default, Tool[setChannelStatusArgs]{
		Name:   "set_channel_status",
		Group:  CapabilityIssueManagement,
		Access: AccessAdmin,
		Risk:   RiskHigh,
		Description: "Enable or disable a channel. Enabling validates the channel's stored configuration first (e.g. a portal needs at least " +
			"one served workspace) — mirrors the cookie-session admin UI's toggle. Requires system admin role and the admin:channels:write scope.",
		Scopes: []string{auth.ScopeAdminChannelsWrite},
		Run: func(ctx context.Context, env *Env, args setChannelStatusArgs) (any, error) {
			if args.Status != "enabled" && args.Status != "disabled" {
				return map[string]string{"error": "status must be enabled or disabled"}, nil
			}
			channelService := services.NewChannelService(env.DB, env.PermService)
			channel, err := channelService.GetByID(ctx, args.ChannelID)
			if err != nil {
				if errors.Is(err, repository.ErrNotFound) {
					return map[string]string{"error": "channel not found"}, nil
				}
				return nil, err
			}
			if channel == nil {
				return map[string]string{"error": "channel not found"}, nil
			}
			pluginManaged, err := channelService.IsPluginManaged(ctx, args.ChannelID)
			if err != nil {
				return nil, err
			}
			if pluginManaged {
				return map[string]string{"error": "plugin-managed channels cannot be modified"}, nil
			}

			if args.Status == "enabled" {
				configUpdate := services.NewChannelConfigUpdateService(channelService, env.PermService)
				validatedConfig, err := configUpdate.PrepareEnable(ctx, env.UserID, args.ChannelID)
				if err != nil {
					var configErr *services.ChannelConfigError
					if errors.As(err, &configErr) {
						return map[string]string{"error": configErr.Message}, nil
					}
					return nil, err
				}
				if validatedConfig != "" {
					updated, err := channelService.SetStatusIfConfigUnchanged(ctx, args.ChannelID, args.Status, validatedConfig)
					if err != nil {
						return nil, err
					}
					if !updated {
						return map[string]string{"error": "channel configuration changed while it was being enabled; try again"}, nil
					}
				} else if err := channelService.SetStatus(ctx, args.ChannelID, args.Status); err != nil {
					return nil, err
				}
			} else if err := channelService.SetStatus(ctx, args.ChannelID, args.Status); err != nil {
				return nil, err
			}

			updated, err := channelService.GetByID(ctx, args.ChannelID)
			if err != nil {
				return nil, err
			}
			return map[string]any{"channel": updated}, nil
		},
	})

	Register(Default, Tool[createRequestTypeArgs]{
		Name:   "create_request_type",
		Group:  CapabilityIssueManagement,
		Access: AccessAdmin,
		Risk:   RiskHigh,
		Description: "Create a Request Type on an inbound portal/form channel: a submittable form that creates an item of the given item " +
			"type in one of the channel's served workspaces. Requires system admin role and the admin:request-types:write scope. Fields " +
			"shown on the submitted form are the target item type's configured create-screen fields (not set by this tool).",
		Scopes: []string{auth.ScopeAdminRequestTypesWrite},
		Run: func(ctx context.Context, env *Env, args createRequestTypeArgs) (any, error) {
			name := strings.TrimSpace(args.Name)
			if name == "" {
				return map[string]string{"error": "name is required"}, nil
			}
			if args.ItemTypeID == 0 {
				return map[string]string{"error": "item_type_id is required"}, nil
			}

			itemTypeRepo := repository.NewItemTypeRepository(env.DB)
			exists, err := itemTypeRepo.Exists(args.ItemTypeID)
			if err != nil {
				return nil, err
			}
			if !exists {
				return map[string]string{"error": "item type not found"}, nil
			}

			channelService := services.NewChannelService(env.DB, env.PermService)
			channel, err := channelService.GetByID(ctx, args.ChannelID)
			if err != nil {
				if errors.Is(err, repository.ErrNotFound) {
					return map[string]string{"error": "channel not found"}, nil
				}
				return nil, err
			}
			if channel == nil || channel.Direction != "inbound" || (channel.Type != "portal" && channel.Type != "form") {
				return map[string]string{"error": "channel does not support request types — must be an inbound portal or form channel"}, nil
			}

			cfgStr, err := channelService.GetConfig(ctx, args.ChannelID)
			if err != nil {
				return nil, err
			}
			var cfg models.ChannelConfig
			if strings.TrimSpace(cfgStr) != "" {
				if err := json.Unmarshal([]byte(cfgStr), &cfg); err != nil {
					return nil, fmt.Errorf("parse channel %d config: %w", args.ChannelID, err)
				}
			}
			served := cfg.PortalWorkspaceIDs
			if channel.Type == "form" {
				served = cfg.FormWorkspaceIDs
			}

			var effectiveWorkspaceID int
			if args.WorkspaceID != nil {
				effectiveWorkspaceID = *args.WorkspaceID
			} else if len(served) > 0 {
				effectiveWorkspaceID = served[0]
			} else {
				return map[string]string{"error": "channel has no served workspace — pass workspace_ids to create_channel first, or workspace_id here"}, nil
			}
			found := false
			for _, id := range served {
				if id == effectiveWorkspaceID {
					found = true
					break
				}
			}
			if !found {
				return map[string]string{"error": "workspace is not served by this channel"}, nil
			}

			requestTypeRepo := repository.NewRequestTypeRepository(env.DB)
			allowed, err := requestTypeRepo.ItemTypeAllowedInWorkspace(effectiveWorkspaceID, args.ItemTypeID)
			if err != nil {
				return nil, err
			}
			if !allowed {
				return map[string]string{"error": "item type is not allowed in the selected workspace"}, nil
			}

			nameExists, err := requestTypeRepo.NameExistsInChannel(args.ChannelID, name, 0)
			if err != nil {
				return nil, err
			}
			if nameExists {
				return map[string]string{"error": "request type with this name already exists for this channel"}, nil
			}

			icon := args.Icon
			if icon == "" {
				icon = "FileText"
			}
			color := args.Color
			if color == "" {
				color = "#3b82f6"
			}
			maxOrder, err := requestTypeRepo.MaxDisplayOrder(args.ChannelID)
			if err != nil {
				return nil, err
			}

			rt := &models.RequestType{
				ChannelID:     args.ChannelID,
				Name:          name,
				Description:   args.Description,
				ItemTypeID:    args.ItemTypeID,
				Icon:          icon,
				Color:         color,
				DisplayOrder:  maxOrder + 1,
				IsActive:      true,
				WorkspaceID:   args.WorkspaceID,
				TitleTemplate: strings.TrimSpace(args.TitleTemplate),
			}
			id, err := requestTypeRepo.Create(rt)
			if err != nil {
				if errors.Is(err, repository.ErrDuplicateEntry) {
					return map[string]string{"error": "request type with this name already exists for this channel"}, nil
				}
				return nil, err
			}

			created, err := requestTypeRepo.GetByID(int(id))
			if err != nil {
				return nil, err
			}
			return map[string]any{"request_type": created}, nil
		},
	})

	Register(Default, Tool[updateRequestTypeFieldsArgs]{
		Name:   "update_request_type_fields",
		Group:  CapabilityIssueManagement,
		Access: AccessAdmin,
		Risk:   RiskHigh,
		Description: "Replace a request type's submittable form fields. A request type with no fields configured shows nothing to " +
			"submitters and submission fails unless title_template is set — at minimum, add a 'title' (and usually 'description') " +
			"default field. 'custom' fields must already be attached to the target item type's create screen in the routed workspace. " +
			"Requires system admin role and the admin:request-types:write scope.",
		Scopes: []string{auth.ScopeAdminRequestTypesWrite},
		Run: func(ctx context.Context, env *Env, args updateRequestTypeFieldsArgs) (any, error) {
			requestTypeRepo := repository.NewRequestTypeRepository(env.DB)
			rt, err := requestTypeRepo.GetByID(args.RequestTypeID)
			if err != nil {
				if errors.Is(err, repository.ErrNotFound) {
					return map[string]string{"error": "request type not found"}, nil
				}
				return nil, err
			}

			channelService := services.NewChannelService(env.DB, env.PermService)
			channel, err := channelService.GetByID(ctx, rt.ChannelID)
			if err != nil {
				return nil, err
			}
			workspaceID := rt.WorkspaceID
			if workspaceID == nil && channel != nil {
				cfgStr, err := channelService.GetConfig(ctx, rt.ChannelID)
				if err != nil {
					return nil, err
				}
				var cfg models.ChannelConfig
				if strings.TrimSpace(cfgStr) != "" {
					if err := json.Unmarshal([]byte(cfgStr), &cfg); err != nil {
						return nil, fmt.Errorf("parse channel %d config: %w", rt.ChannelID, err)
					}
				}
				served := cfg.PortalWorkspaceIDs
				if channel.Type == "form" {
					served = cfg.FormWorkspaceIDs
				}
				if len(served) > 0 {
					workspaceID = &served[0]
				}
			}

			allowedCustom := map[string]bool{}
			if workspaceID != nil {
				screenRepo := repository.NewScreenRepository(env.DB)
				createScreenID, err := screenRepo.GetCreateScreenID(*workspaceID, rt.ItemTypeID)
				if err != nil {
					return nil, err
				}
				if createScreenID != nil {
					screenFields, err := screenRepo.ListFields(*createScreenID)
					if err != nil {
						return nil, err
					}
					for _, f := range screenFields {
						if f.FieldType == "custom" && f.FieldIdentifier != "" {
							allowedCustom[f.FieldIdentifier] = true
						}
					}
				}
			}

			if len(args.Fields) > 40 {
				return map[string]string{"error": "a form may contain at most 40 fields"}, nil
			}
			seen := map[string]bool{}
			fields := make([]models.RequestTypeField, 0, len(args.Fields))
			for _, f := range args.Fields {
				identifier := strings.TrimSpace(f.Identifier)
				if identifier == "" {
					return map[string]string{"error": "field identifier is required"}, nil
				}
				if seen[identifier] {
					return map[string]string{"error": fmt.Sprintf("field identifier %q is duplicated", identifier)}, nil
				}
				seen[identifier] = true
				if f.Order < 0 {
					return map[string]string{"error": fmt.Sprintf("field %q has a negative order", identifier)}, nil
				}

				switch f.Type {
				case "default":
					if identifier != "title" && identifier != "description" {
						return map[string]string{"error": fmt.Sprintf("default field %q is not supported — use title or description", identifier)}, nil
					}
				case "custom":
					if !allowedCustom[identifier] {
						return map[string]string{"error": fmt.Sprintf("custom field %q is not available on the target create screen", identifier)}, nil
					}
				case "virtual":
					if f.VirtualFieldType == nil {
						return map[string]string{"error": fmt.Sprintf("virtual field %q is missing virtual_field_type", identifier)}, nil
					}
					switch strings.TrimSpace(*f.VirtualFieldType) {
					case "text", "textarea", "checkbox":
					case "select":
						if f.VirtualFieldOptions == nil || strings.TrimSpace(*f.VirtualFieldOptions) == "" {
							return map[string]string{"error": fmt.Sprintf("virtual select field %q must define virtual_field_options", identifier)}, nil
						}
						var opts []map[string]any
						if err := json.Unmarshal([]byte(*f.VirtualFieldOptions), &opts); err != nil || len(opts) == 0 {
							return map[string]string{"error": fmt.Sprintf("virtual select field %q has invalid options", identifier)}, nil
						}
					default:
						return map[string]string{"error": fmt.Sprintf("virtual field %q has unsupported virtual_field_type", identifier)}, nil
					}
				default:
					return map[string]string{"error": fmt.Sprintf("field %q has unsupported type %q — use default, custom, or virtual", identifier, f.Type)}, nil
				}

				fields = append(fields, models.RequestTypeField{
					RequestTypeID:       args.RequestTypeID,
					FieldIdentifier:     identifier,
					FieldType:           f.Type,
					DisplayOrder:        f.Order,
					IsRequired:          f.Required,
					DisplayName:         f.DisplayName,
					Description:         f.Description,
					VirtualFieldType:    f.VirtualFieldType,
					VirtualFieldOptions: f.VirtualFieldOptions,
				})
			}

			if err := requestTypeRepo.ReplaceFields(args.RequestTypeID, fields); err != nil {
				return nil, err
			}
			updated, err := requestTypeRepo.ListFields(args.RequestTypeID)
			if err != nil {
				return nil, err
			}
			return map[string]any{"fields": updated}, nil
		},
	})
}
