const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS headers for SharedArrayBuffer support
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve node_modules for ES modules
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('CORS headers enabled for SharedArrayBuffer support');
});