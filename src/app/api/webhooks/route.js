import prisma from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"

export async function POST(req) {
    if (!stripe) {
        return new Response("Stripe not configured", { status: 503 })
    }

    try {
        const body = await req.text()
        const headersList = await headers();
        const signature = headersList.get("stripe-signature")

        if (!signature) {
            return new Response("Invalid signature", { status: 400 })
        }

        const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            // get the metadata from the session
            const { userId, orderId } = session.metadata || {
                userId: null,
                orderId: null
            }

            console.log("userId", userId)
            console.log("orderId", orderId)

            if (!userId || !orderId) {
                return new Response("missing metadata", { status: 400 })
            }

            // update the order in the database
            // TODO: make sure your schema has this table and columns
            await prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    isPaid: true
                }
            });

            return new Response("Webhook received: " + event.type, { status: 200 })
        }

        // return a response for other event types
        return new Response("Unhandled event type: " + event.type, { status: 400 })
    } catch (error) {
        console.error("Error in webhook handler:", error);
        return new Response("Error in webhook handler", { status: 500 })
    }
}