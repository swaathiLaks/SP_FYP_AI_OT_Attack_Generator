"use client";

import React, { useState, useEffect } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import Image from "next/image";


export const CRlogo = () => {
  const router = useRouter();

  return (
    <Image
      src="/cr.png"
      width={50}
      height={50}
      onClick={() => router.push("/")}
      style={{ cursor: "pointer" }}
      alt="CRlogo"
    />
  );
};

const MainHeader = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const loginStatus = sessionStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!loginStatus && loginStatus === "true");
  }, []);

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  const handleProfileRedirect = () => {
    router.push("/profile");
  };

  const handleLogout = () => {
    sessionStorage.clear(); // Clear all session storage items
    localStorage.clear()
    setIsLoggedIn(false); // Update state
    router.push("/"); // Redirect to home page
  };  

  return (
    <Navbar shouldHideOnScroll>
      <div className="w-full max-w-[1100px] mx-auto mt-10">
        {/* Wrapper to extend and style the navbar */}
        <div className="bg-black/15 backdrop-blur-lg border border-white/10 rounded-[20px] shadow-lg">
          <NavbarContent className="flex justify-between items-center gap-6 w-full p-2">
            {/* Navbar brand with logo and text */}
            <NavbarBrand className="flex items-center gap-2">
              <CRlogo />
              <span className="font-bold text-white">CyberRangersAI</span>
            </NavbarBrand>

            {/* Navbar links and actions grouped on the right */}
            <div className="flex items-center gap-6">
              {/* Navbar links */}
              <div className="hidden sm:flex gap-6 text-white">
                <NavbarItem>
                  <Link color="foreground" href="/">
                    Home
                  </Link>
                </NavbarItem>
                <NavbarItem>
                  <Link color="foreground" href="#">
                    About
                  </Link>
                </NavbarItem>
              </div>

              {/* Navbar action buttons */}
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Button
                    onPress={handleProfileRedirect}
                    className="text-white bg-[#5F00FF]"
                  >
                    Profile
                  </Button>
                  <Button
                    onPress={handleLogout}
                    className="text-white bg-red-500"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onPress={handleLoginRedirect}
                  className="text-white bg-[#5F00FF]"
                >
                  Login
                </Button>
              )}
            </div>
          </NavbarContent>
        </div>
      </div>
    </Navbar>
  );
};

export default MainHeader;