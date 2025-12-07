import { _5_160_115_210_apiInstance } from "@/lib/api/5.160.115.210/5apiInstance";
import { ElectronicHealthRecord } from "../type";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const EHR_BY_NATIONAL_NUMBER_KEY = "ehr_by_national_number" as const;
const PATH = "/EHRByNationalNumber";

type EHRByNationalNumberParams = {
  nationalNumber: string;
  fromDate: string;
  toDate: string;
  patientType: string;
};

type EHRByNationalNumberApiInput = {
  params: EHRByNationalNumberParams;
};

export type EHRByNationalNumberApiResponse = ElectronicHealthRecord[];

export const ehr_by_national_number = async ({
  params,
}: EHRByNationalNumberApiInput) => {
  const response =
    await _5_160_115_210_apiInstance.get<EHRByNationalNumberApiResponse>(PATH, {
      params,
    });
  return response.data;
};

export const useEHRByNationalNumberApi = ({
  input,
  options,
}: {
  input: EHRByNationalNumberApiInput;
  options?: Omit<
    UseQueryOptions<
      EHRByNationalNumberApiResponse,
      AxiosError,
      EHRByNationalNumberApiResponse
    >,
    "queryKey" | "queryFn"
  >;
}) => {
  return useQuery({
    queryKey: [EHR_BY_NATIONAL_NUMBER_KEY, input.params.nationalNumber],
    queryFn: () => ehr_by_national_number(input),
    ...options,
  });
};
