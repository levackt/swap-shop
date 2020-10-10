# swap-shop

Swap between 2 secret tokens, one or both of them representing a standard ERC20 token on Ethereum. 

The swap based on 
https://github.com/enigmampc/SimpleAMM

### Build

```bash
    cd contracts/pair
    make

    cd contracts/pair-factory
    make

    cd contracts/secret-secret
    make
```

### Run secretdev blockchain
```bash
    docker run -it --rm \
    -p 26657:26657 -p 26656:26656 -p 1317:1317 \
    -v /Users/taariq/code/enigma-protocol:/root/code \
    --name secretdev enigmampc/secret-network-sw-dev:v1.0.2
```

### Run rest server
```bash
    docker exec secretdev \
    secretcli rest-server \
    --node tcp://localhost:26657 \
    --trust-node \
    --laddr tcp://0.0.0.0:1317
```

### Fund accounts
```bash
    cd client
    ./scripts/fund_accounts.sh
```

### Deploy contracts
```bash
    cd client
    node scripts/deploy.js
```