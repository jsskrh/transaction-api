const mongoose = require("mongoose");
const { creditAccount, debitAccount } = require("../utils/transactions");

const transfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { beneficiary, amount, summary } = req.body;
    const reference =
      Date.now().toString(36) +
      Math.floor(
        Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
      ).toString(36);
    const benefactor = req.user.username;
    if (!beneficiary || !benefactor || !amount || !summary) {
      return res.status(400).json({
        status: false,
        message:
          "Please login and provide the following details: benefactor, amount, summary",
      });
    }
    if (beneficiary === benefactor) {
      return res.status(400).json({
        status: false,
        message: "You cannot sent funds to yourself",
      });
    }

    const transferResult = await Promise.all([
      debitAccount({
        amount,
        username: benefactor,
        purpose: "transfer",
        reference,
        summary,
        transactionSummary: `TRANSFER TO: ${beneficiary}. TRANSACTION REF:${reference} `,
        session,
      }),
      creditAccount({
        amount,
        username: beneficiary,
        purpose: "transfer",
        reference,
        summary,
        transactionSummary: `TRANSFER FROM: ${benefactor}. TRANSACTION REF:${reference} `,
        session,
      }),
    ]);

    const failedTransactions = transferResult.filter(
      (result) => result.status !== true
    );
    if (failedTransactions.length) {
      const errors = failedTransactions.map((a) => a.message);
      await session.abortTransaction();
      return res.status(400).json({
        status: false,
        message: errors,
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      status: true,
      message: "Transfer successful",
      transactions: transferResult.map((result) => {
        return result.data.transaction[0];
      }),
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      status: false,
      message: `Unable to perform transfer. Please try again. \n Error: ${err}`,
    });
  }
};

const deposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount } = req.body;
    const reference =
      Date.now().toString(36) +
      Math.floor(
        Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
      ).toString(36);
    const user = req.user.username;
    const summary = `Deposit of ${amount}`;
    if (!user || !amount) {
      return res.status(400).json({
        status: false,
        message: "Please login and provide the following details: amount",
      });
    }

    const depositResult = await Promise.all([
      creditAccount({
        amount,
        username: user,
        purpose: "deposit",
        reference,
        summary,
        transactionSummary: `DEPOSIT TO: ${user}. TRANSACTION REF:${reference} `,
        session,
      }),
    ]);

    const failedTransactions = depositResult.filter(
      (result) => result.status !== true
    );
    if (failedTransactions.length) {
      const errors = failedTransactions.map((a) => a.message);
      await session.abortTransaction();
      return res.status(400).json({
        status: false,
        message: errors,
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      status: true,
      message: "Deposit successful",
      transaction: depositResult[0].data.transaction[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      status: false,
      message: `Unable to deposit funds. Please try again. \n Error: ${err}`,
    });
  }
};

const withdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount } = req.body;
    const reference =
      Date.now().toString(36) +
      Math.floor(
        Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
      ).toString(36);
    const user = req.user.username;
    const summary = `Withdrawal of ${amount}`;
    if (!user || !amount) {
      return res.status(400).json({
        status: false,
        message: "Please login and provide the following details: amount",
      });
    }

    const withdrawalResult = await Promise.all([
      debitAccount({
        amount,
        username: user,
        purpose: "withdrawal",
        reference,
        summary,
        transactionSummary: `WITHDRAW FROM: ${user}. TRANSACTION REF:${reference} `,
        session,
      }),
    ]);

    const failedTransactions = withdrawalResult.filter(
      (result) => result.status !== true
    );
    if (failedTransactions.length) {
      const errors = failedTransactions.map((a) => a.message);
      await session.abortTransaction();
      return res.status(400).json({
        status: false,
        message: errors,
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      status: true,
      message: "Withdrawal successful",
      transaction: withdrawalResult[0].data.transaction[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      status: false,
      message: `Unable to withdraw funds. Please try again. \n Error: ${err}`,
    });
  }
};

module.exports = { transfer, deposit, withdraw };
