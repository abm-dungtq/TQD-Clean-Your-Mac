package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"buzz-notify/config"
	"buzz-notify/notifier"
)

var testCmd = &cobra.Command{
	Use:   "test",
	Short: "Gửi 1 thông báo thử nghiệm để kiểm tra Windows Toast Notification",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.LoadConfig()
		appURL := "https://buzz.xyz"
		sound := true
		if err == nil {
			if cfg.AppURL != "" {
				appURL = cfg.AppURL
			}
			sound = cfg.Sound
		}

		fmt.Println("🚀 Đang gửi thông báo thử nghiệm tới desktop...")
		notif := notifier.Notification{
			Title:   "Buzz Notifier Test",
			Message: "Chúc mừng! Hệ thống thông báo Buzz trên Windows đang hoạt động hoàn hảo.",
			URL:     appURL,
			Sound:   sound,
		}

		if err := notifier.Show(notif); err != nil {
			return fmt.Errorf("lỗi khi gửi thông báo: %w", err)
		}

		fmt.Println("✅ Đã gửi thông báo thành công! Vui lòng kiểm tra góc dưới bên phải màn hình.")
		return nil
	},
}
