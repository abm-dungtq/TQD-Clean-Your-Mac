package notifier

import (
	"strings"
)

// Notification represents a generic desktop notification
type Notification struct {
	Title   string
	Message string
	URL     string
	Sound   bool
}

// Show displays the notification on the current platform
func Show(n Notification) error {
	if strings.TrimSpace(n.Title) == "" {
		n.Title = "Buzz Notification"
	}
	if len(n.Message) > 280 {
		n.Message = n.Message[:277] + "..."
	}
	return showPlatformNotification(n)
}

// FormatContent formats an event content for display
func FormatContent(content string) string {
	content = strings.TrimSpace(content)
	// Replace excessive newlines
	lines := strings.Split(content, "\n")
	var cleaned []string
	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}
	res := strings.Join(cleaned, " ")
	if len(res) > 200 {
		return res[:197] + "..."
	}
	if res == "" {
		return "(Không có nội dung)"
	}
	return res
}
