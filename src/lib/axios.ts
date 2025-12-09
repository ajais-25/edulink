import axios from "axios";
import { persistor, store } from "@/redux/store";
import { clearUser } from "@/redux/slices/user";

const api = axios.create();

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch clearUser action to Redux store
      store.dispatch(clearUser());
      await persistor.purge();
    }
    return Promise.reject(error);
  }
);

export default api;
