// src/hooks/useQueryParams.ts
import { useLocation } from "react-router-dom";
import { validateParams } from "../utils/validateParams";

export const useQueryParams = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const errorMessage = validateParams(params);
  return { params, errorMessage };
};
