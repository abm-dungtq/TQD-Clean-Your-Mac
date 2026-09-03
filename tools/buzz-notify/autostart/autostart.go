package autostart

import (
	"errors"
	"os"
)

// TaskName is the identifier used in Windows Task Scheduler
const TaskName = "BuzzNotifier"

// GetCurrentExecutable returns the absolute path of the running executable
func GetCurrentExecutable() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", errors.New("không thể xác định đường dẫn file thực thi")
	}
	return exePath, nil
}

// Install registers the application to run automatically at user logon
func Install() error {
	return platformInstall()
}

// Uninstall removes the autostart registration
func Uninstall() error {
	return platformUninstall()
}

// Status checks the current autostart status
func Status() (string, error) {
	return platformStatus()
}
