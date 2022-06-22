import React from "react";

export default ():JSX.Element =>
{
    const [countGet, countSet] = React.useState(5);

    return <>
        <div>hey</div>
        <p>sup</p>
        <strong>{countGet}</strong>
        <button onClick={e=>{countSet(countGet+1)}}>++</button>
    </>;
};