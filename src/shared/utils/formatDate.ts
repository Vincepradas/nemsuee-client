export const formatDateTime = (value: string | number | Date) =>
  new Date(value).toLocaleString();
