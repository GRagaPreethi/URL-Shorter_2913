import { Link } from "wouter"
import { Link as LinkIcon, BarChart3, Settings, Github } from "lucide-react"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center">
          <div className="flex items-center gap-2 font-bold text-lg text-primary mr-6">
            <LinkIcon className="w-5 h-5" />
            <Link href="/" className="hover:opacity-90 transition-opacity">LinkSnap</Link>
          </div>
          
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
              Dashboard
            </Link>
          </nav>
          
          <div className="ml-auto flex items-center space-x-4">
            <a 
              href="https://github.com/replit" 
              target="_blank" 
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
