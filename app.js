import mongoose from 'mongoose';
import express from 'express';
import { myBankApi } from './routers/myBankApi.js';

const urlConection =
  'mongodb+srv://' +
  process.env.USER_DB +
  ':' +
  process.env.USER_PWD +
  '@cluster0.qe3zr.mongodb.net/' +
  process.env.BASE +
  '?retryWrites=true&w=majority';
console.log(urlConection);

//Conecta com o banco.
(async () => {
  try {
    //Conecta com a varivael de conexao
    await mongoose.connect(urlConection, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado com o MongoDB');
  } catch (err) {
    console.log('Erro ao conectar ao mongo db atlas' + err);
  }
})();

const app = express();
app.use(express.json());
app.use(myBankApi);

app.listen(3000, () => console.log('API iniciada'));
