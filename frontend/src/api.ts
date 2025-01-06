import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

export const startGame = (player: string) => {
  return axios.post(`${API_BASE_URL}/start`, { player });
};

export const submitAnswer = (answer: string, player: string) => {
  return axios.post(`${API_BASE_URL}/submit-answer`, { answer, player });
};

export const pauseGame = () => {
  return axios.post(`${API_BASE_URL}/pause`);
};

export const resumeGame = () => {
  return axios.post(`${API_BASE_URL}/resume`);
};

export const getGameState = (player: string) => {
  return axios.get(`${API_BASE_URL}/state?player=${player.toLowerCase()}`);
};

export const getLeaderboard = () => {
  return axios.get(`${API_BASE_URL}/leaderboard`);
};