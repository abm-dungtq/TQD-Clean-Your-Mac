package nostrclient

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/nbd-wtf/go-nostr"
	"github.com/nbd-wtf/go-nostr/nip19"

	"buzz-notify/config"
	"buzz-notify/notifier"
)

// Listener manages the WebSocket connection to the Buzz relay and handles event notifications
type Listener struct {
	cfg      *config.Config
	seenIDs  map[string]time.Time
	seenMu   sync.Mutex
	OnEvent  func(evt *nostr.Event, notif notifier.Notification)
}

// NewListener creates a new Buzz relay event listener
func NewListener(cfg *config.Config) *Listener {
	return &Listener{
		cfg:     cfg,
		seenIDs: make(map[string]time.Time),
	}
}

// isDuplicate checks and records if an event has already been seen
func (l *Listener) isDuplicate(id string) bool {
	l.seenMu.Lock()
	defer l.seenMu.Unlock()

	// Clean up entries older than 2 hours
	cutoff := time.Now().Add(-2 * time.Hour)
	for k, v := range l.seenIDs {
		if v.Before(cutoff) {
			delete(l.seenIDs, k)
		}
	}

	if _, exists := l.seenIDs[id]; exists {
		return true
	}
	l.seenIDs[id] = time.Now()
	return false
}

// Start begins the listening loop with auto-reconnect
func (l *Listener) Start(ctx context.Context) error {
	backoff := 2 * time.Second
	maxBackoff := 60 * time.Second

	// Set initial since to now - 30 seconds so we don't spam historical notifications
	sinceTimestamp := nostr.Timestamp(time.Now().Add(-30 * time.Second).Unix())

	for {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		log.Printf("[Buzz] Đang kết nối tới Relay: %s ...\n", l.cfg.RelayURL)
		err := l.connectAndListen(ctx, &sinceTimestamp)
		if ctx.Err() != nil {
			return nil
		}

		if err != nil {
			log.Printf("[Buzz] Lỗi kết nối: %v. Thử lại sau %v...\n", err, backoff)
		} else {
			log.Printf("[Buzz] Mất kết nối tới Relay. Thử lại sau %v...\n", backoff)
		}

		select {
		case <-ctx.Done():
			return nil
		case <-time.After(backoff):
			backoff = backoff * 2
			if backoff > maxBackoff {
				backoff = maxBackoff
			}
		}
	}
}

func (l *Listener) connectAndListen(ctx context.Context, since *nostr.Timestamp) error {
	relay, err := nostr.RelayConnect(ctx, l.cfg.RelayURL)
	if err != nil {
		return fmt.Errorf("không thể kết nối tới relay: %w", err)
	}
	defer relay.Close()

	log.Printf("[Buzz] Kết nối thành công! Đang lắng nghe thông báo cho pubkey: %s (%s)\n",
		l.cfg.PublicKeyHex[:12]+"...", l.cfg.PublicKeyNpub[:16]+"...")

	// Wait briefly for potential AUTH challenge on connect
	time.Sleep(500 * time.Millisecond)

	// Attempt NIP-42 auth if challenge was presented
	authCtx, authCancel := context.WithTimeout(ctx, 5*time.Second)
	_ = relay.Auth(authCtx, func(evt *nostr.Event) error {
		return evt.Sign(l.cfg.PrivateKeyHex)
	})
	authCancel()

	filter := nostr.Filter{
		Tags: nostr.TagMap{
			"p": []string{l.cfg.PublicKeyHex},
		},
		Since: since,
	}

	sub, err := relay.Subscribe(ctx, nostr.Filters{filter})
	if err != nil {
		return fmt.Errorf("không thể đăng ký subscription: %w", err)
	}
	defer sub.Close()

	for {
		select {
		case <-ctx.Done():
			return nil
		case reason := <-sub.ClosedReason:
			if strings.Contains(strings.ToLower(reason), "auth") {
				log.Printf("[Buzz] Relay yêu cầu xác thực NIP-42: %s\n", reason)
				authCtx, authCancel := context.WithTimeout(ctx, 5*time.Second)
				authErr := relay.Auth(authCtx, func(evt *nostr.Event) error {
					return evt.Sign(l.cfg.PrivateKeyHex)
				})
				authCancel()
				if authErr == nil {
					log.Println("[Buzz] Xác thực NIP-42 thành công!")
					// Re-subscribe
					sub.Unsub()
					sub, err = relay.Subscribe(ctx, nostr.Filters{filter})
					if err != nil {
						return err
					}
					continue
				}
			}
			return fmt.Errorf("subscription bị đóng bởi relay: %s", reason)

		case evt, ok := <-sub.Events:
			if !ok {
				return fmt.Errorf("kênh sự kiện đã bị đóng")
			}
			if evt == nil {
				continue
			}

			// Update timestamp to avoid re-fetching on reconnect
			if evt.CreatedAt > *since {
				*since = evt.CreatedAt
			}

			// Skip events created by ourselves
			if evt.PubKey == l.cfg.PublicKeyHex {
				continue
			}

			if l.isDuplicate(evt.ID) {
				continue
			}

			l.handleEvent(evt)
		}
	}
}

func (l *Listener) handleEvent(evt *nostr.Event) {
	senderShort := evt.PubKey[:8]
	if npub, err := nip19.EncodePublicKey(evt.PubKey); err == nil {
		senderShort = npub[:12] + "..."
	}

	title := fmt.Sprintf("Buzz: Thông báo từ %s", senderShort)
	if evt.Kind == 9 {
		title = fmt.Sprintf("Buzz: Nhắc tên trong kênh (%s)", senderShort)
	} else if evt.Kind == 4 || evt.Kind == 14 {
		title = fmt.Sprintf("Buzz: Tin nhắn mới từ %s", senderShort)
	}

	body := notifier.FormatContent(evt.Content)

	notif := notifier.Notification{
		Title:   title,
		Message: body,
		URL:     l.cfg.AppURL,
		Sound:   l.cfg.Sound,
	}

	log.Printf("[🔔 THÔNG BÁO MỚI] %s | %s\n", title, body)

	if l.OnEvent != nil {
		l.OnEvent(evt, notif)
	}

	if err := notifier.Show(notif); err != nil {
		log.Printf("[Cảnh báo] Không thể hiển thị thông báo desktop: %v\n", err)
	}
}
