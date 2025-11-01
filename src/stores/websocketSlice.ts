import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
}

const initialState: WebSocketState = {
  isConnected: false,
  error: null,
};

const websocketSlice = createSlice({
  name: "websocket",
  initialState,
  reducers: {
    connect: (_state, _action: PayloadAction<string>) => {}, // middleware handles this
    disconnect: () => {},
    connectionOpened: (state) => {
      state.isConnected = true;
      state.error = null;
    },
    connectionClosed: (state) => {
      state.isConnected = false;
    },
    connectionError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isConnected = false;
    },
  },
});

export const { ...websocketActions } = websocketSlice.actions;

export default websocketSlice.reducer;
