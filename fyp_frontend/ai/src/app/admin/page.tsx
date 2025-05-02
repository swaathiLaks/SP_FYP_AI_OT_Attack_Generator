"use client";

import React, { useState, useEffect } from "react";
import { CheckboxGroup, Checkbox, Button, Spinner } from "@heroui/react";
import MainHeader from "../components/MainHeader";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type AttackVector = {
    id: number;
    attack: string;
    selected: number;
};

type Target = {
    id: number;
    target: string;
    ip_address: string;
    selected: number;
};

export default function AdminPage() {
    const [attackVectors, setAttackVectors] = useState<AttackVector[]>([]);
    const [targets, setTargets] = useState<Target[]>([]);

    const [selectedAttackVectors, setSelectedAttackVectors] = useState<number[]>([]);
    const [selectedTargets, setSelectedTargets] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Track loading state

    const successful = () => toast("Selections updated successfully!");
    const saveError = () => toast("Error updating selections. Please try again.");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true); // Start loading
                const attackRes = await fetch(`http://127.0.0.1:5000/api/attack-vectors`);
                const attackData: AttackVector[] = await attackRes.json();
                setAttackVectors(attackData);
                setSelectedAttackVectors(attackData.filter(v => v.selected === 0).map(v => v.id));

                const targetRes = await fetch(`http://127.0.0.1:5000/api/targets`);
                const targetData: Target[] = await targetRes.json();
                setTargets(targetData);
                setSelectedTargets(targetData.filter(t => t.selected === 0).map(t => t.id));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false); // End loading
            }
        };

        fetchData();
    }, []); // Add an empty dependency array to ensure this runs only once

    const saveSelections = async () => {
        try {
            const attackVectorUpdates = attackVectors.map(vector => ({
                id: vector.id,
                "new-name": vector.attack,
                selected: selectedAttackVectors.includes(vector.id) ? 0 : 1,
            }));

            const targetUpdates = targets.map(target => ({
                id: target.id,
                "target": target.target,
                "ip_address": target.ip_address,
                selected: selectedTargets.includes(target.id) ? 0 : 1,
            }));

            console.log(targetUpdates)
            await fetch(`http://127.0.0.1:5000/api/attack-vectors`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "attack-options": attackVectorUpdates }),
            });

            await fetch(`http://127.0.0.1:5000/api/targets`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "attack-targets": targetUpdates }),
            });

            successful();
        } catch (error) {
            console.error("Error updating selections:", error);
            saveError();
        }
    };

    return (
        <div>
            <MainHeader />

            <div className="flex flex-col items-center justify-center pt-20 mb-10">
                <h1 className="text-[4rem] font-bold text-white">Admin Panel</h1>
                <p className="text-[25px] font-bold text-white">Manage Attack Vectors and Targets</p>
            </div>

            <div className="max-w-[950px] mx-auto space-y-10">
                {isLoading ? (
                    // Spinner with "Loading" label
                    <div className="flex flex-col items-center justify-center">
                        <Spinner size="lg" color="primary" className="mb-4" />
                        <span className="text-white text-lg font-bold">Loading...</span>
                    </div>
                ) : (
                    <>
                        {/* Attack Vectors */}
                        <div className="gap-4">
                            <CheckboxGroup
                                label={<span className="text-white">Select Attack Vectors</span>}
                                value={selectedAttackVectors.map(String)}
                                onValueChange={(values) => setSelectedAttackVectors(values.map(Number))}
                            >
                                <div className="grid grid-cols-3 gap-4">
                                    {attackVectors.map((vector) => (
                                        <div
                                            key={vector.id}
                                            className="flex items-center space-x-3"
                                        >
                                            <Checkbox
                                                value={String(vector.id)}
                                                size="sm"
                                                classNames={{
                                                    base: "border-2 border-white rounded-lg",
                                                    icon: "bg-transparent",
                                                }}
                                            />
                                            <span className="text-white bg-black/15 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg px-5 py-3 flex-grow">
                                                {vector.attack}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CheckboxGroup>
                            <p className="text-default-500 text-sm text-white mt-3">
                                Selected Attack Vectors: {selectedAttackVectors.join(", ")}
                            </p>
                        </div>

                        {/* Attack Paths */}
                        <div>
                            <h2 className="text-[2rem] font-bold text-white mb-6">Targets</h2>
                            <CheckboxGroup
                                label={<span className="text-white">Select Targets</span>}
                                value={selectedTargets.map(String)}
                                onValueChange={(values) => setSelectedTargets(values.map(Number))}
                            >
                                <div className="grid grid-cols-3 gap-4">
                                    {targets.map((target) => (
                                        <div key={target.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                value={String(target.id)}
                                                size="sm"
                                                classNames={{
                                                    base: "border-2 border-white rounded-lg",
                                                    icon: "bg-transparent",
                                                }}
                                            />
                                            <span className="text-white bg-black/15 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg px-5 py-3 flex-grow">
                                                {target.target} ({target.ip_address})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CheckboxGroup>
                            <p className="text-default-500 text-sm text-white mt-3">
                                Selected Targets: {selectedTargets.join(", ")}
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-center mt-10 py-10">
                            <Button
                                onPress={saveSelections}
                                className="bg-blue-500 hover:bg-blue-700 text-white px-6 py-3 rounded font-bold"
                            >
                                Save
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* ToastContainer for displaying toast notifications */}
            <ToastContainer position="top-center" theme="dark" />
        </div>
    );
}