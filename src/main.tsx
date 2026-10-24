import { createRoot } from 'react-dom/client';
import { Landing } from './landing/Landing';
import './styles.css';

// No StrictMode: the landing builds a WebGL context and scroll timelines on mount, and the beats' markup is
// mutated by SplitText, so the dev-only double mount would build on already-split DOM.
const host = document.getElementById('root');
if (host) {
  createRoot(host).render(<Landing />);
}
