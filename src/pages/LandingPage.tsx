import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import TextPressure from '../components/TextPressure';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

import lp from "@/assets/lp.jpg";
import lp2 from "@/assets/lp2.jpg";
import lp3 from "@/assets/lp3.png";
import lp4 from "@/assets/lp4.jpg";
import lp5 from "@/assets/lp5.jpeg";
import lp6 from "@/assets/lp6.jpg";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const LandingPage = () => {
    const navigate = useNavigate();
    const smoothWrapperRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        // Create ScrollSmoother instance
        const smoother = ScrollSmoother.create({
            wrapper: smoothWrapperRef.current,
            content: contentRef.current,
            smooth: 3,
            effects: true,
            normalizeScroll: true
        });

        // Cleanup on unmount
        return () => {
            smoother?.kill();
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return (
        // Smooth wrapper - required by ScrollSmoother
        <div id="smooth-wrapper" ref={smoothWrapperRef}>
            {/* Content wrapper - required by ScrollSmoother */}
            <div id="smooth-content" ref={contentRef}>
                {/* Original root container */}
                <div className="w-full min-h-screen bg-black text-white font-sans flex flex-col items-center overflow-x-hidden">

                    {/* ================= CUSTOM FONTS ================= */}
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
                        .font-kindle { font-family: 'Playfair Display', serif; }
                        .font-body { font-family: 'Inter', sans-serif; }
                    `}</style>

                    {/* ================= HERO SECTION ================= */}
                    <div className="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden shrink-0">

                        {/* Background Image */}
                        <div
                            className="absolute inset-0 z-0"
                            style={{
                                backgroundImage: `url(${lp})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black"></div>
                        </div>

                        {/* Hero Content Wrapper */}
                        <div className="relative z-10 w-full max-w-[1200px] px-6 flex flex-col items-center justify-center text-center pt-20">

                            {/* PagePulse Floating Text */}
                            <div className="flex justify-center mb-6 w-full">
                                <TextPressure
                                    text="PagePulse"
                                    flex={true}
                                    alpha={false}
                                    stroke={false}
                                    width={true}
                                    weight={true}
                                    italic={true}
                                    textColor="transparent"
                                    strokeColor="#000000"
                                    minFontSize={28}
                                    className="text-5xl font-bold bg-gradient-to-r from-[#bb750d] via-[#d45b0a] to-[#c8d50e] bg-clip-text text-transparent animate-gradient-x"
                                />
                            </div>

                            {/* Main Headline */}
                            <h1 className="font-kindle text-3xl md:text-8xl mb-8 tracking-tight drop-shadow-2xl">
                                Read. Connect. <span className="text-[#d4af37] italic">Inspire.</span>
                            </h1>

                            {/* Description Paragraph */}
                            <p className="w-full max-w-3xl mx-auto text-center font-body text-xl md:text-2xl text-gray-200 mt-6 mb-16 leading-relaxed drop-shadow-md">
                                The ecosystem where your library comes alive. Track your journey, spark real-time debates, and turn every chapter into a shared adventure.
                            </p>

                            {/* Button */}
                            <Button
                                onClick={() => navigate('/auth')}
                                className="
                                    rounded-full
                                    text-black
                                    text-xl
                                    font-bold
                                    shadow-[0_0_25px_rgba(212,175,55,0.4)]
                                    transition-all
                                    duration-300
                                    hover:scale-105
                                    bg-gradient-to-r
                                    from-[#bb750d]
                                    via-[#d45b0a]
                                    to-[#c8d50e]
                                    animate-gradient-x
                                "
                                style={{
                                    marginTop: '1.5rem',
                                    height: 'auto',
                                    padding: '10px 30px'
                                }}
                            >
                                Start Your Journey
                            </Button>
                        </div>
                    </div>

                    {/* ================= MASTER CENTER CONTAINER ================= */}
                    <div className="w-full max-w-[1200px] px-6 py-24 flex flex-col gap-32">

                        {/* --- Feature 1 --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center" data-speed="0.9">
                            <div className="space-y-8 text-center md:text-left">
                                <h2 className="font-kindle text-4xl md:text-6xl leading-[1.1]">
                                    Your Library, <br />
                                    <span className="italic text-gray-500">Reimagined.</span>
                                </h2>
                                <div className="w-20 h-1 bg-yellow-500/50 mx-auto md:mx-0"></div>
                                <p className="font-body text-gray-300 text-lg md:text-xl leading-loose font-light">
                                    Gone are the days of solitary reading. With PagePulse, every book in your collection becomes a hub for conversation. Annotate socially, share your favorite quotes instantly.
                                </p>
                            </div>
                            <div className="relative w-full aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800" data-speed="1.1">
                                <img
                                    src={lp2}
                                    alt="Library Feature"
                                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                        </div>

                        {/* --- Feature 2 --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <div className="order-2 md:order-1 relative w-full aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800" data-speed="1.1">
                                <img
                                    src={lp3}
                                    alt="Community Reading"
                                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <div className="order-1 md:order-2 space-y-8 text-center md:text-left" data-speed="0.9">
                                <h2 className="font-kindle text-4xl md:text-6xl leading-[1.1]">
                                    Share Your <br />
                                    <span className="italic text-gray-500">Perspective.</span>
                                </h2>
                                <div className="w-20 h-1 bg-[#d4af37]/50 mx-auto md:mx-0"></div>
                                <p className="font-body text-gray-300 text-lg md:text-xl leading-loose font-light">
                                    Don't just read passively. Highlight key passages, leave notes for the community, and see what your friends are thinking in the margins. Turn every chapter into a living conversation.
                                </p>
                            </div>
                        </div>

                        {/* --- Discovery Grid --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

                            {/* Card 1 */}
                            <div className="group cursor-pointer" data-speed="1.05">
                                <div className="aspect-[3/4] bg-zinc-900 rounded-xl mb-6 overflow-hidden border border-zinc-800 relative">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img
                                        src={lp4}
                                        alt="Trending Now"
                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                                <h3 className="font-kindle text-3xl mb-2 group-hover:text-[#d4af37] transition-colors">
                                    Trending Now
                                </h3>
                            </div>

                            {/* Card 2 */}
                            <div className="group cursor-pointer" data-speed="1.0">
                                <div className="aspect-[3/4] bg-zinc-900 rounded-xl mb-6 overflow-hidden border border-zinc-800 relative">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img
                                        src={lp6}
                                        alt="Classics"
                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                                <h3 className="font-kindle text-3xl mb-2 group-hover:text-[#d4af37] transition-colors">
                                    Classics
                                </h3>
                            </div>

                            {/* Card 3 */}
                            <div className="group cursor-pointer" data-speed="1.05">
                                <div className="aspect-[3/4] bg-zinc-900 rounded-xl mb-6 overflow-hidden border border-zinc-800 relative">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img
                                        src={lp5}
                                        alt="Sci-Fi & Fantasy"
                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                                <h3 className="font-kindle text-3xl mb-2 group-hover:text-[#d4af37] transition-colors">
                                    Sci-Fi & Fantasy
                                </h3>
                            </div>

                        </div>

                    </div>
                    {/* ================= FOOTER ================= */}
                    <footer className="w-full bg-gradient-to-b from-black via-[#0a0a0a] to-black border-t border-zinc-800/50 font-body flex flex-col items-center mt-auto relative overflow-hidden" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                        
                        {/* Subtle background decoration */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d4af37] rounded-full blur-[120px]"></div>
                            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#d45b0a] rounded-full blur-[120px]"></div>
                        </div>

                        <div className="relative z-10 w-full max-w-[1200px]" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
                            
                            {/* Top section with branding */}
                            <div className="flex flex-col items-center" style={{ marginBottom: '1rem' }}>
                                <h3 className="font-kindle text-5xl md:text-7xl bg-gradient-to-r from-[#bb750d] via-[#d4af37] to-[#c8d50e] bg-clip-text text-transparent" style={{ marginBottom: '16px' }}>
                                    PagePulse
                                </h3>
                                <p className="text-gray-400 text-center text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                                    Where stories connect readers across the world
                                </p>
                            </div>

                            {/* Back to top button - centered and fancy */}
                            <div className="flex justify-center" style={{ marginBottom: '2rem' }}>
                                <button
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="group relative rounded-full overflow-hidden border border-zinc-700 hover:border-[#d4af37] transition-all duration-300"
                                    style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '16px', paddingBottom: '16px' }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#bb750d] via-[#d4af37] to-[#c8d50e] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                    <span className="relative flex items-center text-gray-300 group-hover:text-white transition-colors duration-300" style={{ gap: '8px' }}>
                                        <svg className="w-4 h-4 transform group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        Back to top
                                    </span>
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent" style={{ height: '1px', marginBottom: '2rem' }}></div>

                            {/* Bottom section */}
                            <div className="flex flex-col md:flex-row justify-between items-center" style={{ gap: '32px' }}>
                                
                                {/* Copyright */}
                                <p className="text-gray-500 text-sm order-2 md:order-1">
                                    &copy; {new Date().getFullYear()} PagePulse. All rights reserved.
                                </p>

                                {/* GitHub Link with icon */}
                                <div className="flex order-1 md:order-2" style={{ gap: '24px' }}>
                                    <a 
                                        href="https://github.com/Karanraj-6/PagePulse" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="group flex items-center rounded-full bg-zinc-900 border border-zinc-800 hover:border-[#d4af37] hover:bg-zinc-800 transition-all duration-300"
                                        style={{ gap: '8px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '10px', paddingBottom: '10px' }}
                                    >
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-[#d4af37] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">GitHub</span>
                                    </a>
                                </div>

                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;