"use client";

import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Metrics } from '@/components/Metrics';
import { Problem, Solution } from '@/components/Features';
import { HowItWorks } from '@/components/HowItWorks';
import { ValueProps } from '@/components/ValueProps';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen selection:bg-brand-accent selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Metrics />
        <Problem />
        <Solution />
        <HowItWorks />
        <ValueProps />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
