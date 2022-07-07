import React from "react";

export const Switch =({children, value}:{children:Array<JSX.Element>, value:string})=>
{
    return React.useMemo(()=>
    {
        const lower = value.toLowerCase();
        let child = <></>;
        for(let i=0; i<children.length; i++)
        {
            child = children[i];
            if(child.props?.value?.toLowerCase() == lower){ break; }
        }
        return child.props.children;

    }, [value]);
};

export const Case =({value, children}:{value?:string, children:React.ReactNode})=> null;