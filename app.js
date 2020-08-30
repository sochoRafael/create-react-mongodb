import mongoose from 'mongoose';
import express from 'express';
import { myBankApi } from './routers/myBankApi.js';

//Conecta com o banco.
(async () => {
  try {
    //string de conexão mongodb+srv://socho:<password>@cluster0.qe3zr.mongodb.net/<dbname>?retryWrites=true&w=majority
    await mongoose.connect(
      'mongodb+srv://socho:socho@cluster0.qe3zr.mongodb.net/bank?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Conectado com o MongoDB');
  } catch (err) {
    console.log('Erro ao conectar ao mongo db atlas' + err);
  }
})();

const app = express();
app.use(express.json());
app.use(myBankApi);

app.listen(3000, () => console.log('API iniciada'));
