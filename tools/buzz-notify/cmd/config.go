package cmd

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"

	"buzz-notify/config"
)

var (
	flagRelayURL   string
	flagPrivateKey string
	flagAppURL     string
	flagSound      bool
)

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Xem hoặc cập nhật thông tin cấu hình Buzz",
	Long: `Lưu thông tin kết nối gồm Relay URL và Private Key (nsec1... hoặc hex)
vào file cấu hình an toàn trên máy cục bộ.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.LoadConfig()
		if err != nil {
			cfg = config.DefaultConfig()
		}

		updated := false

		if strings.TrimSpace(flagRelayURL) != "" {
			cfg.RelayURL = flagRelayURL
			updated = true
		}

		if strings.TrimSpace(flagPrivateKey) != "" {
			cfg.PrivateKey = flagPrivateKey
			updated = true
		}

		if strings.TrimSpace(flagAppURL) != "" {
			cfg.AppURL = flagAppURL
			updated = true
		}

		if cmd.Flags().Changed("sound") {
			cfg.Sound = flagSound
			updated = true
		}

		if updated {
			if cfg.RelayURL == "" {
				return fmt.Errorf("vui lòng cung cấp --relay URL (ví dụ: wss://your-community.communities.buzz.xyz)")
			}
			if cfg.PrivateKey == "" {
				return fmt.Errorf("vui lòng cung cấp --key (private key nsec1... hoặc hex)")
			}

			if err := config.SaveConfig(cfg); err != nil {
				return fmt.Errorf("lỗi lưu cấu hình: %w", err)
			}

			cfgPath, _ := config.GetConfigPath()
			fmt.Println("✅ Đã lưu cấu hình thành công!")
			fmt.Printf("📁 Đường dẫn file: %s\n", cfgPath)
			fmt.Printf("🌐 Relay URL:     %s\n", cfg.RelayURL)
			fmt.Printf("🔗 Web App URL:   %s\n", cfg.AppURL)
			fmt.Printf("🔑 Public Key:    %s\n", cfg.PublicKeyNpub)
			fmt.Printf("🔊 Âm thanh:      %v\n", cfg.Sound)
			fmt.Println("\n👉 Bạn có thể chạy 'buzz-notify test' để thử nghiệm thông báo, hoặc 'buzz-notify install' để tự chạy ngầm.")
			return nil
		}

		// Display current config if no flags were provided
		cfgPath, _ := config.GetConfigPath()
		fmt.Println("📋 Cấu hình hiện tại:")
		fmt.Printf("📁 File:          %s\n", cfgPath)
		if cfg.RelayURL == "" && cfg.PrivateKey == "" {
			fmt.Println("⚠️  Chưa có thông tin cấu hình.")
			fmt.Println("\nHướng dẫn sử dụng:")
			fmt.Println("  buzz-notify config --relay \"wss://your-community.communities.buzz.xyz\" --key \"nsec1...\"")
			return nil
		}
		fmt.Printf("🌐 Relay URL:     %s\n", cfg.RelayURL)
		fmt.Printf("🔗 Web App URL:   %s\n", cfg.AppURL)
		fmt.Printf("🔑 Public Key:    %s (%s)\n", cfg.PublicKeyNpub, cfg.PublicKeyHex)
		fmt.Printf("🔊 Âm thanh:      %v\n", cfg.Sound)
		return nil
	},
}

func init() {
	configCmd.Flags().StringVarP(&flagRelayURL, "relay", "r", "", "Relay WebSocket URL của Buzz (ví dụ: wss://your-community.communities.buzz.xyz)")
	configCmd.Flags().StringVarP(&flagPrivateKey, "key", "k", "", "Private key tài khoản Buzz (nsec1... hoặc hex 64 ký tự)")
	configCmd.Flags().StringVarP(&flagAppURL, "app-url", "a", "", "Web app URL khi bấm vào thông báo")
	configCmd.Flags().BoolVarP(&flagSound, "sound", "s", true, "Bật/tắt âm thanh khi có thông báo")
}
