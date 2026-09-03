//go:build windows

package gui

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"strings"
	"syscall"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"

	"buzz-notify/autostart"
	"buzz-notify/config"
	"buzz-notify/notifier"
)

var (
	user32   = windows.NewLazySystemDLL("user32.dll")
	kernel32 = windows.NewLazySystemDLL("kernel32.dll")
	gdi32    = windows.NewLazySystemDLL("gdi32.dll")

	procCreateWindowExW               = user32.NewProc("CreateWindowExW")
	procDefWindowProcW                = user32.NewProc("DefWindowProcW")
	procDestroyWindow                 = user32.NewProc("DestroyWindow")
	procDispatchMessageW              = user32.NewProc("DispatchMessageW")
	procGetMessageW                   = user32.NewProc("GetMessageW")
	procGetWindowTextW                = user32.NewProc("GetWindowTextW")
	procGetWindowTextLengthW          = user32.NewProc("GetWindowTextLengthW")
	procMessageBoxW                   = user32.NewProc("MessageBoxW")
	procPostQuitMessage               = user32.NewProc("PostQuitMessage")
	procRegisterClassExW              = user32.NewProc("RegisterClassExW")
	procSendMessageW                  = user32.NewProc("SendMessageW")
	procSetWindowTextW                = user32.NewProc("SetWindowTextW")
	procShowWindow                    = user32.NewProc("ShowWindow")
	procUpdateWindow                  = user32.NewProc("UpdateWindow")
	procSetFocus                      = user32.NewProc("SetFocus")
	procGetSystemMetrics              = user32.NewProc("GetSystemMetrics")
	procSetProcessDpiAwarenessContext = user32.NewProc("SetProcessDpiAwarenessContext")
	procInvalidateRect                = user32.NewProc("InvalidateRect")

	procCreateFontW    = gdi32.NewProc("CreateFontW")
	procGetStockObject = gdi32.NewProc("GetStockObject")
)

const (
	WS_OVERLAPPED   = 0x00000000
	WS_CAPTION      = 0x00C00000
	WS_SYSMENU      = 0x00080000
	WS_MINIMIZEBOX  = 0x00020000
	WS_VISIBLE      = 0x10000000
	WS_CHILD        = 0x40000000
	WS_TABSTOP      = 0x00010000
	WS_EX_CLIENTEDGE = 0x00000200

	ES_AUTOHSCROLL  = 0x0080
	ES_PASSWORD     = 0x0020
	SS_LEFT         = 0x0000
	BS_DEFPUSHBUTTON = 0x0001
	BS_PUSHBUTTON   = 0x0000
	BS_AUTOCHECKBOX = 0x0003

	WM_DESTROY = 0x0002
	WM_CLOSE   = 0x0010
	WM_COMMAND = 0x0111
	WM_SETFONT = 0x0030

	BM_GETCHECK        = 0x00F0
	BM_SETCHECK        = 0x00F1
	EM_SETPASSWORDCHAR = 0x00CC

	BST_CHECKED   = 1
	BST_UNCHECKED = 0

	MB_OK          = 0x00000000
	MB_OKCANCEL    = 0x00000001
	MB_YESNO       = 0x00000004
	MB_ICONWARNING = 0x00000030
	MB_ICONINFO    = 0x00000040
	MB_ICONQUESTION = 0x00000020
	IDYES          = 6

	SW_SHOW = 5

	COLOR_WINDOW = 5
	DEFAULT_GUI_FONT = 17

	DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = ^uintptr(3) // -4
)

type WNDCLASSEXW struct {
	CbSize        uint32
	Style         uint32
	LpfnWndProc   uintptr
	CbClsExtra    int32
	CbWndExtra    int32
	HInstance     windows.Handle
	HIcon         windows.Handle
	HCursor       windows.Handle
	HbrBackground windows.Handle
	LpszMenuName  *uint16
	LpszClassName *uint16
	HIconSm       windows.Handle
}

type MSG struct {
	Hwnd     windows.Handle
	Message  uint32
	WParam   uintptr
	LParam   uintptr
	Time     uint32
	Pt       struct{ X, Y int32 }
	LPrivate uint32
}

