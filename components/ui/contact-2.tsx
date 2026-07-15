"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, Send, CheckCircle, AlertCircle } from "lucide-react"
import { submitContactMessage } from "@/lib/api"

interface Contact2Props {
  title?: string
  description?: string
  phone?: string
  email?: string
}

export const Contact2 = ({
  title = "Contact Us",
  description = "Have questions about your order, need help finding a product, or want to partner with us? We'd love to hear from you!",
  phone,
  email,
}: Contact2Props) => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", subject: "", message: "" })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = useState("")

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setError("")
    try {
      await submitContactMessage({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        subject: form.subject,
        message: form.message,
      })
      setStatus("success")
      setForm({ firstName: "", lastName: "", email: "", subject: "", message: "" })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      setError(data ? Object.values(data).flat().join(" ") : "Failed to send message. Please try again.")
      setStatus("error")
    }
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20">
          {/* Left side — info */}
          <div className="flex flex-col justify-between gap-10 max-w-md mx-auto lg:mx-0">
            <div className="text-center lg:text-left">
              <h1 className="mb-3 text-4xl md:text-5xl font-semibold text-foreground">
                {title}
              </h1>
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
            {(phone || email) && (
              <div className="mx-auto lg:mx-0">
                <h3 className="mb-6 text-center lg:text-left text-xl font-semibold text-foreground">
                  Contact Details
                </h3>
                <ul className="space-y-4">
                  {phone && (
                    <li className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Phone</span>
                        <p className="text-foreground font-medium">{phone}</p>
                      </div>
                    </li>
                  )}
                  {email && (
                    <li className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Email</span>
                        <a href={`mailto:${email}`} className="block text-foreground font-medium hover:text-primary transition-colors">
                          {email}
                        </a>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Right side — form */}
          <div className="flex-1 max-w-xl mx-auto lg:mx-0">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/60 backdrop-blur-sm p-8 shadow-sm text-center">
                <CheckCircle className="w-10 h-10 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Message sent!</h3>
                <p className="text-sm text-muted-foreground">Thanks for reaching out — we&apos;ll get back to you soon.</p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="text-sm text-primary font-medium hover:underline mt-1"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-card/60 backdrop-blur-sm p-8 shadow-sm">
                {status === "error" && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="firstname" className="text-foreground">First Name</Label>
                    <Input type="text" id="firstname" placeholder="First Name" value={form.firstName} onChange={handleChange("firstName")} required />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="lastname" className="text-foreground">Last Name</Label>
                    <Input type="text" id="lastname" placeholder="Last Name" value={form.lastName} onChange={handleChange("lastName")} required />
                  </div>
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="contact-email" className="text-foreground">Email</Label>
                  <Input type="email" id="contact-email" placeholder="you@example.com" value={form.email} onChange={handleChange("email")} required />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="subject" className="text-foreground">Subject</Label>
                  <Input type="text" id="subject" placeholder="How can we help?" value={form.subject} onChange={handleChange("subject")} required />
                </div>
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="message" className="text-foreground">Message</Label>
                  <Textarea placeholder="Type your message here..." id="message" className="min-h-[120px]" value={form.message} onChange={handleChange("message")} required />
                </div>
                <Button type="submit" disabled={status === "loading"} className="w-full gap-2">
                  <Send className="w-4 h-4" />
                  {status === "loading" ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
