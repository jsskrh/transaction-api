const Transactions = require('../models/transactions');
const mongoose = require('mongoose');
const { creditAccount, debitAccount } = require( '../utils/transactions');

const transfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction()
    try {
        const { beneficiary, amount, summary} = req.body;
        const reference = Date.now().toString(36) + Math.floor(Math.pow(10, 12) + Math.random() * 9*Math.pow(10, 12)).toString(36);
        const benefactor=req.user.username
        if (!beneficiary && !benefactor && !amount && !summary) {
            return res.status(400).json({
                status: false,
                message: 'Please login and provide the following details: benefactor, amount, summary'
            })
        }
        if (beneficiary === benefactor) {
            return res.status(400).json({
                status: false,
                message: 'You cannot sent money to yourself'
            })
        }
        

      const transferResult = await Promise.all([
        debitAccount(
          {amount, username:benefactor, purpose:"transfer", reference, summary,
          transactionSummary: `TRANSFER TO: ${beneficiary}. TRANSACTION REF:${reference} `, session}),
        creditAccount(
          {amount, username:beneficiary, purpose:"transfer", reference, summary,
          transactionSummary:`TRANSFER FROM: ${benefactor}. TRANSACTION REF:${reference} `, session})
      ]);

      const failedTransactions = transferResult.filter((result) => result.status !== true);
      if (failedTransactions.length) {
        const errors = failedTransactions.map(a => a.message);
        await session.abortTransaction();
        return res.status(400).json({
            status: false,
            message: errors
        })
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        status: true,
        message: 'Transfer successful'
    })
    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        return res.status(500).json({
            status: false,
            message: `Unable to find perform transfer. Please try again. \n Error: ${err}`
        })
    }
}

module.exports = { transfer };