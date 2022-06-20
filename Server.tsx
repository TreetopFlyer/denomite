import { serve } from "std/http/server.ts";
import * as ESBuild from "x/esbuild@v0.14.45/mod.js";

const Headers =
{
    JS:
    {
        status: 200,
        headers: {"content-type": "application/javascript; charset=utf-8"}
    }
};


const Transpile = async (inPath:string):Promise<string|null> =>
{
    try
    {
        const file = await Deno.readTextFile(inPath);
        const code = await ESBuild.transform(file, {loader:"tsx"});
        console.log(code.code);
        return code.code;
    }
    catch(e)
    {
        console.log(e);
        return null;
    }
}


serve(async (inRequest:Request)=>
{
    const url:URL = new URL(inRequest.url);
    const code:string|null = await Transpile("./tsx/app.tsx");
    return new Response(code, Headers.JS);
}
, {port:3333});