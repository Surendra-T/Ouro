import { useMutation, useQuery } from "@tanstack/react-query";

import {
  CollectionStatsResponse,
  GraphResearchRequest,
  GraphResearchResponse,
  HealthReadyResponse,
  HealthResponse,
  IngestRequest,
  IngestResponse,
  RetrieveRequest,
  RetrieveResponse,
  UploadResponse,
} from "./types";
import { apiRequest, apiUpload } from "./client";
import { estimateTokens } from "../utils/format";

export const useHealthLive = () => {
  return useQuery({
    queryKey: ["health", "live"],
    queryFn: async () => (await apiRequest<HealthResponse>("/health/live")).data,
    refetchInterval: 30_000,
  });
};

export const useHealthReady = () => {
  return useQuery({
    queryKey: ["health", "ready"],
    queryFn: async () => (await apiRequest<HealthReadyResponse>("/health/ready")).data,
    refetchInterval: 30_000,
    retry: false,
  });
};

export const useStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => (await apiRequest<CollectionStatsResponse>("/stats")).data,
    refetchInterval: 60_000,
  });
};

export const useUploadPdf = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiUpload<UploadResponse>("/upload", formData);
      return response.data;
    },
  });
};

export const useIngestPdf = () => {
  return useMutation({
    mutationFn: async (payload: IngestRequest) => {
      const response = await apiRequest<IngestResponse>("/ingest", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.data;
    },
  });
};

export const useRetrieve = () => {
  return useMutation({
    mutationFn: async (payload: RetrieveRequest) => {
      const response = await apiRequest<RetrieveResponse>("/retrieve", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.data;
    },
  });
};

export const useResearch = () => {
  return useMutation({
    mutationFn: async (payload: GraphResearchRequest) => {
      const started = performance.now();
      const response = await apiRequest<GraphResearchResponse>("/research", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const durationMs = performance.now() - started;
      const tokens = estimateTokens(response.data.synthesis || "");
      return {
        data: response.data,
        requestId: response.requestId,
        durationMs,
        tokenEstimate: tokens,
      };
    },
  });
};