const (
	ID_RELAY_INPUT = 101
	ID_KEY_INPUT   = 102
	ID_SHOW_KEY    = 103
	ID_SOUND       = 104
	ID_SAVE_BTN    = 105
	ID_CANCEL_BTN  = 106
	ID_TEST_BTN    = 107
	ID_RECONFIG    = 108
	ID_RESTART_BTN = 109
)

func msgBox(hwnd windows.Handle, text, title string, uType uint32) int {
	tPtr, _ := windows.UTF16PtrFromString(text)
	cPtr, _ := windows.UTF16PtrFromString(title)
	ret, _, _ := procMessageBoxW.Call(uintptr(hwnd), uintptr(unsafe.Pointer(tPtr)), uintptr(unsafe.Pointer(cPtr)), uintptr(uType))
	return int(ret)
}

func getControlText(hCtrl windows.Handle) string {
	lenVal, _, _ := procGetWindowTextLengthW.Call(uintptr(hCtrl))
	if lenVal == 0 {
		return ""
	}
	buf := make([]uint16, lenVal+1)
	procGetWindowTextW.Call(uintptr(hCtrl), uintptr(unsafe.Pointer(&buf[0])), uintptr(lenVal+1))
	return windows.UTF16ToString(buf)
}

func preflightCheckRelay(relayURL string) error {
	u, err := url.Parse(relayURL)
	if err != nil {
		return fmt.Errorf("URL không hợp lệ: %w", err)
	}

	host := u.Host
	if !strings.Contains(host, ":") {
		if u.Scheme == "wss" || u.Scheme == "https" {
			host += ":443"
		} else {
			host += ":80"
		}
	}

	d := net.Dialer{Timeout: 3 * time.Second}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	conn, err := d.DialContext(ctx, "tcp", host)
	if err != nil {
		return fmt.Errorf("không thể kết nối TCP tới %s: %w", host, err)
	}
	_ = conn.Close()
	return nil
}

func handlePlatformBareLaunch() error {
	// Enable modern Per-Monitor V2 DPI awareness if supported
	_, _, _ = procSetProcessDpiAwarenessContext.Call(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2)

	cfg, err := config.LoadConfig()
	if err == nil && cfg.RelayURL != "" && cfg.PrivateKey != "" {
		// Already configured: show status & manager dialog
		showStatusWindow(cfg)
		return nil
	}

	// Not configured yet: show initial setup dialog
	showSetupWindow(cfg)
	return nil
}

// Global handles for setup window
var (
	hwndMainSetup windows.Handle
	hwndRelay     windows.Handle
	hwndKey       windows.Handle
	hwndShowKey   windows.Handle
	hwndSound     windows.Handle
	hFontSegoe    windows.Handle
)

