require('dotenv').config();
const express = require('express');
const cors = require('cors');
const weatherRouter = require('./routes/weather');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/weather', weatherRouter);

// 반드시 라우트들 맨 아래에 둬요.
app.use(notFoundHandler);
app.use(errorHandler);

// 이 파일을 직접 실행할 때만 서버를 켜요. (테스트에서는 켜지 않아요.)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;