import React from "react";
import ReactDOMServer from "react-dom/server";

import App from "./client/app.tsx";
export default (inRequest:Request, inConfig:{importMap:string}) => ReactDOMServer.renderToReadableStream(
<html>
    <head>

    </head>
    <body>
        <div id="app">
            <App/>
        </div>
        <script type="importmap" dangerouslySetInnerHTML={{__html:inConfig.importMap}} ></script>
        <script type="module" dangerouslySetInnerHTML={{__html:`
            import {createElement as h} from "react";
            import {hydrateRoot} from "react-dom/client";
            import App from "./client/app.tsx";
            hydrateRoot(document.querySelector("#app"), h(App));
        `}} />
    </body>
</html>
);