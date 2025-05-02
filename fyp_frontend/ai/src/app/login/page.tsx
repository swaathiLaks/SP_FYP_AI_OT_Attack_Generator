"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import MainHeader from "../components/MainHeader";
import {Button, ButtonGroup} from "@heroui/react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const loginError = () => toast("Login failed. Please try again.");
  const networkError = () => toast("Login failed. Please check your connection.")

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Prepare data to send to the backend
    const loginData = {
      email: email,
      password: password,
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle successful login
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userRole", data.user.status); // Store user status or role
        sessionStorage.setItem("userName", data.user.username);
        sessionStorage.setItem("userId",data.user.id)
        
        if (data.user.status === "admin") {
          router.push("/admin"); // Redirect to admin page
        } else {
          router.push("/"); // Redirect to main page
        }
      } else {
        // Handle error from backend
        loginError();
      }
    } catch (error) {
      // Handle network or unexpected error
      networkError()
    }
  };

  return (
    <div>
      <MainHeader />

      <div className="flex flex-col items-center justify-center pt-20 mb-10">
        <div className="w-full max-w-md p-8 bg-black/30 backdrop-blur-lg border border-white/10 rounded-[20px] shadow-lg">
          <h2 className="text-[2rem] font-bold text-white text-center mb-4">Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#6f4ef2] text-white py-2 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Login
            </Button>
          </form>
        </div>      
      </div>

      {/* ToastContainer for displaying toast notifications */}
      <ToastContainer position="top-center" theme="dark"/>
    </div>
  );
}