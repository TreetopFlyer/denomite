import { create } from "https://esm.sh/twind@0.16.13";
import { getStyleTagProperties, virtualSheet } from "https://esm.sh/twind@0.16.13/shim/server";


const sheet = virtualSheet();
const { tw } = create({ sheet: sheet, preflight: true, theme: {}, plugins: {}, mode: "silent" });
sheet.reset();

const propertyMask = 
[
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__",
    "hasOwnProperty",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "valueOf",
    "toLocaleString"
];
const regex = /[^<>\[\]\(\)|&"'`\.\s]*[^<>\[\]\(\)|&"'`\.\s:]/g;


export function generate(docs: string[]): string
{
  for (const html of docs) {
    const m = html.match(regex);
    if (m) {
      for (const c of m) {
        // See https://github.com/tw-in-js/twind/issues/189
        if (propertyMask.indexOf(c) === -1)
        {
          try
          {
            tw(c);
          }
          catch (e)
          {
            console.log(`Error: Failed to handle the pattern '${c}'`);
            throw e;
          }
        }
      }
    }
  }
  const { textContent } = getStyleTagProperties(sheet);
  return textContent;
}

const contents = `import React from "react";
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
}; `;

console.log(generate([contents]));
