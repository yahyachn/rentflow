"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Triggers the browser's print dialog — "Save as PDF" produces the invoice PDF.
 * Hidden when the page is actually printed (`print:hidden`). */
export function PrintInvoiceButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer /> Print / Save as PDF
    </Button>
  );
}
