const Users = require("../models/users");
const Transactions = require("../models/transactions");

const creditAccount = async ({
  amount,
  username,
  purpose,
  reference,
  summary,
  transactionSummary,
  session,
}) => {
  const user = await Users.findOne({ username });
  if (!user) {
    return {
      status: false,
      statusCode: 404,
      message: `User ${username} doesn\'t exist`,
    };
  }

  const updatedUser = await Users.findOneAndUpdate(
    { username },
    { $inc: { balance: amount } },
    { session }
  );

  const transaction = await Transactions.create(
    [
      {
        transactionType: "CR",
        purpose,
        amount,
        username,
        reference,
        balanceBefore: Number(user.balance),
        balanceAfter: Number(user.balance) + Number(amount),
        summary,
        transactionSummary,
      },
    ],
    { session }
  );

  console.log(`Credit successful`);
  return {
    status: true,
    statusCode: 201,
    message: "Credit successful",
    data: { updatedUser, transaction },
  };
};

const debitAccount = async ({
  amount,
  username,
  purpose,
  reference,
  summary,
  transactionSummary,
  session,
}) => {
  const user = await Users.findOne({ username });
  if (!user) {
    return {
      status: false,
      statusCode: 404,
      message: `User ${username} doesn\'t exist`,
    };
  }

  if (Number(user.balance) < amount) {
    return {
      status: false,
      statusCode: 400,
      message: `User ${username} has insufficient balance`,
    };
  }

  const updatedUser = await Users.findOneAndUpdate(
    { username },
    { $inc: { balance: -amount } },
    { session }
  );
  const transaction = await Transactions.create(
    [
      {
        transactionType: "DR",
        purpose,
        amount,
        username,
        reference,
        balanceBefore: Number(user.balance),
        balanceAfter: Number(user.balance) - Number(amount),
        summary,
        transactionSummary,
      },
    ],
    { session }
  );

  console.log(`Debit successful`);
  return {
    status: true,
    statusCode: 201,
    message: "Debit successful",
    data: { updatedUser, transaction },
  };
};

module.exports = {
  creditAccount,
  debitAccount,
};
