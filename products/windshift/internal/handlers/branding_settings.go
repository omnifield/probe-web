package handlers

import (
	"windshift/internal/logger"
	"windshift/internal/repository"
	"windshift/internal/sanitize"

	"net/http"
)

// BrandingSettingsHandler owns the sidebar's top-left brand block: an
// instance name plus a colorful emoji flanking it on each side (no logo
// image, no icon component — the same plain-Unicode-glyph style already
// used across this repo's own README/FAQ docs). One instance per repo is
// expected to set its own name/icons here instead of forking the sidebar.
type BrandingSettingsHandler struct {
	settings *repository.SystemSettingRepository
	auditor  *logger.Auditor
}

func NewBrandingSettingsHandler(settings *repository.SystemSettingRepository, auditor *logger.Auditor) *BrandingSettingsHandler {
	return &BrandingSettingsHandler{settings: settings, auditor: auditor}
}

// BrandingSettings is read by every authenticated user (it drives the
// sidebar) but written by admins only — see routes/admin.go.
type BrandingSettings struct {
	InstanceName string `json:"instance_name"`
	IconBefore   string `json:"icon_before"`
	IconAfter    string `json:"icon_after"`
}

// GetBrandingSettings handles GET /branding-settings.
func (h *BrandingSettingsHandler) GetBrandingSettings(w http.ResponseWriter, r *http.Request) {
	settings := BrandingSettings{InstanceName: "Windshift"}
	if v, ok, _ := h.settings.GetValue("branding_instance_name"); ok && v != "" {
		settings.InstanceName = v
	}
	if v, ok, _ := h.settings.GetValue("branding_icon_before"); ok {
		settings.IconBefore = v
	}
	if v, ok, _ := h.settings.GetValue("branding_icon_after"); ok {
		settings.IconAfter = v
	}
	respondJSONOK(w, settings)
}

// UpdateBrandingSettings handles PUT /admin/branding-settings.
func (h *BrandingSettingsHandler) UpdateBrandingSettings(w http.ResponseWriter, r *http.Request) {
	user, ok := RequireAuth(w, r)
	if !ok {
		return
	}

	settings, ok := decodeJSON[BrandingSettings](w, r)
	if !ok {
		return
	}
	sanitize.Apply(&settings.InstanceName, sanitize.PlainTextField)
	sanitize.Apply(&settings.IconBefore, sanitize.ShortIdentifier)
	sanitize.Apply(&settings.IconAfter, sanitize.ShortIdentifier)

	if err := h.settings.Upsert(
		"branding_instance_name", settings.InstanceName,
		"string", "Sidebar brand name shown next to the logo icons", "branding",
	); err != nil {
		respondInternalError(w, r, err)
		return
	}
	if err := h.settings.Upsert(
		"branding_icon_before", settings.IconBefore,
		"string", "Emoji shown before the sidebar brand name", "branding",
	); err != nil {
		respondInternalError(w, r, err)
		return
	}
	if err := h.settings.Upsert(
		"branding_icon_after", settings.IconAfter,
		"string", "Emoji shown after the sidebar brand name", "branding",
	); err != nil {
		respondInternalError(w, r, err)
		return
	}

	h.auditor.Log(r, user, "branding_settings.update", "system_setting", nil, "branding")
	respondJSONOK(w, settings)
}
