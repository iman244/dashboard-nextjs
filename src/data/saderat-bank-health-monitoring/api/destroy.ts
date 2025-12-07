import { apiInstance } from "@/lib/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

type PathVariables = {
  id: number;
};

type Input = {
    pathVariables: PathVariables;
};

const PATH = ({ id }: PathVariables) =>
  `/saderat-bank-health-monitoring/monitorings/${id}/`;

const destroy = async ({ pathVariables }: Input) => {
  const response = await apiInstance.delete(PATH(pathVariables), {
    withAuthorization: true,
  });
  return response.data;
};

export const useDestroy_SBHM_API = (
  options?: Omit<
    UseMutationOptions<void, AxiosError, Input>,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: destroy,
    ...options,
  });
};
