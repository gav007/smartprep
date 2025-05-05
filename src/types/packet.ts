/**
 * Represents the headers for different network layers.
 */
export interface EthernetHeader {
  sourceMAC: string;
  destMAC: string;
  type: string; // e.g., IPv4
}

export interface IPHeader {
  version: number;
  ihl: number; // Internet Header Length
  tos: number; // Type of Service
  length: number;
  id: number;
  flags: number;
  fragmentOffset: number;
  ttl: number; // Time to Live
  protocol: string; // e.g., TCP, UDP
  checksum: string; // Hex string
  sourceIP: string;
  destIP: string;
}

export interface TCPHeader {
  sourcePort: number;
  destPort: number;
  sequenceNumber: number;
  ackNumber: number;
  dataOffset: number;
  flags: {
    urg: boolean;
    ack: boolean;
    psh: boolean;
    rst: boolean;
    syn: boolean;
    fin: boolean;
  };
  windowSize: number;
  checksum: string; // Hex string
  urgentPointer: number;
}

export interface UDPHeader {
  sourcePort: number;
  destPort: number;
  length: number;
  checksum: string; // Hex string
}

export type TransportHeader = TCPHeader | UDPHeader;

export interface ApplicationData {
  payload: string; // Original user data or application protocol data (e.g., "GET /index.html")
}

/**
 * Represents the state of the packet data at a specific layer during simulation.
 */
export interface PacketLayerData {
  application?: ApplicationData;
  presentation?: { format: string; data: string }; // Simplified
  session?: { sessionId: string; data: string }; // Simplified
  transport?: TransportHeader;
  network?: IPHeader;
  dataLink?: EthernetHeader;
  physical?: { bits: string }; // Simplified representation
  payload?: string | PacketLayerData; // Encapsulated data from upper layer
}

/**
 * Represents a single step in the packet flow simulation.
 */
export interface SimulationStep {
  step: number;
  location: 'Host A' | 'Router' | 'Host B' | 'Network Cable';
  layer: 'Application' | 'Presentation' | 'Session' | 'Transport' | 'Network' | 'Data Link' | 'Physical' | 'Transmission';
  direction: 'Down' | 'Up' | 'Across'; // Encapsulation, De-encapsulation, Forwarding
  description: string; // Explanation of what's happening
  packetState: PacketLayerData; // Data and headers at this step
  activeLayerName: string; // Which layer to highlight
}
