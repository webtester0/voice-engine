# Voice Engine 

This smart contract is designed to create a voiting with a list of candidates, with the ability for any other users to choose a winner.

To participate in the voting user should deposit 0.01ETH.

The winner of the vote takes the entire amount collected, minus the commission.

## Description

### Unit tests

For run unit-tests use cmd it will run `npx hardhat coverage`:

```
npm test
```

#### Coverege 100%

![](https://i2.paste.pics/f29a84a7c8ff9897588634d073340b1b.png)

### Deploy and Tasks

#### Hardhat localhost

To deploy VoiceEngine smart-contract at localhost you should use this steps: 

1. Run hardhat node:
```
npx hardhat node
```

2. Deploy Contract:
```
npx hardhat run scripts/deploy.js --network localhost
```

3. Add new env variable with deployed contract address

![](https://i2.paste.oics/c51ccb46f4e920bfd47e831c730e2007.png)

#### Tasks decription

1. createVote

```
❯ npx hardhat createVote --help
Hardhat version 2.9.9

Usage: hardhat [GLOBAL OPTIONS] createVote --candidates <STRING> [--duration <STRING>] --index <STRING>

OPTIONS:

  --candidates	Candidates addresses
  --duration  	By default duration == 3 days, but could be config through this param
  --index     	Index of voting

createVote: Create new voiting
```

2. makingVoting

```
❯ npx hardhat makeVoting --help
Hardhat version 2.9.9

Usage: hardhat [GLOBAL OPTIONS] makeVoting --candidate <STRING> --index <STRING>

OPTIONS:

  --candidate	Choosen candidate address
  --index    	Index of voting

makeVoting: Making a vote

For global options help run: hardhat help
```

3. taxWithdraw

```
❯ npx hardhat taxWithdraw --help
Hardhat version 2.9.9

Usage: hardhat [GLOBAL OPTIONS] taxWithdraw --addr <STRING> --amount <STRING>

OPTIONS:

  --addr  	Address of funds receive
  --amount	Amount of withdraw funds

taxWithdraw: Tax withdraw

For global options help run: hardhat help
```

4. finishVote

```
❯ npx hardhat finishVote --help
Hardhat version 2.9.9

Usage: hardhat [GLOBAL OPTIONS] finishVote --index <STRING>

OPTIONS:

  --index	Index of Voiting

finishVote: Finish the voiting

For global options help run: hardhat help
```

#### Examples of interactions with deployed smart-contract

1. Create new voting by owner with duration 60s

```
npx hardhat createVote --index 0 --candidates 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db --duration 60 --network localhost
```
![](https://i2.paste.oics/80cf4caede8eeddd01e19acf5f630d71.png)
2. Make a vote for first candidate

```
npx hardhat makeVoting --index 0 --candidate 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2 --network localhost
```
![](https://i2.paste.oics/83c3fb1e9cee767f0ec2ad1999d8b746.png)
3. Tax withdraw 

```
npx hardhat taxWithdraw --amount 0.001 --addr 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --network localhost
```
![](https://i2.paste.oics/77ec8d4b0dd8f667e352c2103f87c5fd.png)
4. Finish the voiting after duraction expire

```
npx hardhat finishVote --index 0 --network localhost
```
![](https://i2.paste.oics/4b1157f477c48365ad2b402361987178.png)
## Voice Engine in Rinkeby Testnet Network

This contract was deployed to Rinkeby test network https://rinkeby.etherscan.io/

Contract address: 
`0x9d481573291D2dE3b42074Cf9b3963AA5527BE05`
