package config

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/nbd-wtf/go-nostr"
	"github.com/nbd-wtf/go-nostr/nip19"
)

// Config represents the application configuration
type Config struct {
	RelayURL      string `json:"relay_url"`
	PrivateKey    string `json:"private_key"`     // Stored as provided (nsec or hex)
	PrivateKeyHex string `json:"private_key_hex"` // Derived 64-char hex
	PublicKeyHex  string `json:"public_key_hex"`  // Derived 64-char hex
	PublicKeyNpub string `json:"public_key_npub"` // Derived npub1...
	AppURL        string `json:"app_url"`         // Web application URL for clicking notification
	Sound         bool   `json:"sound"`           // Enable sound for notification
}

// DefaultConfig returns default settings
func DefaultConfig() *Config {
	return &Config{
		RelayURL: "",
		Sound:    true,
	}
}

// NormalizeRelayURL converts http(s) URL to ws(s) and cleans trailing slashes
func NormalizeRelayURL(urlStr string) string {
	urlStr = strings.TrimSpace(urlStr)
	urlStr = strings.TrimRight(urlStr, "/")

	if strings.HasPrefix(urlStr, "http://") {
		urlStr = "ws://" + strings.TrimPrefix(urlStr, "http://")
	} else if strings.HasPrefix(urlStr, "https://") {
		urlStr = "wss://" + strings.TrimPrefix(urlStr, "https://")
	} else if !strings.HasPrefix(urlStr, "ws://") && !strings.HasPrefix(urlStr, "wss://") {
		urlStr = "wss://" + urlStr
	}
	return urlStr
}

// DeriveAppURL infers web URL from relay URL (e.g. wss://abc -> https://abc)
func DeriveAppURL(relayURL string) string {
	relayURL = strings.TrimSpace(relayURL)
	if strings.HasPrefix(relayURL, "wss://") {
		return "https://" + strings.TrimPrefix(relayURL, "wss://")
	}
	if strings.HasPrefix(relayURL, "ws://") {
		return "http://" + strings.TrimPrefix(relayURL, "ws://")
	}
	return relayURL
}

// ProcessKeys parses and validates private key, populating private_key_hex, public_key_hex, and public_key_npub
func (c *Config) ProcessKeys() error {
	pk := strings.TrimSpace(c.PrivateKey)
	if pk == "" {
		return fmt.Errorf("private key cannot be empty")
	}

	var skHex string
	if strings.HasPrefix(pk, "nsec1") {
		prefix, val, err := nip19.Decode(pk)
		if err != nil {
			return fmt.Errorf("invalid nsec private key: %w", err)
		}
		if prefix != "nsec" {
			return fmt.Errorf("expected nsec prefix, got: %s", prefix)
		}
		var ok bool
		skHex, ok = val.(string)
		if !ok {
			return fmt.Errorf("failed to extract hex from nsec")
		}
	} else {
		// Treat as hex
		cleaned := strings.ToLower(pk)
		if len(cleaned) != 64 {
			return fmt.Errorf("hex private key must be exactly 64 hex characters (got %d)", len(cleaned))
		}
		if _, err := hex.DecodeString(cleaned); err != nil {
			return fmt.Errorf("invalid hex private key: %w", err)
		}
		skHex = cleaned
	}

	pubKeyHex, err := nostr.GetPublicKey(skHex)
	if err != nil {
		return fmt.Errorf("failed to derive public key from private key: %w", err)
	}

	pubKeyNpub, err := nip19.EncodePublicKey(pubKeyHex)
	if err != nil {
		return fmt.Errorf("failed to encode npub: %w", err)
	}

	c.PrivateKeyHex = skHex
	c.PublicKeyHex = pubKeyHex
	c.PublicKeyNpub = pubKeyNpub

	return nil
}

// GetConfigDir returns the directory path for buzz-notify configuration
func GetConfigDir() (string, error) {
	// If local config exists in current working directory, use it
	if _, err := os.Stat("config.json"); err == nil {
		cwd, err := os.Getwd()
		if err == nil {
			return cwd, nil
		}
	}

	var baseDir string
	if runtime.GOOS == "windows" {
		baseDir = os.Getenv("APPDATA")
		if baseDir == "" {
			home, _ := os.UserHomeDir()
			baseDir = filepath.Join(home, "AppData", "Roaming")
		}
	} else {
		home, _ := os.UserHomeDir()
		baseDir = filepath.Join(home, ".config")
	}

	configDir := filepath.Join(baseDir, "buzz-notify")
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return "", fmt.Errorf("failed to create config directory %s: %w", configDir, err)
	}
	return configDir, nil
}

// GetConfigPath returns the absolute path to config.json
func GetConfigPath() (string, error) {
	dir, err := GetConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.json"), nil
}

// LoadConfig reads config from config.json
func LoadConfig() (*Config, error) {
	path, err := GetConfigPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("chưa có file cấu hình. Vui lòng chạy 'buzz-notify config' trước")
		}
		return nil, fmt.Errorf("không thể đọc file cấu hình tại %s: %w", path, err)
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("file cấu hình không hợp lệ: %w", err)
	}

	if cfg.PrivateKey != "" {
		if err := cfg.ProcessKeys(); err != nil {
			return nil, fmt.Errorf("lỗi xử lý khóa: %w", err)
		}
	}

	return &cfg, nil
}

// SaveConfig writes config to config.json
func SaveConfig(cfg *Config) error {
	if err := cfg.ProcessKeys(); err != nil {
		return err
	}

	cfg.RelayURL = NormalizeRelayURL(cfg.RelayURL)
	if cfg.AppURL == "" {
		cfg.AppURL = DeriveAppURL(cfg.RelayURL)
	}

	path, err := GetConfigPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to serialize config: %w", err)
	}

	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("failed to write config to %s: %w", path, err)
	}

	return nil
}
