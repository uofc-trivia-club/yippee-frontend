import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Button, ThemeProvider, createTheme } from "@mui/material";
import type { Dispatch, SetStateAction } from 'react';

import { BubbleBackground } from "./components/common";
import CreateQuiz from "./pages/CreateQuiz";
import Home from "./pages/Home";
import HostGame from "./pages/HostGame";
import JoinGame from "./pages/JoinGame";
import LobbyRoom from "./pages/Game";
import { Navbar } from "./components/layout";
import Resources from "./pages/Resources";
import { SignIn, SignUp } from "./components/user";
import styles from './App.module.css';
import { useState } from "react";

const themes = {
  pink: createTheme({
    palette: {
      primary: { main: '#FF6B95', light: '#FF9A8B', dark: '#E64A79' },
      secondary: { main: '#ec407a', light: '#f48fb1', dark: '#c2185b' },
      success: { main: '#66bb6a', light: '#81c784', dark: '#388e3c' },
      error: { main: '#f44336', light: '#e57373', dark: '#d32f2f' },
      warning: { main: '#ffa726', light: '#ffb74d', dark: '#f57c00' },
      info: { main: '#29b6f6', light: '#4fc3f7', dark: '#0288d1' },
      background: {
        default: '#fff5f5',
        paper: '#ffffff',
      },
      text: {
        primary: '#333333',
        secondary: '#666666',
        disabled: '#999999',
      },
    },
  }),
  blue: createTheme({
    palette: {
      primary: { main: '#1976d2', light: '#64b5f6', dark: '#0d47a1' },
      secondary: { main: '#03a9f4', light: '#4fc3f7', dark: '#01579b' },
      success: { main: '#4caf50', light: '#81c784', dark: '#2e7d32' },
      error: { main: '#e53935', light: '#ef5350', dark: '#c62828' },
      warning: { main: '#ff9800', light: '#ffb74d', dark: '#e65100' },
      info: { main: '#2196f3', light: '#64b5f6', dark: '#0d47a1' },
      background: {
        default: '#f5f8fa',
        paper: '#ffffff',
      },
      text: {
        primary: '#2c3e50',
        secondary: '#546e7a',
        disabled: '#90a4ae',
      },
    },
  }),
  purple: createTheme({
    palette: {
      primary: { main: '#7B1FA2', light: '#9C27B0', dark: '#6A1B9A' },
      secondary: { main: '#BA68C8', light: '#CE93D8', dark: '#8E24AA' },
      success: { main: '#66bb6a', light: '#81c784', dark: '#388e3c' },
      error: { main: '#f44336', light: '#e57373', dark: '#d32f2f' },
      warning: { main: '#ffa726', light: '#ffb74d', dark: '#f57c00' },
      info: { main: '#29b6f6', light: '#4fc3f7', dark: '#0288d1' },
      background: {
        default: '#f5f0ff',
        paper: '#ffffff',
      },
      text: {
        primary: '#3a3a3a',
        secondary: '#666666',
        disabled: '#999999',
      },
    },
  }),
  dark: createTheme({
    palette: {
      mode: 'dark',
      primary: { main: '#2196f3', light: '#64b5f6', dark: '#0d47a1' }, // More saturated blue
      secondary: { main: '#f48fb1', light: '#f8bbd0', dark: '#c2185b' },
      success: { main: '#81c784', light: '#a5d6a7', dark: '#388e3c' },
      error: { main: '#f44336', light: '#e57373', dark: '#d32f2f' },
      warning: { main: '#ffb74d', light: '#ffe0b2', dark: '#f57c00' },
      info: { main: '#64b5f6', light: '#bbdefb', dark: '#1976d2' },
      background: {
        default: '#121212',
        paper: '#1f1f1f',
      },
      text: {
        primary: '#ffffff',
        secondary: '#b0bec5',
        disabled: '#6c7a89',
      },
    },
  }),
};

type ThemeName = 'pink' | 'blue' | 'purple' | 'dark';
function AppRoutes({ theme, setTheme }: { theme: ThemeName, setTheme: Dispatch<SetStateAction<ThemeName>> }) {
  return (
    <div className="App">
      <BubbleBackground />
      <div className="navbar">
        <Navbar theme={theme} setTheme={setTheme} />
      </div>
      <div className={styles.contentContainer}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/host" element={<HostGame />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/:roomCode" element={<LobbyRoom />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<ThemeName>('pink');
  return (
    <ThemeProvider theme={themes[theme]}>
      <BrowserRouter>
        <AppRoutes theme={theme} setTheme={setTheme} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;