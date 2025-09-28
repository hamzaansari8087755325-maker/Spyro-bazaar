const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api', routes);

const PORT = process.env.PORT || 4000;
async function start(){ await sequelize.sync({ alter: true }); console.log('DB synced'); app.listen(PORT, ()=> console.log(`Backend running http://localhost:${PORT}/api`)); }
start();