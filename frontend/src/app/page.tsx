'use client';

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Link from "next/link";
import WalletConnect from "@/components/WalletConnect";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Stats from "@/components/Stats";
import Footer from "@/components/Footer";

export default function Home() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
<section className="relative overflow-hidden min-h-screen flex items-center" data-aos="fade-up" data-aos-delay="100">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-foreground/5" data-aos="fade-in" data-aos-delay="200">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-32 h-32 bg-primary/30 rounded-full blur-lg animate-pulse" data-aos="zoom-in" data-aos-delay="300"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-secondary/40 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s' }} data-aos="zoom-in" data-aos-delay="400"></div>
            <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-accent/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }} data-aos="zoom-in" data-aos-delay="500"></div>
            <div className="absolute bottom-20 right-10 w-28 h-28 bg-primary/20 rounded-full blur-lg animate-bounce" style={{ animationDelay: '0.5s' }} data-aos="zoom-in" data-aos-delay="600"></div>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 w-full">
          <div className="text-center fade-in" data-aos="fade-up" data-aos-delay="300">
            {/* Cool Blinking Animation instead of Wallet Connect Preview */}
            <div className="mb-6 sm:mb-8" data-aos="fade-down" data-aos-delay="400">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary animate-pulse">
                Explore the Future of Event Ticketing!
              </h2>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 leading-tight" data-aos="fade-up" data-aos-delay="500">
              Welcome to{" "}
              <span className="relative inline-block">
                Evenntz
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse"></div>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-foreground/70 max-w-2xl sm:max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4" data-aos="fade-up" data-aos-delay="600">
              Discover amazing events happening around the world or host your own.
              Connect your wallet and start exploring or creating the future of event ticketing.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 px-4" data-aos="fade-up" data-aos-delay="700">
              <Link
                href="/events"
                className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 group w-full sm:w-auto animate-pulse hover:animate-none"
                data-aos="zoom-in" data-aos-delay="800"
              >
                <span>Explore Events</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <Link href="/dashboard" className="btn-primary">Host Events</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-foreground/2" data-aos="fade-up">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 fade-in" data-aos="fade-down">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
              Why Choose Evenntz?
            </h2>
            <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto px-4">
              Experience the next generation of event management with blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="card p-6 sm:p-8 text-center group hover:scale-105 transition-all duration-300 slide-in" data-aos="fade-up" data-aos-delay="100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 glass rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Secure Ticketing</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                Blockchain-powered tickets ensure authenticity and prevent fraud
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-6 sm:p-8 text-center group hover:scale-105 transition-all duration-300 slide-in" data-aos="fade-up" data-aos-delay="200">
              <div className="w-14 h-14 sm:w-16 sm:h-16 glass rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Global Events</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                Discover events from around the world in one seamless platform
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-6 sm:p-8 text-center group hover:scale-105 transition-all duration-300 slide-in" data-aos="fade-up" data-aos-delay="300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 glass rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Lightning Fast</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                Instant transactions and real-time updates powered by modern technology
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card p-6 sm:p-8 text-center group hover:scale-105 transition-all duration-300 slide-in" data-aos="fade-up" data-aos-delay="400">
              <div className="w-14 h-14 sm:w-16 sm:h-16 glass rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Easy Event Hosting</h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                Create and manage your events effortlessly with our intuitive tools and blockchain-powered features
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Stats Section */}
      <Stats />

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24" data-aos="fade-up">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="card p-8 sm:p-10 lg:p-12 fade-in" data-aos="zoom-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg text-foreground/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already discovering and hosting amazing events on Evenntz
            </p>

            {/* Wallet Connect Integration */}
            <div className="mb-6 sm:mb-8">
              <WalletConnect className="justify-center" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/events"
                className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
              >
                Start Exploring
              </Link>
              <Link
                href="/host/register"
                className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
              >
                Become a Host
              </Link>
            </div>

            {/* Demo Video Placeholder */}
            <div className="mt-8 sm:mt-10">
              <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H13a1 1 0 011 1v1a1 1 0 01-1 1h-1.414a1 1 0 00-.707.293l-.707.707A1 1 0 009.586 15H9a1 1 0 01-1-1v-1a1 1 0 011-1z" />
                  </svg>
                  <p className="text-muted-foreground">Interactive Demo Coming Soon</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Watch how Evenntz works in action</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
