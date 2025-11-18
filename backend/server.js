import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.post('/api/chat', (req, res) => {
    const userMessage = req.body.message;

    console.log("User said: ", userMessage);

    return res.json({
        reply: "This is Tina's backend reply(dummy)."
    });
})

app.listen(4000, () => console.log('Server running on port 4000'));