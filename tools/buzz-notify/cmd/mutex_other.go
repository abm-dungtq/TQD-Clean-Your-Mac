//go:build !windows

package cmd

func acquireDaemonMutex() (func(), bool) {
	return func() {}, true
}
