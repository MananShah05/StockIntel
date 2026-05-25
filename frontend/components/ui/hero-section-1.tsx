import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { cn } from '@/lib/utils'
import Particles from '@/components/ui/Particles'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export function Typewriter({ words, delay = 120, period = 2000 }: { words: string[], delay?: number, period?: number }) {
    const [index, setIndex] = useState(0)
    const [subIndex, setSubIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [text, setText] = useState("")

    useEffect(() => {
        if (words.length === 0) return

        const currentWord = words[index]

        let speed = delay
        if (isDeleting) {
            speed /= 2
        }

        if (!isDeleting && subIndex === currentWord.length) {
            const timeout = setTimeout(() => setIsDeleting(true), period)
            return () => clearTimeout(timeout)
        } else if (isDeleting && subIndex === 0) {
            setIsDeleting(false)
            setIndex((prevIndex) => (prevIndex + 1) % words.length)
            return
        }

        const timeout = setTimeout(() => {
            setSubIndex((prevSubIndex) => prevSubIndex + (isDeleting ? -1 : 1))
        }, speed)

        return () => clearTimeout(timeout)
    }, [subIndex, isDeleting, index, words, delay, period])

    useEffect(() => {
        if (words.length === 0) return
        setText(words[index].substring(0, subIndex))
    }, [subIndex, index, words])

    return (
        <span className="relative inline text-[var(--teal-500)] font-serif italic select-none">
            {text}
            <span className="inline-block ml-1.5 w-[3px] h-[0.8em] bg-[var(--teal-500)] align-middle animate-blink" />
        </span>
    )
}

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden">
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
                    <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-36 md:pt-48">
                        <div className="absolute inset-0 -z-20 pointer-events-none opacity-45">
                            <Particles
                                particleColors={["#14b8a6", "#0d9488", "#2dd4bf", "#ffffff"]}
                                particleCount={180}
                                particleSpread={10}
                                speed={0.1}
                                particleBaseSize={90}
                                sizeRandomness={0.7}
                                moveParticlesOnHover={true}
                                particleHoverFactor={1.5}
                                alphaParticles={true}
                                disableRotation={false}
                                cameraDistance={22}
                            />
                        </div>
                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants}>
                                    <Link
                                        href="/auth/signup"
                                        className="hover:bg-[var(--bg-sunken)] bg-[var(--bg-elevated)]/60 backdrop-blur-md group mx-auto flex w-fit items-center gap-3.5 rounded-full border border-[var(--border-soft)] py-2.5 px-7 shadow-lg transition-all duration-300">
                                        <span className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-base font-semibold transition-colors">
                                            AI-Powered Stock Decision Intelligence Hub
                                        </span>
                                        <span className="block h-5 w-px bg-[var(--border-soft)]"></span>

                                        <ArrowRight className="size-5 text-[var(--text-secondary)] group-hover:text-[var(--teal-500)] group-hover:translate-x-0.5 transition-all duration-300" />
                                    </Link>
                        
                                    <h1
                                        className="mt-8 max-w-5xl mx-auto text-center text-5xl md:text-7xl lg:mt-16 xl:text-[5.25rem] font-serif italic font-normal tracking-tight leading-[1.15]">
                                        <span className="block">Clear Stock Intelligence,</span>
                                        <span className="block">Backed by <Typewriter words={["Auditable Reasoning", "Auditable Signals", "Verified Evidence", "Macro Regimes", "Structured Context"]} /></span>
                                    </h1>
                                    <p
                                        className="mx-auto mt-8 max-w-2xl text-balance text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                        StockIntel aggregates official SEC filings, financial news sentiment, social indicators, technical trends, and macroeconomic regimes into transparent, reason-backed ratings to clean the noise from your research.
                                    </p>
                                </AnimatedGroup>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-3.5 md:flex-row">
                                    <Button
                                        key={1}
                                        asChild
                                        size="lg"
                                        className="rounded-xl px-7 text-base bg-[var(--teal-500)] text-white hover:bg-[var(--teal-600)] border border-[var(--teal-500)] shadow-lg shadow-teal-500/20 transition-all duration-300">
                                        <Link href="/auth/signup">
                                            <span className="text-nowrap">Start Building</span>
                                        </Link>
                                    </Button>
                                    <Button
                                        key={2}
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="rounded-xl px-7 text-base border-[var(--border-medium)] hover:bg-[var(--bg-sunken)] transition-all duration-300">
                                        <Link href="/auth/signup">
                                            <span className="text-nowrap">Request a demo</span>
                                        </Link>
                                    </Button>
                                </AnimatedGroup>
                            </div>
                        </div>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                                <div
                                    aria-hidden
                                    className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                                />
                                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
                                    <img
                                        className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2000&q=80"
                                        alt="app screen"
                                        width="2700"
                                        height="1440"
                                    />
                                    <img
                                        className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2000&q=80"
                                        alt="app screen"
                                        width="2700"
                                        height="1440"
                                    />
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>
                <section className="bg-background pb-12 pt-12 md:pb-16">
                    <div className="group relative m-auto max-w-5xl px-6">
                        <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
                            <Link
                                href="/"
                                className="block text-sm duration-150 hover:opacity-75">
                                <span> Data Engines & Sources</span>

                                <ChevronRight className="ml-1 inline-block size-3" />
                            </Link>
                        </div>
                        <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-10 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-12">
                            <div className="flex justify-center items-center">
                                <span className="text-[12px] tracking-[0.25em] font-black uppercase text-[var(--text-secondary)]/30 hover:text-[var(--teal-500)]/70 transition-colors duration-300 select-none font-display">
                                    SEC FILINGS
                                </span>
                            </div>
                            <div className="flex justify-center items-center">
                                <span className="text-[12px] tracking-[0.25em] font-black uppercase text-[var(--text-secondary)]/30 hover:text-[var(--teal-500)]/70 transition-colors duration-300 select-none font-display">
                                    NEWSAPI
                                </span>
                            </div>
                            <div className="flex justify-center items-center">
                                <span className="text-[12px] tracking-[0.25em] font-black uppercase text-[var(--text-secondary)]/30 hover:text-[var(--teal-500)]/70 transition-colors duration-300 select-none font-display">
                                    REDDIT
                                </span>
                            </div>
                            <div className="flex justify-center items-center">
                                <span className="text-[12px] tracking-[0.25em] font-black uppercase text-[var(--text-secondary)]/30 hover:text-[var(--teal-500)]/70 transition-colors duration-300 select-none font-display">
                                    FRED (MACRO)
                                </span>
                            </div>
                            <div className="flex justify-center items-center">
                                <span className="text-[12px] tracking-[0.25em] font-black uppercase text-[var(--text-secondary)]/30 hover:text-[var(--teal-500)]/70 transition-colors duration-300 select-none font-display">
                                    ALPHAVANTAGE
                                </span>
                            </div>
                            <div className="flex justify-center items-center">
                                <span className="text-[12px] tracking-[0.25em] font-black uppercase text-[var(--text-secondary)]/30 hover:text-[var(--teal-500)]/70 transition-colors duration-300 select-none font-display">
                                    POSTGRESQL
                                </span>
                            </div>
                            <div className="flex justify-center items-center">
                                <span className="text-[12px] tracking-[0.25em] font-black uppercase text-[var(--text-secondary)]/30 hover:text-[var(--teal-500)]/70 transition-colors duration-300 select-none font-display">
                                    FASTAPI
                                </span>
                            </div>
                            <div className="flex justify-center items-center">
                                <span className="text-[12px] tracking-[0.25em] font-black uppercase text-[var(--text-secondary)]/30 hover:text-[var(--teal-500)]/70 transition-colors duration-300 select-none font-display">
                                    NEXTAUTH
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Corporate Footer Section */}
                <footer className="border-t border-[var(--border-soft)] bg-[var(--bg-sunken)]/20 py-16 select-none relative z-10">
                    <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                        {/* Column 1: Brand details */}
                        <div className="md:col-span-2 space-y-4">
                            <Logo />
                            <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed font-medium">
                                Probabilistic decision intelligence and sentiment convergence pipeline. Cleaning the noise from regulatory, structural, and news parameters.
                            </p>
                            <p className="text-[10px] text-[var(--text-tertiary)] font-bold tracking-wider uppercase mt-6 block">
                                © {new Date().getFullYear()} StockIntel Inc. All rights reserved.
                            </p>
                        </div>
                        
                        {/* Column 2: Platform Links */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">
                                Research Hubs
                            </h4>
                            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
                                <li>
                                    <Link href="/auth/signup" className="hover:text-[var(--teal-500)] transition-colors">
                                        Decision Engine
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/auth/signup" className="hover:text-[var(--teal-500)] transition-colors">
                                        Signal Comparison
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/auth/signup" className="hover:text-[var(--teal-500)] transition-colors">
                                        Watchlist Tracking
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Legal & Policies */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">
                                Legal & Security
                            </h4>
                            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-medium">
                                <li>
                                    <Link href="#" className="hover:text-[var(--teal-500)] transition-colors">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-[var(--teal-500)] transition-colors">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-[var(--teal-500)] transition-colors">
                                        Regulatory Disclaimer
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </footer>
            </main>
        </>
    )
}

