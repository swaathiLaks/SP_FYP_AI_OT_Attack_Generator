"use client";

import React from "react";

// CustomCodeBlock Component that applies necessary wrapping styles
const CustomCodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  return (
    <div
      style={{
        overflowY: "auto", // Enable vertical scrolling for overflow
        maxHeight: "300px", // Limit the height to make sure it's scrollable
        padding: "10px", // Padding for better spacing
        borderRadius: "8px", // Rounded corners for aesthetics
        fontFamily: "monospace", // Monospace font for code
        color: "#fff", // Text color
      }}
      className="custom-scrollbar" // Add a custom class for targeting the scrollbar
    >
      <pre
        style={{
          whiteSpace: "pre-wrap", // Enable wrapping of long lines
          wordBreak: "break-word", // Break words to fit within the container
          overflowWrap: "break-word", // Ensure long words break
          margin: 0, // Remove default margin for a tighter layout
        }}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

export default CustomCodeBlock; // Export the component