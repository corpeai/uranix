import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WalletProvider from "./components/WalletProvider";
import Layout from "./Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import PaymentScreen from "./pages/Payment";
import PayAnyone from "./pages/PayAnyone";
import WalletManagement from "./pages/Wallet";

const Receive = () => (
  <div className="text-center py-20">
    <h1 className="text-4xl font-bold text-white mb-4">Receive</h1>
    <p className="text-gray-400">Receive payments and tokens</p>
  </div>
);

function App() {
  return (
    <Router>
      <WalletProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/receive-payment" element={<PaymentScreen />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/make-payment" element={<PayAnyone />} />
            <Route path="/wallet-management" element={<WalletManagement />} />
            <Route path="/receive" element={<Receive />} />
          </Routes>
        </Layout>
      </WalletProvider>
    </Router>
  );
}

export default App;
