
import api from "./api";

export async function getVouchers(params = {}) {
  const response = await api.get("/vouchers", { params });
  return response.data;
}

export async function getVoucher(id) {
  const response = await api.get(`/vouchers/${id}`);
  return response.data;
}

export async function createVoucher(data) {
  const response = await api.post("/vouchers", data);
  return response.data;
}

export async function updateVoucher(id, data) {
  const response = await api.put(`/vouchers/${id}`, data);
  return response.data;
}

export async function deleteVoucher(id) {
  const response = await api.delete(`/vouchers/${id}`);
  return response.data;
}

export async function uploadEmployeeSignature(id, file) {
  const formData = new FormData();
  formData.append("signature", file);

  const response = await api.patch(
    `/vouchers/${id}/employee-signature`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
}

export async function submitVoucher(id) {
  const response = await api.patch(`/vouchers/${id}/submit`);
  return response.data;
}



export async function getVoucherSignature(id, kind) {
  const response = await api.get(
    `/vouchers/${id}/signature/${kind}`,
    { responseType: "blob" }
  );

  return URL.createObjectURL(response.data);
}
