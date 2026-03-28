import GoogleProvider from "next-auth/providers/google"
import prisma from "./db"
import { getServerSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function upsertUserAndAccount(account, profile) {
    const user = await prisma.user.upsert({
        where: {
            email: profile.email
        },
        create: {
            email: profile.email,
            name: profile.name,
            image: profile.picture,
            role: "user",
        },
        update: {
            name: profile.name
        },
    })

    console.log("user", user)

    const isNewUser = user.createdAt.getTime() + 1500 > Date.now();
    console.log("is new user?", isNewUser);

    //TODO: update email address and subject accordingly
    if (isNewUser) {
        const emailBody = `
        <p>A new user has signed in on Your Product.</p>
        <p><strong>Name</strong>: ${user.name}</p>
        <p><strong>Email</strong>: ${user.email}</p>
        `

        try {
            await resend.emails.send({
                from: 'hello@runbuilds.xyz',
                to: ['hairunhuang@gmail.com'],
                cc: ['bitebuddyhelp@gmail.com'],
                subject: `[Your Product] New user`,
                html: emailBody
            })
        } catch (error) {
            console.error("Failed to send notification email:", error)
        }
    }

    if (user) {
        await prisma.account.upsert({
            where: {
                provider_providerAccountId: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                },
            },
            create: {
                userId: user.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                // TODO: Add other fields from the account object as necessary
            },
            update: {
                // TODO: Update any fields that might change
            },
        });
    }
}

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt'
    },
    pages: {
        signIn: '/sign-in'
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (account) {
                // Store account info when user first signs in
                token.accessToken = account.access_token
                token.provider = account.provider
            }
            if (user) {
                // This runs when the user first signs in
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
        async signIn({ account, profile }) {
            if (!profile.email) {
                throw new Error('No profile')
            }

            try {
                await upsertUserAndAccount(account, profile);
            } catch (error) {
                console.error('Error upserting user and account:', error);
                return false;
            }

            return true;
        },
        redirect({ url, baseUrl }) {
            console.log("redirect callback triggered:", {
                url,
                baseUrl
            })
            return "/";
        }
    }
}

export async function getAuthSession() {
    return await getServerSession(authOptions);
}