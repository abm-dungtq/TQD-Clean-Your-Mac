package main

import (
	"os"

	"buzz-notify/cmd"
	"buzz-notify/winutil"
)

func main() {
	if len(os.Args) > 1 {
		winutil.AttachParentConsole()
	}
	cmd.Execute()
}
