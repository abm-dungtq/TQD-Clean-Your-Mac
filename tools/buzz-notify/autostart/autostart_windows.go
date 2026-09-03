//go:build windows

package autostart

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
)

func runHiddenCommand(name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}
	out, err := cmd.CombinedOutput()
	return string(out), err
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

// EnsureRelocated copies the running executable to %LOCALAPPDATA%\Programs\buzz-notify\
// if it's currently running from a temporary location (Downloads, Temp, etc.)
func EnsureRelocated() (string, error) {
	currentExe, err := GetCurrentExecutable()
	if err != nil {
		return "", err
	}

	localAppData := os.Getenv("LOCALAPPDATA")
	if localAppData == "" {
		home, _ := os.UserHomeDir()
		localAppData = filepath.Join(home, "AppData", "Local")
	}

	targetDir := filepath.Join(localAppData, "Programs", "buzz-notify")
	targetExe := filepath.Join(targetDir, "buzz-notify.exe")

	// If already running from the target path, no copy needed
	if strings.EqualFold(filepath.Clean(currentExe), filepath.Clean(targetExe)) {
		return targetExe, nil
	}

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return currentExe, nil // fallback to current path
	}

	if err := copyFile(currentExe, targetExe); err != nil {
		return currentExe, nil // fallback to current path
	}

	return targetExe, nil
}

func platformInstall() error {
	// Ensure binary is stored in a permanent location
	exePath, err := EnsureRelocated()
	if err != nil {
		exePath, err = GetCurrentExecutable()
		if err != nil {
			return err
		}
	}

	// Stop any existing instance of the task
	_, _ = runHiddenCommand("schtasks.exe", "/end", "/tn", TaskName)

	// Command to run on user logon
	taskRun := fmt.Sprintf("\"%s\" run --silent", exePath)

	// Create task with schtasks.exe (/f overwrites existing)
	args := []string{
		"/create",
		"/tn", TaskName,
		"/tr", taskRun,
		"/sc", "onlogon",
		"/rl", "limited",
		"/f",
	}

	out, err := runHiddenCommand("schtasks.exe", args...)
	if err != nil {
		return fmt.Errorf("lỗi tạo tác vụ Task Scheduler: %s (%w)", strings.TrimSpace(out), err)
	}

	// Trigger task execution immediately in background
	_, _ = runHiddenCommand("schtasks.exe", "/run", "/tn", TaskName)

	return nil
}

func platformUninstall() error {
	// End task if currently running
	_, _ = runHiddenCommand("schtasks.exe", "/end", "/tn", TaskName)

	args := []string{
		"/delete",
		"/tn", TaskName,
		"/f",
	}

	out, err := runHiddenCommand("schtasks.exe", args...)
	if err != nil {
		return fmt.Errorf("lỗi xóa tác vụ Task Scheduler: %s (%w)", strings.TrimSpace(out), err)
	}

	return nil
}

func platformStatus() (string, error) {
	args := []string{
		"/query",
		"/tn", TaskName,
		"/fo", "LIST",
	}

	out, err := runHiddenCommand("schtasks.exe", args...)
	if err != nil {
		return "Chưa được cài đặt chạy ngầm cùng Windows (Task Scheduler)", nil
	}

	return fmt.Sprintf("Đã đăng ký trong Task Scheduler:\n%s", strings.TrimSpace(out)), nil
}
