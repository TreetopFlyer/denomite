import React from "react";
import { useRoute } from "./app.tsx";
import { Switch, Case } from "./condition.tsx";

export default () =>
{
    const binding = useRoute();
    return <>
        <p>
            Binding.Current:
            <strong>{binding.Current}</strong>
        </p>
        <Switch value={binding.Current}>
            <Case value="/">
                <p className="max-w-4xl mx-auto">Home Page!</p>
            </Case>
            <Case value="/other-page">
                <h4 className="max-w-2xl mx-auto mt-8 px-8 text-center text-2xl text-uppercase text-red font-black">yoooo otha page</h4>
                <p>seo yall</p>
            </Case>
            <Case>
                lolidk
            </Case>
        </Switch>
    </>; 
}; 