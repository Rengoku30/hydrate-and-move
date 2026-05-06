import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/globals.css';
import { Reminder } from './Reminder';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Reminder />
    </StrictMode>,
  );
}