const menuItems = [
    { name: 'Features', href: '#link' },
    { name: 'Solution', href: '#link' },
    { name: 'Pricing', href: '#link' },
    { name: 'About', href: '#link' },
]

const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2 group">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-2 lg:gap-0 lg:py-2.5">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-9 text-[15px] font-semibold">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] block duration-150 transition-colors">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="default"
                                    className={cn("rounded-xl text-sm font-semibold border-[var(--border-medium)] hover:bg-[var(--bg-sunken)] transition-all duration-300", isScrolled && 'lg:hidden')}>
                                    <Link href="/auth/signin">
                                        <span>Login</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="default"
                                    className={cn("rounded-xl text-sm font-semibold bg-[var(--teal-500)] text-white hover:bg-[var(--teal-600)] border border-[var(--teal-500)] shadow-md shadow-teal-500/10 transition-all duration-300", isScrolled && 'lg:hidden')}>
                                    <Link href="/auth/signup">
                                        <span>Sign Up</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="default"
                                    className={cn("rounded-xl text-sm font-semibold bg-[var(--teal-500)] text-white hover:bg-[var(--teal-600)] border border-[var(--teal-500)] shadow-md shadow-teal-500/10 transition-all duration-300", isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                    <Link href="/auth/signup">
                                        <span>Get Started</span>
                                    </Link>
                                </Button>
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn('flex items-center gap-2 select-none', className)}>
            <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-[var(--teal-500)] animate-pulse"
            >
                <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    fill="url(#logo-gradient-hero)"
                />
                <path
                    d="M2 17L12 22L22 17"
                    stroke="url(#logo-gradient-hero)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M2 12L12 17L22 12"
                    stroke="url(#logo-gradient-hero)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <defs>
                    <linearGradient
                        id="logo-gradient-hero"
                        x1="2"
                        y1="2"
                        x2="22"
                        y2="22"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#2BC8B7" />
                        <stop offset="1" stopColor="#9B99FE" />
                    </linearGradient>
                </defs>
            </svg>
            <span 
                className="font-display font-black tracking-tight text-lg text-[var(--text-primary)]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.03em',
                }}
            >
                Stock<span style={{ color: 'var(--teal-500)' }}>Intel</span>
            </span>
        </div>
    )
}
