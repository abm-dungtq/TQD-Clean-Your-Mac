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

export type CategoryRunStatus = "idle" | "cleaning" | "completed" | "skipped" | "failed";

export interface ScanCategoryItem {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  sizeString: string;
  sizeBytes: number;
  safe: boolean;
  status?: CategoryRunStatus;
  requiresFDA?: boolean;
  requiresRoot?: boolean;
  tier?: 1 | 2;
}

export interface ScanResult {
  totalSizeString: string;
  totalSizeBytes: number;
  categories: ScanCategoryItem[];
  timestamp: number;
}

export interface DevArtifactItem {
  id: string;
  path: string;
  type: "node_modules" | "target" | ".gradle" | "venv" | "DerivedData";
  sizeString: string;
  sizeBytes: number;
  lastModifiedDays: number;
}

export interface InstalledApp {
  name: string;
  path: string;
  sizeString: string;
  sizeBytes: number;
}
