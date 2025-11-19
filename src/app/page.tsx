'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Upload, Zap, Shield, Star, ArrowRight, Check, Menu, X } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Transform videos to 4K/8K in minutes, not hours. Preview results instantly."
    },
    {
      icon: Shield,
      title: "Professional Quality",
      description: "Hollywood-grade AI enhancement with exceptional clarity and detail preservation."
    },
    {
      icon: Star,
      title: "Smart Processing",
      description: "Intelligent upscaling that understands content for optimal results."
    }
  ]

  const capabilities = [
    "4K & 8K Resolution Support",
    "AI-Powered Enhancement",
    "Up to 20 Minute Videos",
    "Before/After Preview",
    "Multiple Quality Presets",
    "Cloud-Based Processing"
  ]

  return (
    <div className="min-h-screen bg-primary text-text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-heavy py-3' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent"
            >
              VideoX
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-text-secondary hover:text-text-primary transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-text-secondary hover:text-text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/enhance" className="btn-cinematic px-6 py-2 rounded-full text-white font-medium">
                Enhance Video
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-text-primary"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-4 glass rounded-lg p-4"
            >
              <div className="flex flex-col space-y-4">
                <Link href="#features" className="text-text-secondary hover:text-text-primary transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-text-secondary hover:text-text-primary transition-colors">
                  Pricing
                </Link>
                <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/enhance" className="btn-cinematic px-6 py-2 rounded-full text-white font-medium text-center">
                  Enhance Video
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary to-primary" />
        <div className="absolute inset-0">
          <div className="particles-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 4 + 2}px`,
                  height: `${Math.random() * 4 + 2}px`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${Math.random() * 10 + 10}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative container mx-auto px-6 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full glass mb-6 text-sm">
              <Zap className="w-4 h-4 mr-2 text-accent-orange" />
              <span className="text-text-secondary">Transform your videos to cinematic quality</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-text-primary to-text-secondary bg-clip-text text-transparent">
                Transform Videos to
              </span>
              <br />
              <span className="bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent">
                Hollywood Quality
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
              Enhance your videos from 720p to stunning 4K/8K resolution with AI-powered processing.
              Professional results in minutes, not hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/enhance" className="btn-cinematic px-8 py-4 rounded-full text-lg font-medium text-white group">
                <Upload className="inline-block w-5 h-5 mr-2 group-hover:translate-y-1 transition-transform" />
                Start Enhancing
                <ArrowRight className="inline-block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button className="glass px-8 py-4 rounded-full text-lg font-medium text-text-primary hover:bg-secondary transition-all group">
                <Play className="inline-block w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Video Preview Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="card-cinematic p-2">
              <div className="aspect-video bg-gradient-to-br from-secondary to-tertiary rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 text-accent-orange" />
                  <p className="text-text-secondary">See the incredible difference</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
                Why Choose VideoX?
              </span>
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Experience the future of video enhancement with cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-cinematic p-8 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-accent-orange to-accent-gold rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 relative bg-secondary">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                <span className="bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent">
                  Professional Tools
                </span>
                <br />
                Exceptional Results
              </h2>

              <div className="space-y-4">
                {capabilities.map((capability, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-6 h-6 bg-accent-orange rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg">{capability}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8">
                <Link href="/enhance" className="btn-cinematic px-8 py-4 rounded-full text-lg font-medium text-white inline-block">
                  Try It Now
                  <ArrowRight className="inline-block w-5 h-5 ml-2" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="card-cinematic p-8">
                <div className="aspect-video bg-gradient-to-br from-tertiary to-secondary rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent mb-2">
                      8K
                    </div>
                    <p className="text-text-secondary">Ultra HD Resolution</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="card-cinematic p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-orange/10 to-accent-gold/10" />

              <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">
                Ready to Transform Your Videos?
              </h2>

              <p className="text-xl text-text-secondary mb-8 relative z-10">
                Join thousands of creators using VideoX to enhance their content
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Link href="/enhance" className="btn-cinematic px-8 py-4 rounded-full text-lg font-medium text-white">
                  Start Free Trial
                </Link>

                <Link href="#pricing" className="glass px-8 py-4 rounded-full text-lg font-medium text-text-primary hover:bg-secondary transition-all">
                  View Pricing
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-secondary">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent mb-4 md:mb-0">
              VideoX
            </div>

            <div className="flex space-x-8 text-text-secondary">
              <Link href="/privacy" className="hover:text-text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-text-primary transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-secondary text-center text-text-muted">
            <p>&copy; 2024 VideoX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
