import { GoogleGenerativeAI } from '@google/generative-ai';

export const getGoogleAI = () => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
}; 