import type React from "react";
import { Terminal, Eye } from "lucide-react";

import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
	onOpenMobileCodeDrawer?: () => void;
	hasGeneratedCode?: boolean;
}

const Header: React.FC<HeaderProps> = ({
	onOpenMobileCodeDrawer,
	hasGeneratedCode = false,
}) => {
	return (
		<div className="p-5 text-lg font-semibold flex justify-between items-center">
			<div className="flex items-center">
				<button
					type="button"
					onClick={() => window.location.reload()}
					aria-label="Reload"
					className="cursor-pointer"
				>
					<Terminal className="w-6 h-6 mr-2" />
				</button>
				<div>
					Vibe <span className="text-muted-foreground">Coder</span>
				</div>
			</div>
			<div className="flex items-center gap-x-2">
				{/* Mobile code drawer trigger - only show on mobile and when code is available */}
				{onOpenMobileCodeDrawer && hasGeneratedCode && (
					<div className="block md:hidden">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									onClick={onOpenMobileCodeDrawer}
									className="h-9 w-9"
								>
									<Eye className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>View Code</p>
							</TooltipContent>
						</Tooltip>
					</div>
				)}
				<ModeToggle />
			</div>
		</div>
	);
};

export default Header;
