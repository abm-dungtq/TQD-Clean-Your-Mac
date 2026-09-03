import Cocoa

func createDmgBackground(width: CGFloat, height: CGFloat, scale: CGFloat) -> NSImage {
    let size = NSSize(width: width * scale, height: height * scale)
    let img = NSImage(size: size)
    img.lockFocus()

    guard let ctx = NSGraphicsContext.current?.cgContext else {
        img.unlockFocus()
        return img
    }

    ctx.scaleBy(x: scale, y: scale)

    // 1. Nền tối Gradient Cyber-Void (#050508 sang #0a0b12)
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bgColors = [
        CGColor(red: 0.03, green: 0.03, blue: 0.05, alpha: 1.0),
        CGColor(red: 0.06, green: 0.07, blue: 0.11, alpha: 1.0)
    ] as CFArray
    if let bgGradient = CGGradient(colorsSpace: colorSpace, colors: bgColors, locations: [0.0, 1.0]) {
        ctx.drawLinearGradient(bgGradient, start: CGPoint(x: 0, y: height), end: CGPoint(x: width, y: 0), options: [])
    }

    // 2. Lưới điểm chấm Cyberpunk nhẹ
    ctx.saveGState()
    ctx.setFillColor(CGColor(red: 0, green: 242/255, blue: 1.0, alpha: 0.08))
    let step: CGFloat = 30
    for x in stride(from: 15, to: width, by: step) {
        for y in stride(from: 15, to: height, by: step) {
            ctx.fillEllipse(in: CGRect(x: x - 1, y: y - 1, width: 2, height: 2))
        }
    }
    ctx.restoreGState()

    // 3. Mũi tên phát sáng Neon Cyan nối từ (250, 270) sang (410, 270) trong hệ tọa độ macOS (gốc dưới trái)
    // Lưu ý: macOS Finder gốc tọa độ y là từ đỉnh xuống: y=190 Finder tương đương y=440-190=250 trong NSGraphics
    let arrowY: CGFloat = 250
    let startX: CGFloat = 255
    let endX: CGFloat = 405

    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: 0), blur: 12, color: CGColor(red: 0, green: 242/255, blue: 1.0, alpha: 0.8))
    ctx.setStrokeColor(CGColor(red: 0, green: 242/255, blue: 1.0, alpha: 0.9))
    ctx.setLineWidth(3.0)
    ctx.setLineCap(.round)

    ctx.move(to: CGPoint(x: startX, y: arrowY))
    ctx.addLine(to: CGPoint(x: endX, y: arrowY))
    ctx.strokePath()

    // Đầu mũi tên
    let arrowHead = CGMutablePath()
    arrowHead.move(to: CGPoint(x: endX - 12, y: arrowY + 9))
    arrowHead.addLine(to: CGPoint(x: endX, y: arrowY))
    arrowHead.addLine(to: CGPoint(x: endX - 12, y: arrowY - 9))
    ctx.addPath(arrowHead)
    ctx.strokePath()
    ctx.restoreGState()

    // Chữ chỉ dẫn trên mũi tên
    let arrowText = "KÉO & THẢ ĐỂ CÀI ĐẶT" as NSString
    let arrowFont = NSFont.boldSystemFont(ofSize: 10.5)
    let arrowAttrs: [NSAttributedString.Key: Any] = [
        .font: arrowFont,
        .foregroundColor: NSColor(red: 0, green: 242/255, blue: 1.0, alpha: 0.9),
    ]
    let arrowTextSize = arrowText.size(withAttributes: arrowAttrs)
    arrowText.draw(at: CGPoint(x: (startX + endX) / 2 - arrowTextSize.width / 2, y: arrowY + 14), withAttributes: arrowAttrs)

    // 4. Bảng hướng dẫn Gatekeeper phía dưới (Frosted Box)
    let cardRect = CGRect(x: 35, y: 25, width: width - 70, height: 115)
    let cardPath = CGPath(roundedRect: cardRect, cornerWidth: 14, cornerHeight: 14, transform: nil)

    ctx.saveGState()
    ctx.addPath(cardPath)
    ctx.setFillColor(CGColor(red: 0.08, green: 0.10, blue: 0.16, alpha: 0.75))
    ctx.fillPath()

    ctx.addPath(cardPath)
    ctx.setLineWidth(1.2)
    ctx.setStrokeColor(CGColor(red: 0, green: 242/255, blue: 1.0, alpha: 0.35))
    ctx.strokePath()
    ctx.restoreGState()

    // Tiêu đề bảng hướng dẫn
    let title = "💡 HƯỚNG DẪN MỞ ỨNG DỤNG LẦN ĐẦU (VƯỢT GATEKEEPER):" as NSString
    let titleAttrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.boldSystemFont(ofSize: 11),
        .foregroundColor: NSColor(red: 0, green: 242/255, blue: 1.0, alpha: 1.0)
    ]
    title.draw(at: CGPoint(x: 52, y: 110), withAttributes: titleAttrs)

    // Dòng 1: Giữ Control + Click
    let line1 = "• Cách 1: Giữ phím Control + Click chuột phải vào icon -> Chọn \"Mở\" (Open)." as NSString
    let lineAttrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 11),
        .foregroundColor: NSColor.white
    ]
    line1.draw(at: CGPoint(x: 52, y: 88), withAttributes: lineAttrs)

    // Dòng 2: macOS Sequoia
    let line2 = "• Cách 2 (macOS 15 Sequoia): Vào Cài đặt hệ thống -> Quyền riêng tư & Bảo mật -> Bấm \"Vẫn mở\"." as NSString
    line2.draw(at: CGPoint(x: 52, y: 68), withAttributes: lineAttrs)

    // Dòng 3: Cam kết Zero-Terminal
    let line3 = "🛡️ Cam kết an toàn 100% | Hoàn toàn không cần mở Terminal | Tự động bảo tồn toàn vẹn Mac." as NSString
    let line3Attrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 10.5),
        .foregroundColor: NSColor(red: 0, green: 255/255, blue: 159/255, alpha: 0.9)
    ]
    line3.draw(at: CGPoint(x: 52, y: 44), withAttributes: line3Attrs)

    img.unlockFocus()
    return img
}

let bgImg = createDmgBackground(width: 660, height: 440, scale: 2.0)
if let tiff = bgImg.tiffRepresentation,
   let rep = NSBitmapImageRep(data: tiff),
   let png = rep.representation(using: .png, properties: [:]) {
    try? png.write(to: URL(fileURLWithPath: "assets/dmg-background.png"))
    print("✅ Đã xuất assets/dmg-background.png (1320x880 Retina)")
}
