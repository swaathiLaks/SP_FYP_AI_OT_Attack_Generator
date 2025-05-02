"use client"; 

// components/Loader.js
const Loader = () => {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <video autoPlay loop muted className="w-32 h-32">
          <source src="C:\Users\csw31\Documents\GitHub\FYP\fyp_frontend\ai\public\loader.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };
  
  export default Loader;