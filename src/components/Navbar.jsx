import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Send,
  Wallet,
  ArrowDownToLine,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import WalletButton from "./WalletButton";
import logo from "../assets/logo.png";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Transfer",
      icon: Send,
      submenu: [
        { name: "Send Assets", path: "/transfer", icon: Send },
        {
          name: "Receive Payment",
          path: "/receive-payment",
          icon: ArrowDownToLine,
        },
        { name: "Make Payment", path: "/make-payment", icon: Wallet },
      ],
    },
    {
      name: "Wallet",
      path: "/wallet-management",
      icon: Wallet,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 hidden lg:block">
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-full shadow-2xl">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-3">
                <img src={logo} className="w-10 h-10" alt="Uranix Logo" />
                <span className="text-xl font-bold text-white">Solanica Finance</span>
              </Link>

              {/* Menu Items */}
              <div className="flex items-center space-x-2">
                {menuItems.map((item, index) => (
                  <div key={index} className="relative group">
                    {item.submenu ? (
                      <>
                        <button className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown */}
                        <div className="absolute top-full left-0 pt-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                          <div className="backdrop-blur-xl bg-black/90 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                            {item.submenu.map((subItem, subIndex) => (
                              <Link
                                key={subIndex}
                                to={subItem.path}
                                className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all ${
                                  isActive(subItem.path)
                                    ? "bg-white/20 text-white border-l-2 border-white"
                                    : "text-gray-300 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span>{subItem.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive(item.path)
                            ? "bg-white/20 text-white"
                            : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* Wallet Button */}
              <WalletButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Header */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden">
        <div className="backdrop-blur-xl bg-black/40 border-b border-white/10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-around">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <img src={logo} className="w-9 h-9" alt="Uranix Logo" />
                <span className="text-lg font-bold text-white">Solanica Finance</span>
              </Link>

              {/* Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-xl w-10 bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <img src={logo} className="w-8 h-8" alt="Uranix Logo" />
                  <span className="text-lg font-bold text-white">Menu</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Wallet Info */}
              <div className="p-4 border-b border-white/10">
                <WalletButton isMobile={true} />
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {menuItems.map((item, index) => (
                  <div key={index}>
                    {item.submenu ? (
                      <div className="space-y-1">
                        <button
                          onClick={() => setIsTransferOpen(!isTransferOpen)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isTransferOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Submenu */}
                        {isTransferOpen && (
                          <div className="ml-4 mt-1 space-y-1 animate-fadeIn">
                            {item.submenu.map((subItem, subIndex) => (
                              <Link
                                key={subIndex}
                                to={subItem.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all ${
                                  isActive(subItem.path)
                                    ? "bg-white/20 text-white"
                                    : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {subItem.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                          isActive(item.path)
                            ? "bg-white/20 text-white border border-white/30"
                            : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10">
                <p className="text-xs text-gray-500 text-center">
                  Solanica Finance v1.0 • Powered by Solana
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
