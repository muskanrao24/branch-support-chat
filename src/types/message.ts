// Types for the messaging system
export interface Message {
  userId: string;
  timestamp: string;
  text: string;
  assignedTo: null | "agentId";
  status: "unassigned" | "assigned";
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  availableStatus: "online" | "offline" | "busy";
}
