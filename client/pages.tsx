import React from "react";
import {useRoute} from "./app.tsx";

export default () =>
{
    const binding = useRoute();
    return <>
        <p>{binding.Current}</p>
        {
            binding.Current == "/" && <>
                <p>Home Page!</p>
            </>
        }
        {
            binding.Current == "/other-page" && <>
                <h4>yoooo otha page</h4>
                <p>seo yall</p>
            </>
        }
    </>
};