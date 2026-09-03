//go:build !windows

package gui

import (
	"fmt"
	"runtime"

	"buzz-notify/config"
)

func handlePlatformBareLaunch() error {
	cfg, err := config.LoadConfig()
	if err == nil && cfg.RelayURL != "" && cfg.PrivateKey != "" {
		fmt.Printf("🐝 Buzz Notifier đang hoạt động trên %s.\n", runtime.GOOS)
		fmt.Printf("Relay: %s\n", cfg.RelayURL)
		fmt.Printf("Public Key: %s\n", cfg.PublicKeyNpub)
		fmt.Println("Dùng 'buzz-notify test' để thử thông báo, hoặc 'buzz-notify run' để chạy daemon.")
		return nil
	}

	fmt.Printf("🐝 Buzz Notifier (%s CLI Mode)\n", runtime.GOOS)
	fmt.Println("Chưa có cấu hình. Vui lòng chạy lệnh sau để thiết lập:")
	fmt.Println("  buzz-notify config --relay \"wss://your-community.communities.buzz.xyz\" --key \"nsec1...\"")
	return nil
}
