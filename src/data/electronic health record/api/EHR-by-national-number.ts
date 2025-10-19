import { _5_160_115_210_apiInstance } from "@/lib/api/5.160.115.210/5apiInstance";
import { ElectronicHealthRecord } from "../type";

export const EHR_BY_NATIONAL_NUMBER_KEY = "ehr_by_national_number" as const;
const PATH = "/EHRByNationalNumber";

export type EHRByNationalNumberApiResponse = ElectronicHealthRecord[];

export const ehr_by_national_number = async ({
  params,
}: {
  params: {
    nationalNumber: string;
    fromDate: string;
    toDate: string;
    patientType: string;
  };
}) => {
  const response =
    await _5_160_115_210_apiInstance.get<EHRByNationalNumberApiResponse>(PATH, {
      params,
    });
  return response.data;
};
