export type SessionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export interface ToolParameterProperty {
	type: string;
	description?: string;
	enum?: string[];
	pattern?: string;
	properties?: Record<string, ToolParameterProperty>;
	required?: string[];
	additionalProperties?: boolean;
	items?: ToolParameterProperty;
}

export interface ToolParameters {
	type: string;
	properties: Record<string, ToolParameterProperty>;
	required?: string[];
	additionalProperties?: boolean;
}

export interface Tool {
	type: "function";
	name: string;
	description: string;
	parameters: ToolParameters;
}

export interface AgentConfig {
	name: string;
	publicDescription: string; // gives context to agent transfer tool
	instructions: string;
	tools: Tool[];
	toolLogic?: Record<string, (args: any) => Promise<any> | any>;
	downstreamAgents?:
		| AgentConfig[]
		| { name: string; publicDescription: string }[];
}

export type AllAgentConfigsType = Record<string, AgentConfig[]>;

// Global window properties for agent tools
declare global {
	interface Window {
		triggerAppGeneration?: (description: string) => Promise<void>;
		handleFollowUpSubmit?: (message: string) => Promise<void>;
	}
}
