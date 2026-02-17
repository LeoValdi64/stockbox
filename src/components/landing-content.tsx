"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  ScanBarcode,
  ShoppingCart,
  BarChart3,
  ArrowRight,
  Smartphone,
  Zap,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: ScanBarcode,
    title: "Barcode Scanning",
    description:
      "Scan existing barcodes with your camera or generate new ones. Supports EAN-13, UPC-A, Code128, and QR codes.",
  },
  {
    icon: Package,
    title: "Inventory Tracking",
    description:
      "Add, edit, and organize products with categories. Set low-stock alerts so you never run out.",
  },
  {
    icon: ShoppingCart,
    title: "Sales Module",
    description:
      "Create sales by scanning items or searching your inventory. Automatically deducts stock.",
  },
  {
    icon: BarChart3,
    title: "Dashboard",
    description:
      "See total items, inventory value, low-stock alerts, and recent sales at a glance.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First PWA",
    description:
      "Install on your phone like a native app. Works offline for viewing your inventory.",
  },
  {
    icon: Zap,
    title: "Quick Adjustments",
    description:
      "Tap +/- to adjust stock counts instantly. No forms, no friction.",
  },
];

export function LandingContent() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <Package className="h-4 w-4 text-zinc-950" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              StockBox
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-zinc-800/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-zinc-700/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-400">
              <Shield className="h-3.5 w-3.5" />
              Free & open source
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Inventory management
            <br />
            <span className="text-zinc-500">made simple.</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            Track products, scan barcodes, and manage sales from your phone.
            Built for garage sales, households, and small businesses.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Button size="lg" className="gap-2 text-base" asChild>
              <Link href="/sign-up">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base"
              asChild
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </motion.div>

          {/* Mock UI preview */}
          <motion.div
            className="relative mx-auto mt-16 max-w-2xl"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
          >
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-2xl backdrop-blur">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Products", value: "248", color: "bg-zinc-800" },
                    {
                      label: "Total Value",
                      value: "$12,450",
                      color: "bg-zinc-800",
                    },
                    {
                      label: "Low Stock",
                      value: "3",
                      color: "bg-red-950/50",
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className={`rounded-xl ${card.color} border border-zinc-700/50 p-3`}
                    >
                      <p className="text-xs text-zinc-500">{card.label}</p>
                      <p className="mt-1 text-lg font-semibold">
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>
                {[
                  { name: "Wireless Headphones", qty: 24, price: "$29.99" },
                  { name: "USB-C Cable", qty: 156, price: "$8.99" },
                  { name: "Phone Case", qty: 2, price: "$15.00" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-700" />
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-zinc-500">{item.price}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.qty <= 5
                          ? "bg-red-950 text-red-400"
                          : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {item.qty} in stock
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-800/50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to stay organized
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              No bloat, no learning curve. Just scan, track, and sell.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-colors group-hover:bg-zinc-700 group-hover:text-zinc-200">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800/50 px-6 py-24">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to get organized?
          </h2>
          <p className="mt-4 text-zinc-400">
            Start tracking your inventory in under a minute. No credit card
            required.
          </p>
          <Button size="lg" className="mt-8 gap-2 text-base" asChild>
            <Link href="/sign-up">
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Package className="h-4 w-4" />
            StockBox
          </div>
          <p className="text-sm text-zinc-600">
            Built for people who sell things.
          </p>
        </div>
      </footer>
    </div>
  );
}
