import { _5_160_115_210_ADDRESS, _5_160_115_210_API_PATH } from "@/settings";
import axios from "axios";

export const _5_160_115_210_apiInstance = axios.create({
  baseURL: _5_160_115_210_ADDRESS + _5_160_115_210_API_PATH,
});