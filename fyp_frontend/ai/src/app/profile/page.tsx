"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import MainHeader from "../components/MainHeader";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ProfilePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const codeCopied = () => toast("Code copied to clipboard")
    const failCopied = () => toast("Failed to copt code")

    const [selectedUserName, setSelectedUserName] = useState<string>("Guest");
    const [userId, setUserId] = useState<string | null>(null);
    const [savedCodes, setSavedCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

    useEffect(() => {
        const storedUserId = sessionStorage.getItem("userId");
        const storedUserName = sessionStorage.getItem("userName");

        if (!storedUserId || !storedUserName) {
            router.push("/login"); // Redirect to login if user details are not found
            return;
        }

        setUserId(storedUserId);
        setSelectedUserName(storedUserName);
    }, [router]);

    useEffect(() => {
        if (!userId) return;
        const errorFetch = () => toast("Error fetching saved code")

        const fetchSavedCodes = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/saved-scripts/${userId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();

                const formattedData = data.map((script: any) => ({
                    scriptId: script.script_id,
                    name: script.name,
                    script: script.script,
                    explanation: script.explanation,
                }));

                setSavedCodes(formattedData);
            } catch (error) {
                console.error("Error fetching saved codes:", error);
                errorFetch()
            } finally {
                setLoading(false);
            }
        };

        fetchSavedCodes();
    }, [userId]);

    const handleCopy = (script: string): void => {
        navigator.clipboard
            .writeText(script)
            .then(() => codeCopied())
            .catch((err) => failCopied());
    };

    const handleFlip = (index: number) => {
        setFlippedIndex(flippedIndex === index ? null : index);
    };

    const handleLogoClick = () => {
        router.push("/");
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-b from-[#010103] to-[#5f01f8] bg-fixed h-screen flex items-center justify-center text-white">
                Loading your saved codes...
            </div>
        );
    }

    return (
        <div >
            <MainHeader />

            <div className="flex flex-col items-center justify-center pt-20 mb-10">
                <h2 className="text-xl text-white font-bold">Saved Results:</h2>
            </div>
            <div className="flex flex-col items-center">
                <div className="max-w-[950px] mx-auto space-y-10">
                    {savedCodes.map((result, index) => (
                        <div
                            key={result.scriptId || `saved-code-${index}`} // Ensure a unique key
                            className="relative bg-purple-700 rounded-lg p-6 text-white mb-6"
                        >
                            {flippedIndex === index ? (
                                <>
                                    <div className="text-lg font-semibold mb-4">Explanation:</div>
                                    <p className="text-sm text-gray-300 mb-6">{result.explanation}</p>
                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-full"
                                        onClick={() => handleFlip(index)}
                                    >
                                        Back
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="text-lg font-semibold mb-2">
                                        Name: {result.name}
                                    </div>
                                    <pre className="text-sm bg-purple-800 p-4 rounded whitespace-pre-wrap">
                                        {result.script}
                                    </pre>
                                    <div className="flex justify-between mt-4">
                                        <button
                                            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-full"
                                            onClick={() => handleCopy(result.script)}
                                        >
                                            Copy
                                        </button>
                                        <button
                                            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-full"
                                            onClick={() => handleFlip(index)}
                                        >
                                            Learn More
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {/* ToastContainer for displaying toast notifications */}
            <ToastContainer position="top-center" theme="dark"/>
        </div>
    );
}