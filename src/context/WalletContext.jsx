import { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);

  const checkIfWalletIsConnected = async (retryCount = 0, maxRetries = 3) => {
    console.log(`Checking wallet connection (attempt ${retryCount + 1}/${maxRetries})...`);
    if (!window.ethereum) {
      if (retryCount < maxRetries) {
        console.log("window.ethereum not found, retrying...");
        setTimeout(() => checkIfWalletIsConnected(retryCount + 1, maxRetries), 1000);
      } else {
        console.log("MetaMask not installed or not available");
        setError("MetaMask not found. Please install MetaMask.");
      }
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      console.log("eth_accounts result:", accounts);

      if (
        accounts.length > 0 &&
        localStorage.getItem("walletDisconnected") !== "true"
      ) {
        console.log("Found authorized account:", accounts[0]);
        const providerInstance = new ethers.BrowserProvider(window.ethereum);
        const signerInstance = await providerInstance.getSigner();
        setProvider(providerInstance);
        setSigner(signerInstance);
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
      } else {
        console.log("No authorized accounts or wallet was disconnected");
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
      if (retryCount < maxRetries) {
        console.log("Retrying connection check...");
        setTimeout(() => checkIfWalletIsConnected(retryCount + 1, maxRetries), 1000);
      } else {
        setError("Failed to check wallet connection. Please try again.");
      }
    }
  };

  const connectWallet = async () => {
    console.log("connectWallet called");
    if (!window.ethereum) {
      console.log("MetaMask not installed");
      setError("MetaMask not found. Please install MetaMask.");
      return false;
    }

    if (connectingWallet) {
      console.log("Already connecting, aborting");
      return false;
    }

    setConnectingWallet(true);
    setError(null);

    try {
      console.log("Requesting eth_requestAccounts...");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected to:", accounts[0]);

      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await providerInstance.getSigner();

      setProvider(providerInstance);
      setSigner(signerInstance);
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      localStorage.removeItem("walletDisconnected");
      return true;
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("Failed to connect wallet. Please try again.");
      return false;
    } finally {
      setConnectingWallet(false);
      console.log("connectWallet completed");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setWalletConnected(false);
    setProvider(null);
    setSigner(null);
    localStorage.setItem("walletDisconnected", "true");
    setError(null);
    console.log("Wallet disconnected");
  };

  useEffect(() => {
    let mounted = true;

    checkIfWalletIsConnected();

    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        console.log("accountsChanged:", accounts);
        if (!mounted) return;

        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          const providerInstance = new ethers.BrowserProvider(window.ethereum);
          const signerInstance = await providerInstance.getSigner();
          setProvider(providerInstance);
          setSigner(signerInstance);
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          localStorage.removeItem("walletDisconnected");
        }
      };

      const handleChainChanged = () => {
        console.log("chainChanged detected");
        if (!mounted) return;
        // Reconnect to update provider and signer
        checkIfWalletIsConnected();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        mounted = false;
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        walletConnected,
        walletAddress,
        connectingWallet,
        provider,
        signer,
        error,
        connectWallet,
        disconnectWallet,
        setError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);