const express = require('express');
const app = express();
const PORT = 8080;

app.use(express.static('public'));

app.get('/api/test', (req, res) => {
    res.json({ message: "API funcionando" });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});