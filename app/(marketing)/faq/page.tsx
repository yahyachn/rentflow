import type { Metadata } from "next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about renting a car or motorcycle with us.",
};

const FAQS = [
  {
    question: "What documents do I need to rent a vehicle?",
    answer:
      "A valid driver's license (held for at least one year), a passport or national ID, and a credit or debit card for the deposit. International visitors should bring their passport and, where required, an International Driving Permit.",
  },
  {
    question: "Is insurance included?",
    answer:
      "Yes — every rental includes baseline insurance coverage. The deposit amount and coverage details are listed on each vehicle's page before you reserve.",
  },
  {
    question: "Can I extend my rental?",
    answer:
      "Yes, subject to the vehicle's availability. Contact us before your return date and we'll do our best to extend your booking.",
  },
  {
    question: "What is the fuel policy?",
    answer:
      "Vehicles are provided with a full tank and should be returned with a full tank, unless otherwise agreed at pickup.",
  },
  {
    question: "Is there a mileage limit?",
    answer:
      "Most vehicles include unlimited mileage — this is shown on each vehicle's specification page. Where a daily limit applies, it's listed there too.",
  },
  {
    question: "How do I cancel or modify a reservation?",
    answer:
      "Contact us as soon as possible via phone, WhatsApp, or the contact form. Cancellation terms depend on how close to the pickup date you cancel.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
      <h1 className="font-display text-3xl font-semibold">Frequently asked questions</h1>
      <Accordion type="single" collapsible className="mt-8">
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
