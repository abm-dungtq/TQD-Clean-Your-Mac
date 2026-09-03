import { execSync } from "child_process";

export interface SystemTelemetry {
  cpu: {
    brand: string;
    user: number;
    system: number;
    idle: number;
    totalUsage: number;
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    activeBytes: number;
    wiredBytes: number;
    compressedBytes: number;
    usagePercent: number;
  };
  disk: {
    totalBytes: number;
    usedBytes: number;
    availableBytes: number;
    usagePercent: number;
  };
  battery?: {
    percentage: number;
    isCharging: boolean;
    source: string;
  };
  healthScore: number;
  healthStatus: "TỐI ƯU" | "KHÁ TỐT" | "CẦN DỌN DẸP";
  timestamp: number;
}

let cachedCpuBrand = "";

export function getCpuBrand(): string {
  if (cachedCpuBrand) return cachedCpuBrand;
  try {
    cachedCpuBrand = execSync("sysctl -n machdep.cpu.brand_string", { encoding: "utf8" }).trim();
  } catch {
    cachedCpuBrand = "Apple Silicon";
  }
  return cachedCpuBrand;
}

export function getTelemetry(): SystemTelemetry {
  // 1. CPU
  let user = 0, sys = 0, idle = 100;
  try {
    const topOut = execSync("top -l 1 -n 0", { encoding: "utf8", timeout: 2000 });
    const match = topOut.match(/CPU usage:\s*([0-9.]+)%\s*user,\s*([0-9.]+)%\s*sys,\s*([0-9.]+)%\s*idle/);
    if (match) {
      user = parseFloat(match[1]);
      sys = parseFloat(match[2]);
      idle = parseFloat(match[3]);
    }
  } catch {
    user = 15; sys = 10; idle = 75;
  }
  const totalCpuUsage = Math.min(100, Math.round((user + sys) * 10) / 10);

  // 2. Memory
  let totalMem = 16 * 1024 * 1024 * 1024;
  try {
    totalMem = parseInt(execSync("sysctl -n hw.memsize", { encoding: "utf8" }).trim(), 10);
  } catch {}

  let activeBytes = 0, wiredBytes = 0, compressedBytes = 0, freeBytes = 0;
  try {
    const vmOut = execSync("vm_stat", { encoding: "utf8" });
    const pageSizeMatch = vmOut.match(/page size of (\d+) bytes/);
    const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1], 10) : 16384;

    const parsePages = (key: string) => {
      const m = vmOut.match(new RegExp(`${key}:\\s+(\\d+)\\.`));
      return m ? parseInt(m[1], 10) * pageSize : 0;
    };

    activeBytes = parsePages("Pages active");
    wiredBytes = parsePages("Pages wired down");
    compressedBytes = parsePages("Pages occupied by compressor");
    freeBytes = parsePages("Pages free") + parsePages("Pages speculative");
  } catch {
    activeBytes = totalMem * 0.4;
    wiredBytes = totalMem * 0.2;
    freeBytes = totalMem * 0.4;
  }

  const usedMemBytes = activeBytes + wiredBytes + compressedBytes;
  const memUsagePercent = Math.min(100, Math.round((usedMemBytes / totalMem) * 100));

  // 3. Disk
  let diskTotal = 256 * 1024 * 1024 * 1024;
  let diskUsed = 100 * 1024 * 1024 * 1024;
  let diskAvailable = 156 * 1024 * 1024 * 1024;
  let diskUsagePercent = 40;
  try {
    const dfOut = execSync("df -k /", { encoding: "utf8" }).trim().split("\n");
    if (dfOut.length > 1) {
      const parts = dfOut[1].split(/\s+/);
      const totalBlocks = parseInt(parts[1], 10) * 1024;
      const usedBlocks = parseInt(parts[2], 10) * 1024;
      const availBlocks = parseInt(parts[3], 10) * 1024;
      if (!isNaN(totalBlocks) && totalBlocks > 0) {
        diskTotal = totalBlocks;
        diskUsed = usedBlocks;
        diskAvailable = availBlocks;
        diskUsagePercent = Math.round((diskUsed / diskTotal) * 100);
      }
    }
  } catch {}

  // 4. Battery
  let batteryInfo: SystemTelemetry["battery"] | undefined;
  try {
    const battOut = execSync("pmset -g batt", { encoding: "utf8" });
    const percentMatch = battOut.match(/(\d+)%/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1], 10);
      const isCharging = battOut.includes("charging") || battOut.includes("AC Power");
      const isAc = battOut.includes("AC Power");
      batteryInfo = {
        percentage: percent,
        isCharging,
        source: isAc ? "Nguồn cắm sạc (AC)" : "Pin (Battery)",
      };
    }
  } catch {}

  // 5. Health score calculation
  // Formula: 100 - (CPU penalty + RAM penalty + Disk penalty)
  let healthScore = 100;
  if (totalCpuUsage > 70) healthScore -= 15;
  else if (totalCpuUsage > 40) healthScore -= 5;

  if (memUsagePercent > 85) healthScore -= 20;
  else if (memUsagePercent > 70) healthScore -= 10;

  if (diskUsagePercent > 90) healthScore -= 25;
  else if (diskUsagePercent > 80) healthScore -= 15;
  else if (diskUsagePercent > 65) healthScore -= 5;

  healthScore = Math.max(20, Math.min(100, healthScore));

  let healthStatus: SystemTelemetry["healthStatus"] = "TỐI ƯU";
  if (healthScore < 60) healthStatus = "CẦN DỌN DẸP";
  else if (healthScore < 85) healthStatus = "KHÁ TỐT";

  return {
    cpu: {
      brand: getCpuBrand(),
      user,
      system: sys,
      idle,
      totalUsage: totalCpuUsage,
    },
    memory: {
      totalBytes: totalMem,
      usedBytes: usedMemBytes,
      freeBytes,
      activeBytes,
      wiredBytes,
      compressedBytes,
      usagePercent: memUsagePercent,
    },
    disk: {
      totalBytes: diskTotal,
      usedBytes: diskUsed,
      availableBytes: diskAvailable,
      usagePercent: diskUsagePercent,
    },
    battery: batteryInfo,
    healthScore,
    healthStatus,
    timestamp: Date.now(),
  };
}
