package config

import (
	"testing"
)

func TestNormalizeRelayURL(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"https://mycommunity.communities.buzz.xyz", "wss://mycommunity.communities.buzz.xyz"},
		{"http://localhost:3000/", "ws://localhost:3000"},
		{"wss://myrelay.com/", "wss://myrelay.com"},
		{"myrelay.com", "wss://myrelay.com"},
	}

	for _, tt := range tests {
		got := NormalizeRelayURL(tt.input)
		if got != tt.expected {
			t.Errorf("NormalizeRelayURL(%q) = %q; want %q", tt.input, got, tt.expected)
		}
	}
}

func TestProcessKeys(t *testing.T) {
	// A known valid hex private key
	hexKey := "0000000000000000000000000000000000000000000000000000000000000001"
	cfg := &Config{
		PrivateKey: hexKey,
	}

	if err := cfg.ProcessKeys(); err != nil {
		t.Fatalf("ProcessKeys failed: %v", err)
	}

	if cfg.PublicKeyHex == "" {
		t.Errorf("expected PublicKeyHex to be populated")
	}
	if cfg.PublicKeyNpub == "" {
		t.Errorf("expected PublicKeyNpub to be populated")
	}
}
