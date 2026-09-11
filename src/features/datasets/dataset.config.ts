import type { DatasetSize } from "../../types/telemetry";

export interface DatasetConfig {
  size: DatasetSize;
  label: string;
  description: string;
}

export const DATASET_CONFIGS: DatasetConfig[] = [
  {
    size: 100_000,
    label: "100K",
    description: "Quick workload",
  },
  {
    size: 500_000,
    label: "500K",
    description: "Medium workload",
  },
  {
    size: 1_000_000,
    label: "1M",
    description: "Large workload",
  },
  {
    size: 5_000_000,
    label: "5M",
    description: "Stress workload",
  },
];

export const DEFAULT_DATASET_SIZE: DatasetSize = 1_000_000;