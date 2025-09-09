import { useRef, useEffect, useCallback } from "react";

import { AudioLines, Square, ArrowUp, VolumeOff, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import StatusBar from "@/components/status-bar";
import { modelInfoList } from "@/lib/ai/models";

export interface MessagesProps {
	inputText: string;
	setInputText: (val: string) => void;
	isListening: boolean;
	onToggleListening: () => void;
	status: string;
	isMuted: boolean;
	onToggleMute: () => void;
	onSendMessage: (message: string) => void;
	selectedModel: string;
	onModelChange: (model: string) => void;
	placeholder?: string;
}

function MessageInput({
	inputText,
	setInputText,
	isListening,
	onToggleListening,
	status,
	isMuted,
	onToggleMute,
	onSendMessage,
	selectedModel,
	onModelChange,
	placeholder,
}: MessagesProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const adjustTextareaHeight = useCallback(() => {
		if (textareaRef.current) {
			const minPixelHeight = 98;
			textareaRef.current.style.height = "auto";
			const scrollBasedHeight = textareaRef.current.scrollHeight;
			const targetHeight = Math.max(minPixelHeight, scrollBasedHeight);
			const maxHeight = window.innerHeight * 0.5;
			textareaRef.current.style.height = `${Math.min(targetHeight, maxHeight)}px`;
		}
	}, []);

	useEffect(() => {
		adjustTextareaHeight();
	}, [adjustTextareaHeight]);

	const handleSendMessage = () => {
		if (inputText.trim()) {
			onSendMessage(inputText.trim());
			setInputText("");
		}
	};

	return (
		<div className="flex flex-col gap-0">
			{status && <StatusBar status={status} />}

			<div className="relative">
				<Textarea
					ref={textareaRef}
					id="followUpInputArea"
					className="w-full resize-none overflow-y-auto text-sm bg-muted pr-24 dark:border-zinc-700 border border-input rounded-2xl min-h-[120px]"
					placeholder={placeholder ?? "Ask a follow up..."}
					value={inputText}
					onChange={(e) => {
						setInputText(e.target.value);
						adjustTextareaHeight();
					}}
					rows={4}
					onKeyDown={(e) => {
						if (
							e.key === "Enter" &&
							!e.shiftKey &&
							!e.nativeEvent.isComposing
						) {
							e.preventDefault();
							handleSendMessage();
						}
					}}
				/>
				<div className="absolute bottom-3 left-3 flex items-center gap-2">
					<Select value={selectedModel} onValueChange={onModelChange}>
						<SelectTrigger className="w-[150px] h-8 text-xs bg-background border-border hover:bg-accent hover:text-accent-foreground cursor-pointer">
							<SelectValue placeholder="Select model" />
						</SelectTrigger>
						<SelectContent>
							{modelInfoList.map((model) => (
								<SelectItem key={model.id} value={model.id}>
									{model.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{isListening && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									onClick={onToggleMute}
									className="rounded-full cursor-pointer"
									aria-label={isMuted ? "Unmute" : "Mute"}
								>
									{isMuted ? <VolumeOff size={20} /> : <Volume2 size={20} />}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{isMuted ? "Unmute" : "Mute"}</p>
							</TooltipContent>
						</Tooltip>
					)}
				</div>
				<div className="absolute bottom-3 right-3 flex items-center gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon"
								variant={
									!inputText.trim() && !isListening ? "outline" : "default"
								}
								onClick={
									inputText.trim() ? handleSendMessage : onToggleListening
								}
								className="rounded-full cursor-pointer"
								aria-label={
									inputText.trim()
										? "Send message"
										: isListening
											? "Stop vibing"
											: "Start vibing"
								}
							>
								{inputText.trim() ? (
									<ArrowUp size={20} />
								) : isListening ? (
									<Square size={20} />
								) : (
									<AudioLines size={20} />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								{inputText.trim()
									? "Send message"
									: isListening
										? "Stop vibing"
										: "Start vibing"}
							</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}

export default MessageInput;
