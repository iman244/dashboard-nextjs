import { apiInstance } from "@/lib/api";
import { SBHM_RetrieveSerializer } from "../types";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

type PathVariables = {
  id: number;
};

type Input = {
  pathVariables: PathVariables;
};

type ApiResponse = SBHM_RetrieveSerializer;

const PATH = ({ id }: PathVariables) =>
  `/saderat-bank-health-monitoring/monitorings/${id}/`;

const retrieve = async ({ pathVariables }: Input) => {
  const response = await apiInstance.get<ApiResponse>(PATH(pathVariables), {
    withAuthorization: true,
  });
  return response.data;
};

export const RETRIEVE_SBHM_QUERY_KEY = ({ id }: PathVariables) => [
  "saderat-bank-health-monitoring",
  id,
];
export const useRetrieve_SBHM_API = ({
  input,
  options,
}: {
  input: Input;
  options?: Omit<
    UseQueryOptions<ApiResponse, AxiosError, ApiResponse>,
    "queryKey" | "queryFn"
  >;
}) => {
  return useQuery({
    queryKey: RETRIEVE_SBHM_QUERY_KEY(input.pathVariables),
    queryFn: () => retrieve(input),
    ...options,
  });
};
