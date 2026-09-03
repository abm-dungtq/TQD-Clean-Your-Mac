//go:build !windows

package notifier

import (
	"fmt"
	"os/exec"
	"runtime"
)

func showPlatformNotification(n Notification) error {
	switch runtime.GOOS {
	case "darwin":
		// Use osascript on macOS
		script := fmt.Sprintf(`display notification %q with title %q sound name "default"`, n.Message, n.Title)
		if !n.Sound {
			script = fmt.Sprintf(`display notification %q with title %q`, n.Message, n.Title)
		}
		cmd := exec.Command("osascript", "-e", script)
		return cmd.Run()
	case "linux":
		// Use notify-send if available
		args := []string{n.Title, n.Message}
		cmd := exec.Command("notify-send", args...)
		return cmd.Run()
	default:
		// Fallback print
		fmt.Printf("\n[NOTIFICATION] %s: %s (URL: %s)\n", n.Title, n.Message, n.URL)
		return nil
	}
}
