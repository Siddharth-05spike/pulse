# PULSE — Performance Intelligence Dashboard

PULSE is a high-performance telemetry dashboard built to visualize and explore large datasets without slowing down the interface.

It supports datasets up to **5 million telemetry points** and provides real-time performance monitoring, interactive charts, and a virtualized data explorer.

## What it does

- Visualizes CPU, memory, latency, throughput, and frame-time data
- Supports **100K, 500K, 1M, and 5M** data points
- Uses **Web Workers** for heavy data generation and processing
- Uses **adaptive rendering** for large datasets
- Provides a virtualized data table for exploring millions of rows
- Includes runtime FPS, frame-time, memory, and performance scoring
- Supports Raw, Adaptive, and Aggregated rendering modes

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Apache ECharts
- Zustand
- TanStack Virtual
- Web Workers

## Performance

Tested with a **5M point dataset**:

- ~120 FPS runtime
- ~6.9 ms frame time
- 99.5 / 100 performance score
- 5,000,000 rows handled through virtualization

## Project Structure

The project separates the UI, data generation, telemetry processing, state management, and visualization layers to keep the application maintainable and responsive.

## Live Demo

https://pulse-telemetry.vercel.app

## Repository

https://github.com/Siddharth-05spike/pulse
