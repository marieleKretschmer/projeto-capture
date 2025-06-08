import mime from 'mime';
import api from './api';

export async function listOCR({ page = 1, limit = 10, busca = '' }) {
  console.log('aqui');
  const response = await api.get('/ocr/listOcr', {
    params: { page, limit, busca },
  });
  console.log(response);
  return response.data;
}

export async function sendImageOCR(asset) {
  const uri = asset.uri;
  const name = asset.fileName || uri.split('/').pop() || 'image.jpg';
  const type = mime.getType(uri) || 'image/jpeg';

  if (!type.startsWith('image/')) {
    throw new Error('O arquivo selecionado não é uma imagem válida.');
  }

  const formData = new FormData();
  const image = {
    uri: uri,
    name: name,
    type: type,
  }
  formData.append('image', image);

  const response = await api.postForm('/ocr/upload', formData);
  return response.data;
}

export async function saveOCR(data) {
  try {
    const response = await api.post('/ocr/save', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao salvar OCR:', error.response?.data || error.message);
    throw error;
  }
}

export const getOCRById = async (id) => {
  const response = await api.get(`/ocr/${id}`);
  return response.data;
};

export const updateOCR = async (id, data) => {
  const response = await api.put(`/ocr/update/${id}`, data);
  return response.data;
};

export const deleteOCR = async (id) => {
  const response = await api.delete(`/ocr/${id}`);
  return response.data;
};