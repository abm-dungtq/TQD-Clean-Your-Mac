package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"buzz-notify/autostart"
)

var uninstallCmd = &cobra.Command{
	Use:   "uninstall",
	Short: "Hủy bỏ tự khởi động cùng Windows",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("🗑️  Đang gỡ bỏ tác vụ khỏi Windows Task Scheduler...")
		if err := autostart.Uninstall(); err != nil {
			return err
		}
		fmt.Println("✅ Đã gỡ bỏ tự chạy ngầm thành công!")
		return nil
	},
}
