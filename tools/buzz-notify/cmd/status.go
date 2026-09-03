package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"buzz-notify/autostart"
	"buzz-notify/config"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Xem thông tin cấu hình và trạng thái chạy ngầm của Buzz Notifier",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.LoadConfig()
		cfgPath, _ := config.GetConfigPath()

		fmt.Println("==================================================")
		fmt.Println("             BUZZ NOTIFIER STATUS                 ")
		fmt.Println("==================================================")
		fmt.Printf("📁 File cấu hình: %s\n", cfgPath)

		if err != nil || cfg.RelayURL == "" {
			fmt.Println("⚠️  Trạng thái cấu hình: CHƯA CẤU HÌNH (Chạy 'buzz-notify config' để thiết lập)")
		} else {
			fmt.Println("✅ Trạng thái cấu hình: ĐÃ SẴN SÀNG")
			fmt.Printf("🌐 Relay URL:        %s\n", cfg.RelayURL)
			fmt.Printf("🔗 Web App URL:      %s\n", cfg.AppURL)
			fmt.Printf("🔑 Public Key:       %s\n", cfg.PublicKeyNpub)
			fmt.Printf("🔊 Âm thanh:         %v\n", cfg.Sound)
		}

		fmt.Println("--------------------------------------------------")
		schedStatus, _ := autostart.Status()
		fmt.Println("🔄 Trạng thái Windows Autostart:")
		fmt.Println(schedStatus)
		fmt.Println("==================================================")
		return nil
	},
}
