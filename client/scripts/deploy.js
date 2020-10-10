#!/usr/bin/env node

/* eslint-disable @typescript-eslint/camelcase */
const { Encoding } = require("@iov/encoding");
const { coin } = require("@cosmjs/sdk38");

/* eslint-disable @typescript-eslint/camelcase */
const { BroadcastMode, EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey, makeSignBytes } = require("secretjs");
const { Slip10RawIndex } = require("@iov/crypto");
const fs = require("fs");

const httpUrl = "http://localhost:1317";
const admin = {
  mnemonic:
    "bring hour globe soft quality permit follow upper anxiety link exhibit winner high anger kite pioneer occur topic patient size dumb sheriff myself pottery",
    address: "secret16we5nes8z923n4l2xxyefdfaheghjgcrg44jrx",
};
const user1 = {
  mnemonic:
    "slim glass physical humor dry power clarify nation trial cactus target hawk ketchup sketch until relax elephant swamp process tray undo adapt fee magnet",
    address: "secret10f3hwh8lczhjdje42rtyf3md5edy3htpkpphpl",
};
const user2 = {
  mnemonic:
    "network screen sea pretty wash situate unhappy budget express month style crouch network crime era month bottom jump general prize skin visual parent hip",
    address: "secret1a8d9sj4rq3dw9x56f0gc39z5qaqdmalprqx4d9",
};


initial_balances = [
    {"address": admin.address, "amount": "1000000000"},
    {"address": user1.address, "amount": "100000"}, 
    {"address": user2.address, "amount": "100000"}
]

const secret_secret1 = {
  initMsg: {
    "admin": admin.address,
    "config": {
      "public_total_supply": true
    },
    "decimals": 0,
    "initial_balances": initial_balances,
    "name": "Secret1",
    "symbol": "SCRT",
    "prng_seed": "7f2018d362d54e598b14e7e5ba9d67f6",
  },
};

const secret_secret2 = {
  initMsg: {
    "admin": admin.address,
    "config": {
      "public_total_supply": true
    },
    "decimals": 0,
    "initial_balances": initial_balances,
    "name": "Secret2",
    "symbol": "SCRTX",
    "prng_seed": "7f2018d362d54e598b14e7e5ba9d67f6",
  },
};

const pair1 = {
    initMsg: {
        init_pair: {
            "token_a": "",
            "token_a_code_hash": "4bbcf68558aa3ffb0874d70cbe7f5bc86a1040c6613cb925a87290383980bbbd",
            "token_b": "",
            "token_b_code_hash": "4bbcf68558aa3ffb0874d70cbe7f5bc86a1040c6613cb925a87290383980bbbd",
        }
    },
    label: "pair 1"
}

const pairFactory = {
    initMsg: {
      init_pair_factory: {
        "admin": admin.address,
        "pair_code_id": 1,
        "pair_code_hash": "924c79c42d45a398a31d69ce090a493b778e122a920f9c7670a26c489cb33e7d",
      }
    },
    label: "pair factory"
}

const customFees = {
  upload: {
    amount: [{ amount: "2000000", denom: "uscrt" }],
    gas: "2000000",
  },
  init: {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "500000",
  },
  exec: {
    amount: [{ amount: "250000", denom: "uscrt" }],
    gas: "250000",
  },
  send: {
    amount: [{ amount: "80000", denom: "uscrt" }],
    gas: "80000",
  },
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {

  const signingPen = await Secp256k1Pen.fromMnemonic(admin.mnemonic);
  const adminWalletAddress = pubkeyToAddress(
    encodeSecp256k1Pubkey(signingPen.pubkey),
    "secret"
  );
  const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
  const client = new SigningCosmWasmClient(
    httpUrl,
    adminWalletAddress,
    (signBytes) => signingPen.sign(signBytes),
    txEncryptionSeed, customFees
  );

  // Upload and init tokens
  const tokenWasm = fs.readFileSync(__dirname + "/../../contracts/secret-secret/contract.wasm");
  let uploadReceipt = await client.upload(tokenWasm, { });
  let codeId = uploadReceipt.codeId;

  for (const { initMsg} of [secret_secret1, secret_secret2]) {
    const { contractAddress } = await client.instantiate(codeId, initMsg, initMsg.name);
    console.info(`Contract "${initMsg.name}" instantiated at ${contractAddress}`);

    initMsg.contractAddress = contractAddress
  }

  // Set the token contract addresses
  pair1.initMsg.init_pair.token_a = secret_secret1.initMsg.contractAddress;
  pair1.initMsg.init_pair.token_b = secret_secret2.initMsg.contractAddress;

  // upload and init pair
  const pairWasm = fs.readFileSync(__dirname + "/../../contracts/pair/contract.wasm");
  uploadReceipt = await client.upload(pairWasm, { });
  codeId = uploadReceipt.codeId;
  let initResult = await client.instantiate(codeId, pair1.initMsg, pair1.label);
  console.info(`Contract "${pair1.label}" instantiated at ${initResult.contractAddress}`);

  // upload and init pair factory
  const pairFactoryWasm = fs.readFileSync(__dirname + "/../../contracts/pair-factory/contract.wasm");
  uploadReceipt = await client.upload(pairFactoryWasm, { });
  codeId = uploadReceipt.codeId;
  initResult = await client.instantiate(codeId, pairFactory.initMsg, pairFactory.label);
  console.info(`Contract "${pairFactory.label}" instantiated at ${initResult.contractAddress}`);
  pairFactory.address = initResult.contractAddress;

  const createPairMsg = { 
    pair_label: "SCRTUSD", 
    token_a: pair1.initMsg.init_pair.token_a,
    token_a_code_hash: pair1.initMsg.init_pair.token_a_code_hash,
    token_b: pair1.initMsg.init_pair.token_b,
    token_b_code_hash: pair1.initMsg.init_pair.token_b_code_hash,
  }

  let result = await client.execute(pairFactory.address, { 
    create_pair: createPairMsg
  });

  console.info(`create pair result: ${JSON.stringify(result)}`)
}

main().then(
  () => {
    console.info("Done deploying contracts");
    process.exit(0);
  },
  error => {
    console.error(error);
    process.exit(1);
  },
);
