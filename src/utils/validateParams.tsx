export const ALLOWED_PARAMS: Record<string, (value: string | null) => boolean> = {
    date: (value) => {
      if (!value) return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  
      const date = new Date(value);
      return !isNaN(date.getTime()); 
    },
  };
  
  export const validateParams = (params: URLSearchParams): string | null => {
    const keys = Array.from(params.keys());
  
    const invalidKey = keys.find((key) => !ALLOWED_PARAMS[key]);
    if (invalidKey) return `Parámetro no permitido: ${invalidKey}`;
  
    const invalidValueKey = keys.find((key) => !ALLOWED_PARAMS[key](params.get(key)));
    if (invalidValueKey) return `Formato inválido en ${invalidValueKey}`;
  
    return null;
  };
  