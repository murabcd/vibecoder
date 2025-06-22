import React from "react";
import { Mic, MicOff, Terminal } from "lucide-react";

import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  return (
    <div className="p-5 text-lg font-semibold flex justify-between items-center">
      <div className="flex items-center">
        <div onClick={() => window.location.reload()} style={{ cursor: "pointer" }}>
          <Terminal className="w-6 h-6 mr-2" />
        </div>
        <div>
          Vibe <span className="text-muted-foreground">Coder</span>
        </div>
      </div>
      <div className="flex items-center gap-x-2">
        <ModeToggle />
      </div>
    </div>
  );
};

export default Header;
