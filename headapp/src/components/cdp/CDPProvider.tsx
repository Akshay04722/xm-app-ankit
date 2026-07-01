"use client";

import { useEffect } from "react";
import { getEngage } from "@/lib/cdp/engage";

export default function CDPProvider() {
    useEffect(() => {
        async function init() {
            const engage = await getEngage();

            console.log("Before:", engage.getBrowserId());

            const response = await engage.pageView({
                channel: "WEB",
                currency: "USD",
            });

            console.log(response);

            console.log("After:", engage.getBrowserId());
        }

        init();
    }, []);

    return null;
}