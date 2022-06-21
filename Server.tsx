import React from "esm/react";
import ReactDOMServer from "esm/react-dom/server";
import { serve } from "std/http/server.ts";
import * as ESBuild from "x/esbuild@v0.14.45/mod.js";

import App from "./tsx/app.tsx";

const fileConfig = await Deno.readTextFile("./deno.jsonc");
const Config = JSON.parse(fileConfig);
Config.importMap = await Deno.readTextFile(Config.importMap);

const ScriptImports = () =>
{
    return <script type="importmap" dangerouslySetInnerHTML={{__html:Config.importMap}} ></script>;
};
const ScriptHydrate = ({client, app}:{client:string, app:JSX.Element}) =>
{
    const id = "mount-point";
    return <>
    <div id={id}>
        {app}
    </div>
    <script type="module" dangerouslySetInnerHTML={{__html:`
    import {createElement as h} from "esm/react";
    import {hydrateRoot} from "esm/react-dom/client";
    import App from "${client}";
    hydrateRoot(document.querySelector("#${id}"), h(App));
    `}} />
    </>;
};

const Bedrock = () =>
{
    return <html>
        <head>

        </head>
        <body>
            <ScriptImports/>
            <ScriptHydrate app={<App/>} client="/tsx/App.tsx"/> 
        </body>
    </html>;
};

const Transpile = async (inPath:string):Promise<string|null> =>
{
    try
    {
        const file = await Deno.readTextFile(inPath);
        const code = await ESBuild.transform(file, {loader:"tsx"});
        return code.code;
    }
    catch(e)
    {
        console.log(`Can't find ${e.toString()} for transpiling.`);
        return null;
    }
};

// client
// static
// server
serve(async (inRequest:Request)=>
{
    const url:URL = new URL(inRequest.url);

    if(url.pathname.endsWith(".tsx"))
    {
        console.log("transpiling", url.pathname);
        const code:string|null = await Transpile(url.pathname.substring(1));
        return new Response(code, { status: 200, headers: {"content-type": "application/javascript; charset=utf-8"} });
    }

    if(url.pathname.startsWith("/static"))
    {
        const file = await Deno.open(url.pathname);
        return new Response(file.readable);
    }

    return new Response(ReactDOMServer.renderToString(<Bedrock/>), { status: 200, headers: {"content-type": "text/html"} });
}
, {port:3333});