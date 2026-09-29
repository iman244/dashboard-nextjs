import { apiInstance } from "@/lib/api";
import { AxiosError, toFormData } from "axios";
import { SBHM_UploadExcelSerializer } from "../types";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

const PATH = "/saderat-bank-health-monitoring/monitorings/upload_excel/";

type Input = {
    payload: SBHM_UploadExcelSerializer;
}

/** One upload problem, as Django reports it: a code plus details, never a sentence. */
export type UploadIssue =
  | { level: "error"; code: "unreadable"; detail: string }
  | { level: "warning"; code: "no_rows" }
  | { level: "warning"; code: "missing_id_column"; column: string; found: string[]; looks_like?: string }
  | { level: "warning"; code: "no_id_column" }
  | { level: "warning"; code: "blank_ids"; count: number; rows: number[] }
  | { level: "warning"; code: "invalid_ids"; count: number; rows: { row: number; value: string }[] }
  | { level: "warning"; code: "duplicate_ids"; count: number; groups: { value: string; rows: number[] }[] }
  | { level: "warning"; code: "missing_columns"; columns: string[] };

export type UploadExcelResult = { message: string; id: number; issues: UploadIssue[] };

const upload_excel = async ({
    payload
}: Input) => {
    const formData = toFormData(payload)
    const response = await apiInstance.post<UploadExcelResult>(PATH, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        withAuthorization: true,
    });
    return response.data;
}

export const useUploadExcelApi = (options?: Omit<UseMutationOptions<UploadExcelResult, AxiosError, Input>, "mutationFn">) => {
    return useMutation({
        mutationFn: upload_excel,
        ...options,
    });
}