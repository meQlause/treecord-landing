import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Landing } from './features/landing/landing.page';
import './styles.css';

// StrictMode is on: the landing builds its WebGL stage and scroll story only after the fonts load, and an
// unmount that comes first cancels the build, so the dev-only double mount builds exactly once.
const host = document.getElementById('root');
if (host) {
  createRoot(host).render(
    <StrictMode>
      <Landing />
    </StrictMode>,
  );
}
