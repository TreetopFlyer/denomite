import { serve } from "std/http/server.ts";
import * as ESBuild from "x/esbuild@v0.14.45/mod.js";

import React from "react";
import ReactDOMServer from "react-dom/server";
import App from "./client/app.tsx";

const fileConfig = await Deno.readTextFile("./deno.jsonc");
const Config:{ importMap:string } = JSON.parse(fileConfig);
Config.importMap = await Deno.readTextFile(Config.importMap);

const MIMELUT:{[key:string]:string} =
{
    ".aac": "audio/aac",
    ".abw": "application/x-abiword",
    ".arc": "application/x-freearc",
    ".avif": "image/avif",
    ".avi": "video/x-msvideo",
    ".azw": "application/vnd.amazon.ebook",
    ".bin": "application/octet-stream",
    ".bmp": "image/bmp",
    ".bz": "application/x-bzip",
    ".bz2": "application/x-bzip2",
    ".cda": "application/x-cdf",
    ".csh": "application/x-csh",
    ".css": "text/css",
    ".csv": "text/csv",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".eot": "application/vnd.ms-fontobject",
    ".epub": "application/epub+zip",
    ".gz": "application/gzip",
    ".gif": "image/gif",
    ".htm .html": "text/html",
    ".ico": "image/vnd.microsoft.icon",
    ".ics": "text/calendar",
    ".jar": "application/java-archive",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript",
    ".json": "application/json",
    ".jsonld": "application/ld+json",
    ".mid": "audio/midi",
    ".midi": "audio/midi",
    ".mjs": "text/javascript",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".mpeg": "video/mpeg",
    ".mpkg": "application/vnd.apple.installer+xml",
    ".odp": "application/vnd.oasis.opendocument.presentation",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    ".odt": "application/vnd.oasis.opendocument.text",
    ".oga": "audio/ogg",
    ".ogv": "video/ogg",
    ".ogx": "application/ogg",
    ".opus": "audio/opus",
    ".otf": "font/otf",
    ".png": "image/png",
    ".pdf": "application/pdf",
    ".php": "application/x-httpd-php",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".rar": "application/vnd.rar",
    ".rtf": "application/rtf",
    ".sh": "application/x-sh",
    ".svg": "image/svg+xml",
    ".swf": "application/x-shockwave-flash",
    ".tar": "application/x-tar",
    ".tif .tiff": "image/tiff",
    ".ts": "video/mp2t",
    ".ttf": "font/ttf",
    ".txt": "text/plain",
    ".vsd": "application/vnd.visio",
    ".wav": "audio/wav",
    ".weba": "audio/webm",
    ".webm": "video/webm",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".xhtml": "application/xhtml+xml",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xml": "application/xml",
    ".xul": "application/vnd.mozilla.xul+xml",
    ".zip": "application/zip",
    ".3gp": "video/3gpp",
    ".3g2": "video/3gpp2",
    ".7z": "application/x-7z-compressed"
};

const Resp404 = new Response("404", { status: 404, headers:{"content-type": "text/html; charset=utf-8"}});

serve(async (inRequest:Request) =>
{
    const url = new URL(inRequest.url);
    const path = url.pathname.substring(1).toLowerCase();

    if(path.startsWith("client/"))
    {
        try
        {
            const file = await Deno.readTextFile(path);
            const code = await ESBuild.transform(file, {loader:"tsx"});
            return new Response(code.code, { status: 200, headers: {"content-type": "application/javascript; charset=utf-8"} })
        }
        catch(e)
        {
            console.log(`Can't find ${path} for transpiling.`);
            console.log(e)
            
            return Resp404;
        } 
    }
    else if(path.startsWith("static/"))
    {
        try
        {
            const file = await Deno.open(path);
            const type = MIMELUT[path.substring(path.lastIndexOf("."))];
            return new Response(file.readable, {status: 200, headers: {"content-type": type}});
        }
        catch(e)
        {
            console.log(`Static file ${path} not found.`);
            return Resp404;
        }
    }
    else
    {
        const body = await ReactDOMServer.renderToReadableStream(
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <script type="importmap" dangerouslySetInnerHTML={{__html:Config.importMap}} ></script>
                <style dangerouslySetInnerHTML={{__html:`
                    :root
                    {
                        --tint:#6e6548
                    }
                `}}>
                </style>
                <script type="module" dangerouslySetInnerHTML={{__html:`
                    import {setup} from "esm/twind/shim";
                    setup(
                    {
                        theme:
                        {
                            extend:
                            {
                                colors:
                                {
                                    "TINT": "var(--tint)",
                                }
                            }
                        }
                    });
                `}}>
                </script>
            </head>
            <body>
                <div id="app">
                    <App route={url.pathname} navigation={false}/>
                </div>
                <script type="module" dangerouslySetInnerHTML={{__html:`
                    import {createElement as h} from "react";
                    import {hydrateRoot} from "react-dom/client";
                    import App from "./client/app.tsx";

                    hydrateRoot(document.querySelector("#app"), h(App, {route:"${url.pathname}", navigation}));
                `}} />
            </body>
        </html>
        );
        return new Response(body, { status: 200, headers: {"content-type": "text/html"} });
    }
}
, {port:3333});