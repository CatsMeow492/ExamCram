import React from 'react';
import './Lantern.css';

const Lantern = () => {
  return (
    <div className="lanternContainer">
      <div className="Lantern">
        <div className="Glow"></div>
        <svg className="Top" viewBox="0 0 140 45" preserveAspectRatio="none">
          <linearGradient id="topGradient" x1="0" x2="1" y1="0.4" y2="0.4">
            <stop offset="0" stopColor="#171717"></stop>
            <stop offset="0.7" stopColor="#4e4e4e"></stop>
            <stop offset="1" stopColor="#171717"></stop>
          </linearGradient>
          <path d="M 10 0 C 10 0 38 -5 68 -5 C 98 -5 131 0 131 0 C 136 0 141 4 141 10 L 141 39 L 0 39 L 0 10 C 0 4 4 0 10 0 Z"></path>
        </svg>
        <svg className="Bottom" viewBox="0 0 140 45" preserveAspectRatio="none">
          <linearGradient id="bottomGradient" x1="0" x2="1" y1="0.4" y2="0.4">
            <stop offset="0" stopColor="#171717"></stop>
            <stop offset="0.7" stopColor="#4e4e4e"></stop>
            <stop offset="1" stopColor="#171717"></stop>
          </linearGradient>
          <path d="M 0 0 L 141 0 L 141 29 C 141 34 136 39 131 39 C 131 39 98 43 68 43 C 38 43 10 39 10 39 C 4 39 0 35 0 29 L 0 0 Z"></path>
        </svg>
        <svg className="lanternMain" viewBox="0 0 220 240" preserveAspectRatio="none">
          <radialGradient id="lanternGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#e3b70c"></stop>
            <stop offset="1" stopColor="#e02c0a"></stop>
          </radialGradient>
          <rect rx="50" ry="50" x="0" y="0" width="219" height="240"></rect>
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="64" fill="#ffffff" fontFamily="Arial, sans-serif">
            勉強
          </text>
        </svg>
        <svg className="Ridges" viewBox="0 0 220 240" preserveAspectRatio="none">
          <linearGradient id="Ridges" x1="0.5" x2="0.5" y1="0" y2="1">
            <stop offset="0" stopColor="#a20000" stopOpacity="0.03"></stop>
            <stop offset="0.05" stopColor="#a40000" stopOpacity="1"></stop>
            <stop offset="0.11" stopColor="#a50000" stopOpacity="0.03"></stop>
            <stop offset="0.17" stopColor="#a60000" stopOpacity="1"></stop>
            <stop offset="0.23" stopColor="#a80000" stopOpacity="0.03"></stop>
            <stop offset="0.29" stopColor="#a00" stopOpacity="1"></stop>
            <stop offset="0.35" stopColor="#ac0000" stopOpacity="0.03"></stop>
            <stop offset="0.41" stopColor="#ae0000" stopOpacity="1"></stop>
            <stop offset="0.47" stopColor="#af0000" stopOpacity="0.03"></stop>
            <stop offset="0.53" stopColor="#b00000" stopOpacity="1"></stop>
            <stop offset="0.59" stopColor="#b10000" stopOpacity="0.03"></stop>
            <stop offset="0.65" stopColor="#b20000" stopOpacity="1"></stop>
            <stop offset="0.71" stopColor="#b30000" stopOpacity="0.03"></stop>
            <stop offset="0.77" stopColor="#b40000" stopOpacity="1"></stop>
            <stop offset="0.83" stopColor="#b50000" stopOpacity="0.03"></stop>
            <stop offset="0.89" stopColor="#b60000" stopOpacity="1"></stop>
            <stop offset="0.95" stopColor="#b70000" stopOpacity="0.03"></stop>
            <stop offset="1" stopColor="#b80000" stopOpacity="1"></stop>
          </linearGradient>
          <path d="M 50 0 L 169 0 C 197 0 219 22 219 50 L 219 190 C 219 218 197 240 169 240 L 50 240 C 22 240 0 218 0 190 L 0 50 C 0 36 6 23 16 14 C 24 5 37 0 50 0 Z"></path>
        </svg>
        <svg className="leftSeam" viewBox="780 460 30 240">
          <path d="M 804 458 C 802 458 789 472 783 500 C 780 522 777 555 777 581 C 777 604 780 642 783 661 C 789 692 802 698 804 698 C 806 698 798 686 795 661 C 792 640 790 610 580 C 790 555 792 528 795 506 C 798 477 806 458 804 448 Z"></path>
        </svg>
        <svg className="middleSeam" viewBox="850 460 10 240">
          <path d="M 857 459 C 854 459 850 521 850 580 C 850 640 854 698 857 698 C 859 698 860 640 860 580 C 860 521 859 459 857 459 Z"></path>
        </svg>
        <svg className="rightSeam" viewBox="780 460 30 240">
          <path d="M 781 458 C 783 458 799 472 805 500 C 809 522 811 555 811 580 C 811 604 809 642 805 661 C 799 692 784 698 782 698 C 780 698 789 686 792 661 C 795 640 798 608 798 580 C 798 555 795 528 792 506 C 789 477 780 458 782 458 Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default Lantern;