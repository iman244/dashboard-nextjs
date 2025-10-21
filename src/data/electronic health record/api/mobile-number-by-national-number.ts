import { _5_160_115_210_apiInstance } from "@/lib/api/5.160.115.210/5apiInstance";

export const PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY =
  "pdd_mobile_number_by_national_number" as const;
const PATH = "/EHRGetMobileNumberByNationalNumber";

export type ApiInput = {
  params: {
    nationalNumber: string;
  };
};

export type MobileNumberByNationalNumberApiResponse = {
  MobileNumber: string;
  FirstName: string;
  LastName: string;
}[];

export const mobile_number_by_national_number = async ({
  params,
}: ApiInput) => {
  const response =
    await _5_160_115_210_apiInstance.get<MobileNumberByNationalNumberApiResponse>(
      PATH,
      {
        params: {
          ...params,
          patientType: "1",
        },
      }
    );
  return response.data;
};
