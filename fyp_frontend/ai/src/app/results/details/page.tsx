"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { CodeBlock } from "react-code-block";
import ResultHeader from "../../../app/components/ResultHeader";
import ReactMarkdown from "react-markdown"; // For Markdown rendering
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isMounted, setIsMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");

  const attack = searchParams.get("attack") || "DDOS";
  const target = searchParams.get("target") || "172.16.33.225";

  const [selectedAttack, setSelectedAttack] = useState<string>(attack);
  const [selectedTarget, setSelectedTarget] = useState<string>(target);

  useEffect(() => {
    setIsMounted(true);

    // Retrieve login state
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    setLoggedIn(isLoggedIn);

    // Retrieve and parse selected script from localStorage
    const storedScript = localStorage.getItem("selectedScript");
    if (storedScript) {
      try {
        const parsedScript = JSON.parse(storedScript);
        setCode(parsedScript.script || "No script found.");
        setExplanation(parsedScript.explanation || "No explanation available.");
      } catch (error) {
        console.error("Error parsing selectedScript JSON:", error);
      }
    } else {
      console.warn("No script found in localStorage for 'selectedScript'.");
    }
  }, []);

  const handleBackToResults = () => {
    // Keep the current attack and target in localStorage
    localStorage.setItem("selectedAttack", selectedAttack);
    localStorage.setItem("selectedTarget", selectedTarget);

    router.push(`/results?attack=${selectedAttack}&target=${selectedTarget}`);
  };

  const dataSaved = () => toast("Script saved successfully")
  const dataSaveFailed = () => toast("Failed to save script")
  const noUserId = () => toast("You need to be logged in to save the script.")

  // NOT DONE (SAVE TO DB)
  const handleSaveToDatabase = async (text: string): Promise<void> => {
    try {
      const selectedScript = localStorage.getItem("selectedScript");
      const storedUserId = sessionStorage.getItem("userId");

      if (!selectedScript) {
        alert("No script data available.");
        return;
      }

      const { script_id, script, explanation, name } = JSON.parse(selectedScript);
      //const userId = sessionStorage.getItem("user_id"); // Assuming user_id is stored in sessionStorage
      if (!storedUserId) {
        noUserId()
        return;
      }
      
      const response = await fetch(`http://127.0.0.1:5000/api/save-script/${script_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: storedUserId,
          name: name,
          script: script,
          explanation: explanation
        }),
      });

      if (response.ok) {
        const data = await response.json();
        dataSaved()
      } else {
        const error = await response.json();
        alert(error)
        dataSaveFailed()
      }
    } catch (err) {
      alert(err)
      console.error("Failed to save script:", err);
    }
  };

  /* Copy to Clipboard */
  const handleCopy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  /* Save to File */
  const handleSaveToFile = (text: string): void => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script.py";
    a.click();
  };

  return (
    <div>
      <ResultHeader
        selectedAttack={selectedAttack}
        setSelectedAttack={setSelectedAttack}
        selectedTarget={selectedTarget}
        setSelectedTarget={setSelectedTarget}
      />

      <div className="grid grid-rows-1 px-10 mx-auto mb-5 max-w-[1100px]">
        <Tabs variant="bordered" className="mb-5 text-white" color="default">
          <Tab key="Script" title={<span className="text-white">Script</span>}>
            <Card
              isFooterBlurred
              className="w-full col-span-12 sm:col-span-4 bg-[#3d0b95] transition-all duration-300 ease-in-out border border-white/10 rounded-[20px] shadow-lg mb-40"
            >
              <CardHeader className="p-0 bg-[#3d0b95] rounded-t-[20px]"></CardHeader>

              <CardBody className="flex-grow overflow-y-auto" style={{ maxHeight: '300px' }}>
                <CodeBlock code={code} language="py">
                  <CodeBlock.Code
                    className="bg-gray-900 p-6 rounded-xl shadow-lg overflow-x-auto custom-scrollbar"
                    style={{
                      whiteSpace: "pre-wrap", // Wrap long lines
                      wordBreak: "break-word", // Break words to avoid overflow
                      maxHeight: "300px", // Ensure vertical scrolling
                    }}
                  >
                    <CodeBlock.LineContent>
                      <CodeBlock.Token />
                    </CodeBlock.LineContent>
                  </CodeBlock.Code>
                </CodeBlock>
              </CardBody>

              <CardFooter
                className="bg-[#3d0b95] rounded-b-[20px] flex items-center justify-between border-t-[1px] border-white/20"
              >
                <div></div>

                <div className="flex items-center space-x-4 py-2 px-2">
                  <Button
                    className="bg-[#6f4ef2] inline-flex items-center justify-center text-white shadow-lg shadow-indigo-500/20"
                    onPress={() => handleCopy(code)}
                  >
                    {isCopied ? <span>Copied!</span> : <span>Copy</span>}
                  </Button>

                  <Dropdown>
                    <DropdownTrigger>
                      <Button className="bg-[#6f4ef2] shadow-lg shadow-indigo-500/20 text-white">
                        Save
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      {loggedIn ? (
                        <DropdownItem
                          key="savetodb"
                          onPress={() => handleSaveToDatabase(code)}
                        >
                          Save to Database
                        </DropdownItem>
                      ) : null}
                      <DropdownItem
                        key="savetofile"
                        onPress={() => handleSaveToFile(code)}
                      >
                        Save as File
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </CardFooter>
            </Card>
          </Tab>

          <Tab key="Explanation" title={<span className="text-white">Explanation</span>}>
            <Card
              isFooterBlurred
              className="w-full h-[450px] col-span-12 sm:col-span-4 bg-[#3d0b95] transition-all duration-300 ease-in-out border border-white/10 rounded-[20px] shadow-lg mb-40"
            >
              <CardHeader className="p-0 bg-[#3d0b95] rounded-t-[20px]"></CardHeader>

              <CardBody className="flex-grow custom-scrollbar">
                <ReactMarkdown className="text-white text-left text-[15px] p-5 ">
                  {explanation}
                </ReactMarkdown>
              </CardBody>

              <CardFooter className="p-5 bg-[#3d0b95] rounded-b-[20px] flex items-center justify-between border-t-[1px] border-white/20">
                <div></div>

                <div className="flex items-center space-x-4">
                  <Button
                    className="bg-[#6f4ef2] inline-flex items-center justify-center text-white shadow-lg shadow-indigo-500/20"
                    onPress={() => handleCopy(explanation)}
                  >
                    {isCopied ? <span>Copied!</span> : <span>Copy</span>}
                  </Button>

                  <Dropdown>
                    <DropdownTrigger>
                      <Button className="bg-[#6f4ef2] shadow-lg shadow-indigo-500/20 text-white">
                        Save
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      {loggedIn ? (
                        <DropdownItem
                          key="savetodb"
                          onPress={() => handleSaveToFile(code)}
                        >
                          Save to File
                        </DropdownItem>
                      ) : null}
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </CardFooter>
            </Card>
          </Tab>
        </Tabs>
      </div>

      {/* Fixed Back Button at Bottom Right */}
      <div
        className="fixed bottom-4 right-4"
        style={{ zIndex: 100, marginRight: '20px', marginBottom: '20px' }}
      >
        <Button className="bg-[#6f4ef2] shadow-lg" onClick={handleBackToResults}>
          Back to Results
        </Button>
      </div>

      {/* ToastContainer for displaying toast notifications */}
      <ToastContainer position="top-center" theme="dark" />
    </div>
  );
}