  export async function fetchSearchResults(rfkId: string, keyphrase?: string, uuid?: string) {
    const endpoint = "https://discover.sitecorecloud.io/discover/v2/128591118";
    const apiKey =
      "01-69b141fb-5eaec29094dc20b453087d784b7bf4283555fe18";

    const body = {
      context: {
        locale: { country: "us", language: "en" },
        user: { uuid: uuid || "anonymous" },
      },
      widget: {
        items: [
          {
            entity: "content",
            rfk_id: rfkId,
            search: {
              content: {},
              facet: { all: true, max: 100 },
              personalization: {
                fields: ["name", "type", "description"],
                algorithm: "affinity",
              },
              ...(keyphrase && { query: { keyphrase } }),
            },
          },
        ],
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Search API failed: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }