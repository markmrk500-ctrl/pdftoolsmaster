import { useState } from "react";
import { z } from "zod";
import { StaticPage } from "@/components/StaticPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      toast({
        title: "Please check the form",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    // Without a backend we open the user's mail client
    const subject = encodeURIComponent(`Master PDF Tools Contact — ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:masterpdftools@gmail.com?subject=${subject}&body=${body}`;
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "Email client opened", description: "Send the prepared message to reach us." });
    }, 800);
  };

  return (
    <StaticPage
      title="Contact Master PDF Tools — Get in Touch"
      description="Contact Master PDF Tools with feedback, feature requests, or support questions. Email masterpdftools@gmail.com."
    >
      <h1>Contact Us</h1>
      <p>
        Have a question, feature request, or feedback? Send us a message and we'll get
        back to you as soon as possible. You can also email us directly at{" "}
        <a href="mailto:masterpdftools@gmail.com">masterpdftools@gmail.com</a>.
      </p>

      <form onSubmit={onSubmit} className="not-prose space-y-4 mt-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={100}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={255}
            required
          />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            maxLength={2000}
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Opening..." : "Send Message"}
        </Button>
      </form>
    </StaticPage>
  );
};

export default Contact;
