import { apiInstance } from "@/lib/api";
import { AxiosError, toFormData } from "axios";
import { SBHM_UploadExcelSerializer } from "../types";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

const PATH = "/saderat-bank-health-monitoring/monitorings/upload_excel/";

type Input = {
    payload: SBHM_UploadExcelSerializer;
}

const upload_excel = async ({
    payload
}: Input) => {
    const formData = toFormData(payload)
    const response = await apiInstance.post(PATH, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        withAuthorization: true,
    });
    return response.data;
}

export const useUploadExcelApi = (options?: Omit<UseMutationOptions<void, AxiosError, Input>, "mutationFn">) => {
    return useMutation({
        mutationFn: upload_excel,
        ...options,
    });
}