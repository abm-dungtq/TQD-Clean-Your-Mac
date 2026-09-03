package cmd

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/spf13/cobra"

	"buzz-notify/config"
	nostrclient "buzz-notify/nostr"
)

var flagSilent bool

var runCmd = &cobra.Command{
	Use:   "run",
	Short: "Khởi động tiến trình lắng nghe thông báo Buzz",
	Long: `Kết nối WebSocket tới Buzz Relay và liên tục nhận thông báo mới.
Cờ --silent sẽ ghi log vào file thay vì in ra màn hình console, thích hợp khi chạy nền.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Prevent concurrent daemon instances
		unlock, ok := acquireDaemonMutex()
		if !ok {
			return nil
		}
		defer unlock()

		cfg, err := config.LoadConfig()
		if err != nil {
			return err
		}

		if cfg.RelayURL == "" || cfg.PrivateKey == "" {
			return fmt.Errorf("cấu hình chưa đầy đủ. Hãy chạy 'buzz-notify config --relay <url> --key <nsec>' trước")
		}

		if flagSilent {
			// Setup file logger
			configDir, _ := config.GetConfigDir()
			logPath := filepath.Join(configDir, "daemon.log")
			logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
			if err == nil {
				log.SetOutput(logFile)
				defer logFile.Close()
			}
		}

		log.Println("🐝 Buzz Notifier bắt đầu hoạt động...")
		log.Printf("🌐 Relay: %s\n", cfg.RelayURL)
		log.Printf("👤 Pubkey: %s\n", cfg.PublicKeyNpub)

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		go func() {
			<-sigChan
			log.Println("\n🛑 Nhận tín hiệu dừng, đang ngắt kết nối...")
			cancel()
		}()

		listener := nostrclient.NewListener(cfg)
		return listener.Start(ctx)
	},
}

func init() {
	runCmd.Flags().BoolVarP(&flagSilent, "silent", "", false, "Chạy chế độ im lặng, ghi log vào daemon.log")
}
