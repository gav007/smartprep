'use client';

import type { SimulationStep, PacketLayerData, EthernetHeader, IPHeader, TCPHeader, UDPHeader } from '@/types/packet';

export const osiLayers = ["Application", "Presentation", "Session", "Transport", "Network", "Data Link", "Physical"];

// --- Dummy Data Generation ---
const generateMAC = () => `00:1A:2B:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()}`;
const generateIP = (prefix = "192.168.1") => `${prefix}.${Math.floor(Math.random() * 254) + 1}`;
const generatePort = () => Math.floor(Math.random() * (65535 - 1024)) + 1024; // Dynamic ports

const hostAMAC = generateMAC();
const hostBMAC = generateMAC();
const routerMACInternal = generateMAC(); // Router interface facing Host A
const routerMACExternal = generateMAC(); // Router interface facing Host B (next hop)

const hostAIP = generateIP("192.168.1");
const hostBIP = generateIP("10.10.10"); // Different subnet
const routerIPInternal = "192.168.1.1";
const routerIPExternal = "10.10.10.1"; // Example gateway for Host B's network

const hostAPort = generatePort();
const hostBPort = 80; // Example HTTP

// --- Simulation Step Definitions ---
export const generateSimulationSteps = (initialData: string = "Hello, World!", protocol: 'TCP' | 'UDP' = 'TCP'): SimulationStep[] => {
    const steps: SimulationStep[] = [];
    let currentPacketState: PacketLayerData = {};
    let stepCounter = 0;

    const addStep = (location: SimulationStep['location'], layer: SimulationStep['layer'], direction: SimulationStep['direction'], description: string, updates: Partial<PacketLayerData> = {}, activeLayerName: string = layer as string) => {
        // Deep clone and update state
        const newState = JSON.parse(JSON.stringify(currentPacketState));

        // Apply updates, carefully handling nested payloads
        let target = newState;
        for (const key in updates) {
            if (key === 'payload') {
                 // If updating payload, it usually replaces the deeper structure
                 target.payload = updates.payload;
                 // Clear lower layer headers if we are moving up
                 if (direction === 'Up') {
                    if (layer === 'Data Link') { delete target.dataLink; delete target.physical; }
                    if (layer === 'Network') { delete target.network; delete target.dataLink; delete target.physical; }
                    // ... and so on
                 }
            } else if (key !== 'payload' && updates[key as keyof PacketLayerData] !== undefined) {
                // Assign header directly
                target[key as keyof PacketLayerData] = updates[key as keyof PacketLayerData];
            }
        }

        currentPacketState = newState; // Update global state for next step

        steps.push({
            step: stepCounter++,
            location,
            layer,
            direction,
            description,
            packetState: JSON.parse(JSON.stringify(currentPacketState)), // Store a snapshot
            activeLayerName,
        });
    };


    // === Host A Encapsulation ===
    addStep('Host A', 'Application', 'Down', `Data "${initialData}" created.`, { application: { payload: initialData } });
    addStep('Host A', 'Presentation', 'Down', 'Data formatted (e.g., ASCII encoding).', { presentation: { format: "ASCII", data: initialData } }); // Simplified
    addStep('Host A', 'Session', 'Down', 'Session established (ID: 123).', { session: { sessionId: "123", data: initialData } }); // Simplified
    let transportHeader: TCPHeader | UDPHeader;
    if (protocol === 'TCP') {
        transportHeader = {
            sourcePort: hostAPort, destPort: hostBPort, sequenceNumber: 1000, ackNumber: 0, dataOffset: 5,
            flags: { syn: true, ack: false, fin: false, psh: false, rst: false, urg: false }, windowSize: 65535, checksum: 'A1B2', urgentPointer: 0
        };
        addStep('Host A', 'Transport', 'Down', `TCP header added (Src Port: ${hostAPort}, Dst Port: ${hostBPort}).`, { transport: transportHeader, payload: currentPacketState.session });
    } else {
         transportHeader = { sourcePort: hostAPort, destPort: hostBPort, length: initialData.length + 8, checksum: 'C3D4' };
        addStep('Host A', 'Transport', 'Down', `UDP header added (Src Port: ${hostAPort}, Dst Port: ${hostBPort}).`, { transport: transportHeader, payload: currentPacketState.session });
    }
    const ipHeader: IPHeader = {
        version: 4, ihl: 5, tos: 0, length: 20 + 20 + initialData.length, id: 1, flags: 0, fragmentOffset: 0,
        ttl: 64, protocol: protocol, checksum: 'E5F6', sourceIP: hostAIP, destIP: hostBIP
    };
    addStep('Host A', 'Network', 'Down', `IP header added (Src: ${hostAIP}, Dst: ${hostBIP}).`, { network: ipHeader, payload: currentPacketState.transport });
    const ethernetHeader1: EthernetHeader = { sourceMAC: hostAMAC, destMAC: routerMACInternal, type: 'IPv4' };
    addStep('Host A', 'Data Link', 'Down', `Ethernet header added (Src: ${hostAMAC}, Dst: ${routerMACInternal}). Frame created.`, { dataLink: ethernetHeader1, payload: currentPacketState.network });
    addStep('Host A', 'Physical', 'Down', 'Frame converted to electrical signals (bits).', { physical: { bits: "01101..." } }); // Simplified

    // === Transmission to Router ===
    addStep('Network Cable', 'Transmission', 'Across', `Signals travel across the cable to the router.`, {}, 'Physical');

    // === Router Processing ===
    addStep('Router', 'Physical', 'Up', 'Router receives electrical signals.', { physical: { bits: "01101..." } });
    addStep('Router', 'Data Link', 'Up', `Bits assembled into frame. Dest MAC (${routerMACInternal}) matches router interface. Header stripped.`, { payload: currentPacketState.network }, 'Data Link'); // Show network payload
    addStep('Router', 'Network', 'Up', `IP packet extracted. Dest IP (${hostBIP}) checked in routing table. TTL decremented. Checksum recalculated.`, { network: { ...ipHeader, ttl: 63, checksum: 'E5F7' }, payload: currentPacketState.transport }, 'Network'); // Update TTL, show transport payload
    const ethernetHeader2: EthernetHeader = { sourceMAC: routerMACExternal, destMAC: hostBMAC, type: 'IPv4' }; // New MACs for next hop
    addStep('Router', 'Data Link', 'Down', `Packet re-encapsulated in new Ethernet frame (Src: ${routerMACExternal}, Dst: ${hostBMAC}).`, { dataLink: ethernetHeader2, payload: currentPacketState.network });
    addStep('Router', 'Physical', 'Down', 'Frame converted to signals for transmission.', { physical: { bits: "10010..." } });

    // === Transmission to Host B ===
    addStep('Network Cable', 'Transmission', 'Across', `Signals travel across the cable to Host B.`, {}, 'Physical');

     // === Host B De-encapsulation ===
    addStep('Host B', 'Physical', 'Up', 'Host B receives electrical signals.', { physical: { bits: "10010..." } });
    addStep('Host B', 'Data Link', 'Up', `Bits assembled into frame. Dest MAC (${hostBMAC}) matches. Header stripped.`, { payload: currentPacketState.network }, 'Data Link');
    addStep('Host B', 'Network', 'Up', `IP packet extracted. Dest IP (${hostBIP}) matches. Header stripped.`, { payload: currentPacketState.transport }, 'Network');
    addStep('Host B', 'Transport', 'Up', `${protocol} segment extracted. Dest Port (${hostBPort}) matches listening application. Header stripped.`, { payload: currentPacketState.session }, 'Transport');
    addStep('Host B', 'Session', 'Up', 'Session data extracted.', { payload: currentPacketState.presentation }, 'Session'); // Simplified
    addStep('Host B', 'Presentation', 'Up', 'Data format interpreted (ASCII).', { payload: currentPacketState.application }, 'Presentation'); // Simplified
    addStep('Host B', 'Application', 'Up', `Application receives data: "${initialData}".`, {}, 'Application');

    return steps;
};
