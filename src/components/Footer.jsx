import React from "react";
import { Heart, Github, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Credits */}
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>Built with Solana X ShadowWire</span>
            <Heart className="w-4 h-4 text-green-500 fill-green-500" />
            <span>by Solanica Finance Team</span>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-400">
            © {currentYear} Solanica Finance. All rights reserved.
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/solanicafinance"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-green-500 hover:border-green-500/30 transition-all"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com/solanicafinance"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-green-500 hover:border-green-500/30 transition-all"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-500">
            Powered by Solana Blockchain • ShadowWire
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