func setupWndProc(hwnd windows.Handle, msg uint32, wParam, lParam uintptr) uintptr {
	switch msg {
	case WM_COMMAND:
		ctrlID := int(wParam & 0xFFFF)
		switch ctrlID {
		case ID_SHOW_KEY:
			checkState, _, _ := procSendMessageW.Call(uintptr(hwndShowKey), BM_GETCHECK, 0, 0)
			if checkState == BST_CHECKED {
				procSendMessageW.Call(uintptr(hwndKey), EM_SETPASSWORDCHAR, 0, 0)
			} else {
				procSendMessageW.Call(uintptr(hwndKey), EM_SETPASSWORDCHAR, uintptr(0x25CF), 0)
			}
			procInvalidateRect.Call(uintptr(hwndKey), 0, 1)

		case ID_SAVE_BTN:
			relayStr := strings.TrimSpace(getControlText(hwndRelay))
			keyStr := strings.TrimSpace(getControlText(hwndKey))
			soundCheck, _, _ := procSendMessageW.Call(uintptr(hwndSound), BM_GETCHECK, 0, 0)
			soundVal := (soundCheck == BST_CHECKED)

			if relayStr == "" {
				msgBox(hwnd, "Vui lòng nhập Relay WebSocket URL của Buzz!", "Thiếu thông tin", MB_OK|MB_ICONWARNING)
				procSetFocus.Call(uintptr(hwndRelay))
				return 0
			}
			if keyStr == "" {
				msgBox(hwnd, "Vui lòng nhập Private Key (nsec hoặc hex) của bạn!", "Thiếu thông tin", MB_OK|MB_ICONWARNING)
				procSetFocus.Call(uintptr(hwndKey))
				return 0
			}

			normalizedRelay := config.NormalizeRelayURL(relayStr)

			tempCfg := &config.Config{
				RelayURL:   normalizedRelay,
				PrivateKey: keyStr,
				Sound:      soundVal,
			}

			if err := tempCfg.ProcessKeys(); err != nil {
				msgBox(hwnd, fmt.Sprintf("Khóa bí mật không hợp lệ:\n%v\n\nVui lòng kiểm tra lại nsec1... hoặc 64 ký tự hex.", err), "Lỗi khóa", MB_OK|MB_ICONWARNING)
				procSetFocus.Call(uintptr(hwndKey))
				return 0
			}

			// Pre-flight test WebSocket connectivity
			if err := preflightCheckRelay(normalizedRelay); err != nil {
				promptMsg := fmt.Sprintf("Không thể kết nối thử nghiệm tới Relay URL:\n%v\n\nBạn có muốn tiếp tục lưu và kích hoạt chạy ngầm không?", err)
				ans := msgBox(hwnd, promptMsg, "Cảnh báo kết nối", MB_YESNO|MB_ICONQUESTION)
				if ans != IDYES {
					return 0
				}
			}

			// 1. Save config
			if err := config.SaveConfig(tempCfg); err != nil {
				msgBox(hwnd, fmt.Sprintf("Lỗi khi lưu file cấu hình: %v", err), "Lỗi", MB_OK|MB_ICONWARNING)
				return 0
			}

			// 2. Self-relocate & register Task Scheduler
			if err := autostart.Install(); err != nil {
				msgBox(hwnd, fmt.Sprintf("Đã lưu cấu hình, nhưng gặp lỗi kích hoạt Task Scheduler:\n%v", err), "Cảnh báo Autostart", MB_OK|MB_ICONWARNING)
			} else {
				// 3. Trigger immediate welcome toast
				_ = notifier.Show(notifier.Notification{
					Title:   "Buzz Notifier",
					Message: "🎉 Đã kích hoạt tự động chạy ngầm thành công!",
					URL:     tempCfg.AppURL,
					Sound:   tempCfg.Sound,
				})

				msgBox(hwnd, "Cài đặt thành công!\n\nBuzz Notifier đã được kích hoạt và đang chạy ngầm trong hệ thống của bạn.", "Thành công", MB_OK|MB_ICONINFO)
			}

			procDestroyWindow.Call(uintptr(hwnd))
			procPostQuitMessage.Call(0)
			return 0

		case ID_CANCEL_BTN:
			procDestroyWindow.Call(uintptr(hwnd))
			procPostQuitMessage.Call(0)
			return 0
		}

	case WM_CLOSE:
		procDestroyWindow.Call(uintptr(hwnd))
		procPostQuitMessage.Call(0)
		return 0

	case WM_DESTROY:
		procPostQuitMessage.Call(0)
		return 0
	}

	ret, _, _ := procDefWindowProcW.Call(uintptr(hwnd), uintptr(msg), wParam, lParam)
	return ret
}

