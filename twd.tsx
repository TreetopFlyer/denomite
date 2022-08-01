import { create } from "twind";
import { getStyleTagProperties, virtualSheet } from "twind/shim/server";

const sheet = virtualSheet();
const parse = create({ sheet: sheet, preflight: true, theme: {}, plugins: {}, mode: "silent" }).tw;
const leave = [ "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "valueOf", "toLocaleString" ];
const regex = /[^<>\[\]\(\)|&"'`\.\s]*[^<>\[\]\(\)|&"'`\.\s:]/g;

export const prep =():unknown[]=> sheet.reset();
export const dump =():string=> getStyleTagProperties(sheet).textContent;
export const bake =(inText:string):void=>
{
  const m = inText.match(regex);
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
};