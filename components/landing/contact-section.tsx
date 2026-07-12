'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle } from 'lucide-react'

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.subject.trim()) e.subject = 'Subject is required'
    if (!form.message.trim()) e.message = 'Message is required'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  const inputStyle = (err?: string) => ({
    width: '100%',
    padding: '12px 16px',
    background: err ? '#fff1f2' : '#ffffff',
    border: `1px solid ${err ? '#fca5a5' : '#d4e8d4'}`,
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  })

  return (
    <section id="contact" className="max-w-7xl mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-primary uppercase tracking-wider mb-3"
          >
            Get in Touch
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl font-bold text-foreground"
          >
            We&apos;re here to help
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-3 leading-relaxed"
          >
            Questions about your order, product availability, or anything else? Send us a message.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-card rounded-3xl border border-border p-8 shadow-sm"
        >
          {sent ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <CheckCircle size={48} className="text-primary" />
              <h3 className="font-heading text-xl font-bold text-foreground">Message Sent!</h3>
              <p className="text-muted-foreground text-sm text-center">
                Thank you for reaching out. We&apos;ll get back to you within 24 hours.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-2 text-sm text-primary font-medium hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ram Kumar"
                    style={inputStyle(errors.name)}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ram@example.com"
                    style={inputStyle(errors.email)}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="How can we help you?"
                  style={inputStyle(errors.subject)}
                />
                {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Message
                </label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about your query..."
                  style={{ ...inputStyle(errors.message), resize: 'none' }}
                />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    <Send size={15} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
