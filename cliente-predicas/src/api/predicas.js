import { request } from "./client";

export const getPredicas = () => request("/api/predicas");

export const updatePredica = (id, { titulo, predicador, fecha, password }) =>
  request(`/api/predicas/${id}`, {
    method: "PUT",
    body: { titulo, predicador, fecha, password },
  });

export const getStats = () => request("/api/stats");

export const getDriveId = (url) => {
  if (!url) return null;
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) return matchD[1];
  const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  return null;
};
