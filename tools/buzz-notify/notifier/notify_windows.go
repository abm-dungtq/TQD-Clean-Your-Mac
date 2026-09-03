//go:build windows

package notifier

import (
	"fmt"

	"github.com/go-toast/toast"
)

func showPlatformNotification(n Notification) error {
	t := toast.Notification{
		AppID:               "Buzz",
		Title:               n.Title,
		Message:             n.Message,
		ActivationArguments: n.URL,
	}

	if n.Sound {
		t.Audio = toast.Default
	}

	if err := t.Push(); err != nil {
		return fmt.Errorf("lỗi khi hiển thị Windows Toast: %w", err)
	}

	return nil
}
