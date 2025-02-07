"use client";
import { CircleXIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CloseModalButton() {
    const router = useRouter();

    return (
        <div onClick={() => router.back()}>
            <CircleXIcon className='w-6 h-6 cursor-pointer hover:opacity-50' />
        </div>
    )
}