"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { clearUser } from "./slices/user";
import api from "@/lib/axios";

const validateToken = async () => {
  try {
    const response = await api.get("/api/users/me");
    if (response.status === 401) {
      store.dispatch(clearUser());
      await persistor.purge();
    }
  } catch (error) {
    store.dispatch(clearUser());
    await persistor.purge();
  }
};

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}
        onBeforeLift={validateToken}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
