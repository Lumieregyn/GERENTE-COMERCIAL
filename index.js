
require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.get('/qr', (req, res) => {
    res.send('QR Code route OK');
});

app.post('/conversa', (req, res) => {
    console.log("Payload recebido:", req.body);
    res.status(200).send('Rota /conversa recebida com sucesso!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
