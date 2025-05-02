"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useDisclosure,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalContent,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter
} from "@heroui/react";
import MainHeader from "./components/MainHeader";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
  const [attackVectors, setAttackVectors] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [selectedAttack, setSelectedAttack] = useState("Attack Vector");
  const [selectedTarget, setSelectedTarget] = useState("Target");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const router = useRouter();

  interface Target {
    id: number;
    target: string;
    selected: number; // Ensure type reflects possible values: 0 or 1
  }

  // Fetch attack vectors and targets
  useEffect(() => {
    const fetchAttackVectors = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/attack-vectors");
        if (!response.ok) throw new Error("Failed to fetch attack vectors.");
        const data = await response.json();
        // Filter out attack vectors where selected is 1
        const filteredAttackVectors = data.filter((item: { selected: number }) => item.selected === 0);
        setAttackVectors(filteredAttackVectors.map((item: { attack: string }) => item.attack));
      } catch (error) {
        console.error(error);
      }
    };

    const fetchTargets = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/targets");
        if (!response.ok) throw new Error("Failed to fetch targets.");
        const data: Target[] = await response.json();
        const filteredTargets = data.filter((item) => item.selected === 0);
        setTargets(filteredTargets.map((item) => item.target));
      } catch (error) {
        console.error("Error fetching targets:", error);
      }
    };
    fetchAttackVectors();
    fetchTargets();
  }, []);

  // Show toast notification
  const notify = () => toast('Please select both an Attack Vector and a Target before proceeding.');

  // Redirect or show login modal
  const handleRedirect = () => {
    // Directly check session storage for login status
    const loginStatus = sessionStorage.getItem("isLoggedIn");
    const isUserLoggedIn = !!loginStatus && loginStatus === "true";
  
    if (!isUserLoggedIn) {
      setShowModal(true);
    } else if (selectedAttack !== "Attack Vector" && selectedTarget !== "Target") {
      router.push(`/results?attack=${encodeURIComponent(selectedAttack)}&target=${encodeURIComponent(selectedTarget)}`);
    } else {
      notify();
    }
  };
  

  return (
    <div>
      {/* Main Header */}
      <MainHeader />
      {/* Login Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        backdrop="opaque"
        closeButton
        classNames={{
          body: "py-6",
          backdrop: "bg-[#292f46]/50 backdrop-blur-lg backdrop-opacity-100 fixed inset-0 z-50", // More pronounced blur effect
          base: "border-[#292f46] bg-[#19172c] text-[#a8b0d3] w-[400px] mx-auto my-auto z-50 rounded-lg", // Increased width and centered modal
          header: "relative border-b-[1px] border-[#292f46] pb-6", // Adjusted padding for proper spacing
          footer: "border-t-[1px] border-[#292f46] pt-4 flex justify-end",
        }}
      >
        <ModalContent>
          {/* Manually add close button in header */}
          <ModalHeader className="text-[25px] text-center relative">
            Authentication Required
            {/* HeroUI close button */}
            <Button
              onPress={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "0",
                right: "-20px",
                backgroundColor: "transparent",
                color: "white",
                border: "none",
                padding: "0",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>

            </Button>
          </ModalHeader>
          <ModalBody>
            <p className="text-white">Please log in to access this page.</p>
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => router.push("/login")}
              className="bg-blue-500 text-white"
            >
              Go to Login
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>



      <div className="flex flex-col items-center justify-center pt-20 mb-10">
        <h1 className="text-[4rem] font-bold">CyberRangersAI</h1>
        <p className="text-[25px] font-bold">What's your first target for the attack?</p>
      </div>

      <div className="flex justify-center space-x-10 mb-20">
        {/* Attack Vector Dropdown */}
        <div className="flex items-center">
          <Dropdown>
            <DropdownTrigger>
              <Button className="capitalize text-white text-[25px] flex items-center" variant="bordered">
                {selectedAttack}
                <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} fill="currentColor" className="ml-2" viewBox="0 0 16 16">
                  <path d="M4.293 5.293a1 1 0 0 1 1.414 0L8 7.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z" />
                </svg>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Attack Vector Selection"
              selectedKeys={new Set([selectedAttack])}
              selectionMode="single"
              onSelectionChange={(keys: Set<string>) => {
                setSelectedAttack(Array.from(keys)[0] || "Attack Vector");
              }}
            >
              {attackVectors.map((attack) => (
                <DropdownItem key={attack}>{attack}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Target Dropdown */}
        <div className="flex items-center">
          <Dropdown>
            <DropdownTrigger>
              <Button className="capitalize text-white text-[25px] flex items-center" variant="bordered">
                {selectedTarget}
                <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} fill="currentColor" className="ml-2" viewBox="0 0 16 16">
                  <path d="M4.293 5.293a1 1 0 0 1 1.414 0L8 7.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z" />
                </svg>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Target selection"
              selectedKeys={new Set([selectedTarget])}
              selectionMode="single"
              onSelectionChange={(keys: Set<string>) => {
                setSelectedTarget(Array.from(keys)[0] || "Target");
              }}
            >
              {targets.map((target) => (
                <DropdownItem key={target}>{target}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Play Button */}
        <div>
          <Button
            type="button"
            onPress={handleRedirect}
            className="text-black bg-gray-300 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="#4A4A4A" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </Button>
        </div>
      </div>

      <div className="max-w-[900px] grid grid-rows-1 px-10 mx-auto mb-5">
        <h1 className="text-[2rem]">Features</h1>
      </div>

      <div className="max-w-[900px] gap-5 grid grid-cols-12 grid-rows-2 px-8 mx-auto mb-20">
        <Card className="col-span-12 sm:col-span-4 h-[300px] bg-black/30 backdrop-blur-lg border border-white/10 rounded-[20px] shadow-lg">
          <CardHeader className="absolute z-10 flex-col !items-start p-5">
            <p className="text-tiny text-white/60 uppercase font-bold">Physical Model</p>
            <h4 className="text-white font-medium text-large">OT/ICS Infrastructure</h4>
          </CardHeader>
        </Card>

        <Card className="col-span-12 sm:col-span-4 h-[300px] bg-black/30 backdrop-blur-lg border border-white/10 rounded-[20px] shadow-lg">
          <CardHeader className="absolute z-10 flex-col !items-start p-5">
            <p className="text-tiny text-white/60 uppercase font-bold">Logical Network</p>
            <h4 className="text-white font-medium text-large">OT/ICS Logical Network Diagram</h4>
          </CardHeader>
        </Card>
      </div>

      {/* ToastContainer for displaying toast notifications */}
      <ToastContainer position="top-center" theme="dark"/>
    </div>
  );
}