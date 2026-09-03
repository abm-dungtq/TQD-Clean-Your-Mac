//go:build !windows

package autostart

import (
	"fmt"
	"runtime"
)

func platformInstall() error {
	return fmt.Errorf("tính năng tự chạy ngầm tự động qua Task Scheduler chỉ hỗ trợ trên Windows (hệ điều hành hiện tại: %s)", runtime.GOOS)
}

func platformUninstall() error {
	return fmt.Errorf("tính năng chỉ hỗ trợ trên Windows (hệ điều hành hiện tại: %s)", runtime.GOOS)
}

func platformStatus() (string, error) {
	return fmt.Sprintf("Hệ điều hành hiện tại: %s. Tính năng autostart Task Scheduler chỉ khả dụng trên Windows.", runtime.GOOS), nil
}
