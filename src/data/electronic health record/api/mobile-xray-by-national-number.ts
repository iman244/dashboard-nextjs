import { _5_160_115_210_apiInstance } from "@/lib/api/5.160.115.210/5apiInstance";

export const PDD_MOBILE_XRAY_BY_NATIONAL_NUMBER_KEY =
  "pdd_mobile_xray_by_national_number" as const;
const PATH = "/PDDMobileXRayByNationalNumber";

export type ApiInput = {
  params: {
    nationalNumber: string;
    receptionID: string;
  };
};

export type MobileXRayByNationalNumberApiResponse = string;

export const mobile_xray_by_national_number = async ({
  params,
}: ApiInput) => {
  const response =
    await _5_160_115_210_apiInstance.get<MobileXRayByNationalNumberApiResponse>(
      PATH,
      {
        params,
      }
    );
  return response.data;
};
