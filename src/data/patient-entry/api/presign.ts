import { apiInstance } from "@/lib/api";

const PATH = "/saderat-bank-health-monitoring/patient-entries/presign/";

export type PresignInput = {
  monitoring: number;
  national_id: string;
  field_key: string;
  filename: string;
  content_type: string;
  size: number;
};

export type PresignResult = {
  upload_url: string;
  key: string;
  headers: Record<string, string>;
  expires_in: number;
};

export const presign = async (input: PresignInput) => {
  const response = await apiInstance.post<PresignResult>(PATH, input, {
    withAuthorization: true,
  });
  return response.data;
};
