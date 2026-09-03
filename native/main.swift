import Cocoa
import WebKit

// MARK: - Native TitleBar Drag Overlay
class TitleBarDragView: NSView {
    override var mouseDownCanMoveWindow: Bool {
        return true
    }

    override func hitTest(_ point: NSPoint) -> NSView? {
        // Toạ độ point được cung cấp theo hệ toạ độ của superview (win.contentView).
        // Khu vực Apple Traffic Lights (Đóng/Ẩn/Phóng to) nằm ở góc trên bên trái x: 0..<78.
        // Trả về nil để sự kiện chuột và hover xuyên thấu trực tiếp xuống các nút hệ thống.
        if point.x < 78 {
            return nil
        }
        return super.hitTest(point)
    }

    override func mouseDown(with event: NSEvent) {
        if event.clickCount == 2 {
            // Chuẩn macOS: Bấm đúp thanh tiêu đề để phóng to / thu nhỏ cửa sổ
            window?.zoom(nil)
        } else {
            // Bàn giao việc kéo cửa sổ cho macOS WindowServer (60/120Hz mượt mà, hỗ trợ Sequoia Snapping)
            window?.performDrag(with: event)
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow?
    var webView: WKWebView?
    var backendProcess: Process?
    var outputPipe: Pipe?
    var errorPipe: Pipe?
    var isTerminating = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        startBackendAndLaunchUI()
    }

    func startBackendAndLaunchUI() {
        let bundleResourcePath = Bundle.main.resourceURL
        var backendExecutable = bundleResourcePath?.appendingPathComponent("bin/tqd-backend").path ?? ""

        // Dự phòng khi chạy test từ thư mục build
        if !FileManager.default.fileExists(atPath: backendExecutable) {
            let localDevPath = FileManager.default.currentDirectoryPath + "/build/bin/tqd-backend"
            if FileManager.default.fileExists(atPath: localDevPath) {
                backendExecutable = localDevPath
            }
        }

        guard FileManager.default.fileExists(atPath: backendExecutable) else {
            showErrorDialog(message: "Không tìm thấy tệp nhị phân lõi TQD-Clean tại:\n\(backendExecutable)")
            NSApp.terminate(nil)
            return
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: backendExecutable)
        process.currentDirectoryURL = bundleResourcePath ?? URL(fileURLWithPath: NSTemporaryDirectory())
        
        var env = ProcessInfo.processInfo.environment
        env["TQD_NATIVE_SHELL"] = "1"
        env["NO_OPEN"] = "1"
        env["HOME"] = NSHomeDirectory()
        env["PATH"] = (env["PATH"] ?? "") + ":/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/homebrew/bin"
        if let resPath = bundleResourcePath?.path {
            env["TQD_MOLE_PATH"] = resPath + "/mole"
            env["TQD_FRONTEND_PATH"] = resPath + "/frontend"
        }
        process.environment = env

        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe
        self.outputPipe = stdoutPipe
        self.errorPipe = stderrPipe
        self.backendProcess = process

        // Lắng nghe stdout để nhận diện cổng và token
        stdoutPipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            guard !data.isEmpty else {
                // Gỡ bỏ readabilityHandler ngay lập tức khi gặp EOF để ngăn chặn 100% CPU infinite loop
                handle.readabilityHandler = nil
                return
            }
            guard let output = String(data: data, encoding: .utf8) else { return }

            for line in output.components(separatedBy: .newlines) {
                if line.contains("__TQD_READY__") {
                    self?.parseReadySignal(line)
                }
            }
        }

        stderrPipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            guard !data.isEmpty else {
                handle.readabilityHandler = nil
                return
            }
            if let errStr = String(data: data, encoding: .utf8) {
                NSLog("[Backend Stderr] %@", errStr)
            }
        }

        process.terminationHandler = { [weak self] proc in
            DispatchQueue.main.async {
                if proc.terminationStatus != 0 && !(self?.isTerminating ?? false) {
                    self?.showErrorDialog(message: "Dịch vụ hệ thống TQD-Clean bị dừng bất ngờ (Mã lỗi: \(proc.terminationStatus)).")
                    NSApp.terminate(nil)
                }
            }
        }

        do {
            try process.run()
        } catch {
            showErrorDialog(message: "Lỗi khởi động dịch vụ hệ thống: \(error.localizedDescription)")
            NSApp.terminate(nil)
        }
    }

    func parseReadySignal(_ line: String) {
        // Định dạng: __TQD_READY__ PORT=42100 TOKEN=abcdef...
        var port: Int = 42100
        var token: String = ""

        let parts = line.components(separatedBy: " ")
        for part in parts {
            if part.hasPrefix("PORT=") {
                let pStr = part.replacingOccurrences(of: "PORT=", with: "")
                if let p = Int(pStr) { port = p }
            } else if part.hasPrefix("TOKEN=") {
                token = part.replacingOccurrences(of: "TOKEN=", with: "")
            }
        }

        DispatchQueue.main.async { [weak self] in
            self?.createAndDisplayWindow(port: port, token: token)
        }
    }

    func createAndDisplayWindow(port: Int, token: String) {
        if window != nil { return }

        let rect = NSRect(x: 0, y: 0, width: 1140, height: 760)
        let win = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )

        win.center()
        win.title = "TQD-Clean Your Mac"
        win.titlebarAppearsTransparent = true
        win.titleVisibility = .hidden
        win.backgroundColor = NSColor(red: 0.02, green: 0.02, blue: 0.03, alpha: 1.0)
        win.isMovableByWindowBackground = true
        win.minSize = NSSize(width: 960, height: 640)
        win.delegate = self

        // Cấu hình WKWebView
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        
        let web = WKWebView(frame: win.contentView!.bounds, configuration: config)
        web.autoresizingMask = [.width, .height]
        web.setValue(false, forKey: "drawsBackground") // Nền trong suốt đón nhận cyber theme
        
        win.contentView?.addSubview(web)
        self.webView = web
        self.window = win

        // Gắn thanh kéo trong suốt (TitleBar Drag Overlay) đè lên trên WKWebView ở đỉnh cửa sổ
        let titleBarHeight: CGFloat = 40
        if let contentView = win.contentView {
            let dragFrame = NSRect(
                x: 0,
                y: contentView.bounds.height - titleBarHeight,
                width: contentView.bounds.width,
                height: titleBarHeight
            )
            let dragView = TitleBarDragView(frame: dragFrame)
            dragView.autoresizingMask = [.width, .minYMargin]
            contentView.addSubview(dragView, positioned: .above, relativeTo: web)
        }

        // Tải trang Cyber-HUD
        let urlString = "http://127.0.0.1:\(port)/?token=\(token)"
        if let url = URL(string: urlString) {
            web.load(URLRequest(url: url))
        }

        win.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func showErrorDialog(message: String) {
        let alert = NSAlert()
        alert.messageText = "TQD-Clean Your Mac"
        alert.informativeText = message
        alert.alertStyle = .critical
        alert.addButton(withTitle: "Đóng")
        alert.runModal()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    func applicationWillTerminate(_ notification: Notification) {
        guard !isTerminating else { return }
        isTerminating = true

        outputPipe?.fileHandleForReading.readabilityHandler = nil
        errorPipe?.fileHandleForReading.readabilityHandler = nil
        if let proc = backendProcess, proc.isRunning {
            proc.terminate()
            // Chờ tối đa 300ms để backend đóng sạch
            let start = Date()
            while proc.isRunning && Date().timeIntervalSince(start) < 0.3 {
                usleep(20000)
            }
            if proc.isRunning {
                kill(proc.processIdentifier, SIGKILL)
            }
        }
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
