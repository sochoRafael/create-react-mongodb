import express from 'express';
import { accountModel } from '../models/accountModel.js';

const app = express();

//Todas contas
app.get('/account', async (req, res) => {
  try {
    const account = req.body;

    let allAccount = await accountModel.find();
    res.send(allAccount);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Item04 - Depósito
app.patch('/account/deposit', async (req, res) => {
  try {
    const account = req.body;
    const { balance } = account;

    let newDeposit = await validateAccount(account);

    newDeposit.balance += Number(balance); //Somo o valor atual do balance mais o enviado por requisição
    newDeposit = new accountModel(newDeposit);
    newDeposit.save();

    res.send(newDeposit);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Item 05 - Saque
app.patch('/account/draft', async (req, res) => {
  try {
    const account = req.body;
    const { balance } = account;

    let taxDraft = 1;
    let newDraft = await validateAccount(account);

    newDraft.balance = newDraft.balance - balance - taxDraft;
    newDraft = new accountModel(newDraft);

    newDraft.save();

    res.send(newDraft);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Item 06 - Saldo
app.get('/account/balance', async (req, res) => {
  try {
    const account = req.body;
    const { conta, agencia, saldo } = account;
    let getBalance = await validateAccount(account);

    res.send('Saldo atual: R$ ' + getBalance.balance);
  } catch (err) {
    res.status(500).send('Erro ao consultar o saldo ' + err.message);
  }
});

// Item 07 - Deletar Conta
app.delete('/account/deleteAccount', async (req, res) => {
  try {
    const account = req.body;
    const { agencia, conta } = account;

    let getAccount = await validateAccount(account);

    const deleteAccount = await accountModel.deleteOne({
      conta: conta,
      agencia: agencia,
    });

    getAccount = await accountModel.find({ balance: { $gt: 0 } }).length;

    if (!getAccount) {
      res
        .status(404)
        .send(
          'Erro ao consultar as contas ativas após a exclusão da conta ' +
            conta +
            ' agencia ' +
            agencia
        );
    } else {
      res.send(`Total de contas ativas: ${getAccount}`);
    }
  } catch (err) {
    res.status(500).send('Erro ao excluir a conta/agencia' + err.message);
  }
});

//Item 08 - Transferencia
app.patch('/account/transferBetweenAccounts', async (req, res) => {
  try {
    const accounts = req.body;
    const transferRate = 8;

    let sourceAccount = accounts.conta_orig;
    let targetAccount = accounts.conta_dest;

    let getSourceAccount = await validateAccount({
      agencia: sourceAccount.agencia,
      conta: sourceAccount.conta,
    });

    let getTargetAccount = await validateAccount({
      agencia: targetAccount.agencia,
      conta: targetAccount.conta,
    });

    if (
      getSourceAccount.agencia != getTargetAccount.agencia ||
      getSourceAccount.conta != getTargetAccount.conta
    ) {
      getSourceAccount.balance =
        getSourceAccount.balance - Number(sourceAccount.balance) - transferRate;
      getSourceAccount = new accountModel(getSourceAccount);
      getSourceAccount.save();

      //transfere o valor para a conta destino
      getTargetAccount.balance += Number(sourceAccount.balance);
      getTargetAccount = new accountModel(getTargetAccount);
      getTargetAccount.save();

      res.send('O saldo atual da conta é R$' + getSourceAccount.balance);
    } else {
      getSourceAccount.balance =
        getSourceAccount.balance - Number(sourceAccount.balance);
      getSourceAccount = new accountModel(getSourceAccount);
      getSourceAccount.save();

      //transfere o valor para a conta destino
      getTargetAccount.balance += Number(sourceAccount.balance);
      getTargetAccount = new accountModel(getTargetAccount);
      getTargetAccount.save();
    }
    res.send('O saldo atual da conta é R$' + getSourceAccount.balance);
  } catch (err) {
    res
      .status(500)
      .send(
        'Erro ao realizar a transferencia entre as contas, error: ' +
          err.message
      );
  }
});

//Função para verificar se a conta Existe
async function validateAccount(account) {
  try {
    const { agencia, conta } = account;
    const filterAccount = { agencia, conta };

    account = await accountModel.findOne(filterAccount);

    if (!account) {
      return `(${agencia}/${conta}) agencia/conta invalida`;
    }
    return account;
  } catch (err) {
    return err.message;
  }
}

//Item 09 - Média do saldo por agencia
app.get('/account/balanceAverage', async (req, res) => {
  try {
    const agencia = Number(req.body.agencia);

    const averageBalance = await accountModel.aggregate([
      {
        $match: {
          agencia: agencia,
        },
      },
      {
        $group: {
          _id: '$agencia',
          balance: { $avg: '$balance' },
        },
      },
    ]);

    if (averageBalance.length === 0) {
      throw new Error('agencia nao encontrada');
    }

    res.send(averageBalance);
  } catch (err) {
    res
      .status(500)
      .send('Erro ao calcular media de saldos , error: ' + err.message);
  }
});

//Item 10 -> Menores clientes
app.get('/account/smallestCustomers', async (req, res) => {
  try {
    const qtdeClients = req.body.qtdeClients;

    const smallestCustomers = await accountModel
      .find({}, { _id: 0, agencia: 1, conta: 1, balance: 1 })
      .limit(qtdeClients)
      .sort({ balance: 1 });
    res.send(smallestCustomers);
  } catch (err) {
    res
      .status(500)
      .send('Erro ao listar menores clientes, error: ' + err.message);
  }
});

//Item 11 -> Maiores clientes
app.get('/account/biggestCustomers', async (req, res) => {
  try {
    let accountPrivate = 99;
    const qtdeClients = req.body.qtdeClients;

    const biggestCustomers = await accountModel
      .find({}, { _id: 0, agencia: 1, conta: 1, name: 1, balance: 1 })
      .limit(qtdeClients)
      .sort({ balance: -1, name: 1 });
    res.send(biggestCustomers);
  } catch (err) {
    res
      .status(500)
      .send('Erro ao listar menores clientes, error: ' + err.message);
  }
});

//Item 12 -> Transferir maiores saldo para agencia 99
app.get('/account/transferLargerBalances', async (req, res) => {
  try {
    let transferToPrivates = await accountModel.aggregate([
      {
        $group: {
          _id: '$agencia',
          balance: { $max: '$balance' },
        },
      },
    ]);

    for (const transferToPrivate of transferToPrivates) {
      const { _id, balance } = transferToPrivate;
      let newAccounts = await accountModel.findOne({
        agencia: _id,
        balance,
      });
      newAccounts.agencia = 99;
      newAccounts.save();
    }
    transferToPrivates = await accountModel.find({
      agencia: 99,
    });
    res.send(transferToPrivates);
  } catch (err) {
    res
      .status(500)
      .send('Erro ao transferir saldo privado, error: ' + err.message);
  }
});
export { app as myBankApi };
