import { serve } from "std/http/server.ts";
import * as ESBuild from "x/esbuild@v0.14.45/mod.js";

import SSR from "./ssr.tsx";

type LUT = {[key:string]:string}
type SettingsCollection = { importMap:string };
type ProcessorResult = BodyInit | null | undefined
type Processor = (inFilePath:string, inRequest:Request, inConfig:SettingsCollection)=>ProcessorResult|Promise<ProcessorResult>;
type Route =
{
    Order:number,
    Match:(inPath:string, inRequest:Request)=>boolean,
    Serve:Processor
};

const fileConfig = await Deno.readTextFile("./deno.jsonc");
const Config:SettingsCollection = JSON.parse(fileConfig);
Config.importMap = await Deno.readTextFile(Config.importMap);

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

const Resp404 = new Response("404", {headers:{"content-type": "text/html; charset=utf-8"}});

const Handlers:{[key:string]:Processor} =
{
    async Server(inFS, inRequest, inConfig)
    {
        return await `{"le-json":["data", "array"]}`;
    },
    async Layout(inFS, inRequest, inConfig)
    {
        return await SSR(inRequest, inConfig);
    },
    async Client(inFS)
    {
        try
        {
            const file = await Deno.readTextFile(inFS);
            const code = await ESBuild.transform(file, {loader:"tsx"});
            return code.code;
        }
        catch(e)
        {
            console.log(`Can't find ${inFS} for transpiling.`);
            return null;
        } 
    },
    async Static(inFS, inRequest, inConfig)
    {
        try
        {
            const file = await Deno.open(inFS);
            return file.readable;
        }
        catch(e)
        {
            console.log(`Static file ${inFS} not found.`);
            return null;
        }
    }
};

type ResponseContext =
{
    URL:URL,
    Path:string,
    Body:BodyInit | null | undefined,
    Head:ResponseInit | null | undefined,
};

const parts:{[key:string]:Route} =
{
    Client:
    {
        Match: (inContext)=>inContext.URL.pathname.startsWith("client/") ? inContext.URL.pathname : false,
        Solve: async (inContext)=>
        {
            try
            {
                const file = await Deno.readTextFile("./"+inContext.Path);
                const code = await ESBuild.transform(file, {loader:"tsx"});
                return code.code;
            }
            catch(e)
            {
                console.log(`Can't find ${inPath} for transpiling.`);
                return null;
            } 
        },
        Serve: (inContext)=>
        {
            return {
                status: 200,
                headers:
                {
                    "content-type": "application/javascript; charset=utf-8"
                }
            };
        },
        Order: 1
    },
    Static:
    {
        Match: (inPath, inRequest)=>inPath.startsWith("static/"),
        Solve: (inPath, inRequest)=>
        {

        },
        Serve: (inBody)=>
        {
            const type = MIMELUT[inPath.substring(inPath.lastIndexOf("."))];
            let body = await Handlers.Static(inPath, inRequest, Config);
            return body ? new Response(body, {status: 200, headers: {"content-type": type}}) : Resp404;
        },
        Order: 2
    },
    Server:
    {
        Match: (inPath, inRequest)=>inPath.startsWith("server/"),
        Serve: (inPath, inRequest)=>JSON.stringify({LeTest:true}),
        Order: 3
    },

};

serve(async (inRequest:Request) =>
{
    const url = new URL(inRequest.url);
    const path = url.pathname.substring(1).toLowerCase();

    const Context:ResponseContext = {

        Path:path,
        Body:null,
        Head:null
    }


    let body = null;

    if(path.startsWith("client/"))
    {
        body = await Handlers.Client(path, inRequest, Config);
        return body ? new Response(body, { status: 200, headers: {"content-type": "application/javascript; charset=utf-8"} }) : Resp404;
    }
    if(path.startsWith("static/"))
    {
        const type = MIMELUT[path.substring(path.lastIndexOf("."))];
        body = await Handlers.Static(path, inRequest, Config);
        return body ? new Response(body, {status: 200, headers: {"content-type": type}}) : Resp404;
    }
    if(path.startsWith("server/"))
    {
        body = await Handlers.Server(path, inRequest, Config);
        return body ? new Response(body, { status: 200, headers: {"content-type": "application/javascript; charset=utf-8"} }) : Resp404;
    }
    else
    {
        body = await Handlers.Layout(path, inRequest, Config);
        return body ? new Response(body, { status: 200, headers: {"content-type": "text/html"} }) : Resp404;
    }
}
, {port:3333});