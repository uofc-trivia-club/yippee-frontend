import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "./gameSlice";
import { websocketMiddleware } from "../util/websocketMiddleware";
import websocketReducer from "./websocketSlice";

const store = configureStore({
  reducer: {
    websocket: websocketReducer,
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(websocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;