"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import MainHeader from "./MainHeader";

interface ResultHeaderProps {
  selectedAttack: string;
  setSelectedAttack: (value: string) => void;
  selectedTarget: string;
  setSelectedTarget: (value: string) => void;
}

const ResultHeader: React.FC<ResultHeaderProps> = ({
  selectedAttack,
  setSelectedAttack,
  selectedTarget,
  setSelectedTarget,
}) => {
  const router = useRouter();
  const [attackVectors, setAttackVectors] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const searchParams = useSearchParams();

  // Fetch attack vectors and targets from the backend
  useEffect(() => {
    const fetchAttackVectors = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/attack-vectors");
        if (!response.ok) throw new Error("Failed to fetch attack vectors.");
        const data = await response.json();
        // Filter out attack vectors with selected = 1
        const availableAttackVectors = data
          .filter((item: { selected: number }) => item.selected === 0)
          .map((item: { attack: string }) => item.attack);
        setAttackVectors(availableAttackVectors);
      } catch (error) {
        console.error("Error fetching attack vectors:", error);
      }
    };

    const fetchTargets = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/targets");
        if (!response.ok) throw new Error("Failed to fetch targets.");
        const data = await response.json();
        // Filter out targets with selected = 1
        const availableTargets = data
          .filter((item: { selected: number }) => item.selected === 0)
          .map((item: { target: string }) => item.target);
        setTargets(availableTargets);
      } catch (error) {
        console.error("Error fetching targets:", error);
      }
    };

    fetchAttackVectors();
    fetchTargets();
  }, []);

  // Handle regenerate button click
  const handleRegenerate = () => {
    // Update the URL with the new attack and target
    router.push(`/results?attack=${selectedAttack}&target=${selectedTarget}`);
    // Clear the cached results to force a refresh
    localStorage.removeItem("generatedScripts");
  };

  return (
    <div>
      {/* Main Header */}
      <MainHeader />

      {/* Result Header */}
      <div className="flex justify-center space-x-10 mt-10">
        <h1 className="text-[2rem]">Results generated for you</h1>
      </div>

      <div className="flex justify-center space-x-10 mb-10 mt-5">
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

        <div className="flex items-center">
          <Button
            className="bg-[#6100FF] hover:bg-[#4B00CC] text-white text-[25px] transition-colors ease-in-out duration-300"
            variant="bordered"
            onClick={handleRegenerate}
          >
            Re-generate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultHeader;