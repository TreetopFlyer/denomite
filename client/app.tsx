import React from "react";
import Pages from "./pages.tsx";

export type NavigationEvent = { canTransition: boolean, destination:{url:string}, transitionWhile: ( arg:void )=>void };
export type NavigationBinding = (type:string, handler:(event:NavigationEvent)=>void)=>void;
export type Navigation = { addEventListener:NavigationBinding, removeEventListener:NavigationBinding };
export type State = Array<string>;
export type ActionNavigate = {type:"navigate", payload:string};
export type Action = ActionNavigate; 
export type Binding = [State, React.Dispatch<Action>];

const defaultValue:Binding = [["uninitialized"], (inAction:Action)=>{}];
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
const RouteContext = React.createContext(defaultValue);
const RouteProvider = ({route, children, navigation}:{route:string, children:React.ReactNode, navigation:false|Navigation}) =>
{
    const binding = React.useReducer(Reducer, [route]);

    React.useEffect(()=>
    {
        const handler = (e:NavigationEvent) => e.transitionWhile( binding[1]({type:"navigate", payload:new URL(e.destination.url).pathname}) );
        if(navigation)
        {
            navigation.addEventListener("navigate", handler);
            return ()=>navigation.removeEventListener("navigate", handler);
        }
    }, []);

    return <RouteContext.Provider value={binding}>{children}</RouteContext.Provider>;
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
export default ({route, navigation}:{route:string, navigation:false|Navigation}):JSX.Element =>
{
    const [countGet, countSet] = React.useState(5);
    
    return <RouteProvider route={route} navigation={navigation}>
        <nav>
            <a href="/">Home Page</a>
            <a href="/other-page">Other Page</a>
        </nav>
        <Pages/>
        <div>
            <strong className="italic border-2">{countGet}</strong>
            <button onClick={e=>{countSet(countGet+1)}}>++</button>
        </div>
    </RouteProvider>;
};