import { serve } from "std/http/server.ts";
import * as ESBuild from "x/esbuild@v0.14.45/mod.js";
import * as Env from "std/dotenv/mod.ts";

import SSR from "./ssr.tsx";

type LUT = {[key:string]:string}
type SettingsCollection = {
    importMap:string,
    env:LUT
};

type Processor = (inRequest:Request, inConfig:SettingsCollection)=>string|null;

const fileConfig = await Deno.readTextFile("./deno.jsonc");
const Config:SettingsCollection = JSON.parse(fileConfig);
Config.importMap = await Deno.readTextFile(Config.importMap);
Config.env = Env.config();

const MIMELUT:LUT =
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


const Handlers:{[key:string]:Processor} =
{
    Layout(inRequest:Request)
    {
        return "create a layout";
    }
};

serve(async (inRequest:Request)=>
{
    const path:string = new URL(inRequest.url).pathname;

    if(path.startsWith("/client/"))
    {
        let code;
        try
        {
            code = await Deno.readTextFile(path.substring(1));
            code = await ESBuild.transform(code, {loader:"tsx"});
            code = code.code;
        }
        catch(e)
        {
            console.log(`Can't find ${path} for transpiling.`);
            code = "";
        }

        return new Response(code, { status: 200, headers: {"content-type": "application/javascript; charset=utf-8"} });
    }

    if(path.startsWith("/static/"))
    {
        let file;
        try
        {
            file = await Deno.open(path.substring(1));
            file = file.readable;
        }
        catch(e)
        {
            file = "";
        }

        const ext = path.substring(path.lastIndexOf("."));
        return new Response(file, {status:200, headers:{"content-type": MIMELUT[ext]}});
    }

    if(path.startsWith("/server/"))
    {
        return new Response(null, { status: 200, headers: {"content-type": "text/html"} });
    }

    //const body = Handlers.Layout(inRequest, Config);
    const stream = await SSR(inRequest, Config);
    return new Response(stream, { status: 200, headers: {"content-type": "text/html"} });
}
, {port:3333});