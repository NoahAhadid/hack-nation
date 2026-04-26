"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Hash, Plus, Table2, X, Check } from "lucide-react";

type CsvConfiguration = {
  fileName: string;
  iscoColumn: string;
  selectedFeatures: string[];
  prompt: string;
};

type AdminProtocolPanelProps = {
  adminCsvColumns: string[];
  adminCsvFileName: string;
  adminIscoColumn: string;
  protocolStatus: string;
  onPreviewCsvColumns: (file: File | undefined) => void;
  onSelectIscoColumn: (column: string) => void;
};

const iscoMajorGroups = [
  {
    code: "0",
    title: "Armed forces",
    example: "military and defense roles",
  },
  {
    code: "1",
    title: "Managers",
    example: "shop owner, operations lead",
  },
  {
    code: "2",
    title: "Professionals",
    example: "engineer, teacher, developer",
  },
  {
    code: "3",
    title: "Technicians",
    example: "ICT support, lab technician",
  },
  {
    code: "4",
    title: "Clerical support",
    example: "records, office, data entry",
  },
  {
    code: "5",
    title: "Service and sales",
    example: "retail, customer support",
  },
  {
    code: "6",
    title: "Skilled agriculture",
    example: "farm, forestry, fishery",
  },
  {
    code: "7",
    title: "Craft and trades",
    example: "repair, electrical, mechanics",
  },
  {
    code: "8",
    title: "Machine operators",
    example: "drivers, plant operators",
  },
  {
    code: "9",
    title: "Elementary roles",
    example: "helpers, cleaners, laborers",
  },
];

const diagramDataPoints = [
  {
    label: "Wage floors",
    detail: "minimum realistic earnings",
    position: "left-4 top-8",
    connector: "left-[24%] top-[25%] w-[18%] rotate-[18deg]",
  },
  {
    label: "Sector growth",
    detail: "where demand is expanding",
    position: "right-4 top-8",
    connector: "right-[24%] top-[25%] w-[18%] -rotate-[18deg]",
  },
  {
    label: "Education returns",
    detail: "credential value by path",
    position: "left-10 top-[42%]",
    connector: "left-[26%] top-[49%] w-[16%]",
  },
  {
    label: "Local jobs",
    detail: "real openings and pathways",
    position: "right-10 top-[42%]",
    connector: "right-[26%] top-[49%] w-[16%]",
  },
  {
    label: "Training supply",
    detail: "available seats and costs",
    position: "left-4 bottom-8",
    connector: "left-[24%] bottom-[25%] w-[18%] -rotate-[18deg]",
  },
  {
    label: "Automation risk",
    detail: "task exposure by occupation",
    position: "right-4 bottom-8",
    connector: "right-[24%] bottom-[25%] w-[18%] rotate-[18deg]",
  },
];

