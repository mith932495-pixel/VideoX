'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Play, Upload, Zap, Shield, Star, ArrowRight, Check, Menu, X, ChevronDown, Sparkles, Film, TrendingUp, Award, Users, Clock, Globe, Headphones, Camera, Palette, Cpu, BarChart3, Globe2, ShieldCheck, Lightbulb, Rocket } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollYProgress, setScrollYProgress] = useState(0)

  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 1000], [0, -200])
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
      setScrollYProgress(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight))

      // Determine active section
      const sections = ['hero', 'features', 'stats', 'showcase', 'testimonials', 'pricing']
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Transform videos to 4K/8K in minutes with our advanced AI processing technology",
      stats: "500x faster",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: Shield,
      title: "Professional Quality",
      description: "Hollywood-grade AI enhancement with exceptional clarity and detail preservation",
      stats: "99.9% accuracy",
      color: "from-blue-400 to-purple-500"
    },
    {
      icon: Sparkles,
      title: "Smart Processing",
      description: "Intelligent upscaling that understands content for optimal results",
      stats: "AI-powered",
      color: "from-green-400 to-teal-500"
    }
  ]

  const stats = [
    { icon: Users, label: "Active Users", value: "50K+", suffix: "" },
    { icon: Film, label: "Videos Enhanced", value: "1M+", suffix: "" },
    { icon: Clock, label: "Processing Time", value: "2", suffix: "min avg" },
    { icon: TrendingUp, label: "Quality Improvement", value: "300", suffix: "%" }
  ]

  const showcaseItems = [
    { before: "720p", after: "8K", improvement: "2400%", category: "Film" },
    { before: "1080p", after: "4K", improvement: "400%", category: "Animation" },
    { before: "480p", after: "4K", improvement: "1600%", category: "Documentary" },
    { before: "720p", after: "8K", improvement: "2400%", category: "Sports" }
  ]

  const testimonials = [
    {
      name: "Alex Thompson",
      role: "Film Director",
      company: "Hollywood Studios",
      content: "VideoX has revolutionized our post-production workflow. The quality is absolutely stunning!",
      rating: 5,
      avatar: "AT"
    },
    {
      name: "Sarah Chen",
      role: "Content Creator",
      company: "TechTuber",
      content: "I can now enhance my videos to 8K quality in minutes. My subscribers love the difference!",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "Video Producer",
      company: "Media Corp",
      content: "The AI enhancement is incredible. It saves us hours of manual work every week.",
      rating: 5,
      avatar: "MR"
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "0",
      credits: 3,
      features: ["3 Free Credits", "720p Output", "2-min Video Length", "Watermarked Videos"],
      popular: false,
      highlight: true,
    },
    {
      name: "Creator Pack",
      price: "9",
      credits: 10,
      features: ["4K Enhancement", "No Watermark", "10GB Storage", "Email Support"],
      popular: false,
      highlight: false,
    },
    {
      name: "Pro Pack",
      price: "39",
      credits: 50,
      features: ["8K Enhancement", "Advanced AI Tools", "50GB Storage", "Priority Support"],
      popular: true,
      highlight: false,
    },
    {
      name: "Studio Pack",
      price: "69",
      credits: 100,
      features: ["8K+ Enhancement", "All AI Tools", "100GB Storage", "Dedicated Support"],
      popular: false,
      highlight: false,
    },
  ]

  return (
    <div className="min-h-screen bg-primary text-text-primary overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-orange to-accent-gold origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'glass-heavy py-3' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent cursor-pointer"
            >
              VideoX
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'Pricing', 'Docs'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Docs' ? '/docs' : `#${item.toLowerCase()}`}
                  className={`relative px-2 py-1 transition-all duration-300 hover:text-accent-orange ${
                    activeSection === item.toLowerCase() ? 'text-accent-orange' : 'text-text-secondary'
                  }`}
                >
                  {item}
                  {activeSection === item.toLowerCase() && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-orange"
                    />
                  )}
                </Link>
              ))}
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-text-secondary hover:text-text-primary transition-colors">
                  Log In
                </Link>
                <Link href="/signup" className="btn-cinematic px-6 py-2 rounded-full text-white font-medium">
                  Sign Up
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-text-primary"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <X key="close" size={24} />
                ) : (
                  <Menu key="menu" size={24} />
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-16 left-0 right-0 glass z-40"
          >
            <div className="p-4 space-y-4">
              {['Features', 'Pricing', 'Docs'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Docs' ? '/docs' : `#${item.toLowerCase()}`}
                  className="block text-text-secondary hover:text-text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <div className="pt-4 border-t border-secondary">
                <Link href="/login" className="block text-text-secondary hover:text-text-primary transition-colors mb-4">
                  Log In
                </Link>
                <Link href="/signup" className="btn-cinematic px-6 py-2 rounded-full text-white font-medium text-center">
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Full Screen */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary to-primary" />

        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255, 107, 53, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 53, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Mouse-following Spotlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 107, 53, 0.1), transparent 40%)`
          }}
        />

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-accent-orange to-accent-gold rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                y: [0, -Math.random() * 1000 - 500],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, 360],
                scale: [1, Math.random() * 1.5 + 0.5]
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="container mx-auto px-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="inline-flex items-center px-6 py-3 rounded-full glass mb-8 text-sm font-medium group cursor-pointer">
                <Rocket className="w-5 h-5 mr-3 text-accent-orange group-hover:animate-pulse" />
                <span className="text-text-secondary">Transform your videos to cinematic quality</span>
                <Sparkles className="w-5 h-5 ml-3 text-accent-orange animate-spin" />
              </div>

              <motion.h1
                className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                <span className="bg-gradient-to-r from-white via-text-primary to-text-secondary bg-clip-text text-transparent block mb-2">
                  Enhance Your Videos
                </span>
                <span className="bg-gradient-to-r from-accent-orange via-pink-500 to-accent-gold bg-clip-text text-transparent block animate-pulse">
                  to Cinematic Quality
                </span>
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl lg:text-3xl text-text-secondary mb-12 max-w-4xl mx-auto leading-relaxed font-light"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                Enhance your videos from 720p to stunning{' '}
                <span className="text-accent-orange font-bold">8K resolution</span>{' '}
                with AI-powered processing. Professional results in minutes, not hours.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                <Link href="/signup" className="group btn-cinematic px-10 py-5 rounded-full text-xl font-bold text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-orange to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex items-center">
                    <Upload className="inline-block w-6 h-6 mr-3 group-hover:translate-y-1 transition-transform" />
                    <span>Start Your Free Trial</span>
                    <ArrowRight className="inline-block w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>

                <button className="group glass px-10 py-5 rounded-full text-xl font-bold text-text-primary hover:bg-secondary transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-orange to-accent-gold opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  <div className="relative z-10 flex items-center">
                    <Play className="inline-block w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                    <span>See It In Action</span>
                  </div>
                </button>
              </motion.div>

              {/* Stats Bar */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="flex flex-wrap justify-center gap-8 text-center"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <stat.icon className="w-8 h-8 text-accent-orange mb-2" />
                    <div className="text-3xl font-bold text-text-primary">
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-sm text-text-secondary">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <ChevronDown className="w-6 h-6 text-accent-orange animate-bounce" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
                Why Choose VideoX?
              </span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Experience the future of video enhancement with our cutting-edge AI technology
              and Hollywood-grade processing algorithms
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="group relative"
              >
                <div className="card-cinematic p-8 h-full relative overflow-hidden">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                  {/* Icon */}
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-3xl font-bold mb-4 group-hover:text-accent-orange transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Stats Badge */}
                  <div className="inline-flex items-center px-3 py-1 rounded-full glass group-hover:bg-accent-orange/20 transition-colors">
                    <Sparkles className="w-4 h-4 mr-2 text-accent-orange" />
                    <span className="text-sm font-medium text-accent-orange">{feature.stats}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 relative bg-secondary">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: "10M+", label: "Minutes Processed", icon: Clock },
              { value: "99.9%", label: "Uptime", icon: ShieldCheck },
              { value: "8K", label: "Max Resolution", icon: Camera },
              { value: "150+", label: "Countries", icon: Globe2 }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <item.icon className="w-12 h-12 text-accent-orange mx-auto mb-4" />
                <div className="text-4xl font-bold text-text-primary mb-2">{item.value}</div>
                <div className="text-text-secondary">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-accent-orange to-pink-500 bg-clip-text text-transparent">
                See the Difference
              </span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Real examples of how VideoX transforms ordinary videos into stunning 8K masterpieces
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {showcaseItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="card-cinematic overflow-hidden"
              >
                <div className="aspect-video bg-gradient-to-br from-secondary to-tertiary relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mb-4">
                        <span className="text-6xl font-bold text-text-primary/30">{item.before}</span>
                        <ArrowRight className="inline-block w-8 h-8 mx-4 text-accent-orange" />
                        <span className="text-6xl font-bold text-accent-orange">{item.after}</span>
                      </div>
                      <div className="text-accent-orange font-bold text-xl">
                        {item.improvement} Improvement
                      </div>
                      <div className="text-text-secondary text-sm mt-2">
                        {item.category} Enhancement
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 relative bg-secondary">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
                Loved by Creators
              </span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Join thousands of professionals who trust VideoX for their video enhancement needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="card-cinematic p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-orange to-accent-gold rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">{testimonial.name}</h4>
                    <p className="text-text-secondary">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-text-secondary italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-accent-orange to-pink-500 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Choose the perfect plan for your needs. Start with 3 free credits on us!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`relative ${plan.popular ? 'scale-105' : ''} ${plan.highlight ? 'border-2 border-accent-gold' : ''} rounded-2xl`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-accent-orange to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  </div>
                )}
                <div className={`card-cinematic p-8 h-full ${plan.highlight ? 'bg-secondary' : ''} rounded-2xl`}>
                  <h3 className="text-2xl font-bold mb-4 text-text-primary">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-text-primary">${plan.price}</span>
                    <span className="text-text-secondary">{plan.name === 'Starter' ? '/ 3 free credits' : '/ one-time'}</span>
                  </div>
                  <div className="mb-8">
                    <div className="text-3xl font-bold text-accent-orange mb-2">{plan.credits}</div>
                    <div className="text-text-secondary">Credits</div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className={`w-full btn-cinematic py-3 rounded-full text-white font-bold block text-center ${plan.popular ? '' : 'opacity-80 hover:opacity-100'}`}>
                    Get Started
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-secondary">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent mb-4">
                VideoX
              </h3>
              <p className="text-text-secondary">
                Transform your videos to Hollywood quality with AI-powered enhancement.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-4">Product</h4>
              <div className="space-y-2">
                <Link href="#features" className="block text-text-secondary hover:text-text-primary transition-colors">Features</Link>
                <Link href="#pricing" className="block text-text-secondary hover:text-text-primary transition-colors">Pricing</Link>
                <Link href="#showcase" className="block text-text-secondary hover:text-text-primary transition-colors">Examples</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-4">Company</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-text-secondary hover:text-text-primary transition-colors">About</Link>
                <Link href="/blog" className="block text-text-secondary hover:text-text-primary transition-colors">Blog</Link>
                <Link href="/careers" className="block text-text-secondary hover:text-text-primary transition-colors">Careers</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-4">Legal</h4>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-text-secondary hover:text-text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block text-text-secondary hover:text-text-primary transition-colors">Terms of Service</Link>
                <Link href="/cookies" className="block text-text-secondary hover:text-text-primary transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-secondary text-center text-text-muted">
            <p>&copy; 2024 VideoX. All rights reserved. Made with ❤️ for video creators worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}