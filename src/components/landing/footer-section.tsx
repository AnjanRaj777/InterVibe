"use client"

import React from "react"
import { Twitter, Github, Linkedin } from "lucide-react"

export function FooterSection() {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer className="w-full max-w-[1320px] mx-auto px-5 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0 py-10 md:py-[70px]">
      {/* Left Section: Logo, Description, Social Links */}
      <div className="flex flex-col justify-start items-start gap-8 p-4 md:p-8">
        <div className="flex gap-3 items-stretch justify-center">
          <div className="text-center text-foreground text-xl font-semibold leading-4">InterVibe</div>
        </div>
        <p className="text-foreground/90 text-sm font-medium leading-[18px] text-left">Coding made effortless</p>
        <div className="flex justify-start items-start gap-3">
          <a 
            href="https://x.com/anjan_raj82685" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Twitter / X" 
            className="w-4 h-4 flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <Twitter className="w-full h-full text-muted-foreground hover:text-foreground transition-colors" />
          </a>
          <a 
            href="https://github.com/AnjanRaj777/" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="GitHub" 
            className="w-4 h-4 flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <Github className="w-full h-full text-muted-foreground hover:text-foreground transition-colors" />
          </a>
          <a 
            href="https://www.linkedin.com/in/anjan-p-aab740326/" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="LinkedIn" 
            className="w-4 h-4 flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <Linkedin className="w-full h-full text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        </div>
      </div>

      {/* Right Section: Product, About / Team, Meta API */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 p-4 md:p-8 w-full md:w-auto">
        {/* Column 1: Product */}
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium leading-5">
            <a 
              href="#top" 
              onClick={(e) => handleScroll(e, "top")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Product
            </a>
          </h3>
          <div className="flex flex-col justify-end items-start gap-2">
            <a 
              href="#features-section" 
              onClick={(e) => handleScroll(e, "features-section")}
              className="text-foreground text-sm font-normal leading-5 hover:underline cursor-pointer"
            >
              Features
            </a>
            <a 
              href="#pricing-section" 
              onClick={(e) => handleScroll(e, "pricing-section")}
              className="text-foreground text-sm font-normal leading-5 hover:underline cursor-pointer"
            >
              Pricing
            </a>
            <a 
              href="#meta-ai-models-section" 
              onClick={(e) => handleScroll(e, "meta-ai-models-section")}
              className="text-foreground text-sm font-normal leading-5 hover:underline cursor-pointer"
            >
              Integrations
            </a>
            <a 
              href="#preview-card" 
              onClick={(e) => handleScroll(e, "preview-card")}
              className="text-foreground text-sm font-normal leading-5 hover:underline cursor-pointer"
            >
              Real-time Previews
            </a>
          </div>
        </div>

        {/* Column 2: (Company removed) About us, Our team, Contact */}
        <div className="flex flex-col justify-start items-start gap-3">
          <div className="h-5 invisible select-none" aria-hidden="true" />
          <div className="flex flex-col justify-center items-start gap-2">
            <a 
              href="https://www.linkedin.com/in/anjan-p-aab740326/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-foreground text-sm font-normal leading-5 hover:underline"
            >
              About us
            </a>
            <a 
              href="https://github.com/AnjanRaj777/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-foreground text-sm font-normal leading-5 hover:underline"
            >
              Our team
            </a>
            <a 
              href="https://www.linkedin.com/in/anjan-p-aab740326/" 
              target="_blank" 
              rel="noopener noreferrer" 
              title="LinkedIn: Anjan P | GitHub: AnjanRaj777 | X: @anjan_raj82685"
              className="text-foreground text-sm font-normal leading-5 hover:underline"
            >
              Contact
            </a>
          </div>
        </div>

        {/* Column 3: Meta API, API Reference, Documentation, Support */}
        <div className="flex flex-col justify-start items-start gap-3">
          <h3 className="text-muted-foreground text-sm font-medium leading-5">
            <a 
              href="#meta-ai-models-section" 
              onClick={(e) => handleScroll(e, "meta-ai-models-section")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Meta API
            </a>
          </h3>
          <div className="flex flex-col justify-center items-start gap-2">
            <a 
              href="#meta-ai-models-section" 
              onClick={(e) => handleScroll(e, "meta-ai-models-section")}
              className="text-foreground text-sm font-normal leading-5 hover:underline cursor-pointer"
            >
              API Reference
            </a>
            <a 
              href="https://github.com/AnjanRaj777/InterVibe/blob/main/LICENSE" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-foreground text-sm font-normal leading-5 hover:underline"
            >
              Documentation (MIT License)
            </a>
            <a 
              href="https://github.com/AnjanRaj777/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-foreground text-sm font-normal leading-5 hover:underline"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
