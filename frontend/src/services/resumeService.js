import api from "./api";

export const resumeService = {
  getAll: async () => {
    const res = await api.get("/resume/");  // ✅ api.js adds /api prefix
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/resume/${id}`);  // ✅ Becomes /api/resume/10
    return res.data;
  },
  create: async (data) => {
    const res = await api.post("/resume/", data);  // ✅ Becomes /api/resume/
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/resume/${id}`, data);  // ✅ Becomes /api/resume/10
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/resume/${id}`);  // ✅ Becomes /api/resume/10
    return res.data;
  },
};