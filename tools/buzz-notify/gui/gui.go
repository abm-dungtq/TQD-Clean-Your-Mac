package gui

// SetupResult contains user input from the setup dialog
type SetupResult struct {
	RelayURL   string
	PrivateKey string
	Sound      bool
	Submitted  bool
}

// HandleBareLaunch handles the application launch when no CLI arguments are provided
func HandleBareLaunch() error {
	return handlePlatformBareLaunch()
}
