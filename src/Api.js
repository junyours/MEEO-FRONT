import axios from "axios";

const api = axios.create({
   baseURL: 'https://opolmisor.com/BackEnd/public/api',
//  baseURL: "http://127.0.0.1:8000/api" ,
 withCredentials: true, // Enable sending cookies with requests
});

  //  baseURL: 'https://opol.site/Backend/Capstone_Backend/public/api',
// baseURL: "http://127.0.0.1:8000/api"

api.interceptors.request.use(config => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}); 

export default api;
