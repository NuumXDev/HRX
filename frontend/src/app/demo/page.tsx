"use client";

import { InlineWidget } from "react-calendly";
import { Navbar } from "@/components/Navbar";

export default function DemoPage() {
    const url = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/sompande1007/hrx-demo";

    return (
        <div className="min-h-screen grid-bg selection:bg-brand-accent selection:text-white flex flex-col">
            <Navbar />

            {/* 
        Main content area strictly constrained to viewport minus Navbar (80px),
        preventing unexpected outer scrollbars.
      */}
            <main className="flex-1 pt-28 pb-8 px-6 flex flex-col items-center">

                {/* Intro text aligned Theme-wise */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-display font-medium text-white mb-4 text-glow tracking-tight">
                        Let's upgrade your <span className="text-brand-accent italic">hiring engine.</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-xl mx-auto">
                        Select a time below to see exactly how HRX can automate screening, technical assessments, and more.
                    </p>
                </div>

                {/* 
          Glassmorphism container tightly framing the widget.
          Using a responsive height clamp so it fits inside modern laptop/desktop viewports elegantly. 
        */}
                <div className="w-full max-w-5xl h-[700px] sm:h-[600px] 2xl:h-[750px] relative glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">

                    {/* Ambient Backlight effect for premium feel */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-accent/20 rounded-full blur-[100px] pointer-events-none transition-all duration-700 group-hover:bg-brand-accent/30" />

                    {/* The Widget */}
                    <div className="absolute inset-0 z-10 p-2 sm:p-4">
                        <div className="w-full h-full bg-brand-surface/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-inner border border-white/5">
                            <InlineWidget
                                url={url}
                                styles={{
                                    height: '100%',
                                    width: '100%',
                                    border: 'none',
                                }}
                                pageSettings={{
                                    backgroundColor: '02040a',   /* Syncs with HRX dark background */
                                    hideEventTypeDetails: true,  /* Keep it ultra-clean, relying on our own headers */
                                    hideLandingPageDetails: true,
                                    primaryColor: '7c3aed',      /* Syncs with HRX brand accent (violet-600) */
                                    textColor: 'f1f5f9'          /* Syncs with Tailwind slate-100 */
                                }}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
