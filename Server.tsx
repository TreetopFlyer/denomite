import { serve } from "std/http/server.ts";
import * as ESBuild from "x/esbuild@v0.14.45/mod.js";

import SSR from "./app/ssr.tsx";

const fileConfig = await Deno.readTextFile("./deno.jsonc");
const Config = JSON.parse(fileConfig);
Config.importMap = await Deno.readTextFile(Config.importMap);

serve(async (inRequest:Request)=>
{
    const url:URL = new URL(inRequest.url);
    const webPath = url.pathname;
    const fsPath = "./app"+webPath;

    if(webPath.startsWith("/client/"))
    {
        let code;
        try
        {
            code = await Deno.readTextFile(fsPath);
            code = await ESBuild.transform(code, {loader:"tsx"});
            code = code.code;
        }
        catch(e)
        {
            console.log(`Can't find ${fsPath} for transpiling.`);
            code = null;
        }

        return new Response(code, { status: 200, headers: {"content-type": "application/javascript; charset=utf-8"} });
    }

    if(webPath.startsWith("/static/"))
    {
        const file = await Deno.open(fsPath);
        return new Response(file.readable);
    }

    if(webPath.startsWith("/server/"))
    {
        return new Response(null, { status: 200, headers: {"content-type": "text/html"} });
    }

    const stream = await SSR(inRequest, Config);
    return new Response(stream, { status: 200, headers: {"content-type": "text/html"} });
}
, {port:3333});