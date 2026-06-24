import api from './api';

export const getCases = async () => {
  const response = await api.get('/cases');
  return response.data.data.cases;
};

export const createCase = async (caseData) => {
  const response = await api.post('/cases', caseData);
  return response.data.data.case;
};

export const getCaseById = async (id) => {
  const response = await api.get(`/cases/${id}`);
  return response.data.data.case;
};
