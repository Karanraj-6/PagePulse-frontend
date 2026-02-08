import { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const LandingPage = () => {
    const navigate = useNavigate();
    const mainRef = useRef<HTMLDivElement>(null);
    const smootherRef = useRef<ScrollSmoother | null>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Create ScrollSmoother
            smootherRef.current = ScrollSmoother.create({
                wrapper: "#smooth-wrapper",
                content: "#smooth-content",
                smooth: 2, // Slightly less than 3 for better responsiveness, but feels very smooth
                effects: true,
                normalizeScroll: true, // Helps with touch devices
            });

            // Apply effects to images as requested using the "auto" speed
            smootherRef.current.effects("img", { speed: "auto" });

            // Reveal Animations for Features
            const sections = gsap.utils.toArray('.reveal-section');
            sections.forEach((section: any) => {
                gsap.fromTo(section,
                    { opacity: 0, y: 50 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1,
                        scrollTrigger: {
                            trigger: section,
                            start: "top 80%",
                            end: "top 50%",
                            scrub: 1
                        }
                    }
                );
            });

        }, mainRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={mainRef} className="w-full bg-black text-white font-sans overflow-x-hidden">
            {/* ================= CUSTOM FONTS ================= */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
                .font-kindle { font-family: 'Playfair Display', serif; }
                .font-body { font-family: 'Inter', sans-serif; }
            `}</style>

            <div id="smooth-wrapper">
                <div id="smooth-content">

                    {/* ================= HERO SECTION ================= */}
                    <div className="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden shrink-0">
                        {/* Background Image - Parallax handled by ScrollSmoother 'auto' or data-speed */}
                        <div
                            className="absolute inset-0 z-0 overflow-hidden"
                        >
                            <img
                                src={lp}
                                alt="Hero Background"
                                className="w-full h-[120%] object-cover absolute top-0 left-0"
                                data-speed="0.5" // Parallax speed for background
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black z-10"></div>
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
                    <div className="w-full max-w-[1200px] mx-auto px-6 py-24 flex flex-col gap-32">

                        {/* --- Feature 1 (Reveal Section) --- */}
                        <div className="reveal-section grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
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
                            <div className="relative w-full aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
                                <img
                                    src={lp2}
                                    alt="Library Feature"
                                    className="object-cover w-full h-[120%]" // Made taller for parallax
                                    data-speed="auto" // GSAP ScrollSmoother Effect
                                />
                            </div>
                        </div>

                        {/* --- Feature 2 (Reveal Section) --- */}
                        <div className="reveal-section grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            {/* Image First on Desktop */}
                            <div className="order-2 md:order-1 relative w-full aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
                                <img
                                    src={lp3}
                                    alt="Community Reading"
                                    className="object-cover w-full h-[120%]" // Made taller for parallax
                                    data-speed="auto" // GSAP ScrollSmoother Effect
                                />
                            </div>
                            <div className="order-1 md:order-2 space-y-8 text-center md:text-left">
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

                        {/* --- Discovery Grid (Reveal Section) --- */}
                        <div className="reveal-section grid grid-cols-1 md:grid-cols-3 gap-10">

                            {/* ===== Card 1 ===== */}
                            <div className="group cursor-pointer">
                                <div className="aspect-[3/4] bg-zinc-900 rounded-xl mb-6 overflow-hidden border border-zinc-800 relative">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img
                                        src={lp4}
                                        alt="Trending Now"
                                        className="object-cover w-full h-[110%]"
                                        data-speed="1.1"
                                    />
                                </div>
                                <h3 className="font-kindle text-3xl mb-2 group-hover:text-[#d4af37] transition-colors">
                                    Trending Now
                                </h3>
                            </div>

                            {/* ===== Card 2 ===== */}
                            <div className="group cursor-pointer" style={{ marginTop: '3rem' }}> {/* Offset for visual interest */}
                                <div className="aspect-[3/4] bg-zinc-900 rounded-xl mb-6 overflow-hidden border border-zinc-800 relative">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img
                                        src={lp6}
                                        alt="Classics"
                                        className="object-cover w-full h-[110%]"
                                        data-speed="1.2"
                                    />
                                </div>
                                <h3 className="font-kindle text-3xl mb-2 group-hover:text-[#d4af37] transition-colors">
                                    Classics
                                </h3>
                            </div>

                            {/* ===== Card 3 ===== */}
                            <div className="group cursor-pointer">
                                <div className="aspect-[3/4] bg-zinc-900 rounded-xl mb-6 overflow-hidden border border-zinc-800 relative">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img
                                        src={lp5}
                                        alt="Sci-Fi & Fantasy"
                                        className="object-cover w-full h-[110%]"
                                        data-speed="1.1"
                                    />
                                </div>
                                <h3 className="font-kindle text-3xl mb-2 group-hover:text-[#d4af37] transition-colors">
                                    Sci-Fi & Fantasy
                                </h3>
                            </div>

                        </div>
                    </div>

                    {/* ================= FOOTER ================= */}
                    <footer className="w-full bg-[#111] border-t border-zinc-800 pt-16 pb-10 font-body flex flex-col items-center mt-auto">
                        <div className="mb-16">
                            <button
                                onClick={() => smootherRef.current?.scrollTo(0, true)} // Use smoother to scroll top
                                className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-4 px-10 rounded-full transition-colors border border-zinc-700 shadow-lg"
                            >
                                Back to top
                            </button>
                        </div>
                        <div className="w-full max-w-[1200px] px-6 grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 text-sm">
                            <p><a href='https://github.com/Karanraj-6/PagePulse' target="_blank" rel="noreferrer">Github</a></p>
                        </div>
                        <div className="w-full border-t border-zinc-800 pt-8 text-center text-xs text-gray-500">
                            <p>&copy; {new Date().getFullYear()} PagePulse, Inc. or its affiliates</p>
                        </div>
                    </footer>

                </div>
            </div>
        </div>
    );
};

export default LandingPage;