func showSetupWindow(existingCfg *config.Config) {
	className, _ := windows.UTF16PtrFromString("BuzzNotifySetupWndClass")
	hInstance := windows.Handle(0)

	var wc WNDCLASSEXW
	wc.CbSize = uint32(unsafe.Sizeof(wc))
	wc.LpfnWndProc = syscall.NewCallback(setupWndProc)
	wc.HInstance = hInstance
	wc.HbrBackground = windows.Handle(COLOR_WINDOW + 1)
	wc.LpszClassName = className
	procRegisterClassExW.Call(uintptr(unsafe.Pointer(&wc)))

	winWidth := int32(460)
	winHeight := int32(310)

	scrW, _, _ := procGetSystemMetrics.Call(0)
	scrH, _, _ := procGetSystemMetrics.Call(1)
	posX := (int32(scrW) - winWidth) / 2
	posY := (int32(scrH) - winHeight) / 2

	wTitle, _ := windows.UTF16PtrFromString("Buzz Notifier - Cấu hình lần đầu")
	wHwnd, _, _ := procCreateWindowExW.Call(
		0,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(wTitle)),
		WS_OVERLAPPED|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX|WS_VISIBLE,
		uintptr(posX), uintptr(posY),
		uintptr(winWidth), uintptr(winHeight),
		0, 0, uintptr(hInstance), 0,
	)
	hwndMainSetup = windows.Handle(wHwnd)

	// Create Segoe UI font (15px height, modern)
	fontName, _ := windows.UTF16PtrFromString("Segoe UI")
	fHwnd, _, _ := procCreateFontW.Call(
		16, 0, 0, 0, 400, 0, 0, 0, 1, 0, 0, 2, 0, uintptr(unsafe.Pointer(fontName)),
	)
	hFontSegoe = windows.Handle(fHwnd)

	// Header Label
	createStatic(hwndMainSetup, "🐝 Cấu hình Buzz Notifier (buzz.xyz)", 20, 15, 400, 22, true)

	// Relay URL Label & Edit
	createStatic(hwndMainSetup, "Relay WebSocket URL:", 20, 48, 400, 18, false)
	initialRelay := "wss://communities.buzz.xyz"
	if existingCfg != nil && existingCfg.RelayURL != "" {
		initialRelay = existingCfg.RelayURL
	}
	hwndRelay = createEdit(hwndMainSetup, initialRelay, 20, 68, 404, 26, false, ID_RELAY_INPUT)

	// Key Label & Edit
	createStatic(hwndMainSetup, "Private Key (nsec1... hoặc 64 ký tự hex):", 20, 104, 400, 18, false)
	initialKey := ""
	if existingCfg != nil && existingCfg.PrivateKey != "" {
		initialKey = existingCfg.PrivateKey
	}
	hwndKey = createEdit(hwndMainSetup, initialKey, 20, 124, 404, 26, true, ID_KEY_INPUT)

	// Checkboxes
	hwndShowKey = createButton(hwndMainSetup, "Hiện khóa", 20, 158, 100, 20, BS_AUTOCHECKBOX, ID_SHOW_KEY)
	hwndSound = createButton(hwndMainSetup, "Bật âm thanh khi có thông báo", 140, 158, 280, 20, BS_AUTOCHECKBOX, ID_SOUND)
	procSendMessageW.Call(uintptr(hwndSound), BM_SETCHECK, BST_CHECKED, 0)

	// Action Buttons
	createButton(hwndMainSetup, "Lưu & Kích hoạt chạy ngầm", 20, 198, 250, 36, BS_DEFPUSHBUTTON, ID_SAVE_BTN)
	createButton(hwndMainSetup, "Hủy", 284, 198, 140, 36, BS_PUSHBUTTON, ID_CANCEL_BTN)

	procShowWindow.Call(uintptr(hwndMainSetup), SW_SHOW)
	procUpdateWindow.Call(uintptr(hwndMainSetup))

	// Message Loop
	var m MSG
	for {
		r, _, _ := procGetMessageW.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if int32(r) <= 0 {
			break
		}
		procTranslateMessage := user32.NewProc("TranslateMessage")
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		procDispatchMessageW.Call(uintptr(unsafe.Pointer(&m)))
	}
}

// -------------------------------------------------------------
// STATUS & MANAGER WINDOW (Already configured double-click)
// -------------------------------------------------------------

var (
	hwndMainStatus windows.Handle
	savedCfgRef    *config.Config
)

