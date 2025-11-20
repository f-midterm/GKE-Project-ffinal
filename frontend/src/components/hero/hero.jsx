import React from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa6';
import { motion, useScroll, useTransform } from 'framer-motion';

function Hero({ isAuthenticated }) {
  const handleExplore = () => {
    const el = document.getElementById('explore');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="flex-col items-center px-12 py-56 h-screen lg:px-48 py-72 sm:px-24 py-48"
      fill
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(217, 217, 217, 0.85), rgba(3, 88, 156, 0.85)), url('https://www.rsmeans.com/media/amasty/blog/RSM-BL-CNT-Cost-to-Build-Apartme.jpg')`,
      }}
      priority
    >
      {/* Content */}
      <div className="relative mb-12 flex-col z-10 ">
        <h1 className="text-4xl font-semibold py-6 bg-gradient-to-r from-[#0076D4] to-[#303841] bg-clip-text text-transparent w-fit lg:text-6xl lg:py-10 sm:text-4xl sm:py-6">
          Belong Be Live.
        </h1>
        <p className="text-3xl font-medium text-[#303841] lg:text-5xl sm:text-3xl">
          Join the <span className="italic text-[#0076D4] font-semibold">Future</span> of Apartment Living.
        </p>
      </div>
      <div className="flex gap-8 mb-12">
        {!isAuthenticated && (
          <Link
            to="/signup"
            className="btn-primary rounded-full text-white text-sm font-medium px-6 py-3 bg-gradient-to-r from-[#0076D4] to-[#303841] shadow-md hover:translate-y-[-2px] transition-transform lg:px-8 lg:py-3 lg:text-lg sm:px-6 sm:py-3 sm:text-md"
          >
            Get Started
          </Link>
        )}
        <Link
          to="/booking"
          className={isAuthenticated ? "btn-primary rounded-full text-white text-sm font-medium px-6 py-3 bg-gradient-to-r from-[#0076D4] to-[#303841] shadow-md hover:translate-y-[-2px] transition-transform lg:px-8 lg:py-3 lg:text-lg sm:px-6 sm:py-3 sm:text-md" : "btn-secondary rounded-full text-sm font-medium px-6 py-3 text-transparent bg-clip-text bg-gradient-to-r from-[#0076D4] to-[#303841] border-2 border-[#0076D4] hover:translate-y-[-2px] transition-transform lg:px-8 lg:py-3 lg:text-lg sm:px-6 sm:py-3 sm:text-md"}
        >
          Book now
        </Link>
      </div>
      <div className="flex gap-4 items-center hover:translate-y-[-2px]" onClick={handleExplore}>
        <button className="btn rounded-full p-3 shadow-md bg-gradient-to-b from-[#03589C] to-[#F3F3F3]">
          <FaChevronDown className="text-white" />
        </button>
        <p className="lg:text-xl sm:text-lg">Explore more</p>
      </div>
    </div>
  );
}

export default Hero;