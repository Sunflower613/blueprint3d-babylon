// This indirection gives Vite one canonical URL for app.js even though EditorUi
// currently imports app.js back through a circular dependency.
import './app.js';
