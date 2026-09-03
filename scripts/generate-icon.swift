import Cocoa

func createCyberIcon(size: CGFloat) -> NSImage {
    let img = NSImage(size: NSSize(width: size, height: size))
    img.lockFocus()

    guard let ctx = NSGraphicsContext.current?.cgContext else {
        img.unlockFocus()
        return img
    }

    // Nền tối bo tròn cao cấp (Squircle)
    let rect = CGRect(x: size * 0.05, y: size * 0.05, width: size * 0.9, height: size * 0.9)
    let cornerRadius = size * 0.22
    let path = CGPath(roundedRect: rect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)

    // Đổ bóng nền
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -size * 0.04), blur: size * 0.08, color: CGColor(red: 0, green: 242/255, blue: 1.0, alpha: 0.35))
    ctx.addPath(path)
    ctx.setFillColor(CGColor(red: 0.03, green: 0.03, blue: 0.05, alpha: 1.0))
    ctx.fillPath()
    ctx.restoreGState()

    // Viền phát sáng Gradient Neon
    ctx.saveGState()
    ctx.addPath(path)
    ctx.setLineWidth(size * 0.025)
    ctx.setStrokeColor(CGColor(red: 0, green: 242/255, blue: 1.0, alpha: 0.8))
    ctx.strokePath()
    ctx.restoreGState()

    // Vẽ Khiên Cyber Shield
    let center = CGPoint(x: size * 0.5, y: size * 0.5)
    let shieldWidth = size * 0.46
    let shieldHeight = size * 0.54
    
    let shield = CGMutablePath()
    let topY = center.y + shieldHeight * 0.42
    let midY = center.y
    let bottomY = center.y - shieldHeight * 0.48
    let leftX = center.x - shieldWidth * 0.5
    let rightX = center.x + shieldWidth * 0.5

    shield.move(to: CGPoint(x: center.x, y: topY))
    shield.addLine(to: CGPoint(x: rightX, y: topY - size * 0.05))
    shield.addLine(to: CGPoint(x: rightX, y: midY))
    shield.addCurve(to: CGPoint(x: center.x, y: bottomY),
                     control1: CGPoint(x: rightX, y: center.y - shieldHeight * 0.25),
                     control2: CGPoint(x: center.x + shieldWidth * 0.2, y: bottomY + size * 0.05))
    shield.addCurve(to: CGPoint(x: leftX, y: midY),
                     control1: CGPoint(x: center.x - shieldWidth * 0.2, y: bottomY + size * 0.05),
                     control2: CGPoint(x: leftX, y: center.y - shieldHeight * 0.25))
    shield.addLine(to: CGPoint(x: leftX, y: topY - size * 0.05))
    shield.closeSubpath()

    // Gradient bên trong khiên (Electric Purple sang Neon Cyan)
    ctx.saveGState()
    ctx.addPath(shield)
    ctx.clip()
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let colors = [
        CGColor(red: 188/255, green: 19/255, blue: 254/255, alpha: 0.4),
        CGColor(red: 0, green: 242/255, blue: 1.0, alpha: 0.6)
    ] as CFArray
    if let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: [0.0, 1.0]) {
        ctx.drawLinearGradient(gradient, start: CGPoint(x: leftX, y: bottomY), end: CGPoint(x: rightX, y: topY), options: [])
    }
    ctx.restoreGState()

    // Viền khiên neon
    ctx.saveGState()
    ctx.addPath(shield)
    ctx.setLineWidth(size * 0.02)
    ctx.setStrokeColor(CGColor(red: 0, green: 242/255, blue: 1.0, alpha: 0.95))
    ctx.strokePath()
    ctx.restoreGState()

    // Vẽ chữ TQD phát sáng ở tâm
    let text = "TQD" as NSString
    let fontSize = size * 0.16
    let font = NSFont.boldSystemFont(ofSize: fontSize)
    let textAttrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: NSColor.white,
    ]
    let textSize = text.size(withAttributes: textAttrs)
    let textRect = CGRect(
        x: center.x - textSize.width / 2,
        y: center.y - textSize.height / 2 + size * 0.02,
        width: textSize.width,
        height: textSize.height
    )
    text.draw(in: textRect, withAttributes: textAttrs)

    img.unlockFocus()
    return img
}

let iconsetDir = "assets/AppIcon.iconset"
let fm = FileManager.default
try? fm.removeItem(atPath: iconsetDir)
try? fm.createDirectory(atPath: iconsetDir, withIntermediateDirectories: true)

let sizes: [(String, CGFloat)] = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024)
]

for (name, s) in sizes {
    let img = createCyberIcon(size: s)
    if let tiff = img.tiffRepresentation,
       let rep = NSBitmapImageRep(data: tiff),
       let png = rep.representation(using: .png, properties: [:]) {
        try? png.write(to: URL(fileURLWithPath: "\(iconsetDir)/\(name)"))
    }
}

print("✅ Đã xuất các tệp PNG iconset thành công.")
