//go:build windows

package cmd

import (
	"log"

	"golang.org/x/sys/windows"
)

func acquireDaemonMutex() (func(), bool) {
	mutexName := windows.StringToUTF16Ptr("Global\\BuzzNotifyDaemonMutex")
	hMutex, err := windows.CreateMutex(nil, false, mutexName)
	if err != nil || windows.GetLastError() == windows.ERROR_ALREADY_EXISTS {
		if hMutex != 0 {
			_ = windows.CloseHandle(hMutex)
		}
		log.Println("[Buzz] Một tiến trình daemon Buzz Notifier khác đang hoạt động. Thoát để tránh trùng lặp.")
		return nil, false
	}

	unlock := func() {
		_ = windows.CloseHandle(hMutex)
	}
	return unlock, true
}
