"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useDisclosure,
  Card,
  CardHeader,
  CardBody,
  Button,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  CardFooter,
} from "@heroui/react";
import ResultHeader from "../components/ResultHeader";
import CustomCodeBlock from "../components/CustomCodeBlock";
import Link from "next/link";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ResultItem {
  explanation: string;
  name: string;
  script: string;
  script_id: string;
}

export default function Results() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const attack = searchParams.get("attack");
  const target = searchParams.get("target");

  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [selectedAttack, setSelectedAttack] = useState(attack || "DDOS");
  const [selectedTarget, setSelectedTarget] = useState(target || "172.16.33.225");
  const [selectedAttackIP, setSelectedAttackIP] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedScript, setSelectedScript] = useState<ResultItem | null>(null);

  const calderaSent = () => toast("Script sent to Caldera. Please wait.");
  const calderaFailed = () => toast("Failed to send script. Please try again.")
  const calderaError = () => toast("Error sending script to Caldera. Please check the console for details.")

  // Fetch target IP based on selectedTarget
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/targets");
        if (!response.ok) throw new Error("Failed to fetch targets.");

        const data = await response.json();
        const matchingTarget = data.find((item: any) => item.target === selectedTarget);
        if (matchingTarget) {
          setSelectedAttackIP(matchingTarget.ip_address);
        } else {
          console.warn("No matching target found.");
        }
      } catch (error) {
        console.error("Error fetching targets:", error);
      }
    };

    fetchTargets();
  }, [selectedTarget]);

  // Fetch scripts when both attack type and target IP are available
  useEffect(() => {
    const fetchScripts = async () => {
      if (!selectedAttackIP) return;
  
      setIsLoading(true);
      try {
        const response = await axios.post("http://127.0.0.1:5000/api/generate", {
          user_id: "1",
          vector: selectedAttack,
          target: selectedAttackIP,
        });
  
        const generatedScripts = response.data.scripts;
        setResults(generatedScripts);
  
        // Store the new results in localStorage
        localStorage.setItem("generatedScripts", JSON.stringify(generatedScripts));
        localStorage.setItem("selectedAttack", selectedAttack);
        localStorage.setItem("selectedTarget", selectedTarget);
      } catch (error) {
        console.error("Error fetching scripts:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    const attackFromURL = searchParams.get("attack");
    const targetFromURL = searchParams.get("target");
  
    // Update the state and fetch results when the URL changes
    if (attackFromURL && targetFromURL) {
      setSelectedAttack(attackFromURL);
      setSelectedTarget(targetFromURL);
  
      // Check if we need to fetch new results
      const storedResults = localStorage.getItem("generatedScripts");
      if (!storedResults || selectedAttack !== attackFromURL || selectedTarget !== targetFromURL) {
        fetchScripts();
      } else {
        setResults(JSON.parse(storedResults));
      }
    }
  }, [searchParams, selectedAttackIP]);
  
  const runScript = async (script: string) => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/caldera/send", {
        script, // Pass the selected script in the request body
      });

      if (response.status === 200) {
        calderaSent()
      } else {
        calderaFailed()
      }
    } catch (error) {
      console.error("Error sending script to Caldera:", error);
      calderaError()
    }
  };


  useEffect(() => {
    // If the results are already available in localStorage, load them
    const storedResults = localStorage.getItem("generatedScripts");
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    }
  }, []);

  const handleCopy = (code: string, scriptId: string): void => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setIsCopied(scriptId);
        setTimeout(() => setIsCopied(null), 2000);
      })
      .catch((err) => console.error("Failed to copy code:", err));
  };

  const handleLearnMore = (script: ResultItem) => {
    localStorage.setItem("selectedScript", JSON.stringify(script));
  };

  const handleBackToResults = () => {
    router.push(`/results?attack=${selectedAttack}&target=${selectedTarget}`);
  };

  return (
    <div>
      <ResultHeader
        selectedAttack={selectedAttack}
        setSelectedAttack={setSelectedAttack}
        selectedTarget={selectedTarget}
        setSelectedTarget={setSelectedTarget}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Spinner size="lg" color="primary" className="mb-4" />
          <span className="text-white text-lg font-bold">Loading...</span>
        </div>
      ) : (
        <div className="max-w-[950px] gap-10 grid grid-cols-12 mx-auto mb-20">
          {results.map((item) => (
            <Card
              key={item.script_id}
              isFooterBlurred
              className="w-full h-[400px] col-span-12 sm:col-span-4 bg-[#3d0b95] transition-all duration-300 ease-in-out border border-white/10 rounded-[20px] shadow-lg"
              isPressable
              onPress={() => {
                setSelectedScript(item);
                onOpen();
              }}
            >
              <CardHeader className="flex justify-between items-center p-6">
                <Tooltip closeDelay={0} content="Copy to clipboard" delay={0}>
                  <Button
                    className="absolute top-2 right-[10px] text-white bg-transparent hover:bg-transparent flex items-center justify-center"
                    onPress={() => handleCopy(item.script, item.script_id)}
                  >
                    {isCopied === item.script_id ? (
                      "Copied!"
                    ) : (
                      <svg
                        width="800px"
                        height="800px"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M19.5 16.5L19.5 4.5L18.75 3.75H9L8.25 4.5L8.25 7.5L5.25 7.5L4.5 8.25V20.25L5.25 21H15L15.75 20.25V17.25H18.75L19.5 16.5ZM15.75 15.75L15.75 8.25L15 7.5L9.75 7.5V5.25L18 5.25V15.75H15.75ZM6 9L14.25 9L14.25 19.5L6 19.5L6 9Z"
                          fill="#FFFFFF" />
                      </svg>
                    )}
                  </Button>
                </Tooltip>
              </CardHeader>
              <CardBody>
                {/* Use the CustomCodeBlock for wrapping */}
                <CustomCodeBlock code={item.script} language="bash" />
              </CardBody>
              <CardFooter className="py-5">
                <Button
                  className="absolute bottom-3 right-2 bg-transparent"
                  onPress={() => {
                    runScript(item.script); // Call runScript with the selected script
                  }}
                >
                  <svg width="1000px" height="1000px" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0748 7.50835C9.74622 6.72395 8.25 7.79065 8.25 9.21316V14.7868C8.25 16.2093 9.74622 17.276 11.0748 16.4916L15.795 13.7048C17.0683 12.953 17.0683 11.047 15.795 10.2952L11.0748 7.50835ZM9.75 9.21316C9.75 9.01468 9.84615 8.87585 9.95947 8.80498C10.0691 8.73641 10.1919 8.72898 10.3122 8.80003L15.0324 11.5869C15.165 11.6652 15.25 11.8148 15.25 12C15.25 12.1852 15.165 12.3348 15.0324 12.4131L10.3122 15.2C10.1919 15.271 10.0691 15.2636 9.95947 15.195C9.84615 15.1242 9.75 14.9853 9.75 14.7868V9.21316Z" fill="#FFFFFF" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75C17.1086 2.75 21.25 6.89137 21.25 12C21.25 17.1086 17.1086 21.25 12 21.25C6.89137 21.25 2.75 17.1086 2.75 12Z" fill="#FFFFFF" />
                  </svg>
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Modal for displaying full script */}
          <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="opaque"
            classNames={{
              body: "py-6",
              backdrop: "bg-[#292f46]/50 backdrop-blur-3xl backdrop-opacity-100",
              base: "border-[#292f46] bg-[#19172c] text-[#a8b0d3] max-w-[700px] mx-auto my-20 z-50",
              header: "border-b-[1px] border-[#292f46] py-4",
              footer: "border-t-[1px] border-[#292f46] py-4 flex justify-end",
            }}
          >
            <ModalContent>
              <ModalHeader className="text-[25px]">
                Commands
                {/* HeroUI close button */}
                <Button
                  onPress={onOpenChange}
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
              <ModalBody
                className="overflow-y-auto"
                style={{
                  maxHeight: "400px", // Set a max height for the modal body to allow scrolling
                }}
              >
                {selectedScript ? (
                  <pre className="text-white" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {selectedScript.script}
                  </pre>
                ) : (
                  <p className="text-white">No code snippet available.</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  className="text-white bg-transparent"
                  onPress={() => handleCopy(selectedScript?.script || "", selectedScript?.script_id || "")}
                >
                  {isCopied === selectedScript?.script_id ? "Copied!" : "Copy"}
                </Button>
                <Link
                  href={{
                    pathname: "/results/details",
                    query: { attack: selectedAttack, target: selectedTarget },
                  }}
                  passHref
                >
                  <Button
                    className="bg-[#6f4ef2] shadow-lg ml-4"
                    onClick={() => handleLearnMore(selectedScript!)}
                  >
                    Learn More
                  </Button>
                </Link>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      )}
    </div>
  );
}