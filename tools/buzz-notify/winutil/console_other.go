//go:build !windows

package winutil

// AttachParentConsole is a no-op on non-Windows platforms
func AttachParentConsole() {}
