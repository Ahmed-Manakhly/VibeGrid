import Link from 'next/link';
import { ExternalLinkIcon, GithubIcon, RocketIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ProjectShipCardProps {
  projectName?: string;
  tagline?: string;
  demoUrl?: string;
  repoUrl?: string;
  techStack?: string[];
  className?: string;
}

export function ProjectShipCard({
  projectName,
  tagline,
  demoUrl,
  repoUrl,
  techStack = [],
  className = '',
}: ProjectShipCardProps) {
  if (!projectName && !demoUrl && !repoUrl && techStack.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-background/60 to-purple-950/20 p-4 sm:p-5 backdrop-blur-md shadow-lg shadow-violet-950/20 space-y-4 ${className}`}
    >
      {/* Launch Mode Badge & Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30">
          <RocketIcon className="size-3.5 text-violet-400 animate-pulse" />
          <span>SHIPPED PROJECT</span>
        </div>
      </div>

      {/* Project Title & Tagline */}
      <div className="space-y-1">
        {projectName && (
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {projectName}
          </h3>
        )}
        {tagline && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {tagline}
          </p>
        )}
      </div>

      {/* Tech Stack Pills */}
      {techStack && techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {techStack.map((tech, idx) => (
            <Link
              key={idx}
              href={`/explore?tag=${encodeURIComponent(tech.toLowerCase())}`}
              className="inline-block"
            >
              <span className="inline-flex items-center text-[11px] sm:text-xs font-mono font-medium px-2.5 py-0.5 rounded-lg border border-border/50 bg-secondary/70 text-secondary-foreground hover:bg-violet-500/20 hover:text-violet-300 hover:border-violet-500/40 transition-all cursor-pointer">
                #{tech}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Dual CTA Actions */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {demoUrl && (
          <Button
            asChild
            size="sm"
            className="btn-gradient text-xs font-medium rounded-xl h-9 px-4 shadow-md shadow-violet-500/20 flex items-center gap-1.5"
          >
            <a href={demoUrl} target="_blank" rel="noopener noreferrer">
              <span>Live Demo</span>
              <ExternalLinkIcon className="size-3.5 ml-1" />
            </a>
          </Button>
        )}
        {repoUrl && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs font-medium rounded-xl h-9 px-4 border-border/60 hover:bg-white/5 flex items-center gap-1.5"
          >
            <a href={repoUrl} target="_blank" rel="noopener noreferrer">
              <GithubIcon className="size-3.5 mr-1" />
              <span>Source Code</span>
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
