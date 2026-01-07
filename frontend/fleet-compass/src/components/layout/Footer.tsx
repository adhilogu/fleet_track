import React from 'react';
import { Linkedin, Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto py-3">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-center gap-6 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Fleet Track - </span> Adithya L 
          </span>
          
          <div className="flex gap-2">
            <a href="https://linkedin.com/in/adithya-loganathan-a47218283" target="_blank" rel="noopener noreferrer" 
               className="p-1.5 rounded hover:bg-primary/10 transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
            <a href="https://github.com/adhilogu" target="_blank" rel="noopener noreferrer"
               className="p-1.5 rounded hover:bg-primary/10 transition-colors" aria-label="GitHub">
              <Github className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;