export type HealthResponse = {
  status: string;
  app_name: string;
  app_version: string;
};

export type HealthReadyResponse = {
  status: string;
  checks: Record<string, { status: string; detail?: string }>;
};

export type CollectionStatsResponse = {
  collection_name: string;
  document_count: number;
  persist_directory: string;
  embedding_model: string;
  embedding_device: string;
  chunk_size: number;
  chunk_overlap: number;
  ocr_enabled: boolean;
  ocr_language?: string | null;
  ocr_dpi?: number | null;
};

export type UploadResponse = {
  status: string;
  filename: string;
  stored_filename: string;
  file_path: string;
  content_type: string;
  size_bytes: number;
};

export type IngestRequest = {
  file_path: string;
};

export type IngestResponse = {
  status: string;
  source_file: string;
  pages_indexed: number;
  chunks_indexed: number;
  persist_directory: string;
};

export type RetrieveRequest = {
  query: string;
  source: string;
  k: number;
};

export type RetrievedChunk = {
  content: string;
  metadata: Record<string, unknown>;
};

export type RetrieveResponse = {
  status: string;
  query: string;
  source: string;
  k: number;
  results: RetrievedChunk[];
};

export type GraphResearchRequest = {
  query: string;
  source: string;
  k: number;
};

export type GraphResearchResponse = {
  query: string;
  source: string;
  k: number;
  retrieved_chunks: RetrievedChunk[];
  synthesis: string;
  critique: string;
  supported: boolean;
  error?: string | null;
};
