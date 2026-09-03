//go:build windows

package winutil

import (
	"os"
	"syscall"

	"golang.org/x/sys/windows"
)

// AttachParentConsole attaches to the calling process console (CMD/PowerShell)
func AttachParentConsole() {
	kernel32 := windows.NewLazySystemDLL("kernel32.dll")
	procAttachConsole := kernel32.NewProc("AttachConsole")
	const ATTACH_PARENT_PROCESS = ^uintptr(0) // -1

	r, _, _ := procAttachConsole.Call(ATTACH_PARENT_PROCESS)
	if r != 0 {
		hout, err := syscall.GetStdHandle(syscall.STD_OUTPUT_HANDLE)
		if err == nil && hout != syscall.InvalidHandle {
			os.Stdout = os.NewFile(uintptr(hout), "/dev/stdout")
		}
		herr, err := syscall.GetStdHandle(syscall.STD_ERROR_HANDLE)
		if err == nil && herr != syscall.InvalidHandle {
			os.Stderr = os.NewFile(uintptr(herr), "/dev/stderr")
		}
	}
}