export function AdminProtocolPanel({
  adminCsvColumns,
  adminCsvFileName,
  adminIscoColumn,
  protocolStatus,
  onPreviewCsvColumns,
  onSelectIscoColumn,
}: AdminProtocolPanelProps) {
  const [isIscoGroupsExpanded, setIsIscoGroupsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempIscoColumn, setTempIscoColumn] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [tempFile, setTempFile] = useState<File | undefined>();
  const [tempColumns, setTempColumns] = useState<string[]>([]);
  const [tempPrompt, setTempPrompt] = useState("");
  const [csvConfigurations, setCsvConfigurations] = useState<CsvConfiguration[]>([]);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    
    // Read CSV header to get column names
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    setTempFile(file);
    setTempColumns(headers);
    setTempIscoColumn(headers[0] || "");
    setSelectedFeatures([]);
    setTempPrompt("");
    setIsModalOpen(true);
  };

  const handleConfirmConfiguration = () => {
    if (tempFile) {
      const newConfig: CsvConfiguration = {
        fileName: tempFile.name,
        iscoColumn: tempIscoColumn,
        selectedFeatures: selectedFeatures,
        prompt: tempPrompt,
      };
      setCsvConfigurations(prev => [...prev, newConfig]);
      
      // Keep old behavior for compatibility
      onPreviewCsvColumns(tempFile);
      onSelectIscoColumn(tempIscoColumn);
      
      console.log("CSV Configuration:", newConfig);
    }
    setIsModalOpen(false);
  };

  const removeConfiguration = (index: number) => {
    setCsvConfigurations(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFeature = (column: string) => {
    setSelectedFeatures(prev =>
      prev.includes(column)
        ? prev.filter(f => f !== column)
        : [...prev, column]
    );
  };

  return (
    <section className="grid gap-5">
      <section className="overflow-hidden rounded-md border border-zinc-300 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Admin setup
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
            Data Lake Management
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            Partners upload CSVs with an `isco_code` column. The dashboard
            groups each row by the first digit, so wage, growth, education,
            training, and risk data all speak one shared occupation language.
          </p>
        </div>

        <div className="relative min-h-[34rem] overflow-hidden bg-[#f8faf8] p-4 sm:p-6">
          <div className="absolute inset-x-8 top-1/2 hidden h-px bg-zinc-300 md:block" />
          <div className="absolute inset-y-8 left-1/2 hidden w-px bg-zinc-300 md:block" />
          {diagramDataPoints.map((point) => (
            <div key={point.label}>
              <div
                className={`absolute hidden h-px origin-center bg-cyan-700/50 md:block ${point.connector}`}
              />
              <article
                className={`relative z-10 mb-3 rounded-md border border-zinc-300 bg-white p-3 shadow-sm md:absolute md:mb-0 md:w-52 ${point.position}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                  Data point
                </p>
                <h3 className="mt-2 font-semibold text-zinc-950">
                  {point.label}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {point.detail}
                </p>
              </article>
            </div>
          ))}

          <div className="relative z-20 mx-auto mt-4 grid max-w-sm place-items-center rounded-md border border-zinc-900 bg-zinc-950 px-5 py-8 text-center text-white shadow-lg md:absolute md:left-1/2 md:top-1/2 md:mt-0 md:-translate-x-1/2 md:-translate-y-1/2">
            <Hash className="size-8 text-cyan-200" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Primary key
            </p>
            <h3 className="mt-2 font-mono text-5xl font-semibold">ISCO</h3>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-zinc-300 bg-white shadow-sm">
        <button
          onClick={() => setIsIscoGroupsExpanded(!isIscoGroupsExpanded)}
          className="flex w-full items-center justify-between border-b border-zinc-200 px-4 py-3 text-left transition hover:bg-zinc-50"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              ISCO Directory
            </p>
            <h3 className="mt-1 text-xl font-semibold text-zinc-950">
              Learn about the 10 ISCO Groups
            </h3>
          </div>
          {isIscoGroupsExpanded ? (
            <ChevronUp className="size-5 text-zinc-400" />
          ) : (
            <ChevronDown className="size-5 text-zinc-400" />
          )}
        </button>
        {isIscoGroupsExpanded && (
          <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-5">
            {iscoMajorGroups.map((group) => (
              <article
                key={group.code}
                className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="grid h-10 w-10 place-items-center rounded-md bg-zinc-950 font-mono text-xl font-semibold text-white">
                    {group.code}
                  </p>
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
                    ISCO-{group.code}
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-semibold text-zinc-950">
                  {group.title}
                </h4>
                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  {group.example}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md border border-zinc-300 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-zinc-200 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              CSV intake UI
            </p>
            <h3 className="mt-1 text-xl font-semibold text-zinc-950">
              Upload CSVs and configure data sources
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Upload multiple CSV files, select the ISCO column, choose feature columns for recommendations, and add custom prompts for each data source.
            </p>
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-cyan-800">
            <Plus className="size-4" />
            Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => handleFileSelect(event.target.files?.[0])}
            />
          </label>
        </div>

        {csvConfigurations.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            No CSV files configured yet. Upload a CSV to get started.
          </div>
        ) : (
          <div className="grid gap-4 p-4">
            {csvConfigurations.map((config, index) => (
              <div key={index} className="rounded-md border border-zinc-200 bg-white">
                <div className="border-b border-zinc-200 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                        Data source {index + 1}
                      </p>
                      <h4 className="mt-1 break-all font-mono text-sm font-semibold text-zinc-950">
                        {config.fileName}
                      </h4>
                      {config.prompt && (
                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          <span className="font-semibold">Prompt:</span> {config.prompt}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeConfiguration(index)}
                      className="rounded-md p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      ISCO Column:
                    </span>
                    <span className="rounded bg-cyan-800 px-2 py-1 font-mono text-xs font-semibold text-white">
                      {config.iscoColumn}
                    </span>
                  </div>
                  {config.selectedFeatures.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Selected Features ({config.selectedFeatures.length})
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {config.selectedFeatures.map((feature) => (
                          <div
                            key={feature}
                            className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2"
                          >
                            <span className="break-all font-mono text-sm font-semibold text-cyan-950">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      No feature columns selected for recommendations
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {protocolStatus ? (
          <p className="border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600">
            {protocolStatus}
          </p>
        ) : null}
      </section>

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-zinc-300 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                  CSV Configuration
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-zinc-950">
                  Configure Data Import
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Select the ISCO column and choose which features to use for recommendations
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="grid gap-6">
                {/* ISCO Column Selection */}
                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-zinc-950">
                      ISCO Column <span className="text-red-600">*</span>
                    </span>
                    <p className="text-xs leading-5 text-zinc-600">
                      Select the column that contains the ISCO first-digit occupation code (0-9)
                    </p>
                    <select
                      value={tempIscoColumn}
                      onChange={(e) => setTempIscoColumn(e.target.value)}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/15"
                    >
                      {tempColumns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Feature Selection */}
                <div className="rounded-md border border-zinc-200 bg-white p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-zinc-950">
                      Recommendation Features
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      Select which data columns the system should use when making ISCO-based recommendations
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {tempColumns
                      .filter((column) => column !== tempIscoColumn)
                      .map((column) => {
                        const isSelected = selectedFeatures.includes(column);
                        return (
                          <button
                            key={column}
                            onClick={() => toggleFeature(column)}
                            className={`flex items-start gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                              isSelected
                                ? "border-cyan-600 bg-cyan-50"
                                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${
                                isSelected
                                  ? "border-cyan-600 bg-cyan-600"
                                  : "border-zinc-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="size-3 text-white" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`break-all font-mono text-sm font-semibold ${
                                  isSelected ? "text-cyan-950" : "text-zinc-950"
                                }`}
                              >
                                {column}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {selectedFeatures.length > 0 && (
                    <div className="mt-4 rounded-md bg-cyan-50 px-3 py-2">
                      <p className="text-xs font-semibold text-cyan-950">
                        {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                  )}
                </div>

                {/* Prompt Field */}
                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-zinc-950">
                      Custom Prompt
                    </span>
                    <p className="text-xs leading-5 text-zinc-600">
                      Add instructions or context to guide how this data should be used for ISCO recommendations
                    </p>
                    <textarea
                      value={tempPrompt}
                      onChange={(e) => setTempPrompt(e.target.value)}
                      placeholder="e.g., Use this data to prioritize local job opportunities and consider wage trends..."
                      rows={4}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/15"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-6 py-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConfiguration}
                disabled={!tempIscoColumn}
                className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                Confirm Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
