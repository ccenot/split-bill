# Split Bill (Talangin Dulu)

A modern, fast, and fair receipt scanner and bill-splitting web application designed for group expenses, multi-transaction outings, and restaurant bills in Indonesia.

## Features

- **Dual OCR Engine:**
  - Client-side offline extraction using **Tesseract.js** (privacy-first, runs entirely in browser).
  - Server-side Vision AI OCR via OpenAI-compatible endpoint.
- **Fair Tax & Service Allocation:**
  - Proportional distribution based on individual food & beverage consumption ratio.
  - Support for flat or percentage taxes (PB1/PPN), service charges, and discounts.
- **Multi-Transaction Support:** Consolidate multiple venues or bills into a single settlement calculation.
- **Debt Simplification:** Bilateral settlement matching to minimize circular money transfers.
- **One-Tap WhatsApp Summary:** Formatted breakdown with bank/e-wallet transfer instructions ready to share.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend:** Node.js, Express 5 (SPA static delivery + AI OCR proxy)
- **OCR:** Tesseract.js (offline) / Vision LLM API

## Getting Started

### Prerequisites

- Node.js 20+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ccenot/split-bill.git
   cd split-bill
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Build and start the app:
   ```bash
   # Development mode
   npm run dev

   # Production build & serve
   npm run build
   npm start
   ```

The application runs on `http://localhost:3380` by default.

## License

MIT