func statusWndProc(hwnd windows.Handle, msg uint32, wParam, lParam uintptr) uintptr {
	switch msg {
	case WM_COMMAND:
		ctrlID := int(wParam & 0xFFFF)
		switch ctrlID {
		case ID_TEST_BTN:
			_ = notifier.Show(notifier.Notification{
				Title:   "Buzz Notifier Test",
				Message: "Hệ thống thông báo Buzz đang hoạt động bình thường!",
				URL:     savedCfgRef.AppURL,
				Sound:   savedCfgRef.Sound,
			})
			msgBox(hwnd, "Đã gửi thông báo test thành công!", "Thông báo", MB_OK|MB_ICONINFO)

		case ID_RECONFIG:
			procDestroyWindow.Call(uintptr(hwnd))
			showSetupWindow(savedCfgRef)
			return 0

		case ID_RESTART_BTN:
			if err := autostart.Install(); err != nil {
				msgBox(hwnd, fmt.Sprintf("Lỗi khởi động lại dịch vụ: %v", err), "Lỗi", MB_OK|MB_ICONWARNING)
			} else {
				msgBox(hwnd, "Đã khởi động lại dịch vụ chạy ngầm thành công!", "Thành công", MB_OK|MB_ICONINFO)
			}

		case ID_CANCEL_BTN:
			procDestroyWindow.Call(uintptr(hwnd))
			procPostQuitMessage.Call(0)
			return 0
		}

	case WM_CLOSE:
		procDestroyWindow.Call(uintptr(hwnd))
		procPostQuitMessage.Call(0)
		return 0

	case WM_DESTROY:
		procPostQuitMessage.Call(0)
		return 0
	}

	ret, _, _ := procDefWindowProcW.Call(uintptr(hwnd), uintptr(msg), wParam, lParam)
	return ret
}

func showStatusWindow(cfg *config.Config) {
	savedCfgRef = cfg
	className, _ := windows.UTF16PtrFromString("BuzzNotifyStatusWndClass")
	hInstance := windows.Handle(0)

	var wc WNDCLASSEXW
	wc.CbSize = uint32(unsafe.Sizeof(wc))
	wc.LpfnWndProc = syscall.NewCallback(statusWndProc)
	wc.HInstance = hInstance
	wc.HbrBackground = windows.Handle(COLOR_WINDOW + 1)
	wc.LpszClassName = className
	procRegisterClassExW.Call(uintptr(unsafe.Pointer(&wc)))

	winWidth := int32(460)
	winHeight := int32(290)

	scrW, _, _ := procGetSystemMetrics.Call(0)
	scrH, _, _ := procGetSystemMetrics.Call(1)
	posX := (int32(scrW) - winWidth) / 2
	posY := (int32(scrH) - winHeight) / 2

	wTitle, _ := windows.UTF16PtrFromString("Buzz Notifier - Quản lý trạng thái")
	wHwnd, _, _ := procCreateWindowExW.Call(
		0,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(wTitle)),
		WS_OVERLAPPED|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX|WS_VISIBLE,
		uintptr(posX), uintptr(posY),
		uintptr(winWidth), uintptr(winHeight),
		0, 0, uintptr(hInstance), 0,
	)
	hwndMainStatus = windows.Handle(wHwnd)

	fontName, _ := windows.UTF16PtrFromString("Segoe UI")
	fHwnd, _, _ := procCreateFontW.Call(16, 0, 0, 0, 400, 0, 0, 0, 1, 0, 0, 2, 0, uintptr(unsafe.Pointer(fontName)))
	hFontSegoe = windows.Handle(fHwnd)

	// Status Labels
	createStatic(hwndMainStatus, "🐝 Buzz Notifier đang hoạt động", 20, 15, 400, 22, true)

	relayInfo := fmt.Sprintf("🌐 Relay: %s", cfg.RelayURL)
	createStatic(hwndMainStatus, relayInfo, 20, 48, 410, 18, false)

	npubShort := cfg.PublicKeyNpub
	if len(npubShort) > 24 {
		npubShort = npubShort[:16] + "..." + npubShort[len(npubShort)-8:]
	}
	pubInfo := fmt.Sprintf("👤 Tài khoản: %s", npubShort)
	createStatic(hwndMainStatus, pubInfo, 20, 72, 410, 18, false)

	createStatic(hwndMainStatus, "🔄 Trạng thái: Đang tự chạy ngầm (Task Scheduler)", 20, 96, 410, 18, false)

	// Action Buttons
	createButton(hwndMainStatus, "Bắn thử thông báo (Test)", 20, 136, 195, 34, BS_PUSHBUTTON, ID_TEST_BTN)
	createButton(hwndMainStatus, "Khởi động lại dịch vụ", 225, 136, 195, 34, BS_PUSHBUTTON, ID_RESTART_BTN)
	createButton(hwndMainStatus, "Cấu hình lại", 20, 180, 195, 34, BS_PUSHBUTTON, ID_RECONFIG)
	createButton(hwndMainStatus, "Đóng", 225, 180, 195, 34, BS_DEFPUSHBUTTON, ID_CANCEL_BTN)

	procShowWindow.Call(uintptr(hwndMainStatus), SW_SHOW)
	procUpdateWindow.Call(uintptr(hwndMainStatus))

	var m MSG
	for {
		r, _, _ := procGetMessageW.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if int32(r) <= 0 {
			break
		}
		procTranslateMessage := user32.NewProc("TranslateMessage")
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		procDispatchMessageW.Call(uintptr(unsafe.Pointer(&m)))
	}
}

