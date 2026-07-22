export const API_BASE_URL = import.meta.env.DEV ? '' : 'https://packagemakerbackend.demandsetutours.com';

export const ENDPOINTS = {
  makers: '/api/maker/get-maker',
  updateMaker: (id) => `/api/maker/update-maker/${id}`,
  deleteMaker: (id) => `/api/maker/delete-maker/${id}`,
  updateMakerStatus: (id) => `/api/maker/update-status/${id}`,
  attendance: '/api/attendance',
};
