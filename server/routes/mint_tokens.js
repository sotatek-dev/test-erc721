const express = require('express');
const router = express.Router();
const EthereumTx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
const rpcUrl = `https://${process.env.NETWORK}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
const contractABI = require('../../token/build/contracts/CryptoChocobo.json').abi;

/* GET users listing. */
router.get('/', async function(req, res, next) {
  const minterAccount = web3.eth.accounts.privateKeyToAccount(process.env.MINTER_PRIVATE_KEY);
  console.log(`Mint token: minter=${minterAccount.address} params=${JSON.stringify(req.query)}`);

  const { address, tokenId, contractAddress } = req.query;
  if (!web3.utils.isAddress(address)) {
    return res.render('mint_result', { result: `Invalid address: ${address}` });
  }

  const parsedTokenId = parseInt(tokenId);
  if (isNaN(parsedTokenId)) {
    return res.render('mint_result', { result: `Invalid tokenId: ${tokenId}` });
  }

  try {
    const txid = await _mintToken(minterAccount, { address, tokenId, contractAddress });
    res.render('mint_result', { result: `Submitted tx: ${txid}` });
  } catch (e) {
    console.error(e);
    res.render('mint_result', { result: `ERROR: ${e.toString()}` });
  }
});

async function _mintToken(minterAccount, { address, tokenId, contractAddress }) {
  const contract = new web3.eth.Contract(contractABI, contractAddress);
  const gasLimit = web3.utils.toBN('150000');
  const gasPrice = web3.utils.toBN(await web3.eth.getGasPrice());
  const nonce = await web3.eth.getTransactionCount(minterAccount.address);
  const chainId = await web3.eth.net.getId();
  console.log(`Current ethereum network information: \
    chainId=${chainId}, gasPrice=${gasPrice.toString()}, gasLimit=${gasLimit.toString()}, nonce=${nonce}`);

  const txData = {
    chainId: web3.utils.toHex(chainId),
    data: contract.methods.mint(address, tokenId).encodeABI(),
    gasLimit: web3.utils.toHex(gasLimit),
    gasPrice: web3.utils.toHex(gasPrice),
    nonce: web3.utils.toHex(nonce),
    to: contractAddress,
    value: web3.utils.toHex(0)
  };

  const tx = new EthereumTx(txData, { chain: process.env.NETWORK });
  const bufPrivKey = Buffer.from(minterAccount.privateKey.substr(2), 'hex');

  tx.sign(bufPrivKey);

  let signedHex = tx.serialize().toString('hex');
  if (!signedHex.startsWith('0x')) {
    signedHex = '0x' + signedHex;
  }

  const txid = tx.hash().toString('hex');

  process.nextTick(async () => {
    try {
      await web3.eth.sendSignedTransaction(signedHex);
    } catch (e) {
      logger.error(`Submitted tx failed: ${txid}`);
      logger.error(e);
    }
  });

  return txid;
}

module.exports = router;