// -------------------------------------------------------------
// CONTROL CREATION HELPERS
// -------------------------------------------------------------

func createStatic(parent windows.Handle, text string, x, y, w, h int32, bold bool) windows.Handle {
	tPtr, _ := windows.UTF16PtrFromString(text)
	cPtr, _ := windows.UTF16PtrFromString("STATIC")
	ret, _, _ := procCreateWindowExW.Call(
		0,
		uintptr(unsafe.Pointer(cPtr)),
		uintptr(unsafe.Pointer(tPtr)),
		WS_CHILD|WS_VISIBLE|SS_LEFT,
		uintptr(x), uintptr(y), uintptr(w), uintptr(h),
		uintptr(parent), 0, 0, 0,
	)
	hCtrl := windows.Handle(ret)

	if bold {
		fontName, _ := windows.UTF16PtrFromString("Segoe UI")
		fBold, _, _ := procCreateFontW.Call(18, 0, 0, 0, 700, 0, 0, 0, 1, 0, 0, 2, 0, uintptr(unsafe.Pointer(fontName)))
		procSendMessageW.Call(uintptr(hCtrl), WM_SETFONT, fBold, 1)
	} else if hFontSegoe != 0 {
		procSendMessageW.Call(uintptr(hCtrl), WM_SETFONT, uintptr(hFontSegoe), 1)
	}
	return hCtrl
}

func createEdit(parent windows.Handle, text string, x, y, w, h int32, isPassword bool, id int) windows.Handle {
	tPtr, _ := windows.UTF16PtrFromString(text)
	cPtr, _ := windows.UTF16PtrFromString("EDIT")

	style := WS_CHILD | WS_VISIBLE | WS_TABSTOP | ES_AUTOHSCROLL
	if isPassword {
		style |= ES_PASSWORD
	}

	ret, _, _ := procCreateWindowExW.Call(
		WS_EX_CLIENTEDGE,
		uintptr(unsafe.Pointer(cPtr)),
		uintptr(unsafe.Pointer(tPtr)),
		uintptr(style),
		uintptr(x), uintptr(y), uintptr(w), uintptr(h),
		uintptr(parent), uintptr(id), 0, 0,
	)
	hCtrl := windows.Handle(ret)
	if hFontSegoe != 0 {
		procSendMessageW.Call(uintptr(hCtrl), WM_SETFONT, uintptr(hFontSegoe), 1)
	}
	return hCtrl
}

func createButton(parent windows.Handle, text string, x, y, w, h int32, style uint32, id int) windows.Handle {
	tPtr, _ := windows.UTF16PtrFromString(text)
	cPtr, _ := windows.UTF16PtrFromString("BUTTON")

	ret, _, _ := procCreateWindowExW.Call(
		0,
		uintptr(unsafe.Pointer(cPtr)),
		uintptr(unsafe.Pointer(tPtr)),
		uintptr(WS_CHILD|WS_VISIBLE|WS_TABSTOP|style),
		uintptr(x), uintptr(y), uintptr(w), uintptr(h),
		uintptr(parent), uintptr(id), 0, 0,
	)
	hCtrl := windows.Handle(ret)
	if hFontSegoe != 0 {
		procSendMessageW.Call(uintptr(hCtrl), WM_SETFONT, uintptr(hFontSegoe), 1)
	}
	return hCtrl
}
