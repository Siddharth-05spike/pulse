import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Database,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useVirtualizer,
} from "@tanstack/react-virtual";

import {
  telemetryWorker,
} from "../../features/telemetry/telemetry.service";

import type {
  TelemetryBuffer,
  TelemetryMetric,
} from "../../types/telemetry";

interface DataExplorerProps {
  data: TelemetryBuffer | null;
}

type SortDirection =
  | "asc"
  | "desc";

interface ColumnDefinition {
  key:
    | "timestamp"
    | TelemetryMetric;
  label: string;
  unit?: string;
  align?: "left" | "right";
}

const ROW_HEIGHT = 40;
const OVERSCAN = 12;

const COLUMNS: ColumnDefinition[] = [
  {
    key: "timestamp",
    label: "Timestamp",
    align: "left",
  },
  {
    key: "cpu",
    label: "CPU (%)",
    align: "right",
  },
  {
    key: "memory",
    label: "Memory (MB)",
    align: "right",
  },
  {
    key: "latency",
    label: "Latency (ms)",
    align: "right",
  },
  {
    key: "throughput",
    label: "Throughput (events/s)",
    align: "right",
  },
  {
    key: "frameTime",
    label: "Frame Time (ms)",
    align: "right",
  },
];

function createIdentityIndices(
  length: number,
): Uint32Array {
  const indices =
    new Uint32Array(length);

  for (
    let index = 0;
    index < length;
    index++
  ) {
    indices[index] = index;
  }

  return indices;
}

function formatTimestamp(
  timestamp: number,
): string {
  return new Date(
    timestamp,
  ).toLocaleTimeString(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    },
  );
}

function formatNumber(
  value: number,
  maximumFractionDigits = 2,
): string {
  const minimumFractionDigits =
    Math.min(
      2,
      maximumFractionDigits,
    );

  return value.toLocaleString(
    undefined,
    {
      minimumFractionDigits,
      maximumFractionDigits,
    },
  );
}

function getColumnValues(
  data: TelemetryBuffer,
  key: ColumnDefinition["key"],
): Float32Array | Float64Array {
  if (key === "timestamp") {
    return data.timestamps;
  }

  return data[key];
}

