import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY is not set. Payment processing will not work.");
}

export const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2026-03-25.dahlia",
      })
    : null;
