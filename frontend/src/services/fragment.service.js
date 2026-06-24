import api from './api';

export const uploadFragments = async (caseId, files) => {
  const formData = new FormData();
  formData.append('caseId', caseId);
  files.forEach(file => {
    formData.append('fragments', file.file);
  });

  const response = await api.post('/fragments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getFragmentsByCase = async (caseId) => {
  const response = await api.get(`/fragments/case/${caseId}`);
  return response.data.data.fragments;
};
