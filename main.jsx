import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './SalaryTicker.jsx';

// 给 SalaryTicker 用的 window.storage 做一个 localStorage 兜底实现，
// 这样代码就不需要外部宿主也能跑起来。
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key) {
      try { return { value: localStorage.getItem(key) }; } catch { return { value: null }; }
    },
    async set(key, value) {
      try { localStorage.setItem(key, value); } catch {}
    },
    async remove(key) {
      try { localStorage.removeItem(key); } catch {}
    },
  };
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
