import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, {useEffect, useState} from "react";
import {ethers} from "ethers";
import myEpicNFT from './utils/MyEpicNFT.json';

// Constants
const TWITTER_HANDLE = 'rainerlarin';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/assets/goerli/';
const TOTAL_MINT_COUNT = 10;
const CONTRACT_ADDRESS = "0x270c530033053Ce342B4e5fD803357a925B940f9";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState();
  const [mintedNfts, setMintedNfts] = useState(0);
  const [mintedNftsUrl, setMintedNftsUrl] = useState('');
  const [isWorking, setIsWorking] = useState('');

  // Render Methods
  const isWalletConnected = async () => {
    const {ethereum} = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
    } else {
      console.log("We have the ethereum object", ethereum);
    }

      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      // String, hex code of the chainId of the Goerli test network
      const goerliChainId = "0x5";
      if (chainId !== goerliChainId) {
          alert("You are not connected to the Goerli Test Network!");
      }

    /*
   * Check if we're authorized to access the user's wallet
   */
    const accounts = await ethereum.request({method: 'eth_accounts'});
    if (accounts.length > 0) {
      accounts.forEach((account, ix) => {
        console.log(`Account ${ix}:`, account);
      });
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        await setupEventListener();
    } else {
        console.log("No authorized account found")
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({method: 'eth_requestAccounts'});

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      await setupEventListener()
    } catch (error) {
      console.log(error);
    }
  }

    const setupEventListener = async () => {
        // Most of this looks the same as our function askContractToMintNft
        try {
            const { ethereum } = window;

            if (ethereum) {
                // Same stuff again
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNFT.abi, signer);
                const mintedNfts = await connectedContract.getTotalNFTsMintedSoFar();
                setMintedNfts(mintedNfts.toNumber());
                // THIS IS THE MAGIC SAUCE.
                // This will essentially "capture" our event when our contract throws it.
                // If you're familiar with webhooks, it's very similar to that!
                connectedContract.on("NewEpicNFTMinted", async (from, tokenId) => {
                    console.log(from, tokenId.toNumber())
                    const mintedNfts = await connectedContract.getTotalNFTsMintedSoFar();
                    setMintedNfts(mintedNfts.toNumber());
                    console.log("Minted NFTs so far:", mintedNfts.toNumber());
                    setMintedNftsUrl(`${OPENSEA_LINK}/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`);
                });

                console.log("Setup event listener!")

            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error)
        }
    }

  const askContractToMintNft = async () => {
    try {
        const {ethereum} = window;

        if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNFT.abi, signer);
            setIsWorking("Going to pop wallet now to pay gas...");
            console.log("Going to pop wallet now to pay gas...");
            let nftTxn = await connectedContract.makeAnEpicNFT();

            setIsWorking("Mining...please wait.");
            console.log("Mining...please wait.");
            await nftTxn.wait();
            setIsWorking("");
            console.log(`Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`);
        } else {
            console.log("Ethereum object doesn't exist!");
        }
    } catch (error) {
        console.log("Error: ", error);
    }
  }

  const RenderNotConnectedContainer = () => {
      return (
          <button onClick={connectWallet} type="button" className="cta-button connect-wallet-button">
            Connect to Wallet
          </button>
        );
      }

  const RenderConnectedContainer = () => {
    return (
        <button disabled={!!isWorking} onClick={askContractToMintNft} type="button" className="cta-button connect-wallet-button">
          Mint NFT
        </button>
    );
  };

  useEffect(() => {
    (async () => {
      await isWalletConnected();
    })();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Rainer NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
            <p className="sub-text gradient-text">You have {mintedNfts}/{TOTAL_MINT_COUNT} NFTs minted so far</p>

           {
            currentAccount
              ? <RenderConnectedContainer/>
              : <RenderNotConnectedContainer/>
          }

          <div>
            {isWorking && (
                <>
                <p className="sub-text gradient-text">{isWorking}</p>
                <div className="lds-ellipsis">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                </>
            )}
          </div>

            {mintedNftsUrl && (<div className="card-container">
            <div className="card">
            <p className="sub-text">
                Hey there! We've minted your NFT and sent it to your wallet.
                It may be blank right now. It can take a max of 10 min to show up on OpenSea.
                Here's the <a target="_blank" href={mintedNftsUrl}>link</a>
            </p>
            </div>
          </div>)}

        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
