import { serve } from "std/http/server.ts";
import * as ESBuild from "x/esbuild@v0.14.45/mod.js";

import React from "react";
import ReactDOMServer from "react-dom/server";
import App from "./client/app.tsx";

/**************************************/
import * as FS from "std/fs/mod.ts"; 
import * as Path from "std/path/mod.ts";
import { create } from "twind";
import { getStyleTagProperties, virtualSheet } from "twind/shim/server";
const sheet = virtualSheet();
const parse = create({ sheet: sheet, preflight: true, theme: {}, plugins: {}, mode: "silent" }).tw;
const leave = [ "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "valueOf", "toLocaleString" ];

const Memory:{[key:string]:string} = {};
const prune = Path.dirname(Path.fromFileUrl(import.meta.url)).length+1;
sheet.reset();
for await (const file of FS.expandGlob("./client/**/*.tsx"))
{
    const filename = file.path.substring(prune).replaceAll("\\", "/");
    const body = await Deno.readTextFile(filename);

    // transpile
    const code = await ESBuild.transform(body, {loader:"tsx"});

    // extract tailwind classes
    const m = code.code.match(/[^<>\[\]\(\)|&"'`\.\s]*[^<>\[\]\(\)|&"'`\.\s:]/g);
    if (m)
    {
      for (const c of m)
      {
        if (leave.indexOf(c) === -1)
        {
                try { parse(c); }
          catch (e) { console.log(`Error: Failed to handle the pattern '${c}'`); throw e; }
        }
      }
    }

    // add file to memory
    Memory[filename] = code.code;
}

// add styles to memory
Memory["style"] = getStyleTagProperties(sheet).textContent;

// add importMap to memory
const config:{ importMap:string } = JSON.parse(await Deno.readTextFile("./deno.jsonc"));
Memory["importMap"] = await Deno.readTextFile(config.importMap);

console.log(Memory);

/***************************************/



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
        const check = Memory[path];
        return check ? new Response(check, { status: 200, headers: {"content-type": "application/javascript; charset=utf-8"} }) : Resp404;
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
                <meta charSet="UTF-8"/>
                <script dangerouslySetInnerHTML={{__html:Memory["importMap"]}} type="importmap" />
                <style dangerouslySetInnerHTML={{__html:Memory["style"]}}/>
            </head>
            <body>
                <div id="app">
                    <App route={url.pathname} navigation={false}/>
                </div>
                <script dangerouslySetInnerHTML={{__html:`
                    import {createElement as h} from "react";
                    import {hydrateRoot} from "react-dom/client";
                    import App from "./client/app.tsx";

                    hydrateRoot(document.querySelector("#app"), h(App, {route:"${url.pathname}", navigation}));
                `}} type="module"/>
            </body>
        </html>
        );
        return new Response(body, { status: 200, headers: {"content-type": "text/html"} });
    }
}
, {port:3333});

console.log(Path.resolve("./client"));
