"use client";

import AwesomeButton, { ButtonSize, ButtonType } from "@components/button/AwesomeButton";
import Image from "next/image";
import Link from 'next/link';

export default function Home() {

  return (
    <main className="flex flex-col items-center justify-between p-8">
        <h1>
          J-planner Home
        </h1>
        <div className="p-8 border-solid border-2" 
            style={{width: "300px"}}>
          <Link href={"calender"}>
            <div className="flex flex-col items-center justify-center gap-4" >
              <Image
                  src="example/vercel.svg"
                  alt="Vercel Logo"
                  // className="dark:invert"
                  width={100}
                  height={24}
                  // priority
                  />
              <AwesomeButton 
                size={ButtonSize.normal}
                type={ButtonType.light}
                text="달력으로 가기"
                />
            </div>
          </Link>
        </div>
    </main>
  );
}

