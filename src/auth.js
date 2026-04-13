import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"
import { Resend } from "resend"

async function notifyNewUser(user) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    //TODO: update email address and subject accordingly
    const emailBody = `
        <p>A new user has signed in on Your Product.</p>
        <p><strong>Name</strong>: ${user.name}</p>
        <p><strong>Email</strong>: ${user.email}</p>
    `;

    try {
        await resend.emails.send({
            from: 'hello@runbuilds.xyz',
            to: ['hairunhuang@gmail.com'],
            cc: ['bitebuddyhelp@gmail.com'],
            subject: `[Your Product] New user`,
            html: emailBody,
        });
    } catch (error) {
        console.error("Failed to send notification email:", error);
    }
}

async function upsertUserAndAccount(account, profile) {
    const user = await prisma.user.upsert({
        where: { email: profile.email },
        create: {
            email: profile.email,
            name: profile.name,
            image: profile.picture,
            role: "user",
        },
        update: {
            name: profile.name,
        },
    });

    const isNewUser = user.createdAt.getTime() + 1500 > Date.now();
    if (isNewUser) {
        await notifyNewUser(user);
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
            },
            update: {},
        });
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: { signIn: "/sign-in" },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.provider = account.provider;
            }
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
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
                throw new Error("No profile");
            }

            try {
                await upsertUserAndAccount(account, profile);
            } catch (error) {
                console.error("Error upserting user and account:", error);
                return false;
            }

            return true;
        },
        redirect({ url, baseUrl }) {
            return "/";
        },
    },
});
