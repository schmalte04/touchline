// Lovable Hero Section with Embedded Football Chat
// Copy this component into your Lovable app

import React from 'react';

const HeroWithFootballChat = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Hero Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Your Football
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Intelligence
                </span>
                Assistant
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed">
                Get instant answers about matches, odds, predictions, and everything football-related.
              </p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6 py-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">1000+</div>
                <div className="text-sm text-gray-400">Teams Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">24/7</div>
                <div className="text-sm text-gray-400">Live Updates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400">AI</div>
                <div className="text-sm text-gray-400">Powered</div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                Start Chatting →
              </button>
              <button className="px-8 py-4 border border-purple-400 rounded-lg font-semibold text-lg hover:bg-purple-400 hover:bg-opacity-10 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
          
          {/* Right Side - Embedded Chat */}
          <div className="lg:pl-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-2">Try It Now</h3>
                <p className="text-gray-300 text-sm">Ask about any football match, team, or prediction</p>
              </div>
              
              {/* Embedded Chat iframe */}
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                <iframe
                  src="https://shark-app-robkv.ondigitalocean.app/minimal-chat"
                  className="w-full h-96 border-0"
                  title="Football Chat Assistant"
                  allow="web-share"
                  loading="lazy"
                />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                  Powered by Touchline AI • Real-time football intelligence
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default HeroWithFootballChat;
