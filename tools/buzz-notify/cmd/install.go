package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"buzz-notify/autostart"
	"buzz-notify/config"
)

var installCmd = &cobra.Command{
	Use:   "install",
	Short: "Cài đặt tự khởi động cùng Windows (chạy ngầm silent trong Task Scheduler)",
	RunE: func(cmd *cobra.Command, args []string) error {
		// Check config first
		cfg, err := config.LoadConfig()
		if err != nil || cfg.RelayURL == "" || cfg.PrivateKey == "" {
			return fmt.Errorf("bạn chưa cấu hình Buzz. Vui lòng chạy 'buzz-notify config --relay <url> --key <nsec>' trước khi cài đặt")
		}

		fmt.Println("⚙️  Đang đăng ký tác vụ chạy ngầm vào Windows Task Scheduler...")
		if err := autostart.Install(); err != nil {
			return err
		}

		fmt.Println("🎉 Cài đặt thành công!")
		fmt.Println("📌 buzz-notify sẽ tự động chạy ngầm mỗi khi bạn đăng nhập vào Windows.")
		fmt.Println("💡 Bạn có thể kiểm tra trạng thái bất cứ lúc nào bằng lệnh: buzz-notify status")
		fmt.Println("💡 Để gỡ bỏ tự chạy ngầm, dùng lệnh: buzz-notify uninstall")
		return nil
	},
}
