package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"buzz-notify/gui"
)

var rootCmd = &cobra.Command{
	Use:   "buzz-notify",
	Short: "Buzz Notification Daemon & CLI cho Windows",
	Long: `buzz-notify là công cụ dòng lệnh chạy ngầm trên Windows giúp tự động
nhận thông báo tức thì (realtime) từ Buzz (buzz.xyz) và bắn Windows Toast Notification.`,
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() {
	// Disable Cobra mousetrap so Explorer double-click doesn't trigger help text
	cobra.MousetrapHelpText = ""

	// If launched with no arguments (double-click in Explorer or bare command),
	// automatically route to GUI setup/status window
	if len(os.Args) <= 1 {
		if err := gui.HandleBareLaunch(); err != nil {
			fmt.Fprintf(os.Stderr, "Lỗi: %v\n", err)
			os.Exit(1)
		}
		return
	}

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Lỗi: %v\n", err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.AddCommand(configCmd)
	rootCmd.AddCommand(testCmd)
	rootCmd.AddCommand(runCmd)
	rootCmd.AddCommand(installCmd)
	rootCmd.AddCommand(uninstallCmd)
	rootCmd.AddCommand(statusCmd)
}
