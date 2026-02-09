import { Link } from "react-router-dom";
import { Zap, Shield, BarChart3, Image, ArrowRight } from "lucide-react";

const FORMATS = [
  { from: "PNG / JPG", to: "WEBP", desc: "Web-optimised images, 30-80% smaller" },
  { from: "HEIC", to: "JPG / PNG", desc: "Apple format to universal compatibility" },
  { from: "SVG", to: "PNG", desc: "Vector to raster for any resolution" },
  { from: "PNG / JPG", to: "SVG", desc: "Auto-trace raster images to vector" },
  { from: "PDF", to: "PNG / JPG", desc: "Extract pages as high-quality images" },
  { from: "RAW", to: "JPG / WEBP", desc: "Camera RAW (CR2, NEF, ARW, DNG)" },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "",
    features: ["100 conversions / month", "50 MB max file size", "All formats supported", "API key access"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pay-as-you-go",
    price: "$0.01",
    period: "/ conversion",
    features: ["Unlimited conversions", "50 MB max file size", "Batch API", "Priority processing", "Webhook callbacks"],
    cta: "Start converting",
    highlight: true,
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">ImageForge</h1>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Image conversion API
          <br />
          <span className="text-blue-600">built for scale</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
          Convert between PNG, JPG, WEBP, HEIC, SVG, PDF, and RAW formats with a single API call.
          Pay only for what you use.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#pricing"
            className="rounded-lg border px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View pricing
          </a>
        </div>

        {/* Code snippet */}
        <div className="mx-auto mt-12 max-w-lg overflow-hidden rounded-xl border bg-gray-900 text-left">
          <div className="flex items-center gap-1.5 border-b border-gray-700 px-4 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-300">
{`curl -X POST https://api.imageforge.dev/v1/convert \\
  -H "x-api-key: imgf_your_key" \\
  -F "file=@photo.heic" \\
  -F "outputFormat=webp" \\
  -F "quality=80" \\
  --output photo.webp`}
          </pre>
        </div>
      </section>

      {/* Formats */}
      <section className="border-t bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h3 className="text-center text-2xl font-bold text-gray-900">Supported conversions</h3>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FORMATS.map((f) => (
              <div key={f.desc} className="rounded-xl border bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Image className="h-4 w-4 text-blue-600" />
                  {f.from} <ArrowRight className="h-3 w-3 text-gray-400" /> {f.to}
                </div>
                <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h3 className="text-center text-2xl font-bold text-gray-900">Why ImageForge?</h3>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { icon: Zap, title: "Fast", desc: "Sub-second conversions powered by libvips. Batch API for bulk processing." },
              { icon: Shield, title: "Reliable", desc: "Automatic retries, job queue with exponential backoff, webhook callbacks." },
              { icon: BarChart3, title: "Transparent", desc: "Real-time usage dashboard, per-conversion metering, no hidden fees." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="mt-4 font-semibold text-gray-900">{title}</h4>
                <p className="mt-2 text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h3 className="text-center text-2xl font-bold text-gray-900">Simple pricing</h3>
          <p className="mt-2 text-center text-sm text-gray-500">Start free, scale as you grow.</p>
          <div className="mx-auto mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${plan.highlight ? "border-blue-200 bg-white ring-2 ring-blue-600" : "bg-white"}`}
              >
                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-600">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`mt-6 block rounded-lg px-4 py-2 text-center text-sm font-medium ${
                    plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} ImageForge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
