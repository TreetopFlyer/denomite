import React from "react";

export default ({route}:{route:string}):JSX.Element =>
{
    const [countGet, countSet] = React.useState(5);

    return <>
        <div>
            <h1>React!</h1>
            <h2>{route}</h2>
        </div>
        <nav>
            <a href="/">home</a>
            <a href="/other-page">other route</a>
        </nav>
        <div>
            <strong>{countGet}</strong>
            <button onClick={e=>{countSet(countGet+1)}}>++</button>
        </div>
    </>;
};