export default function DataExplorer({
  data,
}: DataExplorerProps) {
  const [query, setQuery] =
    useState("");

  const [sortColumn, setSortColumn] =
    useState<
      ColumnDefinition["key"] | null
    >(null);

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  /*
   * Search results contain ORIGINAL dataset indices.
   */
  const [
    searchMatches,
    setSearchMatches,
  ] = useState<Uint32Array | null>(null);

  /*
   * sortedIndices represents the currently sorted
   * active index set.
   *
   * When a search is active, this contains only
   * the matching rows after sorting.
   */
  const [
    sortedIndices,
    setSortedIndices,
  ] = useState<Uint32Array | null>(null);

  const [
    operationLoading,
    setOperationLoading,
  ] = useState(false);

  const [
    operationError,
    setOperationError,
  ] = useState<string | null>(null);

  const [
    operationTimeMs,
    setOperationTimeMs,
  ] = useState<number | null>(null);

  /*
   * Prevent stale worker responses from replacing
   * newer search/sort results.
   */
  const operationToken =
    useRef(0);

  /*
   * Reset explorer state when a completely new
   * telemetry dataset arrives.
   */
  useEffect(() => {
    if (!data) {
      setSearchMatches(null);
      setSortedIndices(null);
      setQuery("");
      setSortColumn(null);
      setSortDirection("asc");
      setOperationError(null);
      setOperationTimeMs(null);
      setOperationLoading(false);

      return;
    }

    setSearchMatches(null);

    setSortedIndices(
      createIdentityIndices(
        data.length,
      ),
    );

    setQuery("");
    setSortColumn(null);
    setSortDirection("asc");
    setOperationError(null);
    setOperationTimeMs(null);
    setOperationLoading(false);

    /*
     * Invalidate any operation that belonged to
     * the previous dataset.
     */
    operationToken.current++;
  }, [data]);

  /*
   * Debounced worker-backed search.
   */
  useEffect(() => {
    if (!data) {
      return;
    }

    const normalizedQuery =
      query.trim();

    /*
     * Empty query restores the complete dataset.
     */
    if (!normalizedQuery) {
      const token =
        ++operationToken.current;

      setSearchMatches(null);

      setSortedIndices(
        createIdentityIndices(
          data.length,
        ),
      );

      setSortColumn(null);
      setSortDirection("asc");
      setOperationLoading(false);
      setOperationError(null);
      setOperationTimeMs(null);

      void token;

      return;
    }

    /*
     * A new search invalidates the previous search
     * and previous sort operation.
     */
    const token =
      ++operationToken.current;

    setOperationLoading(true);
    setOperationError(null);

    /*
     * IMPORTANT:
     *
     * Clear the previous sorted result immediately.
     * Otherwise the previous sort can temporarily
     * override the new search result.
     */
    setSortedIndices(null);

    const timeoutId =
      window.setTimeout(
        async () => {
          try {
            const result =
              await telemetryWorker.search(
                data,
                normalizedQuery,
              );

            if (
              token !==
              operationToken.current
            ) {
              return;
            }

            /*
             * Worker returned original dataset indices
             * that match the query.
             */
            setSearchMatches(
              result.indices,
            );

            /*
             * Search establishes a new active ordering.
             * Sorting can later replace this with a sorted
             * version of ONLY these matching indices.
             */
            setSortedIndices(null);

            setOperationTimeMs(
              result.totalTimeMs,
            );

            setOperationError(null);
          } catch (error) {
            if (
              token !==
              operationToken.current
            ) {
              return;
            }

            setSearchMatches(
              new Uint32Array(0),
            );

            setSortedIndices(null);

            setOperationError(
              error instanceof Error
                ? error.message
                : "Search failed.",
            );

            setOperationTimeMs(null);
          } finally {
            if (
              token ===
              operationToken.current
            ) {
              setOperationLoading(false);
            }
          }
        },
        250,
      );

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [data, query]);

  /*
   * Base indices BEFORE sorting.
   *
   * Search results take priority over the full dataset.
   */
  const baseIndices =
    useMemo(() => {
      if (!data) {
        return new Uint32Array(0);
      }

      if (searchMatches) {
        return searchMatches;
      }

      return createIdentityIndices(
        data.length,
      );
    }, [
      data,
      searchMatches,
    ]);

  /*
   * Worker-backed sorting.
   *
   * IMPORTANT:
   *
   * baseIndices is passed to the worker.
   *
   * Therefore:
   *
   * No search:
   *   100K rows → sort 100K rows
   *
   * Search active:
   *   50K matches → sort ONLY 50K rows
   */
  const handleSort = async (
    column: ColumnDefinition["key"],
  ) => {
    if (!data) {
      return;
    }

    const nextDirection =
      sortColumn === column &&
      sortDirection === "asc"
        ? "desc"
        : "asc";

    const token =
      ++operationToken.current;

    setSortColumn(column);
    setSortDirection(
      nextDirection,
    );

    setOperationLoading(true);
    setOperationError(null);

    try {
      const values =
        getColumnValues(
          data,
          column,
        );

      const result =
        await telemetryWorker.sort(
          baseIndices,
          values,
          nextDirection,
        );

      if (
        token !==
        operationToken.current
      ) {
        return;
      }

      /*
       * result.indices contains exactly the same
       * active rows as baseIndices, but reordered.
       *
       * If search is active, only matching rows
       * are sorted.
       */
      setSortedIndices(
        result.indices,
      );

      setOperationTimeMs(
        result.totalTimeMs,
      );

      setOperationError(null);
    } catch (error) {
      if (
        token !==
        operationToken.current
      ) {
        return;
      }

      setOperationError(
        error instanceof Error
          ? error.message
          : "Sort failed.",
      );

      setOperationTimeMs(null);
    } finally {
      if (
        token ===
        operationToken.current
      ) {
        setOperationLoading(false);
      }
    }
  };

  /*
   * THIS IS THE IMPORTANT FIX.
   *
   * Priority:
   *
   * 1. If sorting has happened, use sortedIndices.
   * 2. Otherwise if searching, use searchMatches.
   * 3. Otherwise use the original dataset order.
   *
   * Because sortedIndices is cleared whenever a new
   * search starts, stale sorting can no longer override
   * the search result.
   */
  const activeIndices =
    sortedIndices ??
    baseIndices;

  const parentRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const rowVirtualizer =
    useVirtualizer({
      count:
        activeIndices.length,

      getScrollElement: () =>
        parentRef.current,

      estimateSize: () =>
        ROW_HEIGHT,

      overscan:
        OVERSCAN,
    });

  if (!data) {
    return (
      <section className="rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Database
              size={20}
              strokeWidth={1.5}
              className="mx-auto text-zinc-700"
            />

            <p className="mt-3 text-xs text-zinc-500">
              No telemetry dataset loaded.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const virtualRows =
    rowVirtualizer.getVirtualItems();

  const activeRowCount =
    activeIndices.length;

  const searchActive =
    query.trim().length > 0;

  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-200">
                Telemetry data
              </h3>

              <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-0.5 font-mono text-[9px] text-zinc-500">
                {data.length >=
                1_000_000
                  ? `${(
                      data.length /
                      1_000_000
                    ).toFixed(2)}M`
                  : data.length >=
                    1_000
                    ? `${(
                        data.length /
                        1_000
                      ).toFixed(0)}K`
                    : data.length}
              </span>

              <span className="rounded-md border border-amber-400/10 bg-amber-400/[0.04] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-amber-400">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                Worker
              </span>
            </div>

            <p className="mt-1 text-[11px] text-zinc-600">
              Virtualized view of the active
              telemetry buffer
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-mono text-[10px] text-zinc-500">
                <span className="text-zinc-300">
                  {data.length.toLocaleString()}
                </span>{" "}
                rows
              </span>

              <span className="font-mono text-[10px] text-zinc-500">
                <span className="text-zinc-300">
                  {COLUMNS.length}
                </span>{" "}
                columns
              </span>

              <span className="font-mono text-[10px] text-zinc-500">
                <span className="text-zinc-300">
                  {virtualRows.length}
                </span>{" "}
                rendered
              </span>

              <span className="font-mono text-[10px] text-zinc-500">
                <span className="text-zinc-300">
                  {activeRowCount.toLocaleString()}
                </span>{" "}
                active rows
              </span>

              <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.08em] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Virtualized
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-[310px]">
            <Search
              size={14}
              strokeWidth={1.6}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search telemetry..."
              className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/20 pl-9 pr-3 text-xs text-zinc-300 outline-none placeholder:text-zinc-700 transition focus:border-white/[0.16] focus:bg-white/[0.02]"
            />
          </div>
        </div>
      </div>

      {/* Search / operation status */}
      {(searchActive ||
        operationLoading ||
        operationError) && (
        <div className="flex min-h-9 items-center justify-between border-b border-white/[0.05] bg-white/[0.012] px-5">
          <div className="flex items-center gap-3">
            {searchActive ? (
              <span className="text-[10px] text-zinc-600">
                Search query:{" "}
                <span className="font-mono text-zinc-400">
                  "{query.trim()}"
                </span>
              </span>
            ) : (
              <span className="text-[10px] text-zinc-600">
                Worker operation
              </span>
            )}

            {searchActive &&
              searchMatches && (
                <span className="font-mono text-[10px] text-zinc-500">
                  {searchMatches.length.toLocaleString()}{" "}
                  matches
                </span>
              )}

            {operationLoading && (
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-amber-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                Processing
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {operationTimeMs !==
              null &&
              !operationLoading && (
                <span className="font-mono text-[9px] text-zinc-700">
                  Worker{" "}
                  {operationTimeMs.toFixed(
                    1,
                  )}
                  ms
                </span>
              )}

            {operationError && (
              <span className="text-[9px] text-red-400">
                {operationError}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div
        ref={parentRef}
        className="relative h-[560px] overflow-auto"
      >
        <div className="min-w-[920px]">
          {/* Table header */}
          <div className="sticky top-0 z-20 grid grid-cols-[72px_190px_150px_150px_150px_190px_150px] border-b border-white/[0.06] bg-[#0d0d0f]/95 px-4 backdrop-blur">
            <div className="flex h-11 items-center text-[9px] font-medium uppercase tracking-[0.13em] text-zinc-700">
              #
            </div>

            {COLUMNS.map(
              (column) => {
                const isSorted =
                  sortColumn ===
                  column.key;

                return (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() =>
                      void handleSort(
                        column.key,
                      )
                    }
                    className={`group flex h-11 items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.13em] transition hover:text-zinc-300 ${
                      column.align ===
                      "right"
                        ? "justify-end"
                        : "justify-start"
                    } ${
                      isSorted
                        ? "text-zinc-300"
                        : "text-zinc-700"
                    }`}
                  >
                    <span>
                      {column.label}
                    </span>

                    {isSorted ? (
                      sortDirection ===
                      "asc" ? (
                        <ArrowUp
                          size={11}
                          strokeWidth={
                            1.7
                          }
                        />
                      ) : (
                        <ArrowDown
                          size={11}
                          strokeWidth={
                            1.7
                          }
                        />
                      )
                    ) : (
                      <ChevronsUpDown
                        size={11}
                        strokeWidth={
                          1.5
                        }
                        className="text-zinc-800 transition group-hover:text-zinc-600"
                      />
                    )}
                  </button>
                );
              },
            )}
          </div>

          {/* Virtualized rows */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualRows.map(
              (virtualRow) => {
                /*
                 * virtualRow.index is the POSITION inside
                 * the active index array.
                 *
                 * activeIndices contains ORIGINAL dataset
                 * indices.
                 */
                const rowIndex =
                  activeIndices[
                    virtualRow.index
                  ];

                const timestamp =
                  data.timestamps[
                    rowIndex
                  ];

                const cpu =
                  data.cpu[rowIndex];

                const memory =
                  data.memory[
                    rowIndex
                  ];

                const latency =
                  data.latency[
                    rowIndex
                  ];

                const throughput =
                  data.throughput[
                    rowIndex
                  ];

                const frameTime =
                  data.frameTime[
                    rowIndex
                  ];

                return (
                  <div
                    key={
                      rowIndex
                    }
                    className="absolute left-0 grid w-full grid-cols-[72px_190px_150px_150px_150px_190px_150px] items-center border-b border-white/[0.035] px-4 transition-colors hover:bg-white/[0.018]"
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {/* Index */}
                    <div className="font-mono text-[9px] text-zinc-700">
                      {rowIndex.toLocaleString()}
                    </div>

                    {/* Timestamp */}
                    <div className="font-mono text-[10px] text-zinc-500">
                      {formatTimestamp(
                        timestamp,
                      )}
                    </div>

                    {/* CPU */}
                    <div className="text-right font-mono text-[10px] text-zinc-400">
                      {formatNumber(
                        cpu,
                      )}
                    </div>

                    {/* Memory */}
                    <div className="text-right font-mono text-[10px] text-zinc-400">
                      {formatNumber(
                        memory,
                      )}
                    </div>

                    {/* Latency */}
                    <div className="text-right font-mono text-[10px] text-zinc-400">
                      {formatNumber(
                        latency,
                      )}
                    </div>

                    {/* Throughput */}
                    <div className="text-right font-mono text-[10px] text-zinc-400">
                      {formatNumber(
                        throughput,
                        0,
                      )}
                    </div>

                    {/* Frame time */}
                    <div className="text-right font-mono text-[10px] text-zinc-400">
                      {formatNumber(
                        frameTime,
                      )}
                    </div>
                  </div>
                );
              },
            )}

            {activeRowCount ===
              0 && (
              <div className="absolute inset-x-0 top-0 flex h-32 items-center justify-center">
                <div className="text-center">
                  <Search
                    size={16}
                    strokeWidth={1.5}
                    className="mx-auto text-zinc-700"
                  />

                  <p className="mt-2 text-xs text-zinc-500">
                    No matching telemetry
                    rows
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-700">
                    Try another search
                    value
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-white/[0.06] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em] text-zinc-700">
            <SlidersHorizontal
              size={11}
              strokeWidth={1.5}
            />
            Virtualized
          </div>

          <span className="text-[9px] text-zinc-800">
            •
          </span>

          <span className="font-mono text-[9px] text-zinc-700">
            {virtualRows.length} DOM
            rows
          </span>
        </div>

        <div className="font-mono text-[9px] text-zinc-700">
          {activeRowCount.toLocaleString()}{" "}
          active /{" "}
          {data.length.toLocaleString()}{" "}
          total
        </div>
      </div>
    </section>
  );
}