import React from "react";
import Pages from "./pages.tsx";

const defaultValue:Binding = [["uninitialized"], (inAction:Action)=>{}];
const RouteContext = React.createContext(defaultValue);

export type State = Array<string>;
export type ActionNavigate = {type:"navigate", payload:string};
export type Action = ActionNavigate; 
export type Binding = [State, React.Dispatch<Action>];

const Reducer = (inState:State, inAction:Action):State =>
{
    switch(inAction.type)
    {
        case "navigate" :
            return [inAction.payload, ...inState].slice(0, 10);
        default:
            return inState;
    }
};

export const useRoute = () =>
{
    const binding:Binding = React.useContext(RouteContext);
    return {
        History:binding[0],
        Current:binding[0][0],
        Navigate:(inURL:string)=> binding[1]({type:"navigate", payload:inURL})
    };
};

type NavigationEvent = 
{
    canTransition: boolean,
    destination:{url:string},
    transitionWhile: ( arg:void )=>void
}
type NavigationBinding = (type:string, handler:(event:NavigationEvent)=>void)=>void;
type Navigation = 
{
    addEventListener:NavigationBinding,
    removeEventListener:NavigationBinding
}
export default ({route, navigation}:{route:string, navigation:null|Navigation}):JSX.Element =>
{
    const [countGet, countSet] = React.useState(5);
    const binding = React.useReducer(Reducer, [route]);

    React.useEffect(()=>
    {
        const handler = (e:NavigationEvent) => e.canTransition ? e.transitionWhile( binding[1]({type:"navigate", payload:new URL(e.destination.url).pathname}) ) : null;
        if(navigation)
        {
            navigation.addEventListener("navigate", handler);
            return ()=>navigation.removeEventListener("navigate", handler);
        }
    });

    return <RouteContext.Provider value={binding}>
        <nav>
            <a href="/">Home Page</a>
            <a href="/other-page">Other Page</a>
        </nav>
        <Pages/>
        <div>
            <strong>{countGet}</strong>
            <button onClick={e=>{countSet(countGet+1)}}>++</button>
        </div>
    </RouteContext.Provider>;
};